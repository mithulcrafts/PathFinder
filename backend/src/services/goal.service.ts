import {closeSession,getSession,} from "./neo4j.service.js";
import type { JourneyGoal } from "../types/journey/Journey.types.js";
import { toNeo4jDate } from "../utils/helper.js";
export async function createGoal(
  userId: string,
  goal: JourneyGoal
): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (u:User {clerkId: $userId})
      CREATE (g:Goal {
        id: $id,
        title: $title,
        description: $description,
        status: $status,
        topics: $topics,
        subtopics: $subtopics,
        startDate: date($startDate),
        endDate: CASE
          WHEN $endDate IS NULL
          THEN null
          ELSE date($endDate)
        END
      })
      MERGE (u)-[:HAS_GOAL]->(g)
      `,
      {
        userId,
        ...goal,
        startDate: toNeo4jDate(
          goal.startDate
        ),
        endDate:
          goal.endDate
            ? toNeo4jDate(goal.endDate)
            : null,
      }
    );
  } finally {
    await closeSession(session);

  }
}

export async function getGoalsByIds(
  goalIds: string[]
): Promise<JourneyGoal[]> {
  if (goalIds.length === 0) {
    return [];
  }
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (g:Goal)
      WHERE g.id IN $goalIds

      RETURN
        g.id AS id,
        g.title AS title,
        g.description AS description,
        g.status AS status,
        g.topics AS topics,
        g.subtopics AS subtopics,
        toString(g.startDate) AS startDate,
        CASE
          WHEN g.endDate IS NULL THEN null
          ELSE toString(g.endDate)
        END AS endDate
      `,
      {
        goalIds,
      }
    );
    return result.records.map((record) => ({
      id: record.get("id") as string,
      title: record.get("title") as string,
      description: record.get("description") as string,
      status: record.get("status") as JourneyGoal["status"],
      topics: record.get("topics") as JourneyGoal["topics"],
      subtopics: record.get("subtopics") as JourneyGoal["subtopics"],
      startDate: record.get("startDate") as string,
      endDate: record.get("endDate") as string | null,
    }));
  } finally {
    await closeSession(session);
  }
}

export type ExistingGoal = Pick<JourneyGoal, "id" | "title">;

export async function getUserGoals(
  userId: string
): Promise<ExistingGoal[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User {clerkId: $userId})-[:HAS_GOAL]->(g:Goal)
      RETURN
        g.id AS id,
        g.title AS title
      ORDER BY g.startDate ASC
      `,
      {
        userId,
      }
    );
    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
    }));
  } finally {
    await closeSession(session);
  }
}
