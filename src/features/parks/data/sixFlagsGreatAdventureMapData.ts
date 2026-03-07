import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SIX_FLAGS_GREAT_ADVENTURE_POI } from './sixFlagsGreatAdventurePOI';

// ============================================
// Six Flags Great Adventure — Unified Map Data
//
// Park center: 40.1374, -74.4413
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-sfga', x: 0.38, y: 0.85 },
  { id: 'w-main-street', x: 0.40, y: 0.75 },
  { id: 'w-fantasy-forest', x: 0.22, y: 0.55 },
  { id: 'w-adventure-seeker', x: 0.32, y: 0.38 },
  { id: 'w-movietown-south', x: 0.42, y: 0.55 },
  { id: 'w-movietown-north', x: 0.42, y: 0.45 },
  { id: 'w-frontier-south', x: 0.50, y: 0.68 },
  { id: 'w-frontier-north', x: 0.50, y: 0.60 },
  { id: 'w-plaza-south', x: 0.58, y: 0.35 },
  { id: 'w-plaza-north', x: 0.58, y: 0.25 },
  { id: 'w-lakefront', x: 0.72, y: 0.45 },
  { id: 'w-safari-kids', x: 0.52, y: 0.72 },
];

const EDGES: MapEdge[] = [
  // Main spine
  { from: 'entrance-main-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'w-entrance-sfga', to: 'w-main-street', weight: 2 },
  { from: 'w-main-street', to: 'w-movietown-south', weight: 2 },
  { from: 'w-main-street', to: 'w-frontier-south', weight: 2 },

  // Fantasy Forest / Adventure Seeker branch
  { from: 'w-movietown-south', to: 'w-fantasy-forest', weight: 2 },
  { from: 'w-fantasy-forest', to: 'w-adventure-seeker', weight: 2 },
  { from: 'w-movietown-south', to: 'w-movietown-north', weight: 2 },
  { from: 'w-movietown-north', to: 'w-adventure-seeker', weight: 2 },

  // Frontier Adventures
  { from: 'w-frontier-south', to: 'w-frontier-north', weight: 2 },
  { from: 'w-frontier-south', to: 'w-safari-kids', weight: 2 },

  // Plaza del Carnaval
  { from: 'w-movietown-north', to: 'w-plaza-south', weight: 2 },
  { from: 'w-frontier-north', to: 'w-plaza-south', weight: 2 },
  { from: 'w-plaza-south', to: 'w-plaza-north', weight: 2 },

  // Lakefront
  { from: 'w-plaza-south', to: 'w-lakefront', weight: 2 },

  // Coaster connections
  { from: 'ride-kingda-ka', to: 'w-plaza-north', weight: 1 },
  { from: 'ride-el-toro', to: 'w-plaza-north', weight: 1 },
  { from: 'ride-nitro', to: 'w-adventure-seeker', weight: 1 },
  { from: 'ride-batman-the-ride', to: 'w-movietown-south', weight: 1 },
  { from: 'ride-medusa', to: 'w-lakefront', weight: 1 },
  { from: 'ride-jersey-devil-coaster', to: 'w-lakefront', weight: 1 },
  { from: 'ride-superman-ultimate-flight', to: 'w-adventure-seeker', weight: 1 },
  { from: 'ride-green-lantern', to: 'w-movietown-north', weight: 1 },
  { from: 'ride-the-joker', to: 'w-movietown-south', weight: 1 },
  { from: 'ride-the-dark-knight', to: 'w-movietown-north', weight: 1 },
  { from: 'ride-skull-mountain', to: 'w-adventure-seeker', weight: 1 },
  { from: 'ride-mine-train', to: 'w-frontier-north', weight: 1 },
  { from: 'ride-harley-quinn-crazy-train', to: 'w-safari-kids', weight: 1 },

  // Thrill ride connections
  { from: 'ride-zumanjaro', to: 'w-plaza-north', weight: 1 },
  { from: 'ride-wonder-woman-lasso', to: 'w-adventure-seeker', weight: 1 },
  { from: 'ride-log-flume', to: 'w-frontier-north', weight: 1 },
  { from: 'ride-congo-rapids', to: 'w-adventure-seeker', weight: 1 },
  { from: 'ride-justice-league', to: 'w-movietown-north', weight: 1 },

  // Food connections
  { from: 'food-best-of-the-west', to: 'w-frontier-north', weight: 1 },
  { from: 'food-panda-express-sfga', to: 'w-main-street', weight: 1 },
  { from: 'food-johnny-rockets-sfga', to: 'w-main-street', weight: 1 },
  { from: 'food-macho-nacho', to: 'w-plaza-south', weight: 1 },
  { from: 'food-lakefront-grill', to: 'w-lakefront', weight: 1 },

  // Service connections
  { from: 'restroom-main-street-sfga', to: 'w-main-street', weight: 1 },
  { from: 'restroom-movietown', to: 'w-movietown-south', weight: 1 },
  { from: 'restroom-frontier-sfga', to: 'w-frontier-north', weight: 1 },
  { from: 'restroom-plaza-sfga', to: 'w-plaza-south', weight: 1 },
  { from: 'service-first-aid-sfga', to: 'w-main-street', weight: 1 },
  { from: 'service-guest-services-sfga', to: 'w-entrance-sfga', weight: 1 },
];

export const SIX_FLAGS_GREAT_ADVENTURE_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'six-flags-great-adventure',
  pois: SIX_FLAGS_GREAT_ADVENTURE_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
