import { apiFetch } from "./api";

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export async function generateSpeechUri(
  token: string | null,
  aiInsights: any,
  language: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/output/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ aiInsights, language, speaker: "shubh" }), // Use valid speaker "shubh"
  });

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  // We need to read the audio blob as base64 and return a data URI for expo-audio
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string); // reader.result is already a data URI string
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
