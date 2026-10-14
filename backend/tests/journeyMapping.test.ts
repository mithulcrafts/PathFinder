import assert from "node:assert/strict";
import { test } from "node:test";
import { Date as Neo4jDate, Record as Neo4jRecord } from "neo4j-driver";
import {
  attachExperienceGoals,
  mapJourneyExperience,
  mapJourneyGoal,
  mapJourneyTransition,
} from "../src/services/journeyMapping.js";

function record(values: Record<string, unknown>): Neo4jRecord {
  return new Neo4jRecord(Object.keys(values), Object.values(values));
}

const experience = {
  id: "experience-1",
  title: "First internship",
  startDate: new Neo4jDate(2026, 7, 1),
  context: "Built an application",
  timelineSummary: "Internship",
};

test("journey mapping serializes database dates and retains goal fields", () => {
  const goal = {
    id: "goal-1",
    title: "Become an engineer",
    description: "Build useful software",
    status: "ongoing",
    topics: ["Professionals"],
    subtopics: ["Software Engineering"],
    startDate: new Neo4jDate(2026, 1, 1),
    endDate: new Neo4jDate(2026, 7, 1),
  };
  assert.deepEqual(mapJourneyGoal(record({ g: { properties: goal } })), {
    ...goal,
    startDate: "2026-01-01",
    endDate: "2026-07-01",
  });
  assert.equal(mapJourneyGoal(record({ g: { properties: { ...goal, endDate: null } } })).endDate, null);
});

test("public experience mapping preserves null defaults and omits private proof fields", () => {
  const result = mapJourneyExperience(record({
    e: { properties: { ...experience, proofs: ["private"], embedding: [0.5] } },
    skills: [null, { properties: { name: "TypeScript", type: "Technical", internal: true } }],
  }));
  assert.deepEqual(result, {
    id: "experience-1",
    title: "First internship",
    startDate: "2026-07-01",
    endDate: null,
    context: "Built an application",
    challengeFaced: null,
    outcome: null,
    organization: null,
    applicationStatus: null,
    achievements: null,
    isVerified: false,
    timelineSummary: "Internship",
    goalIds: [],
    skills: [{ name: "TypeScript", type: "Technical" }],
  });
});

test("experience mapping retains existing optional values without replacing empty arrays or strings", () => {
  const optional = {
    endDate: new Neo4jDate(2026, 8, 1),
    challengeFaced: "",
    outcome: "Released",
    organization: "Example",
    applicationStatus: "accepted",
    achievements: [],
    isVerified: true,
  };
  const result = mapJourneyExperience(record({
    e: { properties: { ...experience, ...optional } },
    skills: [],
  }));
  for (const [key, value] of Object.entries(optional)) {
    assert.deepEqual(result[key as keyof typeof result], key === "endDate" ? "2026-08-01" : value);
  }
});

test("goal relationships attach to their experience while unlinked experiences remain empty", () => {
  const experiences = [
    { id: "experience-2", goalIds: [] },
    { id: "experience-1", goalIds: [] },
    { id: "experience-3", goalIds: [] },
  ];
  attachExperienceGoals(experiences, [
    record({ experienceId: "experience-1", goalIds: ["goal-1", "goal-2"] }),
    record({ experienceId: "experience-2", goalIds: ["goal-2"] }),
  ]);
  assert.deepEqual(experiences, [
    { id: "experience-2", goalIds: ["goal-2"] },
    { id: "experience-1", goalIds: ["goal-1", "goal-2"] },
    { id: "experience-3", goalIds: [] },
  ]);
});

test("transition mapping keeps the original direction and decision label", () => {
  const transition = {
    fromExperienceId: "experience-1",
    toExperienceId: "experience-2",
    decisionLabel: "Moved to a new role",
  };
  assert.deepEqual(mapJourneyTransition(record(transition)), transition);
});
