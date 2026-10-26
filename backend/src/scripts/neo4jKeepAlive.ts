import "../config/env.js";
import { keepNeo4jAlive } from "../services/maintenance.service.js";

async function runKeepAlive(): Promise<void> {
  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    console.error("Missing required Neo4j environment variables");
    process.exitCode = 1;
    return;
  }

  let closeConnection: (() => Promise<void>) | undefined;
  try {
    const { closeNeo4jConnection } = await import("../config/neo4j.config.js");
    closeConnection = closeNeo4jConnection;
    await keepNeo4jAlive();
    console.log("Neo4j keep-alive read completed successfully");
  } catch {
    console.error("Neo4j keep-alive failed; check database status and connection settings");
    process.exitCode = 1;
  } finally {
    // Only this standalone script owns the driver's lifetime.
    try {
      await closeConnection?.();
    } catch {
      console.error("Failed to close the Neo4j connection");
      process.exitCode = 1;
    }
  }
}

void runKeepAlive();
