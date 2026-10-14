import neo4j, { Driver } from "neo4j-driver";

const {NEO4J_URI,NEO4J_USERNAME,NEO4J_PASSWORD} = process.env;

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  throw new Error("Missing Neo4j environment variables");
}

export const neo4jDriver: Driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(
    NEO4J_USERNAME,
    NEO4J_PASSWORD
  )
);

export async function closeNeo4jConnection(): Promise<void> {
  await neo4jDriver.close();

  console.log("Neo4j connection closed");
}