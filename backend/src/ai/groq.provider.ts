import { groqClient } from "../config/groq.config.js";

interface StructuredJsonSchema {
  name: string;
  strict?: boolean;
  schema: Record<string, unknown>;
}

interface StructuredJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: StructuredJsonSchema;
}

class GroqProvider {
  async generateText(systemPrompt: string,
  userPrompt: string): Promise<string> {
    const response = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content ?? "";
  }

  async generateStructuredJson<T>({
    systemPrompt,
    userPrompt,
    jsonSchema,
  }: StructuredJsonOptions): Promise<T> {
    const response =
      await groqClient.chat.completions.create({
        model: "openai/gpt-oss-120b",

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],

        response_format: {
            type: "json_schema",
            json_schema: {
            name: jsonSchema.name,
            strict: jsonSchema.strict ?? true,
            schema: jsonSchema.schema,
           },
       },

        temperature: 0,
      });

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Groq returned empty structured response"
      );
    }

    return JSON.parse(content) as T;
  }
}

export const groqProvider = new GroqProvider();