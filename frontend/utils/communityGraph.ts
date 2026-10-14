import type { GraphNode, GraphEdge } from '../api/community.api';

export interface CommunityPath {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const PATH_CARD_WIDTH = 188;
export const PATH_CARD_HEIGHT = 132;
const COLUMN_GAP = 64;
const ROW_GAP = 32;
const PADDING = 24;

/** Keep connected experiences together, in the API's trending order. */
export function groupCommunityPaths(nodes: GraphNode[], edges: GraphEdge[]): CommunityPath[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  const validEdges = edges.filter(edge => nodeIds.has(edge.fromId) && nodeIds.has(edge.toId));
  const neighbors = new Map(nodes.map(node => [node.id, new Set<string>()]));
  for (const edge of validEdges) {
    neighbors.get(edge.fromId)!.add(edge.toId);
    neighbors.get(edge.toId)!.add(edge.fromId);
  }
  const visited = new Set<string>();
  const paths: CommunityPath[] = [];
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const members = new Set<string>();
    const pending = [node.id];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      members.add(id);
      for (const neighbor of neighbors.get(id)!) {
        if (!visited.has(neighbor)) pending.push(neighbor);
      }
    }
    paths.push({
      id: node.id,
      nodes: nodes.filter(member => members.has(member.id)),
      edges: validEdges.filter(edge => members.has(edge.fromId)),
    });
  }
  return paths;
}

/** Layer by actual transitions, never infer a connection from display order. */
export function layoutCommunityPath(path: CommunityPath) {
  const ranks = new Map<string, number>();
  const pending = new Set(path.nodes.map(node => node.id));
  while (pending.size) {
    const ready = path.nodes.filter(node => pending.has(node.id) && !path.edges.some(edge =>
      edge.toId === node.id && edge.fromId !== node.id && pending.has(edge.fromId),
    ));
    // Break cycles deterministically; their return edges are routed above the cards.
    const next = ready.length ? ready : [path.nodes.find(node => pending.has(node.id))!];
    for (const node of next) {
      const predecessors = path.edges
        .filter(edge => edge.toId === node.id && ranks.has(edge.fromId))
        .map(edge => ranks.get(edge.fromId)! + 1);
      ranks.set(node.id, Math.max(0, ...predecessors));
      pending.delete(node.id);
    }
  }
  const columns = Array.from({ length: Math.max(0, ...ranks.values()) + 1 }, () => [] as GraphNode[]);
  for (const node of path.nodes) columns[ranks.get(node.id)!].push(node);
  const detours = path.edges.filter(edge => ranks.get(edge.toId)! !== ranks.get(edge.fromId)! + 1);
  const top = PADDING + detours.length * 14;
  const rows = Math.max(1, ...columns.map(column => column.length));
  const bodyHeight = rows * PATH_CARD_HEIGHT + (rows - 1) * ROW_GAP;
  const positionedNodes = columns.flatMap((column, index) => column.map((node, row) => ({
    ...node,
    x: PADDING + index * (PATH_CARD_WIDTH + COLUMN_GAP),
    y: top + (bodyHeight - (column.length * PATH_CARD_HEIGHT + (column.length - 1) * ROW_GAP)) / 2
      + row * (PATH_CARD_HEIGHT + ROW_GAP),
  })));
  const byId = new Map(positionedNodes.map(node => [node.id, node]));
  let detour = 0;
  const connections = path.edges.map(edge => {
    const from = byId.get(edge.fromId)!;
    const to = byId.get(edge.toId)!;
    let d: string;
    if (ranks.get(edge.toId)! === ranks.get(edge.fromId)! + 1) {
      const startX = from.x + PATH_CARD_WIDTH;
      const startY = from.y + PATH_CARD_HEIGHT / 2;
      const endY = to.y + PATH_CARD_HEIGHT / 2;
      const middleX = (startX + to.x) / 2;
      d = `M ${startX} ${startY} C ${middleX} ${startY}, ${middleX} ${endY}, ${to.x} ${endY}`;
    } else {
      const startX = from.x + PATH_CARD_WIDTH / 2 + 22;
      const endX = to.x + PATH_CARD_WIDTH / 2 - 22;
      const railY = PADDING / 2 + detour++ * 14;
      const turn = endX > startX ? 8 : -8;
      d = `M ${startX} ${from.y} L ${startX} ${railY + 8} Q ${startX} ${railY}, ${startX + turn} ${railY} L ${endX - turn} ${railY} Q ${endX} ${railY}, ${endX} ${railY + 8} L ${endX} ${to.y}`;
    }
    return { ...edge, d };
  });
  return {
    nodes: positionedNodes,
    connections,
    width: PADDING * 2 + columns.length * PATH_CARD_WIDTH + (columns.length - 1) * COLUMN_GAP,
    height: top + bodyHeight + PADDING,
  };
}
