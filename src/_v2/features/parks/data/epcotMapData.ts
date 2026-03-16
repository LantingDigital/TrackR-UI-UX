import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { EPCOT_POI } from './epcotPOI';

// ============================================
// EPCOT — Unified Map Data
//
// Park center: 28.3747, -81.5494
// Layout: World Showcase Lagoon forms a semicircle in the north.
// World Celebration (Spaceship Earth) at south entrance.
// World Nature (The Land, The Seas) to the southwest.
// World Discovery (Test Track, Cosmic Rewind) to the southeast.
// World Showcase countries ring the lagoon clockwise from Mexico (west)
// through Canada (east).
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // South (entrance area)
  { id: 'w-entrance-epcot', x: 0.50, y: 0.92 },
  { id: 'w-celebration-hub', x: 0.50, y: 0.72 },
  // West (World Nature)
  { id: 'w-nature-hub', x: 0.32, y: 0.58 },
  // East (World Discovery)
  { id: 'w-discovery-hub', x: 0.68, y: 0.58 },
  // World Showcase promenade (clockwise from west)
  { id: 'w-ws-mexico', x: 0.27, y: 0.44 },
  { id: 'w-ws-norway', x: 0.33, y: 0.38 },
  { id: 'w-ws-china', x: 0.35, y: 0.32 },
  { id: 'w-ws-germany', x: 0.40, y: 0.26 },
  { id: 'w-ws-italy', x: 0.46, y: 0.22 },
  { id: 'w-ws-america', x: 0.50, y: 0.18 },
  { id: 'w-ws-japan', x: 0.56, y: 0.22 },
  { id: 'w-ws-morocco', x: 0.62, y: 0.26 },
  { id: 'w-ws-france', x: 0.60, y: 0.20 },
  { id: 'w-ws-uk', x: 0.66, y: 0.30 },
  { id: 'w-ws-canada', x: 0.70, y: 0.36 },
];

const EDGES: MapEdge[] = [
  // Main path: entrance -> celebration hub -> branches
  { from: 'entrance-main-epcot', to: 'w-entrance-epcot', weight: 1 },
  { from: 'w-entrance-epcot', to: 'w-celebration-hub', weight: 2 },
  { from: 'w-celebration-hub', to: 'w-nature-hub', weight: 2 },
  { from: 'w-celebration-hub', to: 'w-discovery-hub', weight: 2 },

  // World Nature to World Showcase entrance (west)
  { from: 'w-nature-hub', to: 'w-ws-mexico', weight: 2 },

  // World Discovery to World Showcase entrance (east)
  { from: 'w-discovery-hub', to: 'w-ws-canada', weight: 2 },

  // World Showcase promenade (clockwise loop)
  { from: 'w-ws-mexico', to: 'w-ws-norway', weight: 2 },
  { from: 'w-ws-norway', to: 'w-ws-china', weight: 2 },
  { from: 'w-ws-china', to: 'w-ws-germany', weight: 2 },
  { from: 'w-ws-germany', to: 'w-ws-italy', weight: 2 },
  { from: 'w-ws-italy', to: 'w-ws-america', weight: 2 },
  { from: 'w-ws-america', to: 'w-ws-japan', weight: 2 },
  { from: 'w-ws-japan', to: 'w-ws-morocco', weight: 2 },
  { from: 'w-ws-morocco', to: 'w-ws-france', weight: 2 },
  { from: 'w-ws-france', to: 'w-ws-uk', weight: 2 },
  { from: 'w-ws-uk', to: 'w-ws-canada', weight: 2 },

  // Ride connections — World Discovery
  { from: 'ride-cosmic-rewind', to: 'w-discovery-hub', weight: 1 },
  { from: 'ride-test-track', to: 'w-discovery-hub', weight: 1 },
  { from: 'ride-mission-space', to: 'w-discovery-hub', weight: 1 },

  // Ride connections — World Celebration
  { from: 'ride-spaceship-earth', to: 'w-entrance-epcot', weight: 1 },
  { from: 'ride-figment', to: 'w-celebration-hub', weight: 1 },

  // Ride connections — World Nature
  { from: 'ride-soarin', to: 'w-nature-hub', weight: 1 },
  { from: 'ride-living-with-the-land', to: 'w-nature-hub', weight: 1 },
  { from: 'ride-seas-nemo', to: 'w-nature-hub', weight: 1 },

  // Ride connections — World Showcase
  { from: 'ride-frozen-ever-after', to: 'w-ws-norway', weight: 1 },
  { from: 'ride-remys-ratatouille', to: 'w-ws-france', weight: 1 },
  { from: 'ride-gran-fiesta-tour', to: 'w-ws-mexico', weight: 1 },

  // Food connections
  { from: 'food-san-angel-inn', to: 'w-ws-mexico', weight: 1 },
  { from: 'food-akershus', to: 'w-ws-norway', weight: 1 },
  { from: 'food-nine-dragons', to: 'w-ws-china', weight: 1 },
  { from: 'food-biergarten', to: 'w-ws-germany', weight: 1 },
  { from: 'food-via-napoli', to: 'w-ws-italy', weight: 1 },
  { from: 'food-teppan-edo', to: 'w-ws-japan', weight: 1 },
  { from: 'food-spice-road-table', to: 'w-ws-morocco', weight: 1 },
  { from: 'food-les-halles', to: 'w-ws-france', weight: 1 },
  { from: 'food-rose-crown', to: 'w-ws-uk', weight: 1 },
  { from: 'food-le-cellier', to: 'w-ws-canada', weight: 1 },
  { from: 'food-space-220', to: 'w-discovery-hub', weight: 1 },
  { from: 'food-sunshine-seasons', to: 'w-nature-hub', weight: 1 },
  { from: 'food-connections-eatery', to: 'w-celebration-hub', weight: 1 },

  // Shop connections
  { from: 'shop-creations', to: 'w-celebration-hub', weight: 1 },
  { from: 'shop-mitsukoshi', to: 'w-ws-japan', weight: 1 },
  { from: 'shop-mouse-gear', to: 'w-discovery-hub', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-epcot', to: 'w-entrance-epcot', weight: 1 },
  { from: 'restroom-discovery-epcot', to: 'w-discovery-hub', weight: 1 },
  { from: 'restroom-nature-epcot', to: 'w-nature-hub', weight: 1 },
  { from: 'restroom-mexico-epcot', to: 'w-ws-mexico', weight: 1 },
  { from: 'restroom-america-epcot', to: 'w-ws-america', weight: 1 },
  { from: 'restroom-uk-epcot', to: 'w-ws-uk', weight: 1 },
  { from: 'service-first-aid-epcot', to: 'w-discovery-hub', weight: 1 },
  { from: 'service-guest-services-epcot', to: 'w-entrance-epcot', weight: 1 },
];

export const EPCOT_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'epcot',
  pois: EPCOT_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
