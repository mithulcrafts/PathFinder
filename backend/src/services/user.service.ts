import type { JourneyExperience, JourneyTransition } from "../processors/journey/journeySchema.js";
import type { JourneyGoal } from "../types/journey/Journey.types.js";
import { closeSession, getSession } from "./neo4j.service.js";
import { attachExperienceGoals, mapJourneyExperience, mapJourneyGoal, mapJourneyTransition } from "./journeyMapping.js";

export interface UpdateProfileInput {
  clerkId: string;
  username?: string;
  preferredLanguage?: string;
}

export interface UserProfile {
  clerkId: string;
  email: string;
  username: string | null;
  preferredLanguage: string | null;
  reputationScore: number;
  flagCount: number;
  isFlagged: boolean;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<UserProfile> {

  const session = getSession();

  try {

    const result = await session.run(
      `
      MATCH (u:User { clerkId: $clerkId })

      SET
        u.updatedAt = datetime(),
        u.username = COALESCE($username, u.username),
        u.preferredLanguage = COALESCE($preferredLanguage, u.preferredLanguage)

      RETURN
        u.clerkId AS clerkId,
        u.email AS email,
        u.username AS username,
        u.preferredLanguage AS preferredLanguage,
        u.reputationScore AS reputationScore,
        u.flagCount AS flagCount,
        u.isFlagged AS isFlagged
      `,
      input
    );

    const record = result.records[0];

    if (!record) {
      throw new Error("User not found");
    }

    return {
      clerkId: record.get("clerkId"),
      email: record.get("email"),
      username: record.get("username"),
      preferredLanguage: record.get("preferredLanguage"),
      reputationScore: record.get("reputationScore"),
      flagCount: record.get("flagCount"),
      isFlagged: record.get("isFlagged"),
    };

  } finally {

    await closeSession(session);

  }
}

export async function getUsernameByUserId(
  clerkId: string
): Promise<string> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})
      RETURN u.username AS username
      `,
      { clerkId }
    );
    if (result.records.length === 0) {
      throw new Error("User not found.");
    }
    const username = result.records[0]?.get( "username") as string;
    if (!username) { throw new Error("Username not found.");}
    return username;
  } finally {
    await closeSession(session);
  }
}

export interface UserJourneyStatistics {
  goals: number;
  experiences: number;
  transitions: number;
}

export interface UserJourney {
  username: string;
  statistics: UserJourneyStatistics;
  goals: JourneyGoal[];
  experiences: Omit<JourneyExperience, "proofs">[];
  transitions: JourneyTransition[];
}

export async function getUserJourney(
  clerkId: string
): Promise<UserJourney> {
  const session = getSession();

  try {
    const userResult = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})
      RETURN u.username AS username
      `,
      { clerkId }
    );
    if (userResult.records.length === 0) {
      throw new Error("User not found.");
    }
    const username = userResult.records[0]!.get("username") as string;

    const goalsResult = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})-[:HAS_GOAL]->(g:Goal)
      RETURN g
      `,
      { clerkId }
    );

    const goals = goalsResult.records.map(mapJourneyGoal);
    const experiencesResult = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})-[:HAS_EXPERIENCE]->(e:Experience)
      OPTIONAL MATCH (e)-[:BUILT_SKILL]->(s:Skill)
      RETURN e, collect(DISTINCT s) AS skills
      `,
      { clerkId }
    );

    const experiences = experiencesResult.records.map(mapJourneyExperience);
    const goalRelationshipResult = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})-[:HAS_EXPERIENCE]->(e:Experience)-[:CONTRIBUTED_TO]->(g:Goal)
      RETURN e.id AS experienceId, collect(g.id) AS goalIds
      `,
      { clerkId }
    );

    attachExperienceGoals(experiences, goalRelationshipResult.records);

    const transitionsResult = await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})-[:HAS_EXPERIENCE]->(from:Experience)-[t:TRANSITION]->(to:Experience)
      RETURN from.id AS fromExperienceId, to.id AS toExperienceId, t.decisionLabel AS decisionLabel
      `,
      { clerkId }
    );

    const transitions = transitionsResult.records.map(mapJourneyTransition);

    return {
      username,
      statistics: {
        goals: goals.length,
        experiences: experiences.length,
        transitions: transitions.length,
      },
      goals,
      experiences,
      transitions,
    };
  } finally {
    await closeSession(session);
  }
}

export async function updateUserSummary(
  clerkId: string,
  summary: string,
  expertiseAreas: string[]
): Promise<void> {
  const session = getSession();

  try {
    await session.run(
      `
      MATCH (u:User {clerkId: $clerkId})

      SET
        u.summary = $summary,
        u.expertiseAreas = $expertiseAreas,
        u.updatedAt = datetime()
      `,
      {
        clerkId,
        summary,
        expertiseAreas,
      }
    );
  } finally {
    await closeSession(session);
  }
}