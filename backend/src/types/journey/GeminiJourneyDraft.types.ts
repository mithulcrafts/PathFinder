import type {ApplicationStatus,JourneySkill} from "./Journey.types.js";

export interface GeminiExperience {
  title: string;
  context: string;
  timelineSummary: string;
  startDate?: string;
  endDate?: string;
  organization?: string;
  challengeFaced?: string;
  outcome?: string;
  applicationStatus?: ApplicationStatus;
  achievements?: string[];
  skills?: JourneySkill[];
  decisionReason?: string;
}

export interface GeminiJourneyDraft {
  experiences: (Partial<{ [K in keyof GeminiExperience]: GeminiExperience[K] | null }> & {
    experienceNumber?: number;
  })[];
  removeExperienceNumbers?: number[];
}
