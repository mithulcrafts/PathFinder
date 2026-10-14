import { closeSession, getSession } from "./neo4j.service.js";
import type { ApplicationStatus, JourneyGoal, JourneySkill } from "../types/journey/Journey.types.js";

export type RetrievedGoal = JourneyGoal;

export type RetrievedSkill = JourneySkill;

export interface RetrievedTransition {
  toExperienceId: string;
  decisionLabel: string;
}

export interface RetrievedExperience {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  context: string;
  challengeFaced?: string | null;
  outcome?: string | null;
  organization?: string | null;
  applicationStatus?: ApplicationStatus | null;
  achievements?: string[] | null;
  isVerified: boolean;
  score: number;
  goalIds: string[];
  skills: JourneySkill[];
  transitions: RetrievedTransition[];
  timelineSummary: string;
}

export interface ExpandedGraph {
  experiences: RetrievedExperience[];
  goals: RetrievedGoal[];
  skills: RetrievedSkill[];
}

export async function expandGraph(
  rankedExperienceIds: string[]
): Promise<ExpandedGraph> {
  if (rankedExperienceIds.length === 0) {
    return {
      experiences: [], goals: [], skills: [],
    };
  }

  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Experience)

      WHERE e.id IN $experienceIds

      OPTIONAL MATCH (e)-[:CONTRIBUTED_TO]->(g:Goal)
      OPTIONAL MATCH (e)-[:BUILT_SKILL]->(s:Skill)
      OPTIONAL MATCH (e)-[t:TRANSITION]->(next:Experience)

    RETURN e,
    collect(
      DISTINCT {
        id: g.id,
        title: g.title,
        description: g.description,
        status: g.status,
        topics: g.topics,
        subtopics: g.subtopics,
        startDate: g.startDate,
        endDate: g.endDate
      }
    ) AS goals,

    collect(
       DISTINCT {
        name: s.name,
        type: s.type
      }
    ) AS skills,

    collect(
        DISTINCT {
          toExperienceId: next.id,
          decisionLabel: t.decisionLabel
       }
    ) AS transitions
      `,
      {
        experienceIds:
          rankedExperienceIds,
      }
    );

    const goalsMap = new Map<string, RetrievedGoal>();
    const skillsMap = new Map<string, RetrievedSkill>();

    const experiences = result.records.map((record) => {
      const e = record.get("e").properties;
      const goals = record.get("goals");
      const skills = record.get("skills") as RetrievedSkill[];
      const transitions = record.get("transitions") as RetrievedTransition[];
      const goalIds: string[] = [];

      for (const goal of goals) {
        if (!goal?.id) {
          continue;
        }

        goalIds.push(goal.id);
        goalsMap.set(goal.id, {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          status: goal.status,
          topics: goal.topics ?? [],
          subtopics: goal.subtopics ?? [],
          startDate: goal.startDate?.toString() ?? "",
          endDate: goal.endDate?.toString() ?? null,
        });
      }

      for (const skill of skills) {
          if (!skill?.name) {
            continue;
          }
          skillsMap.set(skill.name, skill);
        }

      return {
        id: e.id,
        title: e.title,
        startDate: e.startDate?.toString() ?? "",
        endDate: e.endDate?.toString() ?? null,
        context: e.context,
        challengeFaced: e.challengeFaced,
        outcome: e.outcome,
        organization: e.organization,
        applicationStatus: e.applicationStatus,
        achievements: e.achievements,
        isVerified: e.isVerified ?? false,
        score: 0,
        goalIds,
        skills: skills
          .filter((skill) => skill?.name)
          .map((skill) => ({
            name: skill.name,
            type: skill.type,
          })),
        transitions: transitions.filter((transition: RetrievedTransition) => transition?.toExperienceId),
        timelineSummary: e.timelineSummary ?? "",
      };
    });

    return {
      experiences,
      goals: [...goalsMap.values()],
      skills: [...skillsMap.values()],
    };
  } finally {
    await closeSession(session);
  }
}