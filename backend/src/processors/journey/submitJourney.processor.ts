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
import { verifyProof } from "./verifyProof.processor.js";
import { z } from "zod";

function normalizeJourneyExperience(
    experience: z.infer<typeof journeyExperienceSchema>
): JourneyExperience {
    return {
        ...experience,
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
    const submittedExperiences = validJourney.experiences;
    const verifiedExperiences: JourneyExperience[] = [];

    for (const experience of submittedExperiences) {
        const verifiedProofs = await Promise.all(
            experience.proofs.map((proof) =>
                verifyProof(
                    experience,
                    proof,
                    proofFile
                )
            )
        );

        const { decisionReason,
            ...experienceWithoutDecisionReason } = experience;

        const parsed = journeyExperienceSchema.safeParse({
            ...experienceWithoutDecisionReason,
            proofs: verifiedProofs,
            isVerified: verifiedProofs.some(
                (proof) => proof.status === "verified"
            ),

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

        verifiedExperiences.push(normalized);
    }

    for (const exp of verifiedExperiences) {
        const isDuplicate = await validateExperienceDuplicate(userId, {
            title: exp.title,
            organization: exp.organization ?? undefined,
            description: exp.context,
            achievements: exp.achievements ?? undefined,
            outcome: exp.outcome ?? undefined,
        });

        if (isDuplicate) {
            throw new Error(
                `Submission rejected: An experience matching "${exp.title}" already exists in your journey footprint.`
            );
        }
    }

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
    await createExperiences(username, verifiedExperiences);
    for (const experience of verifiedExperiences) {
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
        });
    }
    const inferredTransitions: TransitionInference[] = [];
    for (const transition of transitions) {
        const candidates = await inferTransitionCandidates(transition.toExperienceId, transition.decisionLabel);
        const inferred = await inferTransition(candidates.current, candidates.top5);
        inferredTransitions.push(inferred);
    }
    const validatedTransitions = inferredTransitions
    .map((transition): JourneyTransition | null => {
        const currentExperience = verifiedExperiences.find(
            (experience) => experience.title === transition.currentTitle
        );
        if (!currentExperience) {
            console.warn(
                `Skipping transition: current experience "${transition.currentTitle}" not found.`
            );
            return null;
        }
        const previousExperience = verifiedExperiences.find(
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
    await createTransitions(validatedTransitions);
    const verifiedCount = verifiedExperiences.filter((experience) => experience.isVerified).length;
    await addExperienceReputation(userId, verifiedExperiences.length, verifiedCount);
    const { summary, expertiseAreas } = await generateUserSummary(userId);
    await updateUserSummary(userId, summary, expertiseAreas);
    const goalIds = [...new Set(verifiedExperiences.flatMap((experience) => experience.goalIds))];
    const goals = await getGoalsByIds(goalIds);
    try {
        await deleteJourneySession(conversationId);
    } catch (redisError) {
        console.error(`Failed to wipe Redis onboarding cache session ${conversationId}:`, redisError);
    }
    return {
        goals,
        experiences: verifiedExperiences.map(
            ({ proofs, ...experience }) => experience
        ),
        transitions: validatedTransitions,
    };

}