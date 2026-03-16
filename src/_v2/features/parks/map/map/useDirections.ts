import { useState, useCallback, useMemo } from 'react';
import { UnifiedParkMapData, ParkPOI } from '../types';
import { ParkMapConfig, poiToCoordinateForPark } from './parkMapRegistry';
import { findShortestPath } from '../utils/pathfinding';

// ============================================
// useDirections Hook — Walkway Graph Routing
//
// Routes between two points using client-side
// Dijkstra pathfinding on the park's walkway graph.
// No external API calls — works fully offline.
//
// Converts the walkway path to a GeoJSON LineString
// for rendering with RouteLayer.
// ============================================

interface DirectionsState {
  route: GeoJSON.Feature<GeoJSON.LineString> | null;
  routeInfo: { distance: number; duration: number } | null;
  loading: boolean;
  error: string | null;
}

/** Average walking speed in meters per second (~3 mph) */
const WALKING_SPEED_MPS = 1.34;

/** Haversine distance in meters between two lat/lng points */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** A node with geo-coordinates resolved from normalized x/y */
interface GeoNode {
  id: string;
  lng: number;
  lat: number;
}

/**
 * Build GeoNodes from all walkway nodes AND POIs so Dijkstra can
 * route to/from any point on the graph. POIs that already have
 * lng/lat use those directly; otherwise we project from x/y.
 */
function buildGeoNodes(
  mapData: UnifiedParkMapData,
  config: ParkMapConfig,
): GeoNode[] {
  const nodes: GeoNode[] = [];

  // Walkway intersection nodes (x/y → lng/lat)
  for (const wn of mapData.walkwayNodes) {
    const [lng, lat] = poiToCoordinateForPark(wn.x, wn.y, config);
    nodes.push({ id: wn.id, lng, lat });
  }

  // POIs (prefer real coords, fall back to x/y projection)
  for (const poi of mapData.pois) {
    if (poi.lng != null && poi.lat != null) {
      nodes.push({ id: poi.id, lng: poi.lng, lat: poi.lat });
    } else {
      const [lng, lat] = poiToCoordinateForPark(poi.x, poi.y, config);
      nodes.push({ id: poi.id, lng, lat });
    }
  }

  return nodes;
}

/**
 * Find the nearest graph node to a given lat/lng.
 * Considers both walkway nodes and POI nodes.
 */
function findNearestNode(
  lat: number,
  lng: number,
  geoNodes: GeoNode[],
  nodeIdsInGraph: Set<string>,
): string | null {
  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const node of geoNodes) {
    if (!nodeIdsInGraph.has(node.id)) continue;
    const dist = haversineDistance(lat, lng, node.lat, node.lng);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = node.id;
    }
  }

  return bestId;
}

/**
 * Convert a Dijkstra path (ordered node IDs) into a GeoJSON LineString
 * with distance (meters) and duration (seconds) in properties.
 */
function pathToGeoJSON(
  pathIds: string[],
  geoNodeMap: Map<string, GeoNode>,
): GeoJSON.Feature<GeoJSON.LineString> | null {
  if (pathIds.length < 2) return null;

  const coordinates: [number, number][] = [];
  let totalDistance = 0;

  for (let i = 0; i < pathIds.length; i++) {
    const node = geoNodeMap.get(pathIds[i]);
    if (!node) return null;
    coordinates.push([node.lng, node.lat]);

    if (i > 0) {
      const prev = geoNodeMap.get(pathIds[i - 1])!;
      totalDistance += haversineDistance(prev.lat, prev.lng, node.lat, node.lng);
    }
  }

  const durationSeconds = totalDistance / WALKING_SPEED_MPS;

  return {
    type: 'Feature',
    properties: {
      source: 'walkway-graph',
      distance: Math.round(totalDistance),
      duration: Math.round(durationSeconds),
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

/**
 * Hook that provides in-park walking directions using client-side
 * Dijkstra pathfinding on the park's walkway graph.
 *
 * @param mapData  Park map data (POIs, walkway nodes, edges)
 * @param mapConfig  Park map configuration (bounds for coordinate conversion)
 * @param coordConverter  Optional custom x/y → [lng,lat] converter (for backward compat)
 */
export function useDirections(
  mapData: UnifiedParkMapData,
  mapConfig: ParkMapConfig,
  coordConverter?: (x: number, y: number) => [number, number],
) {
  const [state, setState] = useState<DirectionsState>({
    route: null,
    routeInfo: null,
    loading: false,
    error: null,
  });

  // Pre-compute geo nodes and lookup map once per park
  const geoNodes = useMemo(
    () => buildGeoNodes(mapData, mapConfig),
    [mapData, mapConfig],
  );

  const geoNodeMap = useMemo(
    () => new Map(geoNodes.map((n) => [n.id, n])),
    [geoNodes],
  );

  // Build the set of node IDs that actually appear in the edge graph
  // so we only snap to reachable nodes
  const nodeIdsInGraph = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of mapData.edges) {
      ids.add(edge.from);
      ids.add(edge.to);
    }
    return ids;
  }, [mapData.edges]);

  // Build MapNode-compatible array for findShortestPath (it expects { id, x, y }[])
  const allGraphNodes = useMemo(() => {
    const nodes: { id: string; x: number; y: number; type: 'intersection' }[] = [];
    const seen = new Set<string>();

    for (const wn of mapData.walkwayNodes) {
      if (!seen.has(wn.id)) {
        nodes.push({ id: wn.id, x: wn.x, y: wn.y, type: 'intersection' });
        seen.add(wn.id);
      }
    }
    for (const poi of mapData.pois) {
      if (!seen.has(poi.id)) {
        nodes.push({ id: poi.id, x: poi.x, y: poi.y, type: 'intersection' });
        seen.add(poi.id);
      }
    }

    return nodes;
  }, [mapData]);

  /**
   * Calculate a walking route on the park's walkway graph.
   *
   * @param origin       [lng, lat] of the starting point (user GPS or entrance)
   * @param destination  [lng, lat] of the destination point
   * @param _originId    Optional node ID for the origin (skips nearest-node lookup)
   * @param destinationId  Optional node ID for the destination POI
   * @param _isNearPark  Ignored — walkway routing is always local
   */
  const fetchRoute = useCallback(
    (
      origin: [number, number],
      destination: [number, number],
      _originId?: string,
      destinationId?: string,
      _isNearPark?: boolean,
    ) => {
      setState({ route: null, routeInfo: null, loading: true, error: null });

      try {
        // 1. Determine the start node
        const originLng = origin[0];
        const originLat = origin[1];
        const startId =
          _originId && nodeIdsInGraph.has(_originId)
            ? _originId
            : findNearestNode(originLat, originLng, geoNodes, nodeIdsInGraph);

        if (!startId) {
          setState({
            route: null,
            routeInfo: null,
            loading: false,
            error: 'Could not find a nearby walkway node for your location.',
          });
          return;
        }

        // 2. Determine the destination node
        const destId =
          destinationId && nodeIdsInGraph.has(destinationId)
            ? destinationId
            : findNearestNode(destination[1], destination[0], geoNodes, nodeIdsInGraph);

        if (!destId) {
          setState({
            route: null,
            routeInfo: null,
            loading: false,
            error: 'Could not find a walkway near the destination.',
          });
          return;
        }

        // 3. Run Dijkstra on the walkway graph
        const pathIds = findShortestPath(allGraphNodes, mapData.edges, startId, destId);

        if (pathIds.length === 0) {
          // No path found — fall back to straight line so the user sees something
          setState({
            route: {
              type: 'Feature',
              properties: { source: 'straight-line', distance: 0, duration: 0 },
              geometry: { type: 'LineString', coordinates: [origin, destination] },
            },
            routeInfo: null,
            loading: false,
            error: 'No walkway route found. Showing a straight line.',
          });
          return;
        }

        // 4. Convert path to GeoJSON with distance/duration
        const feature = pathToGeoJSON(pathIds, geoNodeMap);

        if (!feature) {
          setState({
            route: null,
            routeInfo: null,
            loading: false,
            error: 'Failed to build route geometry.',
          });
          return;
        }

        const distance = (feature.properties as any)?.distance ?? 0;
        const duration = (feature.properties as any)?.duration ?? 0;

        setState({
          route: feature,
          routeInfo: { distance, duration },
          loading: false,
          error: null,
        });
      } catch (err) {
        setState({
          route: null,
          routeInfo: null,
          loading: false,
          error: 'Route calculation failed.',
        });
      }
    },
    [geoNodes, geoNodeMap, nodeIdsInGraph, allGraphNodes, mapData.edges],
  );

  const clearRoute = useCallback(() => {
    setState({ route: null, routeInfo: null, loading: false, error: null });
  }, []);

  /** Get the best [lng, lat] for a POI — prefer real coords, fall back to x/y conversion */
  const poiCoordinate = useCallback(
    (poi: ParkPOI): [number, number] => {
      if (poi.lng != null && poi.lat != null) return [poi.lng, poi.lat];
      if (coordConverter) return coordConverter(poi.x, poi.y);
      return poiToCoordinateForPark(poi.x, poi.y, mapConfig);
    },
    [mapConfig, coordConverter],
  );

  return {
    route: state.route,
    routeInfo: state.routeInfo,
    loading: state.loading,
    error: state.error,
    fetchRoute,
    clearRoute,
    poiCoordinate,
  };
}
