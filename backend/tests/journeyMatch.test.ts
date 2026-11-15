import { test } from "node:test";
import assert from "node:assert/strict";
import { compareJourneys, graphFeatures, type MatchGraph } from "../src/services/journeyMatch.scoring.js";

const graph = (username: string): MatchGraph => ({
  username, goals: [{ topics: ["Engineering"], subtopics: ["Open source"] }],
  experiences: [
    { id: "1", title: "Build APIs", context: "Developed authentication", skills: ["TypeScript"] },
    { id: "2", title: "Review patches", context: "Maintained software", skills: ["Testing"] },
  ],
  transitions: [{ from: "1", to: "2" }],
});
test("identical feature graphs have a legitimate 100, not an arbitrary cap", () => {
  const match = compareJourneys(graph("a"), graph("b"), "2026-11-15T00:00:00Z");
  assert.equal(match?.percentage, 100);
  assert.equal(match?.computedAt, "2026-11-15T00:00:00Z");
  assert.deepEqual(match?.breakdown.map(x => x.weight), [.4, .25, .2, .15]);
});
test("self comparisons and empty journeys do not produce scores", () => {
  assert.equal(compareJourneys(graph("a"), graph("a")), null);
  assert.equal(compareJourneys({ ...graph("a"), experiences: [] }, graph("b")), null);
  assert.equal(compareJourneys(graph("a"), { ...graph("b"), experiences: [] }), null);
});
test("stopword-only experiences are insufficient even when goal topics match", () => {
  assert.equal(compareJourneys({ ...graph("a"), experiences: [{ id: "1", title: "I am the" }] }, graph("b")), null);
});
test("disjoint meaningful graphs score zero", () => {
  const b: MatchGraph = { username: "b", goals: [{ topics: ["Medicine"] }],
    experiences: [{ id: "3", title: "Surgery clinic", skills: ["Diagnosis"] }], transitions: [] };
  assert.equal(compareJourneys(graph("a"), b)?.percentage, 0);
});
test("missing dimensions are excluded and weights renormalized", () => {
  const a: MatchGraph = { username: "a", goals: [], experiences: [{ id: "1", skills: ["TypeScript"] }], transitions: [] };
  const b = { ...a, username: "b", experiences: [{ id: "2", skills: ["typescript", "Rust"] }] };
  const score = compareJourneys(a, b);
  assert.equal(score?.percentage, 50);
  assert.deepEqual(score?.breakdown, [{ dimension: "Skills", percentage: 50, weight: 1 }]);
});
test("normalization, deduplication, and identity-independent edge features", () => {
  const b = graph("b");
  b.experiences[0]!.skills = [" TYPESCRIPT ", "typescript"];
  b.experiences[0]!.id = "x"; b.experiences[1]!.id = "y";
  b.transitions = [{ from: "x", to: "y" }];
  assert.equal(compareJourneys(graph("a"), b)?.percentage, 100);
});
test("reversing an edge changes the structural match", () => {
  const b = graph("b"); b.transitions = [{ from: "2", to: "1" }];
  const result = compareJourneys(graph("a"), b);
  assert.equal(result?.breakdown.find(x => x.dimension === "Directed transitions")?.percentage, 0);
  assert.equal(result?.percentage, 85);
});
test("weights and percentages remain bounded, symmetric and reproducible", () => {
  const a = graph("a"), b = graph("b");
  b.experiences[0]!.skills = ["Python"];
  const forward = compareJourneys(a, b, "now")!;
  assert.deepEqual(compareJourneys(a, b, "now"), forward);
  assert.equal(compareJourneys(b, a, "now")?.percentage, forward.percentage);
  assert.ok(forward.percentage >= 0 && forward.percentage <= 100);
  assert.ok(Math.abs(forward.breakdown.reduce((n, d) => n + d.weight, 0) - 1) < 1e-9);
});
test("graph feature extraction bounds experiences and transition edges", () => {
  const a = graph("a");
  a.experiences = Array.from({ length: 150 }, (_, i) => ({ id: String(i), skills: ["skill" + i] }));
  assert.equal(graphFeatures(a).skills.size, 100);
});
test("punctuation-only experiences and skills do not produce scores", () => {
  for (const value of ["...", "+++", "###", "   "]) {
    const a = { ...graph("a"), experiences: [{ id: "1", title: value, skills: [value] }] };
    assert.equal(compareJourneys(a, { ...a, username: "b" }), null);
  }
});
