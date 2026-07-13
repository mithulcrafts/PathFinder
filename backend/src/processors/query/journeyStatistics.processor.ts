import type { RetrievedContext } from "./retrieveContext.processor.js";

export interface JourneyStatistics {
  usersAnalyzed: number;
  experiencesAnalyzed: number;
}

export function buildJourneyStatistics(
  context: RetrievedContext
): JourneyStatistics {
  const matchedUsers = new Set<string>();

  for (const journey of context.journeys) {
    if (
      journey.experienceIds.some((id) =>
        context.experiences.some((e) => e.id === id)
      )
    ) {
      matchedUsers.add(journey.username);
    }
  }
  return {
    usersAnalyzed: matchedUsers.size,
    experiencesAnalyzed: context.experiences.length,
  };
}