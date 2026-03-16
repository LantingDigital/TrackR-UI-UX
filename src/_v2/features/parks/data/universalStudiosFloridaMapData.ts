import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { UNIVERSAL_STUDIOS_FLORIDA_POI } from './universalStudiosFloridaPOI';

// ============================================
// Universal Studios Florida — Unified Map Data
//
// Park center: 28.4752, -81.4670
// Layout: clockwise loop through themed areas around central lagoon
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Entrance / Production Central
  { id: 'w-entrance-usf', x: 0.22, y: 0.82 },
  { id: 'w-production-central', x: 0.28, y: 0.70 },
  { id: 'w-minion-land', x: 0.26, y: 0.75 },

  // New York
  { id: 'w-new-york-south', x: 0.35, y: 0.58 },
  { id: 'w-new-york-north', x: 0.38, y: 0.48 },

  // San Francisco
  { id: 'w-san-francisco', x: 0.48, y: 0.40 },

  // Diagon Alley / London
  { id: 'w-london', x: 0.55, y: 0.30 },
  { id: 'w-diagon-alley', x: 0.58, y: 0.28 },

  // World Expo / Springfield
  { id: 'w-world-expo', x: 0.68, y: 0.44 },
  { id: 'w-springfield', x: 0.72, y: 0.50 },

  // DreamWorks Land / Hollywood
  { id: 'w-dreamworks', x: 0.80, y: 0.62 },
  { id: 'w-hollywood', x: 0.84, y: 0.72 },
  { id: 'w-hollywood-south', x: 0.82, y: 0.78 },
];

const EDGES: MapEdge[] = [
  // Main path (clockwise loop)
  { from: 'entrance-main-usf', to: 'w-entrance-usf', weight: 1 },
  { from: 'w-entrance-usf', to: 'w-minion-land', weight: 2 },
  { from: 'w-minion-land', to: 'w-production-central', weight: 2 },
  { from: 'w-production-central', to: 'w-new-york-south', weight: 2 },
  { from: 'w-new-york-south', to: 'w-new-york-north', weight: 2 },
  { from: 'w-new-york-north', to: 'w-san-francisco', weight: 2 },
  { from: 'w-san-francisco', to: 'w-london', weight: 2 },
  { from: 'w-london', to: 'w-diagon-alley', weight: 1 },
  { from: 'w-london', to: 'w-world-expo', weight: 2 },
  { from: 'w-world-expo', to: 'w-springfield', weight: 2 },
  { from: 'w-springfield', to: 'w-dreamworks', weight: 2 },
  { from: 'w-dreamworks', to: 'w-hollywood', weight: 2 },
  { from: 'w-hollywood', to: 'w-hollywood-south', weight: 1 },
  { from: 'w-hollywood-south', to: 'w-entrance-usf', weight: 3 },

  // Production Central ride connections
  { from: 'ride-villain-con-minion-blast', to: 'w-minion-land', weight: 1 },
  { from: 'ride-despicable-me-usf', to: 'w-minion-land', weight: 1 },
  { from: 'ride-fast-and-furious-drift-usf', to: 'w-production-central', weight: 1 },

  // New York ride connections
  { from: 'ride-revenge-of-the-mummy-usf', to: 'w-new-york-north', weight: 1 },
  { from: 'ride-transformers-usf', to: 'w-new-york-south', weight: 1 },
  { from: 'ride-race-through-new-york', to: 'w-new-york-north', weight: 1 },

  // San Francisco ride connections
  { from: 'ride-fast-and-furious-supercharged', to: 'w-san-francisco', weight: 1 },

  // Diagon Alley ride connections
  { from: 'ride-escape-from-gringotts', to: 'w-diagon-alley', weight: 1 },
  { from: 'ride-hogwarts-express-kings-cross', to: 'w-london', weight: 1 },

  // World Expo / Springfield ride connections
  { from: 'ride-men-in-black', to: 'w-world-expo', weight: 1 },
  { from: 'ride-simpsons-ride-usf', to: 'w-springfield', weight: 1 },
  { from: 'ride-kang-and-kodos', to: 'w-springfield', weight: 1 },

  // DreamWorks / Hollywood ride connections
  { from: 'ride-et-adventure', to: 'w-dreamworks', weight: 1 },
  { from: 'ride-dreamworks-trolls', to: 'w-dreamworks', weight: 1 },

  // Show connections
  { from: 'attraction-bourne-stuntacular', to: 'w-hollywood', weight: 1 },
  { from: 'attraction-horror-makeup-show', to: 'w-new-york-south', weight: 1 },
  { from: 'attraction-animal-actors-usf', to: 'w-dreamworks', weight: 1 },

  // Food connections
  { from: 'food-leaky-cauldron', to: 'w-diagon-alley', weight: 1 },
  { from: 'food-florean-fortescues', to: 'w-diagon-alley', weight: 1 },
  { from: 'food-finnegans', to: 'w-new-york-north', weight: 1 },
  { from: 'food-lombards', to: 'w-san-francisco', weight: 1 },
  { from: 'food-krusty-burger-usf', to: 'w-springfield', weight: 1 },
  { from: 'food-moes-tavern-usf', to: 'w-springfield', weight: 1 },
  { from: 'food-lard-lad-donuts-usf', to: 'w-springfield', weight: 1 },
  { from: 'food-london-taxi-hut', to: 'w-london', weight: 1 },
  { from: 'food-mels-drive-in', to: 'w-hollywood', weight: 1 },
  { from: 'food-minions-cafe-usf', to: 'w-minion-land', weight: 1 },
  { from: 'food-central-park-crepes', to: 'w-hollywood', weight: 1 },
  { from: 'food-starbucks-usf', to: 'w-new-york-south', weight: 1 },

  // Service connections
  { from: 'restroom-production-central', to: 'w-minion-land', weight: 1 },
  { from: 'restroom-new-york', to: 'w-new-york-south', weight: 1 },
  { from: 'restroom-san-francisco', to: 'w-san-francisco', weight: 1 },
  { from: 'restroom-diagon-alley', to: 'w-london', weight: 1 },
  { from: 'restroom-springfield-usf', to: 'w-springfield', weight: 1 },
  { from: 'restroom-dreamworks-land', to: 'w-dreamworks', weight: 1 },
  { from: 'service-first-aid-usf', to: 'w-new-york-south', weight: 1 },
  { from: 'service-guest-services-usf', to: 'w-entrance-usf', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-weasleys-wizard-wheezes', to: 'w-diagon-alley', weight: 1 },
  { from: 'shop-ollivanders-usf', to: 'w-diagon-alley', weight: 1 },
  { from: 'shop-borgin-and-burkes', to: 'w-diagon-alley', weight: 1 },
  { from: 'shop-quality-quidditch', to: 'w-diagon-alley', weight: 1 },
  { from: 'shop-universal-studios-store-usf', to: 'w-entrance-usf', weight: 1 },
  { from: 'shop-kwik-e-mart-usf', to: 'w-springfield', weight: 1 },
  { from: 'shop-supply-vault', to: 'w-production-central', weight: 1 },
];

export const UNIVERSAL_STUDIOS_FLORIDA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'universal-studios-florida',
  pois: UNIVERSAL_STUDIOS_FLORIDA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
