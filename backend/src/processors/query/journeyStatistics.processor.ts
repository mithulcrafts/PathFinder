import type { RetrievedContext } from "./retrieveContext.processor.js";

export interface JourneyStatistics {
  usersAnalyzed: number;
  experiencesAnalyzed: number;
}

export function buildJourneyStatistics(
  context: RetrievedContext
): JourneyStatistics {
  const matchedUsers = new Set<string>();
  const experienceIds = new Set(context.experiences.map((experience) => experience.id));

  for (const journey of context.journeys) {
    if (
      journey.experienceIds.some((id) => experienceIds.has(id))
    ) {
      matchedUsers.add(journey.username);
    }
  }
  return {
    usersAnalyzed: matchedUsers.size,
    experiencesAnalyzed: context.experiences.length,
  };
}
