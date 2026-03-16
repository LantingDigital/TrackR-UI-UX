import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { CEDAR_POINT_POI } from './cedarPointPOI';

// ============================================
// Cedar Point — Unified Map Data
//
// Combines:
// - POIs from cedarPointPOI.ts (rendered as markers)
// - Walkway intersection nodes (pathfinding only, not rendered)
// - Edges connecting POIs <-> walkway nodes
//
// Park center: 41.4817, -82.6835
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance', x: 0.15, y: 0.62 },
  { id: 'w-main-midway-south', x: 0.24, y: 0.55 },
  { id: 'w-main-midway-center', x: 0.32, y: 0.45 },
  { id: 'w-main-midway-north', x: 0.34, y: 0.38 },
  { id: 'w-boardwalk-south', x: 0.20, y: 0.42 },
  { id: 'w-boardwalk-north', x: 0.18, y: 0.32 },
  { id: 'w-celebration-plaza', x: 0.40, y: 0.32 },
  { id: 'w-kiddy-kingdom', x: 0.48, y: 0.52 },
  { id: 'w-gemini-junction', x: 0.56, y: 0.36 },
  { id: 'w-frontier-west', x: 0.60, y: 0.44 },
  { id: 'w-frontier-center', x: 0.66, y: 0.48 },
  { id: 'w-frontier-east', x: 0.74, y: 0.52 },
  { id: 'w-millennium-island', x: 0.80, y: 0.42 },
  { id: 'w-maverick-area', x: 0.86, y: 0.50 },
  { id: 'w-magnum-area', x: 0.62, y: 0.28 },
];

const EDGES: MapEdge[] = [
  // Entrance to main midway
  { from: 'entrance-main-cp', to: 'w-entrance', weight: 1 },
  { from: 'w-entrance', to: 'w-main-midway-south', weight: 2 },

  // Main midway spine
  { from: 'w-main-midway-south', to: 'w-main-midway-center', weight: 2 },
  { from: 'w-main-midway-center', to: 'w-main-midway-north', weight: 2 },

  // Boardwalk branch
  { from: 'w-main-midway-center', to: 'w-boardwalk-south', weight: 2 },
  { from: 'w-boardwalk-south', to: 'w-boardwalk-north', weight: 2 },

  // Celebration Plaza
  { from: 'w-main-midway-north', to: 'w-celebration-plaza', weight: 2 },

  // To Kiddy Kingdom
  { from: 'w-main-midway-center', to: 'w-kiddy-kingdom', weight: 2 },

  // Gemini Midway
  { from: 'w-celebration-plaza', to: 'w-gemini-junction', weight: 2 },
  { from: 'w-gemini-junction', to: 'w-magnum-area', weight: 2 },

  // Frontier Town path
  { from: 'w-gemini-junction', to: 'w-frontier-west', weight: 2 },
  { from: 'w-kiddy-kingdom', to: 'w-frontier-west', weight: 2 },
  { from: 'w-frontier-west', to: 'w-frontier-center', weight: 2 },
  { from: 'w-frontier-center', to: 'w-frontier-east', weight: 2 },

  // Millennium / Maverick area
  { from: 'w-frontier-east', to: 'w-millennium-island', weight: 2 },
  { from: 'w-millennium-island', to: 'w-maverick-area', weight: 2 },
  { from: 'w-magnum-area', to: 'w-millennium-island', weight: 2 },

  // Coaster connections
  { from: 'ride-steel-vengeance', to: 'w-frontier-east', weight: 1 },
  { from: 'ride-millennium-force', to: 'w-millennium-island', weight: 1 },
  { from: 'ride-maverick', to: 'w-maverick-area', weight: 1 },
  { from: 'ride-top-thrill-2', to: 'w-magnum-area', weight: 1 },
  { from: 'ride-valravn', to: 'w-celebration-plaza', weight: 1 },
  { from: 'ride-raptor', to: 'w-main-midway-north', weight: 1 },
  { from: 'ride-gatekeeper', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-rougarou', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-magnum-xl-200', to: 'w-magnum-area', weight: 1 },
  { from: 'ride-gemini', to: 'w-gemini-junction', weight: 1 },
  { from: 'ride-blue-streak', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-corkscrew', to: 'w-celebration-plaza', weight: 1 },
  { from: 'ride-cedar-creek-mine-ride', to: 'w-frontier-center', weight: 1 },
  { from: 'ride-iron-dragon', to: 'w-gemini-junction', weight: 1 },
  { from: 'ride-wild-mouse', to: 'w-boardwalk-south', weight: 1 },
  { from: 'ride-sirens-curse', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-woodstock-express', to: 'w-kiddy-kingdom', weight: 1 },
  { from: 'ride-wilderness-run', to: 'w-kiddy-kingdom', weight: 1 },

  // Thrill ride connections
  { from: 'ride-power-tower', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-maxair', to: 'w-celebration-plaza', weight: 1 },
  { from: 'ride-skyhawk', to: 'w-frontier-center', weight: 1 },
  { from: 'ride-windseeker', to: 'w-celebration-plaza', weight: 1 },
  { from: 'ride-snake-river-falls', to: 'w-frontier-center', weight: 1 },
  { from: 'ride-thunder-canyon', to: 'w-frontier-east', weight: 1 },

  // Food connections
  { from: 'food-grand-pavilion', to: 'w-boardwalk-north', weight: 1 },
  { from: 'food-hugos', to: 'w-main-midway-south', weight: 1 },
  { from: 'food-backbeat-que', to: 'w-frontier-center', weight: 1 },
  { from: 'food-panda-express-cp', to: 'w-main-midway-center', weight: 1 },
  { from: 'food-starbucks-cp', to: 'w-main-midway-south', weight: 1 },

  // Service connections
  { from: 'restroom-main-midway', to: 'w-main-midway-south', weight: 1 },
  { from: 'restroom-frontier-town', to: 'w-frontier-center', weight: 1 },
  { from: 'restroom-boardwalk-cp', to: 'w-boardwalk-south', weight: 1 },
  { from: 'restroom-gemini-midway', to: 'w-gemini-junction', weight: 1 },
  { from: 'service-first-aid-cp', to: 'w-main-midway-south', weight: 1 },
  { from: 'service-guest-services-cp', to: 'w-entrance', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'ride-giant-wheel', to: 'w-main-midway-north', weight: 1 },
  { from: 'ride-pipe-scream', to: 'w-boardwalk-south', weight: 1 },
  { from: 'ride-matterhorn', to: 'w-kiddy-kingdom', weight: 1 },
  { from: 'ride-ocean-motion', to: 'w-boardwalk-south', weight: 1 },
  { from: 'ride-monster', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-dodgem', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-midway-carousel', to: 'w-main-midway-center', weight: 1 },
  { from: 'ride-cedar-downs', to: 'w-frontier-west', weight: 1 },
  { from: 'ride-super-himalaya', to: 'w-frontier-west', weight: 1 },
  { from: 'ride-sky-ride', to: 'w-gemini-junction', weight: 1 },
  { from: 'food-miss-keats-smokehouse', to: 'w-frontier-east', weight: 1 },
  { from: 'food-chickie-petes', to: 'w-main-midway-center', weight: 1 },
  { from: 'food-coasters-drive-in', to: 'w-main-midway-center', weight: 1 },
  { from: 'food-red-garter-saloon', to: 'w-frontier-center', weight: 1 },
  { from: 'food-johnny-rockets-cp', to: 'w-boardwalk-north', weight: 1 },
  { from: 'food-famous-daves', to: 'w-frontier-center', weight: 1 },
  { from: 'food-dippin-dots-cp', to: 'w-main-midway-north', weight: 1 },
  { from: 'food-frontier-inn', to: 'w-frontier-west', weight: 1 },
  { from: 'shop-main-gift-shop-cp', to: 'w-main-midway-south', weight: 1 },
  { from: 'shop-frontier-trading-post', to: 'w-frontier-center', weight: 1 },
  { from: 'shop-steel-vengeance-shop', to: 'w-frontier-east', weight: 1 },
  { from: 'shop-gatekeeper-shop', to: 'w-main-midway-south', weight: 1 },
  { from: 'shop-boardwalk-gifts', to: 'w-boardwalk-south', weight: 1 },
  { from: 'attraction-lake-erie-eagles', to: 'w-boardwalk-north', weight: 1 },
  { from: 'attraction-cp-shores-entrance', to: 'w-magnum-area', weight: 1 },
  { from: 'attraction-games-midway', to: 'w-main-midway-center', weight: 1 },
  { from: 'attraction-jack-aldrich-theater', to: 'w-kiddy-kingdom', weight: 1 },
  { from: 'attraction-luminosity-stage', to: 'w-celebration-plaza', weight: 1 },
  { from: 'service-atm-main-cp', to: 'w-main-midway-south', weight: 1 },
  { from: 'service-lockers-cp', to: 'w-entrance', weight: 1 },
];

export const CEDAR_POINT_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'cedar-point',
  pois: CEDAR_POINT_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
