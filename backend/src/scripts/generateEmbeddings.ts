import "../config/env.js";

import { closeNeo4jConnection } from "../config/neo4j.config.js";
import { generateExperienceEmbedding, generateGoalEmbedding, type ExperienceEmbeddingInput as ExperienceRecord, type GoalEmbeddingInput as GoalRecord } from "../processors/journey/generateEmbeddings.processor.js";
import { initializeEmbeddingModel } from "../services/embeddings.service.js";
import { closeSession, getSession } from "../services/neo4j.service.js";

async function fetchExperiences(): Promise<ExperienceRecord[]> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (e:Experience)
      OPTIONAL MATCH (e)-[:BUILT_SKILL]->(s:Skill)
      RETURN
        e.id AS id,
        e.title AS title,
        e.context AS context,
        e.challengeFaced AS challengeFaced,
        e.outcome AS outcome,
        e.achievements AS achievements,
        collect(DISTINCT s.name) AS skills
      ORDER BY e.title
    `);

    return result.records.map((record) => ({
      id: record.get("id") as string,
      title: record.get("title") as string,
      context: record.get("context") as string,
      challengeFaced: record.get("challengeFaced") as string | null,
      outcome: record.get("outcome") as string | null,
      achievements: record.get("achievements") as string[] | null,
      skills: record.get("skills") as string[],
    }));
  } finally {
    await closeSession(session);
  }
}

async function fetchGoals(): Promise<GoalRecord[]> {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (g:Goal)
      RETURN
        g.id AS id,
        g.title AS title,
        g.description AS description
      ORDER BY g.title
    `);
    return result.records.map((record) => ({
      id: record.get("id") as string,
      title: record.get("title") as string,
      description: record.get("description") as string,
    }));
  } finally {
    await closeSession(session);
  }
}

async function main(): Promise<void> {
  console.log("Loading embedding model...");
  await initializeEmbeddingModel();
  console.log("✓ model loaded\n");
  const experiences = await fetchExperiences();
  const goals = await fetchGoals();
  if (experiences.length === 0) {
    console.log("No Experience nodes found.");
    return;
  }
  if(goals.length === 0) {
    console.log("No Goal nodes found.");
    return;
  }
  console.log(
    `Found ${experiences.length} Experience nodes\n`
  );
  console.log(
    `Found ${goals.length} Goal nodes\n`
  );
  for (const [index, experience] of experiences.entries()) {
    console.log(
      `[${index + 1}/${experiences.length}] Embedding "${experience.title}"`
    );
    await generateExperienceEmbedding(experience);
    console.log("✓ stored");
  }
  for (const [index, goal] of goals.entries()) {
    console.log(
      `[Goal ${index + 1}/${goals.length}] Embedding "${goal.title}"`
    );
    await generateGoalEmbedding(goal);
    console.log("✓ stored");
  }
  console.log("\n✓ all embeddings generated successfully");
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("\n✗ embedding generation failed");
    console.error(message);

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4jConnection();
  });