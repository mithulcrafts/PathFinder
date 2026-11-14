import type { GeminiExperience } from "../../types/journey/GeminiJourneyDraft.types.js";
import type { JourneyMessage } from "../../types/journey/JourneySession.types.js";

export const JOURNEY_DRAFT_SYSTEM_PROMPT = `
Build and revise a PathFinder journey draft using facts the user provides. The input contains the current draft, recent user messages, and the latest message. The latest message takes precedence for corrections.

- Add a new item only for a distinct experience the user actually describes. Include its title, context, and a one-sentence timelineSummary. Keep a continuous role or project in one experience.
- To revise an existing item, return its experienceNumber from the current draft and only fields affected by the latest message. Keep unrelated fields and experiences out of the response. Use null to explicitly clear an optional field. Use removeExperienceNumbers only when the user asks to remove an entire experience. If a target is ambiguous, leave it unchanged.
- An item titled "Untitled experience" is a starter draft. If the user repeats or adds to its description, fill its missing fields from the story and keep its experienceNumber.
- Use recent messages to resolve references or recover earlier details when the latest message supplies enough context to create a draft. For a question, greeting, or message with no new facts, return an empty experiences array.
- Use MM YYYY for startDate and endDate when the month and year are known. Leave missing dates blank. An ongoing role has no endDate. A milestone reached during a role does not establish an end date.
- Keep title concise, context faithful to the user's account, and timelineSummary focused on what happened. Update related text if a correction makes it inaccurate.
- Fill organization only for a named organization. Distinguish challengeFaced (the obstacle), outcome (the result), and achievements (measurable or recognized accomplishments).
- Use applicationStatus only for an explicit application. Return stated skills as objects with name and type (Technical, Soft, Domain, or ExtraCurricular).
- Put decisionReason on the experience the decision led to. Capture the user's stated motivation.
- Omit facts the user did not supply. Do not generate goals, proof records, verification information, or IDs.

Example: if experience 1 is the only internship and the user says "My internship started in July 2024, and we reduced processing time by 30%", return
{"experiences":[{"experienceNumber":1,"startDate":"07 2024","outcome":"Reduced processing time by 30%","achievements":["Reduced processing time by 30%"]}]}.
`;

export function buildJourneyDraftPrompt(
  narrative: string,
  previous: GeminiExperience[],
  history: JourneyMessage[],
): string {
  const currentDraft = previous.map((experience, index) => ({
    experienceNumber: index + 1,
    title: experience.title,
    context: experience.context,
    timelineSummary: experience.timelineSummary,
    startDate: experience.startDate,
    endDate: experience.endDate,
    organization: experience.organization,
    challengeFaced: experience.challengeFaced,
    outcome: experience.outcome,
    applicationStatus: experience.applicationStatus,
    achievements: experience.achievements,
    skills: experience.skills,
    decisionReason: experience.decisionReason,
  }));
  return JSON.stringify({
    currentDraft,
    recentMessages: history.filter(({ role }) => role === "user").slice(-8).map(({ content }) => content),
    latestMessage: narrative,
  });
}
