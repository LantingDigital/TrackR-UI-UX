import { UnifiedParkMapData } from '../types';

// ============================================
// Park Map Registry
//
// Central registry mapping park names to their
// map configuration and data. The MapboxMapScreen
// and MapPreviewCard read from this to dynamically
// load the correct map for any park.
// ============================================

export interface ParkMapConfig {
  parkSlug: string;
  displayName: string;
  /** [longitude, latitude] */
  center: [number, number];
  /** Camera bounds: northeast */
  boundsNE: [number, number];
  /** Camera bounds: southwest */
  boundsSW: [number, number];
  /** POI coordinate space bounds (for x/y → lng/lat conversion) */
  poiBoundsNE: [number, number];
  poiBoundsSW: [number, number];
  /** Zoom levels */
  zoom: { min: number; default: number; max: number };
  /** Lazy loader for map data (avoids importing all parks upfront) */
  loadMapData: () => UnifiedParkMapData;
}

// ---- Per-park coordinate conversion ----

/** Convert normalized x/y (0-1) to [lng, lat] using a park's POI bounds */
export function poiToCoordinateForPark(
  x: number,
  y: number,
  config: ParkMapConfig,
): [number, number] {
  const lng = config.poiBoundsSW[0] + x * (config.poiBoundsNE[0] - config.poiBoundsSW[0]);
  const lat = config.poiBoundsNE[1] - y * (config.poiBoundsNE[1] - config.poiBoundsSW[1]);
  return [lng, lat];
}

// ============================================
// Registry entries
// ============================================

const REGISTRY: Record<string, ParkMapConfig> = {
  "Knott's Berry Farm": {
    parkSlug: 'knotts-berry-farm',
    displayName: "Knott's Berry Farm",
    center: [-118.000202, 33.843762],
    boundsNE: [-117.9960, 33.8490],
    boundsSW: [-118.0040, 33.8385],
    poiBoundsNE: [-117.9955, 33.8470],
    poiBoundsSW: [-118.0022, 33.8395],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/knottsMapData').KNOTTS_MAP_DATA,
  },
  'Cedar Point': {
    parkSlug: 'cedar-point',
    displayName: 'Cedar Point',
    center: [-82.6835, 41.4817],
    boundsNE: [-82.6720, 41.4880],
    boundsSW: [-82.6950, 41.4750],
    poiBoundsNE: [-82.6730, 41.4870],
    poiBoundsSW: [-82.6940, 41.4760],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/cedarPointMapData').CEDAR_POINT_MAP_DATA,
  },
  'Kings Island': {
    parkSlug: 'kings-island',
    displayName: 'Kings Island',
    center: [-84.2690, 39.3451],
    boundsNE: [-84.2580, 39.3520],
    boundsSW: [-84.2800, 39.3380],
    poiBoundsNE: [-84.2590, 39.3510],
    poiBoundsSW: [-84.2790, 39.3390],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/kingsIslandMapData').KINGS_ISLAND_MAP_DATA,
  },
  'Carowinds': {
    parkSlug: 'carowinds',
    displayName: 'Carowinds',
    center: [-80.9420, 35.1040],
    boundsNE: [-80.9310, 35.1110],
    boundsSW: [-80.9530, 35.0970],
    poiBoundsNE: [-80.9320, 35.1100],
    poiBoundsSW: [-80.9520, 35.0980],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/carowindsMapData').CAROWINDS_MAP_DATA,
  },
  'Six Flags Magic Mountain': {
    parkSlug: 'six-flags-magic-mountain',
    displayName: 'Six Flags Magic Mountain',
    center: [-118.5972, 34.4253],
    boundsNE: [-118.5860, 34.4330],
    boundsSW: [-118.6080, 34.4180],
    poiBoundsNE: [-118.5870, 34.4320],
    poiBoundsSW: [-118.6070, 34.4190],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/magicMountainMapData').MAGIC_MOUNTAIN_MAP_DATA,
  },
  'Universal Studios Hollywood': {
    parkSlug: 'universal-studios-hollywood',
    displayName: 'Universal Studios Hollywood',
    center: [-118.3534, 34.1381],
    boundsNE: [-118.3430, 34.1440],
    boundsSW: [-118.3640, 34.1320],
    poiBoundsNE: [-118.3440, 34.1430],
    poiBoundsSW: [-118.3630, 34.1330],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/universalHollywoodMapData').UNIVERSAL_HOLLYWOOD_MAP_DATA,
  },
  'Six Flags Great Adventure': {
    parkSlug: 'six-flags-great-adventure',
    displayName: 'Six Flags Great Adventure',
    center: [-74.4413, 40.1374],
    boundsNE: [-74.4300, 40.1450],
    boundsSW: [-74.4520, 40.1300],
    poiBoundsNE: [-74.4310, 40.1440],
    poiBoundsSW: [-74.4510, 40.1310],
    zoom: { min: 15.3, default: 15.3, max: 20 },
    loadMapData: () => require('../data/sixFlagsGreatAdventureMapData').SIX_FLAGS_GREAT_ADVENTURE_MAP_DATA,
  },
  'Busch Gardens Tampa Bay': {
    parkSlug: 'busch-gardens-tampa',
    displayName: 'Busch Gardens Tampa Bay',
    center: [-82.4195, 28.0373],
    boundsNE: [-82.4100, 28.0440],
    boundsSW: [-82.4290, 28.0300],
    poiBoundsNE: [-82.4110, 28.0430],
    poiBoundsSW: [-82.4280, 28.0310],
    zoom: { min: 15.3, default: 15.3, max: 20 },
    loadMapData: () => require('../data/buschGardensTampaMapData').BUSCH_GARDENS_TAMPA_MAP_DATA,
  },
  'Hersheypark': {
    parkSlug: 'hersheypark',
    displayName: 'Hersheypark',
    center: [-76.6555, 40.2870],
    boundsNE: [-76.6470, 40.2930],
    boundsSW: [-76.6640, 40.2810],
    poiBoundsNE: [-76.6480, 40.2920],
    poiBoundsSW: [-76.6630, 40.2820],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/hersheyparkMapData').HERSHEYPARK_MAP_DATA,
  },
  'Dollywood': {
    parkSlug: 'dollywood',
    displayName: 'Dollywood',
    center: [-83.5310, 35.7953],
    boundsNE: [-83.5230, 35.8010],
    boundsSW: [-83.5390, 35.7900],
    poiBoundsNE: [-83.5240, 35.8000],
    poiBoundsSW: [-83.5380, 35.7910],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/dollywoodMapData').DOLLYWOOD_MAP_DATA,
  },
  'Islands of Adventure': {
    parkSlug: 'islands-of-adventure',
    displayName: 'Islands of Adventure',
    center: [-81.4687, 28.4722],
    boundsNE: [-81.4600, 28.4780],
    boundsSW: [-81.4780, 28.4660],
    poiBoundsNE: [-81.4610, 28.4770],
    poiBoundsSW: [-81.4770, 28.4670],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/islandsOfAdventureMapData').ISLANDS_OF_ADVENTURE_MAP_DATA,
  },
  'Magic Kingdom': {
    parkSlug: 'magic-kingdom',
    displayName: 'Magic Kingdom',
    center: [-81.5812, 28.4177],
    boundsNE: [-81.5730, 28.4240],
    boundsSW: [-81.5900, 28.4110],
    poiBoundsNE: [-81.5740, 28.4230],
    poiBoundsSW: [-81.5890, 28.4120],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/magicKingdomMapData').MAGIC_KINGDOM_MAP_DATA,
  },
};

// ============================================
// Public API
// ============================================

/** Get map config for a park by display name. Returns null if no map exists. */
export function getParkMapConfig(parkName: string): ParkMapConfig | null {
  return REGISTRY[parkName] ?? null;
}

/** Get map config by slug. */
export function getParkMapConfigBySlug(slug: string): ParkMapConfig | null {
  return Object.values(REGISTRY).find((c) => c.parkSlug === slug) ?? null;
}

/** Check if a park has map data available. */
export function parkHasMap(parkName: string): boolean {
  return parkName in REGISTRY;
}

/** Load the UnifiedParkMapData for a park. Returns null if no map exists. */
export function loadParkMapData(parkName: string): UnifiedParkMapData | null {
  const config = REGISTRY[parkName];
  if (!config) return null;
  return config.loadMapData();
}

/** All park names that have maps. */
export function getParksWithMaps(): string[] {
  return Object.keys(REGISTRY);
}
