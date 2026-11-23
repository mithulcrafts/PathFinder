
import { apiFetch, apiRequest } from "./api";

export interface TranslateResponse {
  translatedAiInsights: {
    directAnswer: string;
    actionableTakeaway: string;
    keyPoints: string[];
  };
}

export async function translateInsights(
  token: string | null,
  aiInsights: any,
  language: string
): Promise<TranslateResponse> {
  return apiFetch<TranslateResponse>(
    "/output/translate",
    {
      method: "POST",
      body: JSON.stringify({ aiInsights, language }),
    },
    token || undefined
  );
}

export async function generateSpeechUri(
  token: string | null,
  aiInsights: any,
  language: string
): Promise<string> {
  const response = await apiRequest(
    "/output/speech",
    {
      method: "POST",
      body: JSON.stringify({
        aiInsights,
        language,
        speaker: "shubh",
      }),
    },
    token || undefined
  );

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}
