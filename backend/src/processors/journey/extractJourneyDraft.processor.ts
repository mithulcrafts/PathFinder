import { geminiProvider } from "../../ai/gemini.provider.js";
import { JOURNEY_DRAFT_SYSTEM_PROMPT, buildJourneyDraftPrompt, } from "../../prompts/onboarding/journeyDraft.prompt.js";
import type { GeminiExperience, GeminiJourneyDraft } from "../../types/journey/GeminiJourneyDraft.types.js";
import type { JourneyMessage } from "../../types/journey/JourneySession.types.js";
import { partialJourneyDraftSchema } from "./partialJourneyDraft.schema.js";

export async function extractJourneyDraft(
  narrative: string,
  previous: GeminiExperience[],
  history: JourneyMessage[],
): Promise<GeminiJourneyDraft> {

  return geminiProvider.generateStructuredJson<GeminiJourneyDraft>({
    systemPrompt: JOURNEY_DRAFT_SYSTEM_PROMPT,
    userPrompt: buildJourneyDraftPrompt(narrative, previous, history),
    schema: partialJourneyDraftSchema,
    timeoutMs: 15_000,
  });

}
