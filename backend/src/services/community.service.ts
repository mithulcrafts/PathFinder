import { rankTrendingPaths, type PathVote, type RankedCommunityPath } from "./trendingPaths.js";
import { getSession, closeSession } from "./neo4j.service.js";
import { attachExperienceGoals, mapJourneyExperience, mapJourneyGoal, mapJourneyTransition } from "./journeyMapping.js";

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
      WHERE size(matchingGoals) > 0 OR ($topic IS NULL AND $subtopic IS NULL AND size(journeyHighlights) > 0 AND journeyHighlights[0] IS NOT NULL)

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

    const goals = goalsResult.records.map(mapJourneyGoal);

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

    const experiences = experiencesResult.records.map((record) => ({
      ...mapJourneyExperience(record),
      upvoteCount: Number(record.get("fastUpvoteCount")),
      hasUpvoted: record.get("hasUpvoted"),
    }));

    const goalRelationshipResult = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_EXPERIENCE]->(e:Experience)-[:CONTRIBUTED_TO]->(g:Goal)
      RETURN e.id AS experienceId, collect(g.id) AS goalIds
      `,
      { username }
    );

    attachExperienceGoals(experiences, goalRelationshipResult.records);

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

    const transitions = transitionsResult.records.map(mapJourneyTransition);

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
        MERGE (u)-[vote:UPVOTED]->(e)
        ON CREATE SET vote.createdAt = datetime()
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

export async function getTrendingGraph(limit = 20): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: RankedCommunityPath[];
}> {
  const session = getSession();
  const now = Date.now();
  const since = new Date(now - 30 * 86_400_000).toISOString();
  const candidateLimit = Math.max(80, limit * 8);

  try {
    const seedResult = await session.run(
      `
      MATCH (author:User)-[:HAS_EXPERIENCE]->(seed:Experience)
      WHERE author.username IS NOT NULL AND NOT coalesce(author.isFlagged, false)
        AND EXISTS {
          MATCH (seed)-[:TRANSITION]-(neighbor:Experience)<-[:HAS_EXPERIENCE]-(other:User)
          WHERE other.username IS NOT NULL AND NOT coalesce(other.isFlagged, false)
        }
      WITH DISTINCT seed
      OPTIONAL MATCH (seed)<-[vote:UPVOTED]-(voter:User)
      WHERE NOT EXISTS { MATCH (voter)-[:HAS_EXPERIENCE]->(seed) }
      WITH seed, count(DISTINCT voter) AS lifetime,
        count(DISTINCT CASE WHEN vote.createdAt >= datetime($since) AND vote.createdAt <= datetime($now) THEN voter END) AS recent
      WITH seed, lifetime, recent
      ORDER BY recent DESC, lifetime DESC, seed.startDate DESC, seed.id
      LIMIT toInteger($candidateLimit)
      RETURN seed.id AS id
      `,
      { since, now: new Date(now).toISOString(), candidateLimit },
    );
    const seedIds = seedResult.records.map(record => record.get("id") as string);
    if (!seedIds.length) return { nodes: [], edges: [], paths: [] };

    const edgeResult = await session.run(
      `
      UNWIND $seedIds AS seedId
      MATCH (seed:Experience {id: seedId})
      CALL {
        WITH seed
        MATCH (seed)-[transition:TRANSITION]-(neighbor:Experience)
        WITH DISTINCT transition
        WITH startNode(transition) AS source, endNode(transition) AS target, transition
        MATCH (a:User)-[:HAS_EXPERIENCE]->(source), (b:User)-[:HAS_EXPERIENCE]->(target)
        WHERE a.username IS NOT NULL AND b.username IS NOT NULL
          AND NOT coalesce(a.isFlagged, false) AND NOT coalesce(b.isFlagged, false)
        WITH source, target, transition, min(a.username) AS sourceAuthor, min(b.username) AS targetAuthor
        ORDER BY
          (CASE WHEN source.id IN $seedIds THEN 1 ELSE 0 END) +
          (CASE WHEN target.id IN $seedIds THEN 1 ELSE 0 END) DESC,
          source.id, target.id
        LIMIT 12
        RETURN source, target, sourceAuthor, targetAuthor, transition
      }
      RETURN DISTINCT source.id AS fromId, source.title AS fromTitle, sourceAuthor,
        target.id AS toId, target.title AS toTitle, targetAuthor, transition.decisionLabel AS label
      ORDER BY fromId, toId, label
      `,
      { seedIds },
    );
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    for (const record of edgeResult.records) {
      const fromId = record.get("fromId") as string;
      const toId = record.get("toId") as string;
      nodes.set(fromId, { id: fromId, title: record.get("fromTitle"), authorUsername: record.get("sourceAuthor"), upvoteCount: 0 });
      nodes.set(toId, { id: toId, title: record.get("toTitle"), authorUsername: record.get("targetAuthor"), upvoteCount: 0 });
      const key = JSON.stringify([fromId, toId]);
      if (!edges.has(key)) edges.set(key, { fromId, toId, label: record.get("label") ?? null });
    }
    if (!nodes.size) return { nodes: [], edges: [], paths: [] };

    const voteResult = await session.run(
      `
      UNWIND $ids AS id
      MATCH (e:Experience {id: id})<-[vote:UPVOTED]-(voter:User)
      WHERE NOT EXISTS { MATCH (voter)-[:HAS_EXPERIENCE]->(e) }
      WITH e, voter, max(vote.createdAt) AS latestVote
      RETURN e.id AS experienceId, elementId(voter) AS voterId, latestVote.epochMillis AS castAt
      `,
      { ids: [...nodes.keys()] },
    );
    const votes: PathVote[] = voteResult.records.map(record => {
      const experienceId = record.get("experienceId") as string;
      const castAt = record.get("castAt");
      nodes.get(experienceId)!.upvoteCount++;
      return { experienceId, voterId: record.get("voterId"), castAt: castAt == null ? null : Number(castAt) };
    });
    const paths = rankTrendingPaths(seedIds, [...nodes.values()], [...edges.values()], votes, now, limit);
    return { paths, nodes: paths.flatMap(path => path.nodes), edges: paths.flatMap(path => path.edges) };
  } finally {
    await closeSession(session);
  }
}
