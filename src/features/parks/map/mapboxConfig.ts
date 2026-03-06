// ============================================
// Mapbox Configuration — Knott's Berry Farm
// ============================================

import { MapCategory } from '../types';

// Public access token — loaded from EXPO_PUBLIC_MAPBOX_TOKEN in .env
export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

// Whether native Mapbox is available (false in Expo Go)
export let MAPBOX_AVAILABLE = false;

try {
  const MapboxGL = require('@rnmapbox/maps').default;
  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  MAPBOX_AVAILABLE = true;
} catch {
  // Native Mapbox not available
}

export const MAP_STYLE_URL = 'mapbox://styles/mapbox/light-v11';

// ---- Vintage Hand-Drawn Park Style ----

export const PARK_STYLE_JSON = JSON.stringify({
  version: 8,
  name: 'TrackR Vintage Park',
  sources: {
    composite: {
      url: 'mapbox://mapbox.mapbox-streets-v8',
      type: 'vector',
    },
  },
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    // 1. Parchment background
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#F4ECD8' },
    },

    // 2. Park / green areas — muted vintage watercolor green
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'composite',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'park'],
      paint: { 'fill-color': '#A3B19B', 'fill-opacity': 0.85 },
    },
    {
      id: 'landuse-grass',
      type: 'fill',
      source: 'composite',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'grass'],
      paint: { 'fill-color': '#A3B19B', 'fill-opacity': 0.7 },
    },
    {
      id: 'landuse-wood',
      type: 'fill',
      source: 'composite',
      'source-layer': 'landuse',
      filter: [
        'any',
        ['==', ['get', 'class'], 'wood'],
        ['==', ['get', 'class'], 'scrub'],
      ],
      paint: { 'fill-color': '#8FA489', 'fill-opacity': 0.7 },
    },

    // 3. Water — soft pastel blue
    {
      id: 'water',
      type: 'fill',
      source: 'composite',
      'source-layer': 'water',
      paint: { 'fill-color': '#9DBFD8' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'composite',
      'source-layer': 'waterway',
      paint: { 'line-color': '#8BB0C9', 'line-width': 1.5 },
    },

    // 4. Buildings — warm muted tan
    {
      id: 'building',
      type: 'fill',
      source: 'composite',
      'source-layer': 'building',
      paint: {
        'fill-color': '#E6D9C3',
        'fill-opacity': 0.9,
        'fill-outline-color': '#D4C5AB',
      },
    },

    // 5. Roads / paths — warm dirt color
    {
      id: 'road-path-outline',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: [
        'any',
        ['==', ['get', 'class'], 'path'],
        ['==', ['get', 'class'], 'pedestrian'],
      ],
      paint: { 'line-color': '#D4B88C', 'line-width': 4 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
    {
      id: 'road-path',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: [
        'any',
        ['==', ['get', 'class'], 'path'],
        ['==', ['get', 'class'], 'pedestrian'],
      ],
      paint: { 'line-color': '#E0CBA8', 'line-width': 2.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
    {
      id: 'road-service',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'service'],
      paint: { 'line-color': '#E0CBA8', 'line-width': 1.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
    {
      id: 'road-street',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: [
        'any',
        ['==', ['get', 'class'], 'street'],
        ['==', ['get', 'class'], 'street_limited'],
      ],
      paint: { 'line-color': '#E0CBA8', 'line-width': 2 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
  ],
});

// ---- Park Coordinates ----

export const PARK_BOUNDS = {
  ne: [-117.9960, 33.8490] as [number, number],
  sw: [-118.0040, 33.8385] as [number, number],
};

export const KNOTTS_CENTER: [number, number] = [-118.000202, 33.843762];

export const POI_BOUNDS = {
  ne: [-117.9955, 33.8470] as [number, number],
  sw: [-118.0022, 33.8395] as [number, number],
};

// ---- Zoom Levels ----

export const ZOOM = {
  min: 15.7,
  default: 15.7,
  max: 20,
} as const;

export const CATEGORY_ZOOM: Record<MapCategory, number> = {
  coaster: 16.2,
  ride:    16.5,
  food:    17,
  show:    17,
  shop:    17.3,
  service: 17.5,
};

// ---- Coordinate Conversion ----

export function poiToCoordinate(x: number, y: number): [number, number] {
  const lng = POI_BOUNDS.sw[0] + x * (POI_BOUNDS.ne[0] - POI_BOUNDS.sw[0]);
  const lat = POI_BOUNDS.ne[1] - y * (POI_BOUNDS.ne[1] - POI_BOUNDS.sw[1]);
  return [lng, lat];
}

export function coordinateToPoi(
  lng: number,
  lat: number,
): { x: number; y: number } {
  const x = (lng - POI_BOUNDS.sw[0]) / (POI_BOUNDS.ne[0] - POI_BOUNDS.sw[0]);
  const y = (POI_BOUNDS.ne[1] - lat) / (POI_BOUNDS.ne[1] - POI_BOUNDS.sw[1]);
  return { x, y };
}
