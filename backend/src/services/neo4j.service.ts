import type { Session, SessionConfig } from "neo4j-driver";
import { neo4jDriver } from "../config/neo4j.config.js";

export function getSession(config?: SessionConfig): Session {
  return neo4jDriver.session(config);
}

export async function closeSession(session: Session): Promise<void> {
  await session.close();
}
