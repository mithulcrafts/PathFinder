import assert from "node:assert/strict";
import { test } from "node:test";
import { rankTrendingPaths, type PathVote } from "../src/services/trendingPaths.js";

const now = Date.UTC(2026, 10, 14);
const day = 86_400_000;
const node = (id: string) => ({ id, title: id, authorUsername: "author", upvoteCount: 0 });
const edge = (fromId: string, toId: string) => ({ fromId, toId, label: fromId + " to " + toId });
const vote = (experienceId: string, voterId: string, daysAgo: number | null): PathVote => ({
  experienceId, voterId, castAt: daysAgo === null ? null : now - daysAgo * day,
});

test("connected paths still display before their first vote", () => {
  const edges = [edge("a", "b"), edge("b", "c")];
  const paths = rankTrendingPaths(["a", "b", "c"], ["a", "b", "c"].map(node), edges, [], now, 5);
  assert.equal(paths.length, 1);
  assert.deepEqual(paths[0]?.edges, edges);
  assert.equal(paths[0]?.recentVoters, 0);
  assert.equal(paths[0]?.lifetimeVoters, 0);
});

test("recent distinct voters outrank lifetime popularity and duplicated votes count once", () => {
  const edges = [edge("a", "b"), edge("b", "c"), edge("x", "y")];
  const votes = [
    vote("a", "recent", 12), vote("b", "recent", 1), vote("c", "second", 4),
    vote("x", "old1", null), vote("x", "old2", 40), vote("y", "old3", null),
  ];
  const paths = rankTrendingPaths(["x", "a", "b"], ["a", "b", "c", "x", "y"].map(node), edges, votes, now, 5);
  assert.equal(paths.length, 2);
  assert.deepEqual(paths[0]?.edges, edges.slice(0, 2));
  assert.equal(paths[0]?.recentVoters, 2);
  assert.equal(paths[0]?.lifetimeVoters, 2);
  assert.equal(paths[1]?.recentVoters, 0);
  assert.equal(paths[1]?.lifetimeVoters, 3);
});

test("recent weighting uses the latest vote per voter and ties are stable", () => {
  const edges = [edge("a", "b"), edge("x", "y"), edge("j", "k")];
  const nodes = ["a", "b", "x", "y", "j", "k"].map(node);
  const votes = [vote("a", "u1", 1), vote("b", "u1", 1), vote("x", "u2", 1), vote("j", "u3", 0)];
  const paths = rankTrendingPaths(["x", "a", "j"], nodes, edges, votes, now, 3);
  assert.deepEqual(paths.map(path => path.edges[0]?.fromId), ["j", "a", "x"]);
});

test("a large hub has a bounded path and cannot take multiple slots", () => {
  const edges = Array.from({ length: 16 }, (_, index) => edge("hub", String(index)));
  edges.push(edge("x", "y"));
  const nodes = [...new Set(edges.flatMap(({ fromId, toId }) => [fromId, toId]))].map(node);
  const votes = [vote("hub", "voter", 0), vote("15", "other", 0), vote("x", "popular", null)];
  const paths = rankTrendingPaths(["hub", "15", "x"], nodes, edges, votes, now, 3);
  assert.equal(paths.length, 2);
  assert.equal(paths[0]?.edges.length, 12);
  assert.equal(paths[1]?.edges[0]?.fromId, "x");
});
