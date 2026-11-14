import type { Transaction } from "neo4j-driver";
import { closeSession, getSession } from "../../services/neo4j.service.js";
import { journeyJsonSchema } from "./journeySchema.js";
import type {JourneyExperience,JourneyGoal,JourneyJson,JourneyProof,JourneyTransition,JourneyUser} from "../../types/journey/Journey.types.js";
import { toNeo4jDate } from "../../utils/helper.js";

function nullIfUndefined<T>(value: T | undefined): T | null {
  return value ?? null;
}

function userParams(user: JourneyUser) {
  return {
    username: user.username,
    clerkId: nullIfUndefined(user.clerkId),
    preferredLanguage: nullIfUndefined(user.preferredLanguage),
    summary: nullIfUndefined(user.summary),
    imageUrl: nullIfUndefined(user.imageUrl),
    expertiseAreas: user.expertiseAreas ?? [],
    reputationScore: user.reputationScore ?? 0,
    flagCount: user.flagCount ?? 0,
    isFlagged: user.isFlagged ?? false,
    email: nullIfUndefined(user.email),
  };
}

function goalParams(goal: JourneyGoal) {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    topics: goal.topics,
    subtopics: goal.subtopics,
    startDate: goal.startDate,
    endDate: nullIfUndefined(goal.endDate),
  };
}

function experienceParams(experience: JourneyExperience, order: number) {
  return {
    id: experience.id,
    title: experience.title,
    timelineSummary: experience.timelineSummary,
    startDate: experience.startDate,
    endDate: nullIfUndefined(experience.endDate),
    context: experience.context,
    challengeFaced: nullIfUndefined(experience.challengeFaced),
    outcome: nullIfUndefined(experience.outcome),
    organization: nullIfUndefined(experience.organization),
    applicationStatus: nullIfUndefined(experience.applicationStatus),
    achievements: experience.achievements ?? null,
    isVerified: experience.isVerified ?? false,
    verificationStatus: experience.verificationStatus ?? null,
    verificationMocked: experience.verificationMocked ?? null,
    order,
  };
}

function proofParams(proof: JourneyProof) {
  return {
    id: proof.id,
    sourceType: proof.sourceType,
    url: proof.url,
    status: proof.status,
    verifiedAt: nullIfUndefined(proof.verifiedAt),
    reason: nullIfUndefined(proof.reason),
  };
}

async function upsertUser(tx: Transaction, user: JourneyUser): Promise<void> {
  await tx.run(
    `
    MERGE (u:User {username: $username})
    ON CREATE SET
      u.createdAt = datetime()
    SET
      u.updatedAt = datetime(),
      u.clerkId = $clerkId,
      u.email = $email,
      u.preferredLanguage = $preferredLanguage,
      u.summary = $summary,
      u.imageUrl = $imageUrl,
      u.expertiseAreas = $expertiseAreas,
      u.reputationScore = $reputationScore,
      u.flagCount = $flagCount,
      u.isFlagged = $isFlagged
    `,
    userParams(user)
  );
}

async function upsertGoal(
  tx: Transaction,
  username: string,
  goal: JourneyGoal
): Promise<void> {
  await tx.run(
    `
    MATCH (u:User {username: $username})
    MERGE (g:Goal {id: $id})
    SET
      g.title = $title,
      g.description = $description,
      g.status = $status,
      g.topics = $topics,
      g.subtopics = $subtopics,
      g.startDate = date($startDate),
      g.endDate = CASE
        WHEN $endDate IS NULL THEN null
        ELSE date($endDate)
      END
    MERGE (u)-[:HAS_GOAL]->(g)
    `,
    {
      username,
      ...goalParams(goal),
      startDate: toNeo4jDate(goal.startDate),
      endDate: goal.endDate ? toNeo4jDate(goal.endDate) : null,
    }
  );
}

export async function upsertExperience(
  tx: Transaction,
  username: string,
  experience: JourneyExperience,
  order: number
): Promise<void> {
  await tx.run(
    `
    MATCH (u:User {username: $username})
    MERGE (u)-[r:HAS_EXPERIENCE]->(e:Experience {id: $id})
    SET
      e.title = $title,
      e.timelineSummary = $timelineSummary,
      e.startDate = date($startDate),
      e.endDate = CASE
        WHEN $endDate IS NULL THEN null
        ELSE date($endDate)
      END,
      e.context = $context,
      e.challengeFaced = $challengeFaced,
      e.outcome = $outcome,
      e.organization = $organization,
      e.applicationStatus = $applicationStatus,
      e.achievements = $achievements,
      e.isVerified = $isVerified,
      e.verificationStatus = $verificationStatus,
      e.verificationMocked = $verificationMocked,
      r.order = $order
    `,
    {
      username,
      ...experienceParams(experience, order),
      startDate: toNeo4jDate(experience.startDate),
      endDate: experience.endDate ? toNeo4jDate(experience.endDate) : null,
    }
  );
}

export async function connectExperienceGoals(
  tx: Transaction,
  experience: JourneyExperience
): Promise<void> {
  for (const goalId of experience.goalIds) {
    await tx.run(
      `
      MATCH (e:Experience {id: $experienceId})
      MATCH (g:Goal {id: $goalId})
      MERGE (e)-[:CONTRIBUTED_TO]->(g)
      `,
      { experienceId: experience.id, goalId }
    );
  }
}

export async function connectExperienceSkills(
  tx: Transaction,
  experience: JourneyExperience
): Promise<void> {
  for (const skill of experience.skills) {
    await tx.run(
      `
      MATCH (e:Experience {id: $experienceId})
      MERGE (s:Skill {name: $name})
      SET s.type = $type
      MERGE (e)-[:BUILT_SKILL]->(s)
      `,
      {
        experienceId: experience.id,
        name: skill.name,
        type: skill.type,
      }
    );
  }
}

export async function upsertExperienceProofs(
  tx: Transaction,
  experience: JourneyExperience
): Promise<void> {
  for (const proof of experience.proofs) {
    await tx.run(
      `
      MATCH (e:Experience {id: $experienceId})
      MERGE (p:Proof {id: $id})
      SET
        p.sourceType = $sourceType,
        p.url = $url,
        p.status = $status,
        p.verifiedAt = CASE
          WHEN $verifiedAt IS NULL THEN null
          ELSE datetime($verifiedAt)
        END,
        p.reason = $reason
      MERGE (e)-[:HAS_PROOF]->(p)
      `,
      { experienceId: experience.id, ...proofParams(proof) }
    );
  }
}

export async function upsertTransition(
  tx: Transaction,
  transition: JourneyTransition
): Promise<void> {
  await tx.run(
    `
    MATCH (from:Experience {id: $fromExperienceId})
    MATCH (to:Experience {id: $toExperienceId})
    MERGE (from)-[r:TRANSITION]->(to)
    SET
      r.decisionLabel = $decisionLabel
    `,
    {
      fromExperienceId: transition.fromExperienceId,
      toExperienceId: transition.toExperienceId,
      decisionLabel: transition.decisionLabel
    }
  );
}

export async function createGraph(journey: JourneyJson): Promise<void> {
  const validation = journeyJsonSchema.safeParse(journey);

  if (!validation.success) {
    throw new Error(`Invalid journey JSON: ${validation.error.message}`);
  }

  const validJourney = validation.data as JourneyJson;
  const session = getSession();
  const tx = session.beginTransaction();

  try {
    await upsertUser(tx, validJourney.user);

    for (const goal of validJourney.goals) {
      await upsertGoal(tx, validJourney.user.username, goal);
    }

    for (const [index, experience] of validJourney.experiences.entries()) {
      await upsertExperience(tx, validJourney.user.username, experience, index);
    }

    for (const experience of validJourney.experiences) {
      await connectExperienceGoals(tx, experience);
      await connectExperienceSkills(tx, experience);
      await upsertExperienceProofs(tx, experience);
    }

    for (const transition of validJourney.transitions) {
      await upsertTransition(tx, transition);
    }

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    await closeSession(session);
  }
}
