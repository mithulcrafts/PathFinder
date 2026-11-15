import { test } from "node:test";
import assert from "node:assert/strict";
import type { Session } from "neo4j-driver";
import { journeyMatches } from "../src/services/journeyMatch.service.js";
import type { MatchGraph } from "../src/services/journeyMatch.scoring.js";
const graph = (username: string): MatchGraph => ({
  username, goals: [{ topics: ["engineering"] }],
  experiences: [{ id: "1", title: "Build APIs", skills: ["TypeScript"] }], transitions: [],
});
function record(isOwner: boolean, data: MatchGraph) {
  const fields: Record<string, unknown> = { isOwner, ...data };
  return { get: (key: string) => fields[key] };
}
const records = () => [record(true, graph("owner")), record(false, graph("candidate"))];
function fake(rows = records(), failRun = false, failClose = false) {
  const state = { closed: 0, calls: [] as { query: string; params: any; options: any }[] };
  const session = {
    run: async (query: string, params: any, options: any) => {
      state.calls.push({ query, params, options });
      if (failRun) throw new Error("database down");
      return { records: rows };
    },
    close: async () => { state.closed++; if (failClose) throw new Error("close failed"); },
  } as unknown as Session;
  return { state, factory: async () => session };
}
test("unauthenticated and empty searches never open a database session", async () => {
  const factory = async (): Promise<Session> => { throw new Error("must not run"); };
  assert.equal((await journeyMatches(null, ["candidate"], factory)).size, 0);
  assert.equal((await journeyMatches("clerk-owner", [], factory)).size, 0);
});
test("owner lookup is parameterized, candidates bounded, and graph stays private", async () => {
  const { factory, state } = fake();
  const result = await journeyMatches("clerk-owner", Array.from({ length: 40 }, (_, i) => "user" + i), factory);
  assert.equal(state.calls[0]!.params.clerkId, "clerk-owner");
  assert.equal(state.calls[0]!.params.usernames.length, 20);
  assert.equal(state.calls[0]!.options.timeout, 5000);
  assert.match(state.calls[0]!.query, /MATCH \(owner:User \{clerkId: \$clerkId\}\)/);
  assert.match(state.calls[0]!.query, /ORDER BY skill LIMIT 30/);
  assert.equal(result.has("owner"), false);
  assert.equal(result.get("candidate")?.percentage, 100);
  assert.equal(state.closed, 1);
  const serialized = JSON.stringify([...result.values()]);
  for (const field of ["clerkId", "goals", "experiences", "transitions", "TypeScript", "proof"]) {
    assert.equal(serialized.includes('"' + field + '"'), false);
  }
});
test("candidate usernames are deduplicated", async () => {
  const { factory, state } = fake();
  await journeyMatches("owner", ["candidate", "candidate"], factory);
  assert.deepEqual(state.calls[0]!.params.usernames, ["candidate"]);
});
test("missing owner and insufficient target data produce no score", async () => {
  assert.equal((await journeyMatches("owner", ["candidate"], fake([record(false, graph("candidate"))]).factory)).size, 0);
  const empty = { ...graph("candidate"), experiences: [] };
  assert.equal((await journeyMatches("owner", ["candidate"], fake([record(true, graph("owner")), record(false, empty)]).factory)).size, 0);
});
test("session creation, read and close failures never fail the search or return a score", async () => {
  assert.equal((await journeyMatches("owner", ["candidate"], async () => { throw new Error("connection"); })).size, 0);
  for (const [read, close] of [[true, false], [false, true]]) {
    const { factory, state } = fake(records(), read, close);
    assert.equal((await journeyMatches("owner", ["candidate"], factory)).size, 0);
    assert.equal(state.closed, 1);
  }
});
test("a malformed later graph clears earlier partial scores", async () => {
  const malformed = { ...graph("bad"), experiences: null } as unknown as MatchGraph;
  const { factory } = fake([...records(), record(false, malformed)]);
  assert.equal((await journeyMatches("owner", ["candidate", "bad"], factory)).size, 0);
});
test("scores are recomputed from each new database snapshot", async () => {
  const a = await journeyMatches("owner", ["candidate"], fake().factory);
  const changed = graph("candidate");
  changed.goals = [{ topics: ["medicine"] }];
  changed.experiences = [{ id: "2", title: "Clinical surgery", skills: ["Diagnosis"] }];
  const b = await journeyMatches("owner", ["candidate"], fake([record(true, graph("owner")), record(false, changed)]).factory);
  assert.equal(a.get("candidate")?.percentage, 100);
  assert.equal(b.get("candidate")?.percentage, 0);
});
