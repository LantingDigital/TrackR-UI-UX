import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { MAGIC_KINGDOM_POI } from './magicKingdomPOI';

// ============================================
// Walt Disney World Magic Kingdom — Unified Map Data
//
// Park center: 28.4177, -81.5812
// Layout: hub-and-spoke from Cinderella Castle
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-mk', x: 0.48, y: 0.88 },
  { id: 'w-main-street', x: 0.48, y: 0.68 },
  { id: 'w-hub', x: 0.48, y: 0.45 },
  { id: 'w-adventureland', x: 0.28, y: 0.50 },
  { id: 'w-frontierland', x: 0.22, y: 0.32 },
  { id: 'w-liberty-square', x: 0.35, y: 0.30 },
  { id: 'w-fantasyland-west', x: 0.48, y: 0.28 },
  { id: 'w-fantasyland-east', x: 0.58, y: 0.20 },
  { id: 'w-tomorrowland-south', x: 0.68, y: 0.40 },
  { id: 'w-tomorrowland-north', x: 0.75, y: 0.30 },
];

const EDGES: MapEdge[] = [
  // Main path (hub-and-spoke)
  { from: 'entrance-main-mk', to: 'w-entrance-mk', weight: 1 },
  { from: 'w-entrance-mk', to: 'w-main-street', weight: 2 },
  { from: 'w-main-street', to: 'w-hub', weight: 2 },
  // Hub spokes
  { from: 'w-hub', to: 'w-adventureland', weight: 2 },
  { from: 'w-hub', to: 'w-liberty-square', weight: 2 },
  { from: 'w-hub', to: 'w-fantasyland-west', weight: 2 },
  { from: 'w-hub', to: 'w-tomorrowland-south', weight: 2 },
  // Cross connections
  { from: 'w-adventureland', to: 'w-frontierland', weight: 2 },
  { from: 'w-frontierland', to: 'w-liberty-square', weight: 2 },
  { from: 'w-liberty-square', to: 'w-fantasyland-west', weight: 2 },
  { from: 'w-fantasyland-west', to: 'w-fantasyland-east', weight: 2 },
  { from: 'w-tomorrowland-south', to: 'w-tomorrowland-north', weight: 2 },
  { from: 'w-fantasyland-east', to: 'w-tomorrowland-north', weight: 2 },

  // Coaster connections
  { from: 'ride-space-mountain', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-tron-lightcycle', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-big-thunder-mountain', to: 'w-frontierland', weight: 1 },
  { from: 'ride-seven-dwarfs', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-barnstormer-mk', to: 'w-fantasyland-east', weight: 1 },

  // Major ride connections
  { from: 'ride-pirates-caribbean', to: 'w-adventureland', weight: 1 },
  { from: 'ride-jungle-cruise', to: 'w-adventureland', weight: 1 },
  { from: 'ride-splash-mountain', to: 'w-frontierland', weight: 1 },
  { from: 'ride-haunted-mansion', to: 'w-liberty-square', weight: 1 },
  { from: 'ride-its-a-small-world', to: 'w-fantasyland-west', weight: 1 },
  { from: 'ride-peter-pans-flight', to: 'w-fantasyland-west', weight: 1 },
  { from: 'ride-buzz-lightyear', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'ride-tomorrowland-speedway', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-people-mover', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'ride-dumbo', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-magic-carpets', to: 'w-adventureland', weight: 1 },
  { from: 'ride-under-the-sea', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-mad-tea-party', to: 'w-fantasyland-west', weight: 1 },
  { from: 'ride-prince-charming-regal-carrousel', to: 'w-fantasyland-west', weight: 1 },

  // Food connections
  { from: 'food-be-our-guest', to: 'w-fantasyland-east', weight: 1 },
  { from: 'food-cosmic-rays', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'food-pecos-bills', to: 'w-frontierland', weight: 1 },
  { from: 'food-columbia-harbour-house', to: 'w-liberty-square', weight: 1 },
  { from: 'food-aloha-isle', to: 'w-adventureland', weight: 1 },
  { from: 'food-casey-corner', to: 'w-main-street', weight: 1 },
  { from: 'food-sleepy-hollow', to: 'w-liberty-square', weight: 1 },
  { from: 'food-main-street-bakery', to: 'w-main-street', weight: 1 },

  // Theater / attraction connections
  { from: 'attraction-cinderella-castle', to: 'w-hub', weight: 1 },
  { from: 'attraction-country-bear-jamboree', to: 'w-frontierland', weight: 1 },
  { from: 'attraction-enchanted-tiki-room', to: 'w-adventureland', weight: 1 },
  { from: 'attraction-hall-of-presidents', to: 'w-liberty-square', weight: 1 },
  { from: 'attraction-mickeys-philharmagic', to: 'w-fantasyland-west', weight: 1 },

  // Service connections
  { from: 'restroom-main-street-mk', to: 'w-main-street', weight: 1 },
  { from: 'restroom-adventureland', to: 'w-adventureland', weight: 1 },
  { from: 'restroom-fantasyland', to: 'w-fantasyland-east', weight: 1 },
  { from: 'restroom-tomorrowland', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'restroom-frontierland', to: 'w-frontierland', weight: 1 },
  { from: 'service-first-aid-mk', to: 'w-main-street', weight: 1 },
  { from: 'service-guest-services-mk', to: 'w-entrance-mk', weight: 1 },
];

export const MAGIC_KINGDOM_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'magic-kingdom',
  pois: MAGIC_KINGDOM_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
