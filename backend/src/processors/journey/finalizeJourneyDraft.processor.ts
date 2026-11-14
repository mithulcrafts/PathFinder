import { randomUUID } from "crypto";
import { z } from "zod";
import type { GeminiJourneyDraft } from "../../types/journey/GeminiJourneyDraft.types.js";
import type { PartialJourneyDraft } from "../../types/journey/PartialJourney.types.js";
import { applicationStatusSchema, journeySkillSchema } from "./journeySchema.js";

const text = z.string().trim().min(1);
const date = z.string().trim().regex(/^(0[1-9]|1[0-2]) \d{4}$/);
const draftChangesSchema = z.object({
  experienceNumber: z.number().int().positive().optional().catch(0),
  title: text.optional().catch(undefined),
  context: text.optional().catch(undefined),
  timelineSummary: text.optional().catch(undefined),
  startDate: date.nullable().optional().catch(undefined),
  endDate: date.nullable().optional().catch(undefined),
  organization: text.nullable().optional().catch(undefined),
  challengeFaced: text.nullable().optional().catch(undefined),
  outcome: text.nullable().optional().catch(undefined),
  applicationStatus: applicationStatusSchema.nullable().optional().catch(undefined),
  achievements: z.array(text).nullable().optional().catch(undefined),
  skills: z.array(journeySkillSchema).nullable().optional().catch(undefined),
  decisionReason: text.nullable().optional().catch(undefined),
});

export function applyJourneyDraftChanges(
  draft: GeminiJourneyDraft,
  previous: PartialJourneyDraft["experiences"],
  narrative = "",
) {
  const removed = new Set(Array.isArray(draft.removeExperienceNumbers) ? draft.removeExperienceNumbers : []);
  const experiences = previous.map(experience => ({ ...experience }));
  const changedFields: Record<string, string[]> = {};
  const candidates = Array.isArray(draft.experiences) ? draft.experiences : [];

  for (const candidate of candidates) {
    const parsed = draftChangesSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const { experienceNumber: target, ...changes } = parsed.data;
    const experienceNumber = target ?? (
      previous.length === 1 && previous[0]?.title === "Untitled experience" && previous[0].context === narrative
        ? 1
        : undefined
    );
    if (experienceNumber === undefined || previous.length === 0) {
      const { title, context, timelineSummary } = changes;
      const description = context ?? (previous.length === 0 ? narrative : "");
      if (!description) continue;
      const newFields = Object.fromEntries(Object.entries(changes).filter(([, value]) => value != null));
      experiences.push({
        ...newFields,
        title: title ?? "Untitled experience",
        context: description,
        timelineSummary: timelineSummary ?? description,
        id: randomUUID(), goalIds: [], proofs: [], isVerified: false,
      });
      continue;
    }

    const existing = previous[experienceNumber - 1];
    if (!existing || removed.has(experienceNumber)) continue;
    const updated = experiences[experienceNumber - 1]!;
    const keys = (Object.keys(changes) as (keyof typeof changes)[]).filter(key => changes[key] !== undefined);
    for (const key of keys) {
      if (changes[key] === null) delete updated[key];
    }
    Object.assign(updated, Object.fromEntries(Object.entries(changes).filter(([, value]) => value != null)));
    if (keys.length) changedFields[existing.id] = [...(changedFields[existing.id] ?? []), ...keys];
  }

  if (!previous.length && !experiences.length && narrative) {
    experiences.push({
      title: "Untitled experience",
      context: narrative,
      timelineSummary: narrative,
      id: randomUUID(), goalIds: [], proofs: [], isVerified: false,
    });
  }
  return {
    experiences: experiences.filter((_, index) => index >= previous.length || !removed.has(index + 1)),
    changedFields,
  };
}
