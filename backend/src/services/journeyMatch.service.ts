import type { Session } from "neo4j-driver";
import { compareJourneys, type MatchGraph, type JourneyMatch } from "./journeyMatch.scoring.js";

// Only project non-sensitive matching features; never return owner graph or proofs.
export async function journeyMatches(
  clerkId: string | null,
  usernames: string[],
  createSession: () => Promise<Session> = async () => {
    const { getSession } = await import("./neo4j.service.js");
    return getSession({ defaultAccessMode: "READ" });
  },
): Promise<Map<string, JourneyMatch>> {
  const matches = new Map<string, JourneyMatch>();
  if (!clerkId || !usernames.length) return matches;
  let session: Session | undefined;
  try {
    session = await createSession();
    const result = await session.run(`
      MATCH (owner:User {clerkId: $clerkId})
      WITH owner
      MATCH (u:User)
      WHERE u = owner OR u.username IN $usernames
      WITH DISTINCT owner, u
      LIMIT 21
      CALL {
        WITH u
        MATCH (u)-[:HAS_GOAL]->(g:Goal)
        WITH g ORDER BY g.id LIMIT 50
        RETURN collect({topics: g.topics, subtopics: g.subtopics}) AS goals
      }
      CALL {
        WITH u
        MATCH (u)-[:HAS_EXPERIENCE]->(e:Experience)
        WITH e ORDER BY e.startDate DESC, e.id LIMIT 100
        RETURN collect(e) AS nodes
      }
      CALL {
        WITH nodes
        UNWIND nodes AS e
        CALL {
          WITH e
          MATCH (e)-[:BUILT_SKILL]->(s:Skill)
          WHERE s.name IS NOT NULL
          WITH DISTINCT s.name AS skill
          ORDER BY skill LIMIT 30
          RETURN collect(skill) AS skills
        }
        RETURN collect({
          id: e.id, title: e.title, context: e.context,
          challengeFaced: e.challengeFaced, outcome: e.outcome,
          skills: skills
        }) AS experiences
      }
      CALL {
        WITH nodes
        UNWIND nodes AS e
        MATCH (e)-[:TRANSITION]->(target:Experience)
        WHERE target IN nodes
        WITH DISTINCT e, target ORDER BY e.id, target.id LIMIT 200
        RETURN collect({from: e.id, to: target.id}) AS transitions
      }
      RETURN u = owner AS isOwner, u.username AS username, goals, experiences, transitions
    `, { clerkId, usernames: [...new Set(usernames)].slice(0, 20) }, { timeout: 5000 });
    const rows = result.records.map(record => ({
      isOwner: record.get("isOwner") as boolean,
      graph: {
        username: record.get("username") as string,
        goals: record.get("goals"),
        experiences: record.get("experiences"),
        transitions: record.get("transitions"),
      } as MatchGraph,
    }));
    const owner = rows.find(row => row.isOwner)?.graph;
    if (!owner) return matches;
    const computedAt = new Date().toISOString();
    for (const row of rows) {
      if (row.isOwner) continue;
      const score = compareJourneys(owner, row.graph, computedAt);
      if (score) matches.set(row.graph.username, score);
    }
    return matches;
  } catch {
    // Fail closed: search remains available, but never manufacture a percentage.
    matches.clear();
    return matches;
  } finally {
    try { await session?.close(); } catch { matches.clear(); }
  }
}
