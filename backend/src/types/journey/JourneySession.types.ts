import type { PartialJourneyDraft } from "./PartialJourney.types.js";

export interface JourneyMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

export enum JourneyState {
  WAITING_FOR_INITIAL_NARRATIVE = "WAITING_FOR_INITIAL_NARRATIVE",
  PLANNING_JOURNEY = "PLANNING_JOURNEY",
  INTERVIEWING_EXPERIENCE = "INTERVIEWING_EXPERIENCE",
  ASSIGNING_GOALS = "ASSIGNING_GOALS",
  COLLECTING_PROOFS = "COLLECTING_PROOFS",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
}

export interface JourneySession {
  conversationId: string;
  userId: string;
  state: JourneyState;
  conversationHistory: JourneyMessage[];
  journeyDraft: PartialJourneyDraft | null;
  currentExperienceIndex: number;
  createdAt: number;
  updatedAt: number;
}
