import { useState, useCallback } from 'react';
import { UnifiedParkMapData, MapNode } from '../types';
import { findShortestPath } from '../utils/pathfinding';
import { poiToCoordinate, MAPBOX_ACCESS_TOKEN } from './mapboxConfig';

// ============================================
// useDirections Hook
//
// Fetches a walking route between two points:
// 1. Try Mapbox Directions API (walking profile)
// 2. If API fails → fallback to on-device Dijkstra using
//    the existing walkway graph from knottsMapData.ts
//
// Returns a GeoJSON LineString for rendering with RouteLayer.
// ============================================

interface DirectionsState {
  route: GeoJSON.Feature<GeoJSON.LineString> | null;
  loading: boolean;
  error: string | null;
}

export function useDirections(
  mapData: UnifiedParkMapData,
  coordConverter?: (x: number, y: number) => [number, number],
) {
  const toCoord = coordConverter ?? poiToCoordinate;
  const [state, setState] = useState<DirectionsState>({
    route: null,
    loading: false,
    error: null,
  });

  const fetchRoute = useCallback(
    async (
      origin: [number, number],
      destination: [number, number],
      originId?: string,
      destinationId?: string,
    ) => {
      setState({ route: null, loading: true, error: null });

      try {
        // Try Mapbox Directions API first
        const route = await fetchMapboxDirections(origin, destination);
        if (route) {
          setState({ route, loading: false, error: null });
          return;
        }
      } catch {
        // API failed — fall through to Dijkstra
      }

      // Fallback: on-device Dijkstra pathfinding
      if (originId && destinationId) {
        const fallbackRoute = dijkstraFallback(mapData, originId, destinationId, toCoord);
        if (fallbackRoute) {
          setState({ route: fallbackRoute, loading: false, error: null });
          return;
        }
      }

      setState({ route: null, loading: false, error: 'No route found' });
    },
    [mapData, toCoord],
  );

  const clearRoute = useCallback(() => {
    setState({ route: null, loading: false, error: null });
  }, []);

  return {
    route: state.route,
    loading: state.loading,
    error: state.error,
    fetchRoute,
    clearRoute,
  };
}

// ---- Mapbox Directions API ----

async function fetchMapboxDirections(
  origin: [number, number],
  destination: [number, number],
): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full&walkway_bias=1` +
    `&access_token=${MAPBOX_ACCESS_TOKEN}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route?.geometry) return null;

  return {
    type: 'Feature',
    properties: {
      distance: route.distance,
      duration: route.duration,
    },
    geometry: route.geometry,
  };
}

// ---- Dijkstra Fallback ----

function dijkstraFallback(
  mapData: UnifiedParkMapData,
  startId: string,
  endId: string,
  toCoord: (x: number, y: number) => [number, number] = poiToCoordinate,
): GeoJSON.Feature<GeoJSON.LineString> | null {
  // Build node list from POIs + walkway nodes (matching MapNode shape)
  const nodes: MapNode[] = [
    ...mapData.pois.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      type: p.type as MapNode['type'],
      name: p.name,
    })),
    ...mapData.walkwayNodes.map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      type: 'intersection' as const,
    })),
  ];

  const path = findShortestPath(nodes, mapData.edges, startId, endId);
  if (path.length < 2) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const coordinates = path
    .map((id) => {
      const node = nodeMap.get(id);
      if (!node) return null;
      return toCoord(node.x, node.y);
    })
    .filter((c): c is [number, number] => c !== null);

  if (coordinates.length < 2) return null;

  return {
    type: 'Feature',
    properties: {
      source: 'dijkstra-fallback',
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}
