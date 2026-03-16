import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { BUSCH_GARDENS_WILLIAMSBURG_POI } from './buschGardensWilliamsburgPOI';

// ============================================
// Busch Gardens Williamsburg — Unified Map Data
//
// Park center: 37.2340, -76.6454
// Williamsburg, Virginia
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-bgw', x: 0.42, y: 0.86 },
  { id: 'w-england-center', x: 0.43, y: 0.75 },
  { id: 'w-england-north', x: 0.42, y: 0.65 },
  { id: 'w-scotland-south', x: 0.35, y: 0.55 },
  { id: 'w-scotland-center', x: 0.30, y: 0.48 },
  { id: 'w-france-south', x: 0.38, y: 0.38 },
  { id: 'w-france-center', x: 0.36, y: 0.32 },
  { id: 'w-italy-south', x: 0.52, y: 0.28 },
  { id: 'w-italy-center', x: 0.54, y: 0.22 },
  { id: 'w-germany-south', x: 0.60, y: 0.45 },
  { id: 'w-germany-center', x: 0.64, y: 0.42 },
  { id: 'w-oktoberfest-center', x: 0.70, y: 0.52 },
  { id: 'w-sesame-center', x: 0.76, y: 0.62 },
  { id: 'w-ireland-center', x: 0.18, y: 0.55 },
  { id: 'w-new-france-center', x: 0.22, y: 0.45 },
  { id: 'w-central-crossroads', x: 0.45, y: 0.50 },
];

const EDGES: MapEdge[] = [
  // Entrance to England
  { from: 'entrance-main-bgw', to: 'w-entrance-bgw', weight: 1 },
  { from: 'w-entrance-bgw', to: 'w-england-center', weight: 2 },
  { from: 'w-england-center', to: 'w-england-north', weight: 2 },

  // England to central crossroads
  { from: 'w-england-north', to: 'w-central-crossroads', weight: 2 },

  // Central crossroads branches
  { from: 'w-central-crossroads', to: 'w-scotland-south', weight: 2 },
  { from: 'w-central-crossroads', to: 'w-france-south', weight: 2 },
  { from: 'w-central-crossroads', to: 'w-germany-south', weight: 2 },

  // Scotland path
  { from: 'w-scotland-south', to: 'w-scotland-center', weight: 2 },
  { from: 'w-scotland-center', to: 'w-ireland-center', weight: 2 },
  { from: 'w-scotland-center', to: 'w-new-france-center', weight: 2 },

  // Ireland / New France
  { from: 'w-ireland-center', to: 'w-new-france-center', weight: 2 },

  // France path
  { from: 'w-france-south', to: 'w-france-center', weight: 2 },
  { from: 'w-france-center', to: 'w-italy-south', weight: 2 },

  // Italy path
  { from: 'w-italy-south', to: 'w-italy-center', weight: 2 },

  // Germany path
  { from: 'w-germany-south', to: 'w-germany-center', weight: 2 },
  { from: 'w-germany-center', to: 'w-oktoberfest-center', weight: 2 },

  // Oktoberfest to Sesame
  { from: 'w-oktoberfest-center', to: 'w-sesame-center', weight: 2 },

  // Cross connections
  { from: 'w-italy-south', to: 'w-germany-south', weight: 2 },
  { from: 'w-france-center', to: 'w-scotland-center', weight: 3 },

  // ---- POI connections to nearest walkway node ----

  // Roller coasters
  { from: 'ride-pantheon', to: 'w-italy-center', weight: 1 },
  { from: 'ride-apollos-chariot', to: 'w-italy-center', weight: 1 },
  { from: 'ride-griffon', to: 'w-france-south', weight: 1 },
  { from: 'ride-alpengeist', to: 'w-germany-center', weight: 1 },
  { from: 'ride-verbolten', to: 'w-germany-center', weight: 1 },
  { from: 'ride-loch-ness-monster', to: 'w-scotland-center', weight: 1 },
  { from: 'ride-invadr', to: 'w-new-france-center', weight: 1 },
  { from: 'ride-tempesto', to: 'w-italy-south', weight: 1 },
  { from: 'ride-darkoaster', to: 'w-oktoberfest-center', weight: 1 },
  { from: 'ride-glissade', to: 'w-france-center', weight: 1 },
  { from: 'ride-grovers-alpine-express', to: 'w-sesame-center', weight: 1 },

  // Thrill rides
  { from: 'ride-escape-from-pompeii', to: 'w-italy-center', weight: 1 },
  { from: 'ride-roman-rapids', to: 'w-italy-south', weight: 1 },
  { from: 'ride-battle-for-eire', to: 'w-ireland-center', weight: 1 },
  { from: 'ride-le-scoot', to: 'w-france-south', weight: 1 },
  { from: 'ride-mach-tower', to: 'w-germany-south', weight: 1 },
  { from: 'ride-trade-wind', to: 'w-scotland-south', weight: 1 },
  { from: 'ride-finnegans-flyer', to: 'w-ireland-center', weight: 1 },

  // Family rides
  { from: 'ride-kinder-karussel', to: 'w-oktoberfest-center', weight: 1 },
  { from: 'ride-ses-oscar-grouchland', to: 'w-sesame-center', weight: 1 },
  { from: 'ride-ses-big-bird-flyers', to: 'w-sesame-center', weight: 1 },

  // Food
  { from: 'food-trapper-smokehouse', to: 'w-new-france-center', weight: 1 },
  { from: 'food-squires-grille', to: 'w-england-center', weight: 1 },
  { from: 'food-das-festhaus', to: 'w-oktoberfest-center', weight: 1 },
  { from: 'food-ristorante-italiano', to: 'w-italy-center', weight: 1 },
  { from: 'food-le-bistro', to: 'w-france-center', weight: 1 },
  { from: 'food-highland-steer', to: 'w-scotland-center', weight: 1 },
  { from: 'food-grogan-grille', to: 'w-ireland-center', weight: 1 },
  { from: 'food-marco-polos-marketplace', to: 'w-italy-south', weight: 1 },
  { from: 'food-starbucks-bgw', to: 'w-england-center', weight: 1 },
  { from: 'food-funnel-cake-bgw', to: 'w-france-center', weight: 1 },

  // Services
  { from: 'restroom-england', to: 'w-entrance-bgw', weight: 1 },
  { from: 'restroom-france', to: 'w-france-south', weight: 1 },
  { from: 'restroom-germany', to: 'w-germany-center', weight: 1 },
  { from: 'restroom-italy', to: 'w-italy-center', weight: 1 },
  { from: 'restroom-ireland', to: 'w-ireland-center', weight: 1 },
  { from: 'restroom-sesame', to: 'w-sesame-center', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-england-emporium', to: 'w-england-center', weight: 1 },
  { from: 'shop-italy-gifts', to: 'w-italy-center', weight: 1 },
  { from: 'shop-germany-gifts', to: 'w-germany-south', weight: 1 },
  { from: 'shop-scotland-gifts', to: 'w-scotland-center', weight: 1 },
  { from: 'shop-sesame-store', to: 'w-sesame-center', weight: 1 },
  { from: 'show-globe-theatre', to: 'w-england-center', weight: 1 },
  { from: 'show-das-festhaus-show', to: 'w-oktoberfest-center', weight: 1 },
  { from: 'show-sesame-street-show', to: 'w-sesame-center', weight: 1 },
  { from: 'attraction-wolf-valley', to: 'w-ireland-center', weight: 1 },
  { from: 'attraction-eagle-ridge', to: 'w-new-france-center', weight: 1 },
  { from: 'service-first-aid-bgw', to: 'w-entrance-bgw', weight: 1 },
  { from: 'service-guest-relations-bgw', to: 'w-entrance-bgw', weight: 1 },
  { from: 'service-quick-queue-bgw', to: 'w-entrance-bgw', weight: 1 },
  { from: 'service-atm-england', to: 'w-entrance-bgw', weight: 1 },
  { from: 'service-atm-germany', to: 'w-oktoberfest-center', weight: 1 },
  { from: 'service-lockers-entrance-bgw', to: 'w-entrance-bgw', weight: 1 },
];

export const BUSCH_GARDENS_WILLIAMSBURG_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'busch-gardens-williamsburg',
  pois: BUSCH_GARDENS_WILLIAMSBURG_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
