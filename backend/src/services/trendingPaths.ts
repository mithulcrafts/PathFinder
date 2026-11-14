import type { GraphEdge, GraphNode } from "./community.service.js";

const DAY = 86_400_000;
const MAX_PATH_EDGES = 12;

export interface PathVote {
  experienceId: string;
  voterId: string;
  castAt: number | null;
}

export interface RankedCommunityPath {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  recentVoters: number;
  lifetimeVoters: number;
}

export function rankTrendingPaths(
  seedIds: string[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  votes: PathVote[],
  now: number,
  limit: number,
): RankedCommunityPath[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const votesByNode = new Map<string, PathVote[]>();
  for (const vote of votes) {
    const entries = votesByNode.get(vote.experienceId) ?? [];
    entries.push(vote);
    votesByNode.set(vote.experienceId, entries);
  }

  const adjacent = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    for (const id of new Set([edge.fromId, edge.toId])) {
      const incident = adjacent.get(id) ?? [];
      incident.push(edge);
      adjacent.set(id, incident);
    }
  }

  const candidates = new Map<string, { path: RankedCommunityPath; score: number; latest: number }>();
  for (const seed of seedIds) {
    const ids = new Set([seed]);
    const pathEdges = new Set<GraphEdge>();
    for (const id of ids) {
      if (pathEdges.size >= MAX_PATH_EDGES) break;
      for (const edge of adjacent.get(id) ?? []) {
        pathEdges.add(edge);
        ids.add(edge.fromId);
        ids.add(edge.toId);
        if (pathEdges.size >= MAX_PATH_EDGES) break;
      }
    }
    if (!pathEdges.size) continue;
    const pathNodes = [...ids].map(id => nodeById.get(id)).filter((node): node is GraphNode => !!node);
    const id = JSON.stringify([...pathEdges].map(edge => [edge.fromId, edge.toId]).sort());
    if (candidates.has(id)) continue;

    const lifetime = new Set<string>();
    const recent = new Map<string, number>();
    for (const nodeId of ids) {
      for (const vote of votesByNode.get(nodeId) ?? []) {
        lifetime.add(vote.voterId);
        if (vote.castAt !== null && vote.castAt >= now - 30 * DAY && vote.castAt <= now) {
          recent.set(vote.voterId, Math.max(vote.castAt, recent.get(vote.voterId) ?? -Infinity));
        }
      }
    }
    const dates = [...recent.values()];
    candidates.set(id, {
      path: { id, nodes: pathNodes, edges: [...pathEdges], recentVoters: recent.size, lifetimeVoters: lifetime.size },
      score: dates.reduce((sum, time) => sum + 2 ** (-(now - time) / (14 * DAY)), 0),
      latest: dates.reduce((latest, time) => Math.max(latest, time), 0),
    });
  }

  const ranked = [...candidates.values()].sort((a, b) =>
    b.score - a.score || b.latest - a.latest ||
    (a.score === 0 && b.score === 0 ? b.path.lifetimeVoters - a.path.lifetimeVoters : 0) ||
    a.path.id.localeCompare(b.path.id),
  );
  const used = new Set<string>();
  const paths: RankedCommunityPath[] = [];
  for (const { path } of ranked) {
    if (path.nodes.some(node => used.has(node.id))) continue;
    paths.push(path);
    for (const node of path.nodes) used.add(node.id);
    if (paths.length === limit) break;
  }
  return paths;
}
