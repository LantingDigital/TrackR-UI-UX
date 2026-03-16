import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { CAROWINDS_POI } from './carowindsPOI';

// ============================================
// Carowinds — Unified Map Data
//
// Park center: 35.1040, -80.9420
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-cw', x: 0.50, y: 0.82 },
  { id: 'w-main-plaza', x: 0.50, y: 0.68 },
  { id: 'w-celebration-center', x: 0.50, y: 0.44 },
  { id: 'w-county-fair-west', x: 0.40, y: 0.55 },
  { id: 'w-county-fair-east', x: 0.48, y: 0.58 },
  { id: 'w-blue-ridge-south', x: 0.32, y: 0.38 },
  { id: 'w-blue-ridge-north', x: 0.34, y: 0.28 },
  { id: 'w-camp-snoopy-junction', x: 0.24, y: 0.48 },
  { id: 'w-boardwalk-west', x: 0.56, y: 0.38 },
  { id: 'w-boardwalk-center', x: 0.62, y: 0.35 },
  { id: 'w-boardwalk-east', x: 0.70, y: 0.42 },
];

const EDGES: MapEdge[] = [
  // Entrance to main plaza
  { from: 'entrance-main-cw', to: 'w-entrance-cw', weight: 1 },
  { from: 'w-entrance-cw', to: 'w-main-plaza', weight: 2 },
  { from: 'w-main-plaza', to: 'w-celebration-center', weight: 2 },

  // Celebration center branches
  { from: 'w-celebration-center', to: 'w-county-fair-west', weight: 2 },
  { from: 'w-celebration-center', to: 'w-boardwalk-west', weight: 2 },
  { from: 'w-celebration-center', to: 'w-blue-ridge-south', weight: 2 },

  // County Fair
  { from: 'w-county-fair-west', to: 'w-county-fair-east', weight: 2 },
  { from: 'w-county-fair-west', to: 'w-camp-snoopy-junction', weight: 2 },

  // Blue Ridge Junction
  { from: 'w-blue-ridge-south', to: 'w-blue-ridge-north', weight: 2 },
  { from: 'w-blue-ridge-south', to: 'w-camp-snoopy-junction', weight: 2 },

  // Boardwalk
  { from: 'w-boardwalk-west', to: 'w-boardwalk-center', weight: 2 },
  { from: 'w-boardwalk-center', to: 'w-boardwalk-east', weight: 2 },

  // Cross connections
  { from: 'w-county-fair-east', to: 'w-boardwalk-west', weight: 2 },

  // Coaster connections
  { from: 'ride-fury-325', to: 'w-boardwalk-center', weight: 1 },
  { from: 'ride-thunder-striker', to: 'w-boardwalk-east', weight: 1 },
  { from: 'ride-copperhead-strike', to: 'w-blue-ridge-north', weight: 1 },
  { from: 'ride-afterburn', to: 'w-boardwalk-west', weight: 1 },
  { from: 'ride-carolina-cyclone', to: 'w-county-fair-east', weight: 1 },
  { from: 'ride-vortex-cw', to: 'w-county-fair-west', weight: 1 },
  { from: 'ride-hurler', to: 'w-county-fair-east', weight: 1 },
  { from: 'ride-carolina-goldrusher', to: 'w-blue-ridge-south', weight: 1 },
  { from: 'ride-kiddy-hawk', to: 'w-camp-snoopy-junction', weight: 1 },
  { from: 'ride-woodstock-express-cw', to: 'w-camp-snoopy-junction', weight: 1 },
  { from: 'ride-snoopys-racing-railway', to: 'w-camp-snoopy-junction', weight: 1 },

  // Food connections
  { from: 'food-harmony-hall', to: 'w-celebration-center', weight: 1 },
  { from: 'food-panda-express-cw', to: 'w-county-fair-east', weight: 1 },
  { from: 'food-chickie-petes-cw', to: 'w-boardwalk-west', weight: 1 },
  { from: 'food-grannys-kitchen', to: 'w-blue-ridge-south', weight: 1 },
  { from: 'food-starbucks-cw', to: 'w-main-plaza', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-cw', to: 'w-main-plaza', weight: 1 },
  { from: 'restroom-county-fair', to: 'w-county-fair-west', weight: 1 },
  { from: 'restroom-boardwalk-cw', to: 'w-boardwalk-west', weight: 1 },
  { from: 'restroom-blue-ridge', to: 'w-blue-ridge-south', weight: 1 },
  { from: 'restroom-camp-snoopy-cw', to: 'w-camp-snoopy-junction', weight: 1 },
  { from: 'service-first-aid-cw', to: 'w-main-plaza', weight: 1 },
  { from: 'service-guest-services-cw', to: 'w-entrance-cw', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'ride-windseeker-cw', to: 'w-celebration-center', weight: 1 },
  { from: 'ride-electro-spin', to: 'w-county-fair-west', weight: 1 },
  { from: 'ride-zephyr', to: 'w-county-fair-west', weight: 1 },
  { from: 'ride-dodgem-cw', to: 'w-county-fair-west', weight: 1 },
  { from: 'ride-grand-carousel-cw', to: 'w-celebration-center', weight: 1 },
  { from: 'ride-charlie-browns-raft-blast', to: 'w-camp-snoopy-junction', weight: 1 },
  { from: 'ride-boo-blasters', to: 'w-county-fair-east', weight: 1 },
  { from: 'food-bier-fest-grill', to: 'w-celebration-center', weight: 1 },
  { from: 'food-brickhouse-bbq', to: 'w-blue-ridge-north', weight: 1 },
  { from: 'food-jukebox-diner', to: 'w-county-fair-west', weight: 1 },
  { from: 'food-dippin-dots-cw', to: 'w-boardwalk-center', weight: 1 },
  { from: 'shop-main-gate-gifts', to: 'w-entrance-cw', weight: 1 },
  { from: 'shop-fury-325-store', to: 'w-boardwalk-center', weight: 1 },
  { from: 'shop-camp-snoopy-store-cw', to: 'w-camp-snoopy-junction', weight: 1 },
  { from: 'shop-boardwalk-gifts-cw', to: 'w-boardwalk-west', weight: 1 },
  { from: 'attraction-carolina-harbor', to: 'w-boardwalk-east', weight: 1 },
  { from: 'attraction-celebration-stage', to: 'w-celebration-center', weight: 1 },
  { from: 'attraction-midway-games-cw', to: 'w-county-fair-west', weight: 1 },
  { from: 'service-atm-cw', to: 'w-entrance-cw', weight: 1 },
  { from: 'service-lockers-cw', to: 'w-entrance-cw', weight: 1 },
];

export const CAROWINDS_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'carowinds',
  pois: CAROWINDS_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
