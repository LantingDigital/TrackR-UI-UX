import { MapNode, MapEdge, UnifiedParkMapData } from '../types';
import { ParkMapConfig, poiToCoordinateForPark } from '../map/parkMapRegistry';

// ============================================
// Types
// ============================================

/** A graph node with resolved GPS coordinates */
export interface GeoNode {
  id: string;
  lat: number;
  lng: number;
}

/** GeoJSON route result from park pathfinding */
export interface ParkRoute {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    distanceMeters: number;
    estimatedWalkSeconds: number;
    nodeCount: number;
  };
}

// ============================================
// Haversine Distance
// ============================================

const EARTH_RADIUS_M = 6_371_000;

/** Returns distance in meters between two GPS points using the haversine formula. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// ============================================
// Geo Node Builder
// ============================================

/**
 * Build an array of GeoNodes from all walkway nodes and POIs in a park.
 * POIs with real lat/lng use those directly; everything else is computed
 * from normalized x/y via the park's poiBounds.
 */
export function buildGeoNodes(
  mapData: UnifiedParkMapData,
  parkConfig: ParkMapConfig,
): GeoNode[] {
  const geoNodes: GeoNode[] = [];

  // Walkway nodes (always computed from x/y)
  for (const wn of mapData.walkwayNodes) {
    const [lng, lat] = poiToCoordinateForPark(wn.x, wn.y, parkConfig);
    geoNodes.push({ id: wn.id, lat, lng });
  }

  // POIs (use real coords if available, otherwise compute)
  for (const poi of mapData.pois) {
    if (poi.lat != null && poi.lng != null) {
      geoNodes.push({ id: poi.id, lat: poi.lat, lng: poi.lng });
    } else {
      const [lng, lat] = poiToCoordinateForPark(poi.x, poi.y, parkConfig);
      geoNodes.push({ id: poi.id, lat, lng });
    }
  }

  return geoNodes;
}

// ============================================
// Nearest Node
// ============================================

/** Find the closest graph node to a GPS position. Returns the node's ID. */
export function nearestNode(
  userLat: number,
  userLng: number,
  geoNodes: GeoNode[],
): string {
  let bestId = '';
  let bestDist = Infinity;

  for (const gn of geoNodes) {
    const d = haversineDistance(userLat, userLng, gn.lat, gn.lng);
    if (d < bestDist) {
      bestDist = d;
      bestId = gn.id;
    }
  }

  return bestId;
}

// ============================================
// Path → GeoJSON
// ============================================

/** Average walking speed in meters per second (typical theme park pace). */
const WALKING_SPEED_MPS = 1.4;

/**
 * Convert an ordered array of node IDs from Dijkstra into a GeoJSON
 * LineString feature with distance and walking time in properties.
 */
export function graphPathToGeoJSON(
  pathIds: string[],
  geoNodes: GeoNode[],
): ParkRoute | null {
  if (pathIds.length < 2) return null;

  const geoMap = new Map(geoNodes.map((gn) => [gn.id, gn]));
  const coordinates: [number, number][] = [];
  let totalDistance = 0;

  for (let i = 0; i < pathIds.length; i++) {
    const node = geoMap.get(pathIds[i]);
    if (!node) return null;
    coordinates.push([node.lng, node.lat]);

    if (i > 0) {
      const prev = geoMap.get(pathIds[i - 1])!;
      totalDistance += haversineDistance(prev.lat, prev.lng, node.lat, node.lng);
    }
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {
      distanceMeters: Math.round(totalDistance),
      estimatedWalkSeconds: Math.round(totalDistance / WALKING_SPEED_MPS),
      nodeCount: pathIds.length,
    },
  };
}

// ============================================
// Convenience: Full Park Route
// ============================================

/**
 * Calculate a walking route from the user's GPS position to a destination
 * POI/node within the park. Chains: buildGeoNodes → nearestNode →
 * findShortestPath → graphPathToGeoJSON.
 *
 * Returns the GeoJSON route or null if no path is found.
 */
export function calculateParkRoute(
  userLat: number,
  userLng: number,
  destinationId: string,
  mapData: UnifiedParkMapData,
  parkConfig: ParkMapConfig,
): ParkRoute | null {
  // 1. Build geo-located nodes
  const geoNodes = buildGeoNodes(mapData, parkConfig);

  // 2. Find the nearest graph node to the user
  const startId = nearestNode(userLat, userLng, geoNodes);
  if (!startId) return null;

  // 3. Build a combined MapNode[] for Dijkstra (it only reads .id)
  const allNodes: MapNode[] = [
    ...mapData.walkwayNodes.map((wn) => ({
      id: wn.id,
      x: wn.x,
      y: wn.y,
      type: 'intersection' as const,
    })),
    ...mapData.pois.map((poi) => ({
      id: poi.id,
      x: poi.x,
      y: poi.y,
      type: poi.type === 'ride' ? ('ride' as const) : ('attraction' as const),
    })),
  ];

  // 4. Run Dijkstra
  const pathIds = findShortestPath(allNodes, mapData.edges, startId, destinationId);
  if (pathIds.length === 0) return null;

  // 5. Convert to GeoJSON
  return graphPathToGeoJSON(pathIds, geoNodes);
}

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
