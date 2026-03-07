import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { BUSCH_GARDENS_TAMPA_POI } from './buschGardensTampaPOI';

// ============================================
// Busch Gardens Tampa Bay — Unified Map Data
//
// Park center: 28.0373, -82.4195
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-bgt', x: 0.18, y: 0.78 },
  { id: 'w-morocco', x: 0.22, y: 0.68 },
  { id: 'w-egypt-south', x: 0.28, y: 0.35 },
  { id: 'w-egypt-north', x: 0.28, y: 0.25 },
  { id: 'w-nairobi', x: 0.36, y: 0.50 },
  { id: 'w-congo', x: 0.42, y: 0.42 },
  { id: 'w-jungala', x: 0.45, y: 0.55 },
  { id: 'w-pantopia-south', x: 0.52, y: 0.38 },
  { id: 'w-pantopia-north', x: 0.52, y: 0.28 },
  { id: 'w-stanleyville', x: 0.62, y: 0.50 },
  { id: 'w-sesame', x: 0.72, y: 0.68 },
  { id: 'w-bird-gardens', x: 0.75, y: 0.72 },
];

const EDGES: MapEdge[] = [
  // Main path
  { from: 'entrance-main-bgt', to: 'w-entrance-bgt', weight: 1 },
  { from: 'w-entrance-bgt', to: 'w-morocco', weight: 2 },
  { from: 'w-morocco', to: 'w-egypt-south', weight: 2 },
  { from: 'w-morocco', to: 'w-nairobi', weight: 2 },
  { from: 'w-egypt-south', to: 'w-egypt-north', weight: 2 },
  { from: 'w-egypt-south', to: 'w-congo', weight: 2 },
  { from: 'w-nairobi', to: 'w-congo', weight: 2 },
  { from: 'w-nairobi', to: 'w-jungala', weight: 2 },
  { from: 'w-congo', to: 'w-pantopia-south', weight: 2 },
  { from: 'w-pantopia-south', to: 'w-pantopia-north', weight: 2 },
  { from: 'w-pantopia-south', to: 'w-stanleyville', weight: 2 },
  { from: 'w-jungala', to: 'w-stanleyville', weight: 2 },
  { from: 'w-stanleyville', to: 'w-sesame', weight: 2 },
  { from: 'w-sesame', to: 'w-bird-gardens', weight: 2 },
  { from: 'w-bird-gardens', to: 'w-morocco', weight: 2 },

  // Coaster connections
  { from: 'ride-iron-gwazi', to: 'w-pantopia-south', weight: 1 },
  { from: 'ride-sheikra', to: 'w-stanleyville', weight: 1 },
  { from: 'ride-montu', to: 'w-egypt-north', weight: 1 },
  { from: 'ride-kumba', to: 'w-congo', weight: 1 },
  { from: 'ride-cheetah-hunt', to: 'w-pantopia-north', weight: 1 },
  { from: 'ride-cobra-curse', to: 'w-egypt-south', weight: 1 },
  { from: 'ride-tigris', to: 'w-stanleyville', weight: 1 },
  { from: 'ride-scorpion', to: 'w-pantopia-south', weight: 1 },
  { from: 'ride-sand-serpent', to: 'w-pantopia-north', weight: 1 },
  { from: 'ride-air-grover', to: 'w-sesame', weight: 1 },

  // Thrill ride connections
  { from: 'ride-falcon-fury', to: 'w-pantopia-north', weight: 1 },
  { from: 'ride-congo-river-rapids', to: 'w-congo', weight: 1 },
  { from: 'ride-stanley-falls', to: 'w-stanleyville', weight: 1 },
  { from: 'ride-serengeti-flyer', to: 'w-nairobi', weight: 1 },
  { from: 'ride-jungle-flyers', to: 'w-jungala', weight: 1 },

  // Food connections
  { from: 'food-zambia-smokehouse', to: 'w-stanleyville', weight: 1 },
  { from: 'food-dragon-fire-grill', to: 'w-pantopia-south', weight: 1 },
  { from: 'food-zagoras-cafe', to: 'w-morocco', weight: 1 },
  { from: 'food-garden-gate-cafe', to: 'w-bird-gardens', weight: 1 },

  // Service connections
  { from: 'restroom-morocco', to: 'w-entrance-bgt', weight: 1 },
  { from: 'restroom-egypt', to: 'w-egypt-south', weight: 1 },
  { from: 'restroom-congo', to: 'w-congo', weight: 1 },
  { from: 'restroom-stanleyville', to: 'w-stanleyville', weight: 1 },
  { from: 'service-first-aid-bgt', to: 'w-nairobi', weight: 1 },
  { from: 'service-guest-services-bgt', to: 'w-entrance-bgt', weight: 1 },
];

export const BUSCH_GARDENS_TAMPA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'busch-gardens-tampa',
  pois: BUSCH_GARDENS_TAMPA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
