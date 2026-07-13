import type { RetrievedContext } from "./retrieveContext.processor.js";
import type {
  JourneyExperience,
  JourneyTransition,
} from "../journey/journeySchema.js";

import type { RetrievedJourney } from "../../services/journeyRetrieval.service.js";
import type { JourneyGoal } from "../../types/journey/Journey.types.js";

export interface RelevantJourney {
  username: string;
  summary: string;
  expertiseAreas: string[];
  imageUrl?: string | null;
  expandedDetails: {
    goals: JourneyGoal[];
    experiences: Omit<JourneyExperience, "proofs">[];
    transitions: JourneyTransition[];
  };
}

export function buildTimelineFeed(
  context: RetrievedContext
): RelevantJourney[] {

  // experienceId -> owner journey
  const journeyByExperienceId = new Map<string, RetrievedJourney>();

  for (const journey of context.journeys) {
    for (const id of journey.experienceIds) {
      journeyByExperienceId.set(id, journey);
    }
  }

  // username -> matched experiences
  const grouped = new Map<
    string,
    {
      journey: RetrievedJourney;
      experiences: typeof context.experiences;
    }
  >();

  for (const experience of context.experiences) {
    const journey = journeyByExperienceId.get(experience.id);

    if (!journey) continue;

    if (!grouped.has(journey.username)) {
      grouped.set(journey.username, {
        journey,
        experiences: [],
      });
    }

    grouped.get(journey.username)!.experiences.push(experience);
  }

  return [...grouped.values()].map(({ journey, experiences }) => {

    const relevantGoalIds = new Set(
      experiences.flatMap((e) => e.goalIds)
    );

    const goals = context.goals.filter((goal) =>
      relevantGoalIds.has(goal.id)
    );

    const transitions: JourneyTransition[] =
      experiences.flatMap((experience) =>
        experience.transitions.map((transition) => ({
          fromExperienceId: experience.id,
          toExperienceId: transition.toExperienceId,
          decisionLabel: transition.decisionLabel,
        }))
      );

    return {
      username: journey.username,
      summary: journey.summary,
      expertiseAreas: journey.expertiseAreas,
      imageUrl: journey.imageUrl,

      expandedDetails: {
        goals,
        experiences: experiences.map((experience) => ({
          id: experience.id,
          title: experience.title,
          startDate: experience.startDate,
          endDate: experience.endDate ?? null,
          context: experience.context,
          challengeFaced: experience.challengeFaced ?? null,
          outcome: experience.outcome ?? null,
          organization: experience.organization ?? null,
          applicationStatus:
            experience.applicationStatus ?? null,
          achievements: experience.achievements ?? null,
          isVerified: experience.isVerified,
          timelineSummary: experience.timelineSummary,
          goalIds: experience.goalIds,
          skills: experience.skills,
        })),
        transitions,
      },
    };
  });
}