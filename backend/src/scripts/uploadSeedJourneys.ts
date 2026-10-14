import "../config/env.js";

import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";
import { closeNeo4jConnection } from "../config/neo4j.config.js";
import { createGraph } from "../processors/journey/createGraph.processor.js";
import { journeyJsonSchema } from "../processors/journey/journeySchema.js";
import { closeSession, getSession } from "../services/neo4j.service.js";
import type { JourneyJson } from "../types/journey/Journey.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const journeysDir = resolve(__dirname, "../../db/journeys");

const verificationQueries = [
  { label: "Users", query: "MATCH (u:User) RETURN count(u) AS total" },
  { label: "Goals", query: "MATCH (g:Goal) RETURN count(g) AS total" },
  { label: "Experiences", query: "MATCH (e:Experience) RETURN count(e) AS total" },
  { label: "Skills", query: "MATCH (s:Skill) RETURN count(s) AS total" },
  { label: "Relationships", query: "MATCH ()-[r]->() RETURN count(r) AS total" },
] as const;

function neo4jCountToNumber(value: unknown): number {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  if (typeof value === "number") {
    return value;
  }

  throw new Error(`Unexpected count value returned by Neo4j: ${String(value)}`);
}

async function loadJourney(filePath: string): Promise<JourneyJson> {
  const rawJson = await readFile(filePath, "utf-8");
  const parsed: unknown = JSON.parse(rawJson);
  const validation = journeyJsonSchema.safeParse(parsed);

  if (!validation.success) {
    throw new Error(
      `${basename(filePath)} failed journey validation: ${validation.error.message}`
    );
  }

  return validation.data as JourneyJson;
}

async function printVerificationTotals(): Promise<void> {
  const session = getSession();

  try {
    console.log("\nVerification totals:");

    for (const { label, query } of verificationQueries) {
      const result = await session.run(query);
      const record = result.records[0];

      if (!record) {
        throw new Error(`Verification query returned no records: ${query}`);
      }

      console.log(`${label}: ${neo4jCountToNumber(record.get("total"))}`);
    }
  } finally {
    await closeSession(session);
  }
}

async function main(): Promise<void> {
  const inputFile = process.argv[2];

  let files: string[];

  if (inputFile) {
    const filePath = resolve(journeysDir, inputFile);

    try {
      await readFile(filePath, "utf-8");
    } catch {
      throw new Error(
        `Journey file not found: ${inputFile}`
      );
    }

    files = [filePath];
  } else {
    throw new Error(
      "Please provide a journey JSON file. Example: npm run upload-seeds -- nikhil-kamath.json"
    );
  }

  for (const file of files) {
    console.log(`Uploading ${basename(file)}...`);

    const journey = await loadJourney(file);

    await createGraph(journey);

    console.log("✓ uploaded\n");
  }

  await printVerificationTotals();
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("✗ seed upload failed");
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4jConnection();
  });
