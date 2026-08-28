import "../config/env.js";

async function runKeepAlive(): Promise<void> {
  console.log("Starting Neo4j AuraDB keep-alive operation...");

  // 1. Check required environment variables
  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    console.error("✗ Error: Missing required Neo4j environment variables (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).");
    process.exit(1);
  }

  // 2. Import existing Driver configurations and Service session helpers dynamically
  // This allows checking env vars first, and matches Node ESM nodenext conventions.
  let getSession: typeof import("../services/neo4j.service.js").getSession;
  let closeSession: typeof import("../services/neo4j.service.js").closeSession;
  let closeNeo4jConnection: typeof import("../config/neo4j.config.js").closeNeo4jConnection;

  try {
    const serviceExports = await import("../services/neo4j.service.js");
    const configExports = await import("../config/neo4j.config.js");
    getSession = serviceExports.getSession;
    closeSession = serviceExports.closeSession;
    closeNeo4jConnection = configExports.closeNeo4jConnection;
  } catch (importError) {
    console.error("✗ Error loading Neo4j configuration or services:", importError);
    process.exit(1);
  }

  const session = getSession();

  try {
    console.log("Executing keep-alive write query...");

    // Run an idempotent write query to reset AuraDB Free's 72-hour inactivity timer
    const query = `
      MERGE (k:KeepAlive {id: 1})
      SET k.lastSeen = datetime()
      RETURN k.lastSeen AS lastSeen
    `;

    const result = await session.run(query);
    const record = result.records[0];

    if (!record) {
      throw new Error("No records returned by the keep-alive write query.");
    }

    const lastSeen = record.get("lastSeen");
    console.log(`✓ Neo4j write query successful. lastSeen updated to: ${lastSeen.toString()}`);
    console.log("✓ Keep-alive operation completed successfully.");
  } catch (error) {
    console.error("✗ Neo4j keep-alive query failed:");
    console.error(error);
    process.exit(1);
  } finally {
    // 3. Clean up the session and connection driver
    try {
      await closeSession(session);
      await closeNeo4jConnection();
      console.log("Neo4j session and driver connections closed successfully.");
    } catch (cleanupError) {
      console.error("Warning: Error occurred while closing Neo4j connections:", cleanupError);
    }
  }
}

void runKeepAlive();
