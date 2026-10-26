import type { Redis } from "@upstash/redis";
import type { Session } from "neo4j-driver";

export async function keepNeo4jAlive(session?: Pick<Session, "run" | "close">): Promise<void> {
  const activeSession = session ?? (await import("./neo4j.service.js")).getSession({ defaultAccessMode: "READ" });
  try {
    const result = await activeSession.run("RETURN true AS ok", {}, { timeout: 10_000 });
    if (result.records[0]?.get("ok") !== true) {
      throw new Error("Neo4j maintenance read returned an unexpected result");
    }
  } finally {
    // Close this session, never the shared application driver.
    await activeSession.close();
  }
}

export async function keepRedisAlive(redis?: Pick<Redis, "get">): Promise<void> {
  const client = redis ?? (await import("../config/upstash.config.js")).upstash;
  // A missing key (null) is a successful read; no marker needs to be created.
  await client.get("maintenance:keepalive");
}
