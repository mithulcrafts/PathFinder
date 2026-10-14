import assert from "node:assert/strict";
import { test } from "node:test";
import { buildJourneyStatistics } from "../src/processors/query/journeyStatistics.processor.js";
import type { RetrievedContext } from "../src/processors/query/retrieveContext.processor.js";

function context(journeys: { username: string; experienceIds: string[] }[], experienceIds: string[]): RetrievedContext {
  return {
    usernames: journeys.map((journey) => journey.username),
    journeys: journeys.map((journey) => ({
      ...journey,
      summary: "",
      expertiseAreas: [],
      imageUrl: null,
      reputationScore: 0,
    })),
    experiences: experienceIds.map((id) => ({
      id,
      title: id,
      startDate: "2026-07-01",
      context: "",
      isVerified: false,
      score: 1,
      goalIds: [],
      skills: [],
      transitions: [],
      timelineSummary: "",
    })),
    goals: [],
    skills: [],
  };
}

test("statistics count distinct owners of matched experiences, not all retrieved users", () => {
  const result = buildJourneyStatistics(context([
    { username: "alice", experienceIds: ["first", "second"] },
    { username: "alice", experienceIds: ["second"] },
    { username: "bob", experienceIds: ["unmatched"] },
    { username: "carol", experienceIds: [] },
  ], ["first", "second", "orphan", "second"]));
  assert.deepEqual(result, { usersAnalyzed: 1, experiencesAnalyzed: 4 });
});

test("statistics handle no matched experiences and empty input", () => {
  assert.deepEqual(buildJourneyStatistics(context([{ username: "alice", experienceIds: ["first"] }], [])), {
    usersAnalyzed: 0, experiencesAnalyzed: 0,
  });
  assert.deepEqual(buildJourneyStatistics(context([], [])), { usersAnalyzed: 0, experiencesAnalyzed: 0 });
});
