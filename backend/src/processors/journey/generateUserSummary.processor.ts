import { geminiProvider } from "../../ai/gemini.provider.js";
import { closeSession, getSession } from "../../services/neo4j.service.js";
import {USER_SUMMARY_SYSTEM_PROMPT,buildUserSummaryPrompt,
} from "../../prompts/profile/userSummary.prompt.js";
import { userSummarySchema } from "./userSummary.schema.js";

export interface UserSummary {
  summary: string;
  expertiseAreas: string[];
}

export async function generateUserSummary(
  clerkId: string,
  timeoutMs = 10_000,
): Promise<UserSummary> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})
      OPTIONAL MATCH (u)-[:HAS_GOAL]->(g:Goal)
      OPTIONAL MATCH (u)-[:HAS_EXPERIENCE]->(e:Experience)
      OPTIONAL MATCH (e)-[:BUILT_SKILL]->(s:Skill)
      WITH
        u,
        collect(DISTINCT g.title) AS goalTitles,
        collect(DISTINCT g.topics) AS topicLists,
        collect(DISTINCT g.subtopics) AS subtopicLists,
        collect(DISTINCT e.timelineSummary) AS timelineSummaries,
        collect(DISTINCT s.name) AS skills
      RETURN
        goalTitles,
        topicLists,
        subtopicLists,
        timelineSummaries,
        skills
      `,
      { clerkId }
    );

    const record = result.records[0];
    if (!record) {
      throw new Error("User not found.");
    }
    const topics = [
      ...new Set((record.get("topicLists") as string[][])
          .flat()
          .filter(Boolean)
      ),
    ];

    const subtopics = [
      ...new Set((record.get("subtopicLists") as string[][])
          .flat()
          .filter(Boolean)
      ),
    ];

    return geminiProvider.generateStructuredJson<UserSummary>({
      systemPrompt: USER_SUMMARY_SYSTEM_PROMPT,
      userPrompt: buildUserSummaryPrompt({
        goalTitles: (record.get("goalTitles") as string[]).filter(Boolean),
        timelineSummaries: (
          record.get("timelineSummaries") as string[]
        ).filter(Boolean),
        skills: (record.get("skills") as string[]).filter(Boolean),
        topics,
        subtopics,
      }),
      schema: userSummarySchema,
      timeoutMs,
    });
  } finally {
    await closeSession(session);
  }
}
