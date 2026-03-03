import { MapNode, MapEdge } from '../types';

// ============================================
// Dijkstra Shortest Path
// ============================================

/**
 * Find the shortest path between two nodes using Dijkstra's algorithm.
 * Returns an ordered array of node IDs from start to end, or [] if no path.
 */
export function findShortestPath(
  nodes: MapNode[],
  edges: MapEdge[],
  startId: string,
  endId: string,
): string[] {
  if (startId === endId) return [startId];

  const nodeIds = new Set(nodes.map((n) => n.id));
  if (!nodeIds.has(startId) || !nodeIds.has(endId)) return [];

  // Build adjacency list (undirected)
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    adj.get(e.from)?.push({ to: e.to, weight: e.weight });
    adj.get(e.to)?.push({ to: e.from, weight: e.weight });
  }

  // Distances and predecessors
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of nodeIds) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(startId, 0);

  // Simple array-based priority queue (extract-min by scan)
  const queue: string[] = [...nodeIds];
  const visited = new Set<string>();

  while (queue.length > 0) {
    // Find min-distance node in queue
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if ((dist.get(queue[i]) ?? Infinity) < (dist.get(queue[minIdx]) ?? Infinity)) {
        minIdx = i;
      }
    }
    const u = queue[minIdx];
    queue.splice(minIdx, 1);

    if (visited.has(u)) continue;
    visited.add(u);

    const uDist = dist.get(u)!;
    if (uDist === Infinity) break; // remaining are unreachable
    if (u === endId) break; // found shortest path

    for (const neighbor of adj.get(u) ?? []) {
      if (visited.has(neighbor.to)) continue;
      const alt = uDist + neighbor.weight;
      if (alt < (dist.get(neighbor.to) ?? Infinity)) {
        dist.set(neighbor.to, alt);
        prev.set(neighbor.to, u);
      }
    }
  }

  // Reconstruct path
  if (prev.get(endId) === null && startId !== endId) return [];

  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.push(current);
    current = prev.get(current) ?? null;
  }
  path.reverse();

  return path[0] === startId ? path : [];
}

/**
 * Convert an ordered array of node IDs into SVG-ready pixel coordinates.
 */
export function pathToSvgPoints(
  path: string[],
  nodes: MapNode[],
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number }[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return path
    .map((id) => {
      const node = nodeMap.get(id);
      if (!node) return null;
      return { x: node.x * imageWidth, y: node.y * imageHeight };
    })
    .filter((p): p is { x: number; y: number } => p !== null);
}
