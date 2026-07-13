import type { JourneyTransition } from "../processors/journey/journeySchema.js";
import type { JourneyGoal } from "../types/journey/Journey.types.js";
import { getSession, closeSession } from "./neo4j.service.js";
import type { UserJourney } from "./user.service.js";

const TOPIC_SCORE = 10;
const SUBTOPIC_SCORE = 20;
const VERIFIED_SCORE = 5;

export interface SearchCommunityUsersInput {
  topic: string | undefined;
  subtopic: string | undefined;
  page: number;
  limit: number;
}

export async function getCommunityTopics(): Promise<string[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (g:Goal)
      UNWIND g.topics AS topic
      RETURN DISTINCT topic
      ORDER BY topic
      `
    );

    return result.records.map((record) => record.get("topic"));
  } finally {
    await closeSession(session);
  }
}

export async function getCommunitySubtopics(
  topic: string
): Promise<string[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (g:Goal)
      WHERE $topic IN g.topics

      UNWIND g.subtopics AS subtopic

      RETURN DISTINCT subtopic
      ORDER BY subtopic
      `,
      {
        topic,
      }
    );

    return result.records.map((record) => record.get("subtopic"));
  } finally {
    await closeSession(session);
  }
}

export async function searchCommunityUsers(
  input: SearchCommunityUsersInput
) {
  const session = getSession();

  try {
    const skip = (input.page - 1) * input.limit;

    const result = await session.run(
      `
      MATCH (u:User)

      // Fetch goals and matching goals
      CALL {
        WITH u

        OPTIONAL MATCH (u)-[:HAS_GOAL]->(g:Goal)

        WITH collect(g) AS goals

        RETURN
          [
            goal IN goals
            WHERE
              ($topic IS NULL OR $topic IN goal.topics)
              AND
              ($subtopic IS NULL OR $subtopic IN goal.subtopics)
          ] AS matchingGoals
      }

      // Check if user has any verified experience
      CALL {
        WITH u

        OPTIONAL MATCH (u)-[:HAS_EXPERIENCE]->(e:Experience)

        RETURN
          any(exp IN collect(e) WHERE exp.isVerified) AS hasVerifiedExperience
      }

      // Compute top 3 journey highlights
      CALL {
        WITH u

        OPTIONAL MATCH (u)-[:HAS_EXPERIENCE]->(e:Experience)
        OPTIONAL MATCH (e)-[:CONTRIBUTED_TO]->(g:Goal)

        WITH
          e,
          count(g) AS goalCount

        WITH
          e,
          (
            CASE WHEN e.isVerified THEN 5 ELSE 0 END +
            CASE
              WHEN e.achievements IS NOT NULL
                AND size(e.achievements) > 0
              THEN 4
              ELSE 0
            END +
            CASE WHEN e.outcome IS NOT NULL THEN 3 ELSE 0 END +
            CASE WHEN e.organization IS NOT NULL THEN 2 ELSE 0 END +
            CASE WHEN goalCount > 1 THEN 2 ELSE 0 END +
            CASE WHEN e.challengeFaced IS NOT NULL THEN 1 ELSE 0 END
          ) AS highlightScore

        ORDER BY
          highlightScore DESC,
          e.startDate DESC
        
        WITH
          collect({
          title: e.title,
          score: highlightScore
        }) AS highlights

        RETURN
          [h IN highlights[..3] | h.title] AS journeyHighlights,
          reduce(total = 0, h IN highlights | total + h.score) AS journeyScore
      }

      // FIX 1: Use a WITH clause to explicitly carry all variables from subqueries forward
      WITH 
        u, 
        matchingGoals, 
        hasVerifiedExperience, 
        journeyHighlights, 
        journeyScore
      WHERE size(matchingGoals) > 0

      WITH
        u,
        matchingGoals,
        hasVerifiedExperience,
        journeyHighlights,
        // FIX 2: Added a missing comma after journeyScore
        journeyScore,
        (
          CASE
            WHEN $topic IS NOT NULL
            THEN $topicScore
            ELSE 0
          END +

          CASE
            WHEN $subtopic IS NOT NULL
            THEN $subtopicScore
            ELSE 0
          END +

          CASE
            WHEN hasVerifiedExperience
            THEN $verifiedScore
            ELSE 0
          END +

          (journeyScore * 0.3)
        ) AS score

      RETURN
        u.username AS username,
        u.summary AS summary,
        u.expertiseAreas AS expertiseAreas,
        u.reputationScore AS reputationScore,
        size(matchingGoals) AS matchingGoalCount,
        [goal IN matchingGoals[..3] | goal.title] AS matchingGoalTitles,
        journeyHighlights

      ORDER BY
        score DESC,
        u.reputationScore DESC,
        u.username ASC

      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      `,
      {
        topic: input.topic ?? null,
        subtopic: input.subtopic ?? null,
        skip,
        limit: input.limit,
        topicScore: TOPIC_SCORE,
        subtopicScore: SUBTOPIC_SCORE,
        verifiedScore: VERIFIED_SCORE
      }
    );

    return result.records.map((record) => ({
      username: record.get("username"),
      summary: record.get("summary"),
      expertiseAreas: record.get("expertiseAreas"),
      reputationScore: record.get("reputationScore"),
      matchingGoalCount: Number(record.get("matchingGoalCount")),
      matchingGoalTitles: record.get("matchingGoalTitles"),
      journeyHighlights: record.get("journeyHighlights"),
    }));
  } finally {
    await closeSession(session);
  }
}

function neo4jDateToString(date: any): string | null {
  return date ? date.toString() : null;
}

export async function getCommunityJourney(
  username: string,
  userId?: string
): Promise<any> {
  const session = getSession();

  try {
    // User
    const userResult = await session.run(
      `
      MATCH (u:User {username: $username})
      RETURN u.username AS username, u.avatarUrl AS avatarUrl, coalesce(u.reputationScore, 0) AS reputationScore
      `,
      { username }
    );

    if (userResult.records.length === 0) {
      throw new Error("User not found.");
    }
    const userRecord = userResult.records[0];

    const goalsResult = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_GOAL]->(g:Goal)
      RETURN g
      `,
      { username }
    );

    const goals = goalsResult.records.map((record) => {
      const goal = record.get("g");

      return {
        id: goal.properties.id,
        title: goal.properties.title,
        description: goal.properties.description,
        status: goal.properties.status,
        topics: goal.properties.topics,
        subtopics: goal.properties.subtopics,
        startDate: goal.properties.startDate.toString(),
        endDate: goal.properties.endDate
          ? goal.properties.endDate.toString()
          : null,
      };
    }) satisfies JourneyGoal[];

    const experiencesResult = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_EXPERIENCE]->(e:Experience)
      OPTIONAL MATCH (e)-[:BUILT_SKILL]->(s:Skill)
      
      // Calculate upvote count
      CALL {
        WITH e
        RETURN count { (e)<-[:UPVOTED]-() } AS fastUpvoteCount
      }
      
      // Calculate if current user has upvoted
      CALL {
        WITH e
        OPTIONAL MATCH (me:User {clerkId: $userId})-[:UPVOTED]->(e)
        RETURN CASE WHEN me IS NOT NULL THEN true ELSE false END AS hasUpvoted
      }

      RETURN e, collect(DISTINCT s) AS skills, fastUpvoteCount, hasUpvoted
      `,
      { username, userId: userId ?? "anonymous" }
    );

    const experiences = experiencesResult.records.map((record) => {
      const experience = record.get("e").properties;
      const skillNodes = record.get("skills") as any[];

      return {
        id: experience.id,
        title: experience.title,
        startDate: experience.startDate.toString(),
        endDate: experience.endDate
          ? experience.endDate.toString()
          : null,
        context: experience.context,
        challengeFaced: experience.challengeFaced ?? null,
        outcome: experience.outcome ?? null,
        organization: experience.organization ?? null,
        applicationStatus: experience.applicationStatus ?? null,
        achievements: experience.achievements ?? null,
        isVerified: experience.isVerified ?? false,
        timelineSummary: experience.timelineSummary,
        upvoteCount: Number(record.get("fastUpvoteCount")),
        hasUpvoted: record.get("hasUpvoted"),
        goalIds: [] as string[],
        skills: skillNodes
          .filter(Boolean)
          .map((skill) => ({
            name: skill.properties.name,
            type: skill.properties.type,
          })),
      };
    });

    const goalRelationshipResult = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_EXPERIENCE]->(e:Experience)-[:CONTRIBUTED_TO]->(g:Goal)
      RETURN e.id AS experienceId, collect(g.id) AS goalIds
      `,
      { username }
    );

    const goalMap = new Map<string, string[]>();

    for (const record of goalRelationshipResult.records) {
      goalMap.set(
        record.get("experienceId"),
        record.get("goalIds")
      );
    }

    experiences.forEach((experience) => {
      experience.goalIds =
        goalMap.get(experience.id) ?? [];
    });

    const transitionsResult = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_EXPERIENCE]->(from:Experience)-[t:TRANSITION]->(to:Experience)

      RETURN
        from.id AS fromExperienceId,
        to.id AS toExperienceId,
        t.decisionLabel AS decisionLabel
      `,
      { username }
    );

    const transitions = transitionsResult.records.map(
      (record) => ({
        fromExperienceId:
          record.get("fromExperienceId"),
        toExperienceId:
          record.get("toExperienceId"),
        decisionLabel:
          record.get("decisionLabel"),
      })
    ) satisfies JourneyTransition[];

    return {
      user: {
        username: userRecord!.get("username"),
        avatarUrl: userRecord!.get("avatarUrl"),
        reputationScore: Number(userRecord!.get("reputationScore"))
      },
      username: userRecord!.get("username"),
      imageUrl: userRecord!.get("avatarUrl"),
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

export interface FeedExperience {
  id: string;
  title: string;
  context: string;
  outcome: string | null;
  isVerified: boolean;
  startDate: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  authorUsername: string;
}

export async function getGlobalFeed(
  userId?: string,
  page = 1,
  limit = 20
): Promise<FeedExperience[]> {
  const session = getSession();

  try {
    const skip = (page - 1) * limit;

    const result = await session.run(
      `
      MATCH (u:User)-[:HAS_EXPERIENCE]->(e:Experience)
      
      // Calculate if current user has upvoted
      CALL {
        WITH e
        OPTIONAL MATCH (me:User {clerkId: $userId})-[:UPVOTED]->(e)
        RETURN CASE WHEN me IS NOT NULL THEN true ELSE false END AS hasUpvoted
      }

      RETURN
        e.id AS id,
        e.title AS title,
        e.context AS context,
        e.outcome AS outcome,
        e.isVerified AS isVerified,
        e.startDate AS startDate,
        count { (e)<-[:UPVOTED]-() } AS fastUpvoteCount,
        hasUpvoted,
        u.username AS authorUsername,
        u.summary AS authorSummary
      ORDER BY e.startDate DESC, fastUpvoteCount DESC
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      `,
      {
        userId: userId ?? "anonymous",
        skip,
        limit,
      }
    );

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
      context: record.get("context"),
      outcome: record.get("outcome"),
      isVerified: record.get("isVerified") ?? false,
      startDate: record.get("startDate").toString(),
      upvoteCount: Number(record.get("fastUpvoteCount")),
      hasUpvoted: record.get("hasUpvoted"),
      authorUsername: record.get("authorUsername"),
      authorSummary: record.get("authorSummary") || "Backend engineering student building scalable systems through hackathons, open source contributions and internships.",
    }));
  } finally {
    await closeSession(session);
  }
}

export async function toggleUpvote(
  userId: string,
  experienceId: string
): Promise<{ upvoteCount: number; hasUpvoted: boolean }> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (u:User {clerkId: $userId})
      MATCH (e:Experience {id: $experienceId})
      
      // Get the author to reward reputation
      MATCH (author:User)-[:HAS_EXPERIENCE]->(e)

      // Toggle relationship using standard Cypher (apoc might not be installed, better safe)
      OPTIONAL MATCH (u)-[rel:UPVOTED]->(e)
      
      // First, handle deletion if it exists
      WITH u, e, author, rel
      CALL {
        WITH u, e, author, rel
        WITH u, e, author, rel
        WHERE rel IS NOT NULL
        DELETE rel
        SET author.reputationScore = coalesce(author.reputationScore, 2) - 2
        RETURN false AS toggledState
        
        UNION
        
        WITH u, e, author, rel
        WITH u, e, author, rel
        WHERE rel IS NULL
        MERGE (u)-[:UPVOTED]->(e)
        SET author.reputationScore = coalesce(author.reputationScore, 0) + 2
        RETURN true AS toggledState
      }
      
      RETURN toggledState AS hasUpvoted, count { (e)<-[:UPVOTED]-() } AS upvoteCount
      `,
      { userId, experienceId }
    );

    if (result.records.length === 0) {
      throw new Error("Experience not found or user not found");
    }

    const record = result.records[0];
    return {
      upvoteCount: Number(record!.get("upvoteCount")),
      hasUpvoted: record!.get("hasUpvoted"),
    };
  } finally {
    await closeSession(session);
  }
}

export interface GraphNode {
  id: string;
  title: string;
  authorUsername: string;
  upvoteCount: number;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  label: string | null;
}

export async function getTrendingGraph(limit = 20): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (u1:User)-[:HAS_EXPERIENCE]->(e1:Experience)-[t:TRANSITION]->(e2:Experience)<-[:HAS_EXPERIENCE]-(u2:User)
      
      WITH e1, e2, t, u1, u2, count { (e1)<-[:UPVOTED]-() } AS e1Upvotes, count { (e2)<-[:UPVOTED]-() } AS e2Upvotes
      
      ORDER BY (e1Upvotes + e2Upvotes) DESC, e1.startDate DESC
      LIMIT toInteger($limit)
      
      RETURN 
        e1.id AS e1Id, e1.title AS e1Title, u1.username AS e1Author, e1Upvotes,
        e2.id AS e2Id, e2.title AS e2Title, u2.username AS e2Author, e2Upvotes,
        t.decisionLabel AS decisionLabel
      `,
      { limit }
    );

    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const record of result.records) {
      const e1Id = record.get("e1Id");
      const e2Id = record.get("e2Id");

      if (!nodesMap.has(e1Id)) {
        nodesMap.set(e1Id, {
          id: e1Id,
          title: record.get("e1Title"),
          authorUsername: record.get("e1Author"),
          upvoteCount: Number(record.get("e1Upvotes"))
        });
      }

      if (!nodesMap.has(e2Id)) {
        nodesMap.set(e2Id, {
          id: e2Id,
          title: record.get("e2Title"),
          authorUsername: record.get("e2Author"),
          upvoteCount: Number(record.get("e2Upvotes"))
        });
      }

      edges.push({
        fromId: e1Id,
        toId: e2Id,
        label: record.get("decisionLabel") || null
      });
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges
    };
  } finally {
    await closeSession(session);
  }
}