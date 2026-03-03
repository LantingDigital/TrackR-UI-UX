// ============================================
// Walk Time Engine
//
// Maps POIs to nearest walkway nodes and computes
// walk times via Dijkstra shortest path.
// ============================================

import { findShortestPath } from '../utils/pathfinding';
import type { MapNode, MapEdge, WalkwayNode } from '../types';
import type { UnifiedParkMapData } from '../types';

const WEIGHT_TO_MIN = 2; // each edge weight unit ≈ 2 minutes (calibrated to Knott's scale)
const DEFAULT_WALK_MIN = 5; // fallback when no walkway data

/**
 * Build a combined node array (POIs as MapNodes + walkway nodes as MapNodes)
 * for pathfinding. POI nodes use their x,y positions.
 */
function buildNodeArray(
  mapData: UnifiedParkMapData,
): MapNode[] {
  const poiNodes: MapNode[] = mapData.pois.map((poi) => ({
    id: poi.id,
    x: poi.x,
    y: poi.y,
    type: poi.type as MapNode['type'],
    name: poi.name,
  }));

  const walkNodes: MapNode[] = mapData.walkwayNodes.map((w) => ({
    id: w.id,
    x: w.x,
    y: w.y,
    type: 'intersection' as const,
  }));

  return [...poiNodes, ...walkNodes];
}

/**
 * Compute walk time in minutes between two POIs using the park's walkway graph.
 * Returns DEFAULT_WALK_MIN if no path exists or no map data available.
 */
export function getWalkTimeMin(
  fromPoiId: string,
  toPoiId: string,
  mapData: UnifiedParkMapData | null,
): number {
  if (!mapData || fromPoiId === toPoiId) return 0;

  const nodes = buildNodeArray(mapData);
  const path = findShortestPath(nodes, mapData.edges, fromPoiId, toPoiId);

  if (path.length < 2) return DEFAULT_WALK_MIN;

  // Sum edge weights along path
  const edgeMap = new Map<string, number>();
  for (const e of mapData.edges) {
    edgeMap.set(`${e.from}|${e.to}`, e.weight);
    edgeMap.set(`${e.to}|${e.from}`, e.weight);
  }

  let totalWeight = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const key = `${path[i]}|${path[i + 1]}`;
    totalWeight += edgeMap.get(key) ?? 1;
  }

  return Math.round(totalWeight * WEIGHT_TO_MIN);
}

/**
 * Compute walk times for an ordered sequence of POI IDs.
 * Returns an array of walk times (minutes) where index i = walk time from stop i to stop i+1.
 * First element is 0 (no walking to first stop assumed — user is already there or starts from entrance).
 */
export function getSequenceWalkTimes(
  poiIds: string[],
  mapData: UnifiedParkMapData | null,
): number[] {
  if (poiIds.length === 0) return [];
  if (!mapData) return poiIds.map(() => DEFAULT_WALK_MIN);

  const walkTimes = [0]; // no walk to first stop
  for (let i = 1; i < poiIds.length; i++) {
    walkTimes.push(getWalkTimeMin(poiIds[i - 1], poiIds[i], mapData));
  }
  return walkTimes;
}
