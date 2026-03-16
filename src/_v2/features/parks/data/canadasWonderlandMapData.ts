import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { CANADAS_WONDERLAND_POI } from './canadasWonderlandPOI';

// ============================================
// Canada's Wonderland — Unified Map Data
//
// Park center: 43.8424, -79.5414
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-cw', x: 0.50, y: 0.88 },
  { id: 'w-international-street', x: 0.50, y: 0.68 },
  { id: 'w-hub-cw', x: 0.50, y: 0.50 },
  { id: 'w-medieval-faire', x: 0.32, y: 0.35 },
  { id: 'w-frontier-canada', x: 0.70, y: 0.35 },
  { id: 'w-alpenfest', x: 0.50, y: 0.32 },
  { id: 'w-wonder-mountain', x: 0.50, y: 0.38 },
  { id: 'w-action-zone', x: 0.64, y: 0.48 },
  { id: 'w-planet-snoopy', x: 0.40, y: 0.60 },
  { id: 'w-kidzville', x: 0.56, y: 0.58 },
];

const EDGES: MapEdge[] = [
  // Main paths
  { from: 'entrance-main-cw', to: 'w-entrance-cw', weight: 1 },
  { from: 'w-entrance-cw', to: 'w-international-street', weight: 2 },
  { from: 'w-international-street', to: 'w-hub-cw', weight: 2 },
  { from: 'w-hub-cw', to: 'w-medieval-faire', weight: 2 },
  { from: 'w-hub-cw', to: 'w-wonder-mountain', weight: 2 },
  { from: 'w-hub-cw', to: 'w-action-zone', weight: 2 },
  { from: 'w-wonder-mountain', to: 'w-alpenfest', weight: 2 },
  { from: 'w-alpenfest', to: 'w-medieval-faire', weight: 2 },
  { from: 'w-alpenfest', to: 'w-frontier-canada', weight: 2 },
  { from: 'w-action-zone', to: 'w-frontier-canada', weight: 2 },
  { from: 'w-hub-cw', to: 'w-planet-snoopy', weight: 2 },
  { from: 'w-hub-cw', to: 'w-kidzville', weight: 2 },
  { from: 'w-planet-snoopy', to: 'w-medieval-faire', weight: 2 },

  // Coaster connections
  { from: 'ride-leviathan', to: 'w-medieval-faire', weight: 1 },
  { from: 'ride-yukon-striker', to: 'w-frontier-canada', weight: 1 },
  { from: 'ride-behemoth', to: 'w-medieval-faire', weight: 1 },
  { from: 'ride-alpenfury', to: 'w-alpenfest', weight: 1 },
  { from: 'ride-the-bat', to: 'w-action-zone', weight: 1 },
  { from: 'ride-vortex-cw', to: 'w-hub-cw', weight: 1 },
  { from: 'ride-wilde-beast', to: 'w-medieval-faire', weight: 1 },
  { from: 'ride-mighty-canadian-minebuster', to: 'w-frontier-canada', weight: 1 },
  { from: 'ride-time-warp', to: 'w-action-zone', weight: 1 },
  { from: 'ride-backlot-stunt-coaster', to: 'w-action-zone', weight: 1 },
  { from: 'ride-flight-deck', to: 'w-action-zone', weight: 1 },
  { from: 'ride-dragon-fyre', to: 'w-medieval-faire', weight: 1 },
  { from: 'ride-wonder-mountain-guardian', to: 'w-wonder-mountain', weight: 1 },
  { from: 'ride-silver-streak', to: 'w-planet-snoopy', weight: 1 },
  { from: 'ride-ghoster-coaster', to: 'w-planet-snoopy', weight: 1 },
  { from: 'ride-thunder-run', to: 'w-wonder-mountain', weight: 1 },
  { from: 'ride-snoopys-racing-railway', to: 'w-planet-snoopy', weight: 1 },
  { from: 'ride-taxi-jam', to: 'w-kidzville', weight: 1 },

  // Ride connections
  { from: 'ride-windseeker-cw', to: 'w-hub-cw', weight: 1 },
  { from: 'ride-drop-tower-cw', to: 'w-action-zone', weight: 1 },
  { from: 'ride-shockwave-cw', to: 'w-action-zone', weight: 1 },

  // Food connections
  { from: 'food-mountain-lodge-grill', to: 'w-frontier-canada', weight: 1 },
  { from: 'food-medieval-fayre-food', to: 'w-medieval-faire', weight: 1 },
  { from: 'food-alpine-haus', to: 'w-alpenfest', weight: 1 },
  { from: 'food-international-eats', to: 'w-international-street', weight: 1 },
  { from: 'food-lazy-bear-lodge', to: 'w-frontier-canada', weight: 1 },
  { from: 'food-grande-world-eatery', to: 'w-action-zone', weight: 1 },
  { from: 'food-tiny-tom-donuts', to: 'w-international-street', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-cw', to: 'w-entrance-cw', weight: 1 },
  { from: 'restroom-medieval-cw', to: 'w-medieval-faire', weight: 1 },
  { from: 'restroom-action-zone-cw', to: 'w-action-zone', weight: 1 },
  { from: 'restroom-frontier-cw', to: 'w-frontier-canada', weight: 1 },
  { from: 'service-first-aid-cw', to: 'w-entrance-cw', weight: 1 },
  { from: 'service-guest-services-cw', to: 'w-entrance-cw', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-wonder-store', to: 'w-international-street', weight: 1 },
];

export const CANADAS_WONDERLAND_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'canadas-wonderland',
  pois: CANADAS_WONDERLAND_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
