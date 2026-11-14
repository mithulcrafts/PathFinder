import { getJourneySession, updateJourneySession } from "../../services/journeySession.service.js";
import { extractJourneyDraft } from "./extractJourneyDraft.processor.js";
import { applyJourneyDraftChanges } from "./finalizeJourneyDraft.processor.js";
import type { JourneyMessage } from "../../types/journey/JourneySession.types.js";
import type { GeminiJourneyDraft } from "../../types/journey/GeminiJourneyDraft.types.js";
import { getUserGoals } from "../../services/goal.service.js";

async function loadDraftGoals(userId: string) {
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getUserGoals(userId),
      new Promise<Awaited<ReturnType<typeof getUserGoals>>>(resolve => {
        deadline = setTimeout(() => resolve([]), 3_000);
      }),
    ]);
  } catch {
    return [];
  } finally {
    clearTimeout(deadline);
  }
}

export async function continueJourney(
  userId: string,
  conversationId: string,
  message: string
) {
  const session = await getJourneySession(conversationId);
  if (!session || session.userId !== userId) return null;

  const userMessage: JourneyMessage = {
    role: "user",
    content: message,
    timestamp: Date.now(),
  };
  const previous = session.journeyDraft?.experiences ?? [];
  const goalsRequest = session.journeyDraft?.goals ?? loadDraftGoals(userId);
  let extractionUnavailable = false;
  let geminiDraft: GeminiJourneyDraft;
  try {
    geminiDraft = (await extractJourneyDraft(message, previous, session.conversationHistory)) ?? { experiences: [] };
  } catch (error) {
    console.warn("Journey draft extraction unavailable:", error instanceof Error ? error.name : "Unknown error");
    extractionUnavailable = true;
    geminiDraft = { experiences: [] };
  }
  const { experiences, changedFields } = applyJourneyDraftChanges(geminiDraft, previous, message);
  const journeyDraft = { goals: await goalsRequest, experiences };

  session.conversationHistory.push(userMessage);
  session.journeyDraft = journeyDraft;
  session.updatedAt = Date.now();
  await updateJourneySession(conversationId, session);
  return { conversationId, journeyDraft, changedFields, extractionUnavailable };
}
