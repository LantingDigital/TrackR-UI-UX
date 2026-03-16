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
  'Universal Epic Universe': {
    parkSlug: 'epic-universe',
    displayName: 'Universal Epic Universe',
    center: [-81.4477, 28.4735],
    boundsNE: [-81.4400, 28.4790],
    boundsSW: [-81.4550, 28.4690],
    poiBoundsNE: [-81.4410, 28.4780],
    poiBoundsSW: [-81.4540, 28.4700],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/epicUniverseMapData').EPIC_UNIVERSE_MAP_DATA,
  },
  'Universal Studios Florida': {
    parkSlug: 'universal-studios-florida',
    displayName: 'Universal Studios Florida',
    center: [-81.4670, 28.4752],
    boundsNE: [-81.4580, 28.4800],
    boundsSW: [-81.4750, 28.4710],
    poiBoundsNE: [-81.4590, 28.4790],
    poiBoundsSW: [-81.4740, 28.4720],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/universalStudiosFloridaMapData').UNIVERSAL_STUDIOS_FLORIDA_MAP_DATA,
  },
  'Six Flags Over Georgia': {
    parkSlug: 'six-flags-over-georgia',
    displayName: 'Six Flags Over Georgia',
    center: [-84.5516, 33.7685],
    boundsNE: [-84.5430, 33.7740],
    boundsSW: [-84.5600, 33.7630],
    poiBoundsNE: [-84.5440, 33.7730],
    poiBoundsSW: [-84.5590, 33.7640],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/sixFlagsOverGeorgiaMapData').SIX_FLAGS_OVER_GEORGIA_MAP_DATA,
  },
  'Disneyland': {
    parkSlug: 'disneyland',
    displayName: 'Disneyland',
    center: [-117.9190, 33.8121],
    boundsNE: [-117.9120, 33.8170],
    boundsSW: [-117.9260, 33.8070],
    poiBoundsNE: [-117.9130, 33.8160],
    poiBoundsSW: [-117.9250, 33.8080],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/disneylandMapData').DISNEYLAND_MAP_DATA,
  },
  'Busch Gardens Williamsburg': {
    parkSlug: 'busch-gardens-williamsburg',
    displayName: 'Busch Gardens Williamsburg',
    center: [-76.6454, 37.2340],
    boundsNE: [-76.6360, 37.2400],
    boundsSW: [-76.6520, 37.2270],
    poiBoundsNE: [-76.6370, 37.2390],
    poiBoundsSW: [-76.6510, 37.2280],
    zoom: { min: 15.3, default: 15.3, max: 20 },
    loadMapData: () => require('../data/buschGardensWilliamsburgMapData').BUSCH_GARDENS_WILLIAMSBURG_MAP_DATA,
  },
  'Dorney Park & Wildwater Kingdom': {
    parkSlug: 'dorney-park',
    displayName: 'Dorney Park & Wildwater Kingdom',
    center: [-75.5350, 40.5784],
    boundsNE: [-75.5270, 40.5830],
    boundsSW: [-75.5420, 40.5740],
    poiBoundsNE: [-75.5280, 40.5820],
    poiBoundsSW: [-75.5410, 40.5750],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/dorneyParkMapData').DORNEY_PARK_MAP_DATA,
  },
  'Six Flags Great America': {
    parkSlug: 'six-flags-great-america',
    displayName: 'Six Flags Great America',
    center: [-87.9354, 42.3716],
    boundsNE: [-87.9280, 42.3770],
    boundsSW: [-87.9420, 42.3660],
    poiBoundsNE: [-87.9290, 42.3760],
    poiBoundsSW: [-87.9410, 42.3670],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/sixFlagsGreatAmericaMapData').SIX_FLAGS_GREAT_AMERICA_MAP_DATA,
  },
  'LEGOLAND California': {
    parkSlug: 'legoland-california',
    displayName: 'LEGOLAND California',
    center: [-117.3112, 33.1265],
    boundsNE: [-117.3040, 33.1310],
    boundsSW: [-117.3180, 33.1220],
    poiBoundsNE: [-117.3050, 33.1300],
    poiBoundsSW: [-117.3170, 33.1230],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/legolandCaliforniaMapData').LEGOLAND_CALIFORNIA_MAP_DATA,
  },
  'SeaWorld Orlando': {
    parkSlug: 'seaworld-orlando',
    displayName: 'SeaWorld Orlando',
    center: [-81.4612, 28.4112],
    boundsNE: [-81.4530, 28.4170],
    boundsSW: [-81.4700, 28.4050],
    poiBoundsNE: [-81.4540, 28.4160],
    poiBoundsSW: [-81.4690, 28.4060],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/seaworldOrlandoMapData').SEAWORLD_ORLANDO_MAP_DATA,
  },
  'SeaWorld San Diego': {
    parkSlug: 'seaworld-san-diego',
    displayName: 'SeaWorld San Diego',
    center: [-117.2263, 32.7657],
    boundsNE: [-117.2190, 32.7710],
    boundsSW: [-117.2340, 32.7610],
    poiBoundsNE: [-117.2200, 32.7700],
    poiBoundsSW: [-117.2330, 32.7620],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/seaworldSanDiegoMapData').SEAWORLD_SAN_DIEGO_MAP_DATA,
  },
  'LEGOLAND Florida': {
    parkSlug: 'legoland-florida',
    displayName: 'LEGOLAND Florida',
    center: [-81.6908, 27.9886],
    boundsNE: [-81.6840, 27.9930],
    boundsSW: [-81.6970, 27.9840],
    poiBoundsNE: [-81.6850, 27.9920],
    poiBoundsSW: [-81.6960, 27.9850],
    zoom: { min: 15.7, default: 15.7, max: 20 },
    loadMapData: () => require('../data/legolandFloridaMapData').LEGOLAND_FLORIDA_MAP_DATA,
  },
  "Canada's Wonderland": {
    parkSlug: 'canadas-wonderland',
    displayName: "Canada's Wonderland",
    center: [-79.5414, 43.8424],
    boundsNE: [-79.5340, 43.8480],
    boundsSW: [-79.5490, 43.8370],
    poiBoundsNE: [-79.5350, 43.8470],
    poiBoundsSW: [-79.5480, 43.8380],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/canadasWonderlandMapData').CANADAS_WONDERLAND_MAP_DATA,
  },
  'Six Flags Fiesta Texas': {
    parkSlug: 'six-flags-fiesta-texas',
    displayName: 'Six Flags Fiesta Texas',
    center: [-98.6098, 29.5987],
    boundsNE: [-98.6000, 29.6040],
    boundsSW: [-98.6190, 29.5930],
    poiBoundsNE: [-98.6010, 29.6030],
    poiBoundsSW: [-98.6180, 29.5940],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/sixFlagsFiestaTexasMapData').SIX_FLAGS_FIESTA_TEXAS_MAP_DATA,
  },
  'Epcot': {
    parkSlug: 'epcot',
    displayName: 'EPCOT',
    center: [-81.5494, 28.3747],
    boundsNE: [-81.5430, 28.3790],
    boundsSW: [-81.5560, 28.3670],
    poiBoundsNE: [-81.5440, 28.3780],
    poiBoundsSW: [-81.5550, 28.3680],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/epcotMapData').EPCOT_MAP_DATA,
  },
  "Disney's Hollywood Studios": {
    parkSlug: 'hollywood-studios',
    displayName: "Disney's Hollywood Studios",
    center: [-81.5594, 28.3575],
    boundsNE: [-81.5520, 28.3620],
    boundsSW: [-81.5670, 28.3530],
    poiBoundsNE: [-81.5530, 28.3610],
    poiBoundsSW: [-81.5660, 28.3540],
    zoom: { min: 15.5, default: 15.5, max: 20 },
    loadMapData: () => require('../data/hollywoodStudiosMapData').HOLLYWOOD_STUDIOS_MAP_DATA,
  },
  "Disney's Animal Kingdom": {
    parkSlug: 'animal-kingdom',
    displayName: "Disney's Animal Kingdom",
    center: [-81.5901, 28.3553],
    boundsNE: [-81.5820, 28.3610],
    boundsSW: [-81.5980, 28.3500],
    poiBoundsNE: [-81.5830, 28.3600],
    poiBoundsSW: [-81.5970, 28.3510],
    zoom: { min: 15.3, default: 15.3, max: 20 },
    loadMapData: () => require('../data/animalKingdomMapData').ANIMAL_KINGDOM_MAP_DATA,
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
