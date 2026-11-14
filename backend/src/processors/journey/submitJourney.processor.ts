import { journeyExperienceSchema, submitJourneySchema, type SubmitJourney, type JourneyTransition, journeyTransitionSchema } from "./journeySchema.js";
import type { JourneyExperience, JourneyGoal } from "../../types/journey/Journey.types.js";
import { createExperiences, createTransitions } from "./createSubFields.processor.js";
import { generateExperienceEmbedding } from "./generateEmbeddings.processor.js";
import { getUsernameByUserId } from "../../services/user.service.js";
import { inferTransitionCandidates } from "./inferTransitionCandidates.processor.js";
import { geminiProvider } from "../../ai/gemini.provider.js";
import {
    TRANSITION_INFERENCE_SYSTEM_PROMPT, buildTransitionInferencePrompt,
} from "../../prompts/onboarding/transitionInference.prompt.js";
import { transitionInferenceSchema } from "./transitionInference.schema.js";
import { getGoalsByIds } from "../../services/goal.service.js";
import { generateUserSummary } from "./generateUserSummary.processor.js";
import { updateUserSummary } from "../../services/user.service.js";
import { validateExperienceDuplicate } from "./staticAnalysis/experienceDuplicate.validator.js";
import { deleteJourneySession } from "../../services/journeySession.service.js";
import { addExperienceReputation } from "../../services/reputation.service.js";
import { MAX_PROOF_FILE_SIZE, uploadProofToCloudinary, verifyProof } from "./verifyProof.processor.js";
import { z } from "zod";

function normalizeJourneyExperience(
    experience: z.infer<typeof journeyExperienceSchema>
): JourneyExperience {
    const { verificationStatus, verificationMocked, ...fields } = experience;
    return {
        ...fields,
        ...(verificationStatus !== undefined && { verificationStatus }),
        ...(verificationMocked !== undefined && { verificationMocked }),
        endDate: experience.endDate ?? null,
        challengeFaced: experience.challengeFaced ?? null,
        outcome: experience.outcome ?? null,
        organization: experience.organization ?? null,
        applicationStatus: experience.applicationStatus ?? null,
        achievements: experience.achievements ?? null,
        isVerified: experience.isVerified ?? false,
        proofs: experience.proofs.map((proof) => ({
            ...proof,
            verifiedAt: proof.verifiedAt ?? null,
            reason: proof.reason ?? null,
        })),
    };
}

export interface SubmitJourneyResponse {
    goals: JourneyGoal[];
    experiences: Omit<JourneyExperience, "proofs">[];
    transitions: JourneyTransition[];
}

interface TransitionInference {
    currentTitle: string;
    fromTitle: string;
}

async function inferTransition(
    current: {
        title: string;
        context: string;
        timelineSummary: string;
        decisionLabel: string;
    },
    top5: {
        title: string;
        context: string;
        timelineSummary: string;
    }[]
): Promise<TransitionInference> {
    return geminiProvider.generateStructuredJson<TransitionInference>({
        systemPrompt: TRANSITION_INFERENCE_SYSTEM_PROMPT,
        userPrompt: buildTransitionInferencePrompt(current, top5),
        schema: transitionInferenceSchema,
        timeoutMs: 10_000,
    });
}
export async function submitJourney(
    userId: string,
    conversationId: string,
    input: SubmitJourney,
    proofFile: Express.Multer.File | null
): Promise<SubmitJourneyResponse> {
    const validation = submitJourneySchema.safeParse(input);
    if (!validation.success) {
        throw new Error(
            `Invalid journey submission: ${validation.error.message}`
        );
    }
    const validJourney = validation.data;
    const { experiences: submittedExperiences, mockVerification } = validJourney;
    const fileProofs = submittedExperiences.flatMap(({ proofs }) =>
        proofs.filter(({ sourceType, url }) => !url && (sourceType === "image" || sourceType === "pdf"))
    );
    if (proofFile && fileProofs.length !== 1) {
        throw new Error("Attach one photo or document per submission and select it as proof.");
    }
    if (proofFile && proofFile.size > MAX_PROOF_FILE_SIZE) {
        throw new Error("Attachments must be 10 MB or smaller.");
    }
    for (const experience of submittedExperiences) {
        const isDuplicate = await validateExperienceDuplicate(userId, {
            title: experience.title,
            organization: experience.organization ?? undefined,
            description: experience.context,
            achievements: experience.achievements ?? undefined,
            outcome: experience.outcome ?? undefined,
        });

        if (isDuplicate) {
            throw new Error(
                `Submission rejected: An experience matching "${experience.title}" already exists in your journey footprint.`
            );
        }
    }

    const uploadedProofUrl = mockVerification && proofFile ? await uploadProofToCloudinary(proofFile) : null;
    const experiencesToSave = await Promise.all(submittedExperiences.map(async experience => {
        const proofs = mockVerification
            ? experience.proofs.map((proof) => ({
                ...proof,
                url: proof.url ?? (proof === fileProofs[0] ? uploadedProofUrl : null),
                status: "skipped",
                verifiedAt: null,
                reason: null,
            }))
            : await Promise.all(experience.proofs.map(proof =>
                verifyProof(experience, proof, proof === fileProofs[0] ? proofFile : null)
            ));
        const isVerified = !mockVerification && proofs.some(proof => proof.status === "verified");
        const verificationStatus = mockVerification || isVerified
            ? "verified"
            : proofs.some(proof => proof.status === "failed") ? "failed" : "rejected";

        const { decisionReason,
            ...experienceWithoutDecisionReason } = experience;

        const parsed = journeyExperienceSchema.safeParse({
            ...experienceWithoutDecisionReason,
            proofs,
            isVerified,
            ...(mockVerification !== undefined && {
                verificationStatus,
                verificationMocked: mockVerification,
            }),

            endDate: experience.endDate ?? null,
            challengeFaced: experience.challengeFaced ?? null,
            outcome: experience.outcome ?? null,
            organization: experience.organization ?? null,
            applicationStatus: experience.applicationStatus ?? null,
            achievements: experience.achievements ?? null,
        });

        if (!parsed.success) {
            throw new Error(
                `Invalid experience: ${parsed.error.message}`
            );
        }

        const normalized: JourneyExperience = normalizeJourneyExperience(parsed.data);

        return normalized;
    }));

    const transitions = submittedExperiences.flatMap((experience) => {
        const decisionReason = experience.decisionReason?.trim();
        if (!decisionReason) {
            return [];
        }
        return [{
            toExperienceId: experience.id,
            decisionLabel: decisionReason,
        }];
    });
    const username = await getUsernameByUserId(userId);
    await createExperiences(username, experiencesToSave);
    for (const experience of experiencesToSave) {
        await generateExperienceEmbedding({
            id: experience.id,
            title: experience.title,
            context: experience.context,
            challengeFaced:
                experience.challengeFaced ?? null,
            outcome:
                experience.outcome ?? null,
            achievements:
                experience.achievements ?? null,
            skills:
                experience.skills.map((s) => s.name),
        }).catch(error => console.warn("Could not generate experience embedding", experience.id, error));
    }
    const inferredTransitions: TransitionInference[] = [];
    const inferred = await Promise.allSettled(transitions.map(async transition => {
        const candidates = await inferTransitionCandidates(transition.toExperienceId, transition.decisionLabel);
        return inferTransition(candidates.current, candidates.top5);
    }));
    for (const result of inferred) {
        if (result.status === "fulfilled") inferredTransitions.push(result.value);
        else console.warn("Could not infer journey transition", result.reason);
    }
    const validatedTransitions = inferredTransitions
    .map((transition): JourneyTransition | null => {
        const currentExperience = experiencesToSave.find(
            (experience) => experience.title === transition.currentTitle
        );
        if (!currentExperience) {
            console.warn(
                `Skipping transition: current experience "${transition.currentTitle}" not found.`
            );
            return null;
        }
        const previousExperience = experiencesToSave.find(
            (experience) => experience.title === transition.fromTitle
        );
        if (!previousExperience) {
            console.warn(
                `Skipping transition: previous experience "${transition.fromTitle}" not found.`
            );
            return null;
        }
        const decisionLabel = submittedExperiences.find(
            (experience) => experience.title === transition.currentTitle
        )?.decisionReason;
        if (!decisionLabel) {
            console.warn(
                `Skipping transition: no decision reason for "${transition.currentTitle}".`
            );
            return null;
        }
        const parsed = journeyTransitionSchema.safeParse({
            fromExperienceId: previousExperience.id,
            toExperienceId: currentExperience.id,
            decisionLabel,
        });
        if (!parsed.success) {
            console.warn(
                `Skipping invalid transition: ${parsed.error.message}`
            );
            return null;
        }
        return parsed.data;
    })
    .filter(
        (t): t is JourneyTransition => t !== null
    );
    const savedTransitions = await createTransitions(validatedTransitions)
        .then(() => validatedTransitions)
        .catch(error => {
            console.warn("Could not save inferred journey transitions", error);
            return [];
        });
    const verifiedCount = experiencesToSave.filter((experience) => experience.isVerified).length;
    const goalIds = [...new Set(experiencesToSave.flatMap((experience) => experience.goalIds))];
    const [, , goals] = await Promise.all([
        addExperienceReputation(userId, experiencesToSave.length, verifiedCount)
            .catch(error => console.warn("Could not update experience reputation", error)),
        generateUserSummary(userId, 10_000)
            .then(({ summary, expertiseAreas }) => updateUserSummary(userId, summary, expertiseAreas))
            .catch(error => console.warn("Could not update journey summary", error)),
        getGoalsByIds(goalIds).catch(error => {
            console.warn("Could not load saved journey goals", error);
            return [];
        }),
    ]);
    try {
        await deleteJourneySession(conversationId);
    } catch (redisError) {
        console.error(`Failed to wipe Redis onboarding cache session ${conversationId}:`, redisError);
    }
    return {
        goals,
        experiences: experiencesToSave.map(
            ({ proofs, ...experience }) => experience
        ),
        transitions: savedTransitions,
    };

}
