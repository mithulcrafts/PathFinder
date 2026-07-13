import { geminiClient } from "../config/gemini.config.js";
import type { Schema } from "@google/generative-ai";

export class GeminiProvider {
  async generateText(systemPrompt: string,
    userPrompt: string): Promise<string> {
    const model = geminiClient.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);

    return result.response.text();
  }

  async generateStructuredJson<T>({
    systemPrompt,
    userPrompt,
    schema,
    temperature,
  }: {
    systemPrompt: string;
    userPrompt: string;
    schema: Schema;
    temperature?: number;
  }): Promise<T> {
    const model =
      geminiClient.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        systemInstruction: systemPrompt,

        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: temperature ?? 0.1,
        },
      });

  const result =
    await model.generateContent(
      userPrompt
    );

  const text =
    result.response.text();

  if (!text) {
    throw new Error(
      "Gemini returned empty structured response"
    );
  }

  return JSON.parse(text) as T;
}
}

export const geminiProvider = new GeminiProvider();