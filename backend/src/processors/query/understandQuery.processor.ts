import { groqProvider } from "../../ai/groq.provider.js";
import {queryUnderstandingSchema,type QueryUnderstanding} from "./querySchema.js";
import { queryJsonSchema } from "./queryJsonSchema.js";
import {QUERY_UNDERSTANDING_SYSTEM_PROMPT,buildQueryUnderstandingPrompt} from "../../prompts/queryUnderstanding.prompt.js";


export async function understandQuery(
  userQuery: string
): Promise<QueryUnderstanding> {
  const result =
    await groqProvider.generateStructuredJson<unknown>({
      systemPrompt: QUERY_UNDERSTANDING_SYSTEM_PROMPT,

      userPrompt:
        buildQueryUnderstandingPrompt(userQuery),

      jsonSchema: queryJsonSchema,
    });

  const validation =
    queryUnderstandingSchema.safeParse(result);

  if (!validation.success) {
    throw new Error(
      `Query understanding validation failed: ${validation.error.message}`
    );
  }

  return validation.data;
}