import assert from "node:assert/strict";
import { test } from "node:test";
import { buildJourneyDraftPrompt } from "../src/prompts/onboarding/journeyDraft.prompt.js";
import { applyJourneyDraftChanges } from "../src/processors/journey/finalizeJourneyDraft.processor.js";

const internship = {
  title: "Engineering internship",
  context: "Automated reporting with Python.",
  timelineSummary: "Automated reporting during an internship.",
  startDate: "06 2024",
  endDate: "08 2024",
  organization: "Cedar Labs",
};

test("chat corrections retain existing experience IDs, unrelated fields, goals and proofs", () => {
  const initial = applyJourneyDraftChanges({ experiences: [internship, { ...internship, title: "Second role" }] }, []);
  const first = { ...initial.experiences[0]!, goalIds: ["goal-1"], proofs: [{
    id: "proof-1", url: "https://example.test/proof", sourceType: "link" as const, status: "pending" as const,
  }] };
  const second = initial.experiences[1]!;
  const result = applyJourneyDraftChanges({
    experiences: [{ experienceNumber: 1, startDate: "07 2024", endDate: null, outcome: "Shipped a weekly report" }],
  }, [first, second]);

  const { endDate, ...expected } = first;
  assert.equal(endDate, "08 2024");
  assert.deepEqual(result.experiences, [{ ...expected, startDate: "07 2024", outcome: "Shipped a weekly report" }, second]);
  assert.deepEqual(result.changedFields, { [first.id]: ["startDate", "endDate", "outcome"] });
});

test("only explicit removals delete experiences and invalid corrections preserve the current draft", () => {
  const initial = applyJourneyDraftChanges({ experiences: [internship] }, []).experiences;
  const draft = applyJourneyDraftChanges({
    experiences: [{ experienceNumber: 5, title: "Unmatched correction" }, { experienceNumber: 1, startDate: "2024" }],
  }, initial);
  assert.deepEqual(draft.experiences, initial);
  const revised = applyJourneyDraftChanges({
    experiences: [{ ...internship, title: "New role" }], removeExperienceNumbers: [1],
  }, draft.experiences);
  assert.equal(revised.experiences.length, 1);
  assert.equal(revised.experiences[0]!.title, "New role");
  assert.notEqual(revised.experiences[0]!.id, initial[0]!.id);
});

test("a first message opens a draft even with incomplete extraction or a malformed optional field", () => {
  const narrative = "I worked as an engineering intern at Cedar Labs in June 2024.";
  const result = applyJourneyDraftChanges({
    experiences: [{ experienceNumber: 1, title: "Engineering internship", startDate: "06 2024", endDate: "ongoing" }],
  }, [], narrative);
  const experience = result.experiences[0]!;
  assert.equal(experience.title, "Engineering internship");
  assert.equal(experience.startDate, "06 2024");
  assert.equal(experience.endDate, undefined);
  assert.equal(experience.context, narrative);
  assert.equal(experience.timelineSummary, narrative);
});

test("empty or failed extraction keeps the user's text in a starter draft and never overwrites an existing draft", () => {
  const narrative = "I automated a weekly report.";
  const initial = applyJourneyDraftChanges({ experiences: [] }, [], narrative);
  assert.equal(initial.experiences[0]?.context, narrative);
  assert.equal(initial.experiences[0]?.title, "Untitled experience");
  assert.deepEqual(
    applyJourneyDraftChanges({ experiences: [] }, initial.experiences, "Change the date."),
    initial,
  );
  const recovered = applyJourneyDraftChanges({
    experiences: [{ title: "Automating weekly reports", startDate: "06 2024" }],
  }, initial.experiences, narrative);
  assert.equal(recovered.experiences.length, 1);
  assert.equal(recovered.experiences[0]?.id, initial.experiences[0]?.id);
  assert.equal(recovered.experiences[0]?.startDate, "06 2024");
});

test("extraction prompt distinguishes the current draft, recent user turns and latest correction", () => {
  const previous = { ...internship, id: "private-id", goalIds: ["goal-1"], proofs: [] };
  const prompt = JSON.parse(buildJourneyDraftPrompt("It started in July.", [previous], [
    { role: "user", content: "My internship", timestamp: 1 },
    { role: "assistant", content: "An assistant turn", timestamp: 2 },
  ]));
  assert.deepEqual(prompt.currentDraft, [{ experienceNumber: 1, ...internship }]);
  assert.deepEqual(prompt.recentMessages, ["My internship"]);
  assert.equal(prompt.latestMessage, "It started in July.");
});
