import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { DORNEY_PARK_POI } from './dorneyParkPOI';

// ============================================
// Dorney Park & Wildwater Kingdom — Unified Map Data
//
// Park center: 40.5784, -75.5332
// Layout: entrance at south, midway runs north through park,
// Steel Force area to the northwest, Talon/Hydra to the northeast,
// Planet Snoopy to the east, Iron Menace to the west.
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-dp', x: 0.28, y: 0.88 },
  { id: 'w-entrance-north', x: 0.32, y: 0.75 },
  { id: 'w-midway-south', x: 0.40, y: 0.62 },
  { id: 'w-midway-center', x: 0.48, y: 0.50 },
  { id: 'w-midway-north', x: 0.48, y: 0.38 },
  { id: 'w-talon-junction', x: 0.35, y: 0.35 },
  { id: 'w-hydra-junction', x: 0.30, y: 0.48 },
  { id: 'w-steel-force-area', x: 0.66, y: 0.30 },
  { id: 'w-iron-menace-area', x: 0.58, y: 0.42 },
  { id: 'w-snoopy-area', x: 0.72, y: 0.62 },
];

const EDGES: MapEdge[] = [
  // Main path: entrance -> midway -> north
  { from: 'entrance-main-dp', to: 'w-entrance-dp', weight: 1 },
  { from: 'w-entrance-dp', to: 'w-entrance-north', weight: 2 },
  { from: 'w-entrance-north', to: 'w-midway-south', weight: 2 },
  { from: 'w-midway-south', to: 'w-midway-center', weight: 2 },
  { from: 'w-midway-center', to: 'w-midway-north', weight: 2 },

  // Branch paths
  { from: 'w-midway-north', to: 'w-talon-junction', weight: 2 },
  { from: 'w-midway-north', to: 'w-steel-force-area', weight: 2 },
  { from: 'w-midway-center', to: 'w-hydra-junction', weight: 2 },
  { from: 'w-midway-center', to: 'w-iron-menace-area', weight: 2 },
  { from: 'w-midway-south', to: 'w-snoopy-area', weight: 3 },
  { from: 'w-hydra-junction', to: 'w-talon-junction', weight: 2 },
  { from: 'w-iron-menace-area', to: 'w-steel-force-area', weight: 2 },

  // Coaster connections
  { from: 'ride-steel-force', to: 'w-steel-force-area', weight: 1 },
  { from: 'ride-talon', to: 'w-talon-junction', weight: 1 },
  { from: 'ride-hydra-the-revenge', to: 'w-hydra-junction', weight: 1 },
  { from: 'ride-possessed', to: 'w-midway-center', weight: 1 },
  { from: 'ride-iron-menace', to: 'w-iron-menace-area', weight: 1 },
  { from: 'ride-thunderhawk', to: 'w-midway-north', weight: 1 },
  { from: 'ride-wild-mouse-dp', to: 'w-midway-center', weight: 1 },
  { from: 'ride-woodstocks-express-dp', to: 'w-snoopy-area', weight: 1 },

  // Thrill ride connections
  { from: 'ride-demon-drop', to: 'w-midway-center', weight: 1 },
  { from: 'ride-enterprise-dp', to: 'w-midway-center', weight: 1 },
  { from: 'ride-revolution-dp', to: 'w-midway-south', weight: 1 },
  { from: 'ride-monster-dp', to: 'w-midway-north', weight: 1 },
  { from: 'ride-whip-dp', to: 'w-midway-north', weight: 1 },
  { from: 'ride-scrambler-dp', to: 'w-midway-center', weight: 1 },
  { from: 'ride-music-express-dp', to: 'w-midway-center', weight: 1 },
  { from: 'ride-ferris-wheel-dp', to: 'w-entrance-north', weight: 1 },
  { from: 'ride-carousel-dp', to: 'w-entrance-north', weight: 1 },
  { from: 'ride-thunder-creek-mountain', to: 'w-steel-force-area', weight: 1 },
  { from: 'ride-white-water-landing', to: 'w-steel-force-area', weight: 1 },

  // Food connections
  { from: 'food-chickies-petes-dp', to: 'w-midway-south', weight: 1 },
  { from: 'food-monster-grille-dp', to: 'w-midway-center', weight: 1 },
  { from: 'food-patio-pizza-dp', to: 'w-midway-center', weight: 1 },
  { from: 'food-just-chicken-tacos-dp', to: 'w-midway-south', weight: 1 },
  { from: 'food-burger-barn-dp', to: 'w-steel-force-area', weight: 1 },
  { from: 'food-whitewater-tavern-dp', to: 'w-steel-force-area', weight: 1 },
  { from: 'food-suppertime-dp', to: 'w-snoopy-area', weight: 1 },
  { from: 'food-center-stage-snacks-dp', to: 'w-entrance-north', weight: 1 },

  // Shop connections
  { from: 'shop-main-gate-dp', to: 'w-entrance-dp', weight: 1 },
  { from: 'shop-steel-force-photos-dp', to: 'w-steel-force-area', weight: 1 },
  { from: 'shop-talon-gifts-dp', to: 'w-talon-junction', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-dp', to: 'w-entrance-dp', weight: 1 },
  { from: 'restroom-midway-dp', to: 'w-midway-center', weight: 1 },
  { from: 'restroom-steel-force-dp', to: 'w-steel-force-area', weight: 1 },
  { from: 'restroom-snoopy-dp', to: 'w-snoopy-area', weight: 1 },
  { from: 'service-first-aid-dp', to: 'w-midway-south', weight: 1 },
  { from: 'service-guest-services-dp', to: 'w-entrance-dp', weight: 1 },
];

export const DORNEY_PARK_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'dorney-park',
  pois: DORNEY_PARK_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
