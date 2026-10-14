import { randomUUID } from "crypto";
import { getUserGoals } from "../../services/goal.service.js";
import type { GeminiJourneyDraft } from "../../types/journey/GeminiJourneyDraft.types.js";
import type { PartialJourneyDraft } from "../../types/journey/PartialJourney.types.js";

export async function finalizeJourneyDraft(
    draft: GeminiJourneyDraft,
    userId: string
): Promise<PartialJourneyDraft> {
    const existingGoals = await getUserGoals(userId);
    const experiences =
        draft.experiences.map((experience) => {
            return {
                ...experience,
                id:randomUUID(),
                goalIds: [],
                proofs: [],
                isVerified: false,
            };
        });
    return {
        goals: existingGoals,
        experiences,
    };
}