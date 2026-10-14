export type GoalStatus =  "achieved" | "abandoned" | "ongoing";

export type GoalTopic = "Startup" | "Professionals" | "College Students";

export type GoalSubtopic =
  | "SaaS / Tech"
  | "D2C / Consumer"
  | "Fintech"
  | "Edtech"
  | "Social Impact"
  | "Software Engineering"
  | "Product Management"
  | "Data / AI"
  | "Design"
  | "Sales / GTM"
  | "Cracking Placements"
  | "MS Abroad Applications"
  | "Dropping Out To Build"
  | "Getting Into IITs/NITs"
  | "Internship"
  | "Other"
  | "Competition";

export type SkillType = "Technical" | "Soft" | "Domain" | "ExtraCurricular";

export type ProofSourceType = "image" | "pdf" | "github" | "link";

export type ProofStatus = "pending" | "verified" | "rejected" | "skipped";

export type ApplicationStatus = "accepted" | "rejected" | "waitlisted" | "pending";

export interface JourneyUser {
  username: string;
  clerkId?: string | null;
  preferredLanguage?: string | null;
  reputationScore?: number;
  flagCount?: number;
  isFlagged?: boolean;
  email?: string | null;
  imageUrl?: string | null;
  summary:string,
  expertiseAreas: string[];
}

export interface JourneyGoal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  topics: GoalTopic[];
  subtopics: GoalSubtopic[];
  startDate: string;
  endDate?: string | null;
}

export interface JourneySkill {
  name: string;
  type: SkillType;
}

export interface JourneyProof {
  id: string;
  sourceType: ProofSourceType;
  url: string;
  status: ProofStatus;
  verifiedAt?: string | null;
  reason?: string | null;
}

export interface JourneyExperience {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  context: string;
  challengeFaced: string | null;
  outcome: string | null;
  organization: string | null;
  applicationStatus: ApplicationStatus | null;
  achievements: string[] | null;
  isVerified: boolean;
  goalIds: string[];
  skills: JourneySkill[];
  proofs: JourneyProof[];
  timelineSummary: string;
}

export interface JourneyTransition {
  fromExperienceId: string;
  toExperienceId: string;
  decisionLabel: string;
}

export interface JourneyJson {
  user: JourneyUser;
  goals: JourneyGoal[];
  experiences: JourneyExperience[];
  transitions: JourneyTransition[];
}
