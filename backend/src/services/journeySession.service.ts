import { randomUUID } from "crypto";
import { upstash as redis } from "../config/upstash.config.js";
import type { JourneySession } from "../types/journey/JourneySession.types.js";
import { JourneyState } from "../types/journey/JourneySession.types.js";


const SESSION_EXPIRY = 60 * 60 * 24; // 24 hours

export async function createJourneySession(
    userId: string
) {
    const conversationId = randomUUID();
    const session: JourneySession = {
        conversationId,
        userId,
        state: JourneyState.WAITING_FOR_INITIAL_NARRATIVE,
        conversationHistory: [],
        journeyDraft: null,
        currentExperienceIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    await redis.set(`journey:${conversationId}`,
        session,
        {ex: SESSION_EXPIRY }
    );

    return conversationId;
}

export async function getJourneySession(
  conversationId: string
): Promise<JourneySession | null> {
  const session = await redis.get( `journey:${conversationId}`);
  return session as JourneySession | null;
}

export async function updateJourneySession(
    conversationId: string,
    session: JourneySession
) {
    session.updatedAt = Date.now();
    await redis.set(
        `journey:${conversationId}`,
        session,
        {
            ex: SESSION_EXPIRY,
        }
    );
}


export async function deleteJourneySession(conversationId: string): Promise<void> {
    await redis.del(`journey_session:${conversationId}`); 
}
