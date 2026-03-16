import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { DOLLYWOOD_POI } from './dollywoodPOI';

// ============================================
// Dollywood — Unified Map Data
//
// Park center: 35.7953, -83.5310
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-dw', x: 0.25, y: 0.85 },
  { id: 'w-showstreet', x: 0.28, y: 0.72 },
  { id: 'w-imagination', x: 0.22, y: 0.60 },
  { id: 'w-jukebox', x: 0.35, y: 0.35 },
  { id: 'w-country-fair', x: 0.42, y: 0.52 },
  { id: 'w-timber-south', x: 0.52, y: 0.38 },
  { id: 'w-timber-north', x: 0.50, y: 0.28 },
  { id: 'w-wilderness', x: 0.62, y: 0.28 },
  { id: 'w-craftsmans-west', x: 0.68, y: 0.38 },
  { id: 'w-craftsmans-east', x: 0.75, y: 0.45 },
  { id: 'w-wildwood', x: 0.82, y: 0.52 },
];

const EDGES: MapEdge[] = [
  // Main path
  { from: 'entrance-main-dw', to: 'w-entrance-dw', weight: 1 },
  { from: 'w-entrance-dw', to: 'w-showstreet', weight: 2 },
  { from: 'w-showstreet', to: 'w-imagination', weight: 2 },
  { from: 'w-showstreet', to: 'w-jukebox', weight: 2 },
  { from: 'w-showstreet', to: 'w-country-fair', weight: 2 },
  { from: 'w-imagination', to: 'w-jukebox', weight: 2 },
  { from: 'w-jukebox', to: 'w-timber-north', weight: 2 },
  { from: 'w-country-fair', to: 'w-timber-south', weight: 2 },
  { from: 'w-timber-south', to: 'w-timber-north', weight: 2 },
  { from: 'w-timber-north', to: 'w-wilderness', weight: 2 },
  { from: 'w-timber-south', to: 'w-craftsmans-west', weight: 2 },
  { from: 'w-wilderness', to: 'w-craftsmans-west', weight: 2 },
  { from: 'w-craftsmans-west', to: 'w-craftsmans-east', weight: 2 },
  { from: 'w-craftsmans-east', to: 'w-wildwood', weight: 2 },

  // Coaster connections
  { from: 'ride-lightning-rod', to: 'w-jukebox', weight: 1 },
  { from: 'ride-wild-eagle', to: 'w-wilderness', weight: 1 },
  { from: 'ride-tennessee-tornado', to: 'w-craftsmans-east', weight: 1 },
  { from: 'ride-mystery-mine', to: 'w-timber-south', weight: 1 },
  { from: 'ride-thunderhead', to: 'w-timber-north', weight: 1 },
  { from: 'ride-firechaser-express', to: 'w-wilderness', weight: 1 },
  { from: 'ride-blazing-fury', to: 'w-craftsmans-west', weight: 1 },
  { from: 'ride-dragonflier', to: 'w-wildwood', weight: 1 },
  { from: 'ride-big-bear-mountain', to: 'w-wildwood', weight: 1 },

  // Thrill ride connections
  { from: 'ride-drop-line', to: 'w-timber-south', weight: 1 },
  { from: 'ride-barnstormer', to: 'w-country-fair', weight: 1 },
  { from: 'ride-river-rampage', to: 'w-craftsmans-west', weight: 1 },
  { from: 'ride-daredevil-falls', to: 'w-craftsmans-west', weight: 1 },
  { from: 'ride-treetop-tower', to: 'w-wildwood', weight: 1 },

  // Food connections
  { from: 'food-front-porch-cafe', to: 'w-showstreet', weight: 1 },
  { from: 'food-aunt-grannys', to: 'w-showstreet', weight: 1 },
  { from: 'food-hickory-house-bbq', to: 'w-craftsmans-west', weight: 1 },
  { from: 'food-red-rooster', to: 'w-jukebox', weight: 1 },
  { from: 'food-grannys-country-kitchen', to: 'w-country-fair', weight: 1 },
  { from: 'food-lumber-jacks-pizza', to: 'w-timber-south', weight: 1 },
  { from: 'food-till-and-harvest', to: 'w-wildwood', weight: 1 },

  // Service connections
  { from: 'restroom-showstreet', to: 'w-showstreet', weight: 1 },
  { from: 'restroom-timber-canyon', to: 'w-timber-south', weight: 1 },
  { from: 'restroom-craftsmans', to: 'w-craftsmans-east', weight: 1 },
  { from: 'restroom-wildwood', to: 'w-wildwood', weight: 1 },
  { from: 'service-first-aid-dw', to: 'w-entrance-dw', weight: 1 },
  { from: 'service-guest-services-dw', to: 'w-entrance-dw', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'ride-dizzy-disk', to: 'w-country-fair', weight: 1 },
  { from: 'ride-whistle-punk-chaser', to: 'w-timber-south', weight: 1 },
  { from: 'shop-showstreet-emporium', to: 'w-showstreet', weight: 1 },
  { from: 'shop-valley-wood-carvers', to: 'w-craftsmans-east', weight: 1 },
  { from: 'shop-dolly-closet', to: 'w-showstreet', weight: 1 },
  { from: 'attraction-dollys-home-on-wheels', to: 'w-entrance-dw', weight: 1 },
  { from: 'attraction-chasing-rainbows', to: 'w-showstreet', weight: 1 },
  { from: 'attraction-showstreet-palace', to: 'w-showstreet', weight: 1 },
  { from: 'attraction-back-porch-theater', to: 'w-imagination', weight: 1 },
];

export const DOLLYWOOD_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'dollywood',
  pois: DOLLYWOOD_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
