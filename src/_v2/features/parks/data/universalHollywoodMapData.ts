import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { UNIVERSAL_HOLLYWOOD_POI } from './universalHollywoodPOI';

// ============================================
// Universal Studios Hollywood — Unified Map Data
//
// Park center: 34.1381, -118.3534
// Upper Lot and Lower Lot connected by Starway escalators
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Upper Lot
  { id: 'w-entrance-ush', x: 0.25, y: 0.55 },
  { id: 'w-upper-lot-west', x: 0.32, y: 0.45 },
  { id: 'w-upper-lot-center', x: 0.42, y: 0.40 },
  { id: 'w-springfield', x: 0.44, y: 0.36 },
  { id: 'w-studio-tour-area', x: 0.52, y: 0.50 },
  { id: 'w-wizarding-world-south', x: 0.65, y: 0.30 },
  { id: 'w-wizarding-world-north', x: 0.72, y: 0.24 },
  { id: 'w-nintendo-world', x: 0.80, y: 0.34 },
  { id: 'w-starway-upper', x: 0.50, y: 0.58 },

  // Lower Lot
  { id: 'w-starway-lower', x: 0.50, y: 0.65 },
  { id: 'w-lower-lot-center', x: 0.52, y: 0.70 },
  { id: 'w-jurassic-area', x: 0.60, y: 0.72 },
];

const EDGES: MapEdge[] = [
  // Entrance to Upper Lot
  { from: 'entrance-main-ush', to: 'w-entrance-ush', weight: 1 },
  { from: 'w-entrance-ush', to: 'w-upper-lot-west', weight: 2 },
  { from: 'w-upper-lot-west', to: 'w-upper-lot-center', weight: 2 },

  // Upper Lot paths
  { from: 'w-upper-lot-center', to: 'w-springfield', weight: 1 },
  { from: 'w-upper-lot-center', to: 'w-studio-tour-area', weight: 2 },
  { from: 'w-springfield', to: 'w-wizarding-world-south', weight: 2 },
  { from: 'w-wizarding-world-south', to: 'w-wizarding-world-north', weight: 2 },
  { from: 'w-wizarding-world-south', to: 'w-nintendo-world', weight: 2 },

  // Starway connection
  { from: 'w-studio-tour-area', to: 'w-starway-upper', weight: 1 },
  { from: 'w-starway-upper', to: 'w-starway-lower', weight: 3 },
  { from: 'service-starway-upper', to: 'w-starway-upper', weight: 1 },
  { from: 'service-starway-lower', to: 'w-starway-lower', weight: 1 },

  // Lower Lot
  { from: 'w-starway-lower', to: 'w-lower-lot-center', weight: 2 },
  { from: 'w-lower-lot-center', to: 'w-jurassic-area', weight: 2 },

  // Ride connections — Upper Lot
  { from: 'ride-harry-potter-forbidden-journey', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'ride-flight-of-the-hippogriff', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'ride-mario-kart-bowsers-challenge', to: 'w-nintendo-world', weight: 1 },
  { from: 'ride-despicable-me', to: 'w-upper-lot-west', weight: 1 },
  { from: 'ride-simpsons-ride', to: 'w-springfield', weight: 1 },
  { from: 'ride-secret-life-of-pets', to: 'w-upper-lot-west', weight: 1 },
  { from: 'ride-studio-tour', to: 'w-studio-tour-area', weight: 1 },
  { from: 'ride-kung-fu-panda', to: 'w-upper-lot-center', weight: 1 },
  { from: 'ride-fast-and-furious-drift', to: 'w-studio-tour-area', weight: 1 },

  // Ride connections — Lower Lot
  { from: 'ride-jurassic-world-the-ride', to: 'w-jurassic-area', weight: 1 },
  { from: 'ride-transformers', to: 'w-lower-lot-center', weight: 1 },
  { from: 'ride-revenge-of-the-mummy', to: 'w-lower-lot-center', weight: 1 },

  // Show connections
  { from: 'attraction-waterworld', to: 'w-upper-lot-west', weight: 2 },
  { from: 'attraction-raptor-encounter', to: 'w-jurassic-area', weight: 1 },
  { from: 'attraction-ollivanders', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'attraction-super-nintendo-activities', to: 'w-nintendo-world', weight: 1 },

  // Food connections
  { from: 'food-three-broomsticks', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'food-toadstool-cafe', to: 'w-nintendo-world', weight: 1 },
  { from: 'food-krusty-burger', to: 'w-springfield', weight: 1 },
  { from: 'food-moes-tavern', to: 'w-springfield', weight: 1 },
  { from: 'food-isla-nu-bar', to: 'w-jurassic-area', weight: 1 },
  { from: 'food-jurassic-cafe', to: 'w-jurassic-area', weight: 1 },
  { from: 'food-studio-commissary', to: 'w-upper-lot-center', weight: 1 },
  { from: 'food-starbucks-ush', to: 'w-upper-lot-west', weight: 1 },

  // Service connections
  { from: 'restroom-upper-lot-entrance', to: 'w-entrance-ush', weight: 1 },
  { from: 'restroom-upper-lot-center', to: 'w-upper-lot-center', weight: 1 },
  { from: 'restroom-wizarding-world', to: 'w-wizarding-world-south', weight: 1 },
  { from: 'restroom-lower-lot', to: 'w-lower-lot-center', weight: 1 },
  { from: 'service-first-aid-ush', to: 'w-entrance-ush', weight: 1 },
  { from: 'service-guest-services-ush', to: 'w-entrance-ush', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'attraction-dinoplay', to: 'w-jurassic-area', weight: 1 },
  { from: 'attraction-animal-actors', to: 'w-upper-lot-center', weight: 1 },
  { from: 'attraction-special-effects-show', to: 'w-upper-lot-west', weight: 1 },
  { from: 'food-hogs-head', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'food-lard-lad-donuts', to: 'w-springfield', weight: 1 },
  { from: 'food-minion-cafe', to: 'w-upper-lot-west', weight: 1 },
  { from: 'food-dippin-dots-ush', to: 'w-upper-lot-center', weight: 1 },
  { from: 'shop-universal-studio-store', to: 'w-entrance-ush', weight: 1 },
  { from: 'shop-honeydukes', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'shop-zonkos', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'shop-filchs-emporium', to: 'w-wizarding-world-north', weight: 1 },
  { from: 'shop-1-up-factory', to: 'w-nintendo-world', weight: 1 },
  { from: 'shop-kwik-e-mart', to: 'w-upper-lot-center', weight: 1 },
  { from: 'shop-jurassic-outfitters', to: 'w-jurassic-area', weight: 1 },
  { from: 'shop-feature-presentation', to: 'w-upper-lot-west', weight: 1 },
  { from: 'service-atm-ush', to: 'w-upper-lot-west', weight: 1 },
  { from: 'service-lockers-ush', to: 'w-upper-lot-west', weight: 1 },
];

export const UNIVERSAL_HOLLYWOOD_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'universal-studios-hollywood',
  pois: UNIVERSAL_HOLLYWOOD_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
