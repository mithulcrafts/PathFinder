

/* ── Backend-aligned TypeScript schema ────────────── */

export interface StructuredQuery {
  queryType: string;
  topics: string[];
  subtopics: string[];
  skills: string[];
  semanticQuery: string;
  focus: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface Transition {
  decisionLabel: string;
  toExperienceId: string;
}

export interface ExpandedDetails {
  context: string;
  challengeFaced: string | null;
  outcome: string | null;
  achievements: string[] | null;
  applicationStatus: string | null;
  goals: Goal[];
  skills: string[];
  transitions: Transition[];
  emotionNote?: string | null;
}

/* Frontend display fields — not returned by backend,
   computed client-side for styling */
export type NodeType = 'Education' | 'Job' | 'Decision' | 'Failure' | 'Startup' | 'Achievement';
export type EmotionLabel = 'Confident' | 'Uncertain' | 'Pivoting' | 'Pushing through' | string;

export interface TimelineEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  organization: string | null;
  isVerified: boolean;
  timelineSummary: string;
  expandedDetails: ExpandedDetails;

  /* Client-side display fields (set by enrichTimeline helper) */
  nodeType?: NodeType;
  emotionLabel?: EmotionLabel;
}

export interface UserTrajectory {
  username: string;
  reputationScore: number;
  timeline: TimelineEvent[];
  ai_summary?: string;
  skills?: any[];
  summary?: string;
  expertiseAreas?: string[];
  imageUrl?: string | null;
  expandedDetails?: {
    goals: any[];
    experiences: any[];
    transitions: any[];
  };
}

export interface CommonPattern {
  title: string;
  description: string;
  frequency: number;
  percentage?: number; // client-computed if needed
}

export interface AiInsights {
  directAnswer: string;
  keyPoints: string[];
  actionableTakeaway: string;
}

export interface JourneyStatistics {
  usersAnalyzed: number;
  experiencesAnalyzed: number;
  /* These may or may not be present depending on backend version */
  pathSplit?: { workedFirst: number; startedDirectly: number };
  averageTimeToRevenue?: number;
}

export interface AggregatedContext {
  journeyStatistics: JourneyStatistics;
  timelineFeed: UserTrajectory[];
  commonPatterns: CommonPattern[];
  aiInsights: AiInsights;
}

/** Full backend response shape from POST /api/query */
export interface BackendQueryResponse {
  query: string;
  transcribed: boolean;
  structuredQuery: StructuredQuery;
  context: any; // raw retrieved context — not needed on frontend
  aggregatedContext: AggregatedContext;
}

/** Legacy alias used across screens — maps to aggregatedContext wrapper */
export interface DecisionAtlasBackendResponse {
  structuredQuery: StructuredQuery | Record<string, any>;
  aggregatedContext: AggregatedContext;
}
