import { closeSession, getSession } from "./neo4j.service.js";

export interface JourneyExperience {
  id: string;
  title: string;
}

export interface RetrievedJourney {
  username: string;
  summary: string;
  expertiseAreas: string[];
  imageUrl: string | null;
  reputationScore: number;
  experienceIds: string[];
}

export async function retrieveJourneys(
  usernames: string[]
): Promise<RetrievedJourney[]> {
  if (usernames.length === 0) {
    return [];
  }

  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (u:User)-[:HAS_EXPERIENCE]->(e:Experience)

      WHERE u.username IN $usernames

      RETURN
        u.username AS username,
        u.summary AS summary,
        u.expertiseAreas AS expertiseAreas,
        u.imageUrl AS imageUrl,
        u.reputationScore AS reputationScore,
        collect(e.id) AS experienceIds
      `,
      {
        usernames,
      }
    );

    return result.records.map((record) => ({
      username: record.get("username") as string,

      summary:
        (record.get("summary") as string) ?? "",

      expertiseAreas:
        (record.get("expertiseAreas") as string[]) ?? [],
      imageUrl:
        (record.get("imageUrl") as string) ?? null,

      reputationScore:
        (record.get("reputationScore") as number) ?? 0,

      experienceIds:
        record.get("experienceIds") as string[],
    }));
  } finally {
    await closeSession(session);
  }
}