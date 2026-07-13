import { sarvamProvider } from "../../ai/sarvam.provider.js";
import type { AiInsights } from "../query/aiInsights.schema.js";

export interface TranslatedAiInsights {
  directAnswer: string;
  keyPoints: string[];
  actionableTakeaway: string;
}
export async function translateAiInsights(
  aiInsights: AiInsights,
  targetLanguage: string
): Promise<TranslatedAiInsights> {
  if (targetLanguage === "en-IN" || targetLanguage === "en") {
    return {
      directAnswer: aiInsights.directAnswer || "",
      keyPoints: aiInsights.keyPoints || [],
      actionableTakeaway: aiInsights.actionableTakeaway || ""
    };
  }

  const directAnswerPromise = aiInsights.directAnswer
    ? sarvamProvider.translate(aiInsights.directAnswer, targetLanguage, "en-IN")
    : Promise.resolve("");

  const actionableTakeawayPromise = aiInsights.actionableTakeaway
    ? sarvamProvider.translate(aiInsights.actionableTakeaway, targetLanguage, "en-IN")
    : Promise.resolve("");

  const keyPointsPromise = Array.isArray(aiInsights.keyPoints)
    ? Promise.all(
        aiInsights.keyPoints.map((point) =>
          point ? sarvamProvider.translate(point, targetLanguage, "en-IN") : Promise.resolve("")
        )
      )
    : Promise.resolve([]);

  const [directAnswer, actionableTakeaway, keyPoints] = await Promise.all([
    directAnswerPromise,
    actionableTakeawayPromise,
    keyPointsPromise,
  ]);

  return {
    directAnswer,
    keyPoints,
    actionableTakeaway,
  };
}