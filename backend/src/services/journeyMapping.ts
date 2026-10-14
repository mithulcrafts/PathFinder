import type { Record as Neo4jRecord } from "neo4j-driver";
import type {
  JourneyExperience,
  JourneyGoal,
  JourneySkill,
  JourneyTransition,
} from "../types/journey/Journey.types.js";

type JourneyRecord = Pick<Neo4jRecord, "get">;
type SkillNode = { properties: JourneySkill };

export function mapJourneyGoal(record: JourneyRecord): JourneyGoal {
  const goal = record.get("g").properties;

  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    topics: goal.topics,
    subtopics: goal.subtopics,
    startDate: goal.startDate.toString(),
    endDate: goal.endDate ? goal.endDate.toString() : null,
  };
}

// Public journey responses intentionally omit proof records.
export function mapJourneyExperience(
  record: JourneyRecord
): Omit<JourneyExperience, "proofs"> {
  const experience = record.get("e").properties;
  const skills = record.get("skills") as (SkillNode | null)[];

  return {
    id: experience.id,
    title: experience.title,
    startDate: experience.startDate.toString(),
    endDate: experience.endDate ? experience.endDate.toString() : null,
    context: experience.context,
    challengeFaced: experience.challengeFaced ?? null,
    outcome: experience.outcome ?? null,
    organization: experience.organization ?? null,
    applicationStatus: experience.applicationStatus ?? null,
    achievements: experience.achievements ?? null,
    isVerified: experience.isVerified ?? false,
    timelineSummary: experience.timelineSummary,
    goalIds: [],
    skills: skills
      .filter((skill): skill is SkillNode => Boolean(skill))
      .map((skill) => ({
        name: skill.properties.name,
        type: skill.properties.type,
      })),
  };
}

export function attachExperienceGoals(
  experiences: Pick<JourneyExperience, "id" | "goalIds">[],
  records: JourneyRecord[]
): void {
  const goalIdsByExperience = new Map<string, string[]>();
  for (const record of records) {
    goalIdsByExperience.set(record.get("experienceId"), record.get("goalIds"));
  }

  for (const experience of experiences) {
    experience.goalIds = goalIdsByExperience.get(experience.id) ?? [];
  }
}

export function mapJourneyTransition(record: JourneyRecord): JourneyTransition {
  return {
    fromExperienceId: record.get("fromExperienceId"),
    toExperienceId: record.get("toExperienceId"),
    decisionLabel: record.get("decisionLabel"),
  };
}
