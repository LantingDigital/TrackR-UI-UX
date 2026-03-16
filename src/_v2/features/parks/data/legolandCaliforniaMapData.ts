import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { LEGOLAND_CALIFORNIA_POI } from './legolandCaliforniaPOI';

// ============================================
// LEGOLAND California — Unified Map Data
//
// Park center: 33.1264, -117.3115
// Layout: Rough loop with Miniland USA in center
// Entrance at south, LEGO Galaxy at northeast
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Entrance / Main Path
  { id: 'w-entrance-llc', x: 0.50, y: 0.88 },
  { id: 'w-main-south', x: 0.45, y: 0.75 },
  { id: 'w-main-center', x: 0.45, y: 0.55 },

  // LEGO City / Fun Town area
  { id: 'w-lego-city-east', x: 0.38, y: 0.50 },
  { id: 'w-lego-city-west', x: 0.30, y: 0.50 },

  // Pirate Shores
  { id: 'w-pirate-shores', x: 0.23, y: 0.40 },

  // Land of Adventure
  { id: 'w-adventure-north', x: 0.20, y: 0.55 },
  { id: 'w-adventure-south', x: 0.22, y: 0.60 },

  // Dino Valley
  { id: 'w-dino-valley', x: 0.30, y: 0.65 },

  // Heartlake City
  { id: 'w-heartlake', x: 0.42, y: 0.62 },

  // Miniland USA (center)
  { id: 'w-miniland', x: 0.50, y: 0.55 },

  // Imagination Zone
  { id: 'w-imagination', x: 0.50, y: 0.42 },

  // LEGO Movie World
  { id: 'w-movie-world', x: 0.42, y: 0.32 },

  // Castle Hill
  { id: 'w-castle-hill', x: 0.58, y: 0.30 },

  // NINJAGO World
  { id: 'w-ninjago', x: 0.65, y: 0.36 },

  // LEGO Galaxy
  { id: 'w-galaxy', x: 0.72, y: 0.24 },
];

const EDGES: MapEdge[] = [
  // Main loop path
  { from: 'entrance-main-llc', to: 'w-entrance-llc', weight: 1 },
  { from: 'w-entrance-llc', to: 'w-main-south', weight: 2 },
  { from: 'w-main-south', to: 'w-main-center', weight: 3 },
  { from: 'w-main-center', to: 'w-lego-city-east', weight: 2 },
  { from: 'w-lego-city-east', to: 'w-lego-city-west', weight: 2 },

  // West loop (Pirate Shores -> Adventure -> Dino Valley -> Heartlake)
  { from: 'w-lego-city-west', to: 'w-pirate-shores', weight: 2 },
  { from: 'w-pirate-shores', to: 'w-adventure-north', weight: 2 },
  { from: 'w-adventure-north', to: 'w-adventure-south', weight: 1 },
  { from: 'w-adventure-south', to: 'w-dino-valley', weight: 2 },
  { from: 'w-dino-valley', to: 'w-heartlake', weight: 2 },
  { from: 'w-heartlake', to: 'w-main-center', weight: 2 },

  // Center path through Miniland
  { from: 'w-main-center', to: 'w-miniland', weight: 1 },
  { from: 'w-miniland', to: 'w-imagination', weight: 2 },

  // North loop (Imagination -> Movie World -> Castle Hill -> NINJAGO -> Galaxy)
  { from: 'w-imagination', to: 'w-movie-world', weight: 2 },
  { from: 'w-movie-world', to: 'w-castle-hill', weight: 2 },
  { from: 'w-castle-hill', to: 'w-ninjago', weight: 2 },
  { from: 'w-ninjago', to: 'w-galaxy', weight: 2 },

  // Cross connections
  { from: 'w-castle-hill', to: 'w-imagination', weight: 2 },
  { from: 'w-ninjago', to: 'w-imagination', weight: 2 },

  // ---- LEGO Galaxy ride connections ----
  { from: 'ride-galacticoaster', to: 'w-galaxy', weight: 1 },
  { from: 'ride-galaxy-spin', to: 'w-galaxy', weight: 1 },
  { from: 'ride-space-flyer', to: 'w-galaxy', weight: 1 },
  { from: 'food-cosmic-bites', to: 'w-galaxy', weight: 1 },
  { from: 'shop-galactic-gear', to: 'w-galaxy', weight: 1 },

  // ---- Castle Hill ride connections ----
  { from: 'ride-the-dragon', to: 'w-castle-hill', weight: 1 },
  { from: 'ride-royal-joust', to: 'w-castle-hill', weight: 1 },
  { from: 'ride-merlin-challenge', to: 'w-castle-hill', weight: 1 },
  { from: 'ride-hideaways', to: 'w-castle-hill', weight: 1 },
  { from: 'food-knights-smokehouse', to: 'w-castle-hill', weight: 1 },
  { from: 'food-chicken-crown', to: 'w-castle-hill', weight: 1 },
  { from: 'food-pizza-pasta-buffet', to: 'w-castle-hill', weight: 1 },
  { from: 'shop-castle-shop', to: 'w-castle-hill', weight: 1 },

  // ---- NINJAGO World connections ----
  { from: 'ride-ninjago-the-ride', to: 'w-ninjago', weight: 1 },
  { from: 'ride-cole-rock-climb', to: 'w-ninjago', weight: 1 },
  { from: 'ride-zane-temple-build', to: 'w-ninjago', weight: 1 },
  { from: 'shop-wus-warehouse', to: 'w-ninjago', weight: 1 },

  // ---- LEGO Movie World connections ----
  { from: 'ride-emmets-flying-adventure', to: 'w-movie-world', weight: 1 },
  { from: 'ride-unikittys-disco-drop', to: 'w-movie-world', weight: 1 },
  { from: 'ride-bennys-play-ship', to: 'w-movie-world', weight: 1 },
  { from: 'food-everything-is-ramen', to: 'w-movie-world', weight: 1 },

  // ---- Imagination Zone connections ----
  { from: 'ride-lego-technic-coaster', to: 'w-imagination', weight: 1 },
  { from: 'ride-bionicle-blaster', to: 'w-imagination', weight: 1 },
  { from: 'ride-aquazone-wave-racers', to: 'w-imagination', weight: 1 },
  { from: 'ride-build-n-test', to: 'w-imagination', weight: 1 },
  { from: 'food-pizza-pit-stop', to: 'w-imagination', weight: 1 },

  // ---- LEGO City connections ----
  { from: 'ride-driving-school', to: 'w-lego-city-east', weight: 1 },
  { from: 'ride-jr-driving-school', to: 'w-lego-city-east', weight: 1 },
  { from: 'ride-police-helicopter', to: 'w-lego-city-east', weight: 1 },
  { from: 'ride-coast-cruise', to: 'w-lego-city-west', weight: 1 },
  { from: 'ride-skipper-school', to: 'w-lego-city-west', weight: 1 },
  { from: 'food-burger-stop', to: 'w-lego-city-east', weight: 1 },
  { from: 'food-fun-town-market', to: 'w-lego-city-east', weight: 1 },
  { from: 'food-grannys-apple-fries', to: 'w-lego-city-east', weight: 1 },
  { from: 'shop-lego-factory-tour', to: 'w-lego-city-east', weight: 1 },
  { from: 'shop-big-shop', to: 'w-lego-city-east', weight: 1 },
  { from: 'shop-city-shop', to: 'w-lego-city-east', weight: 1 },

  // ---- Pirate Shores connections ----
  { from: 'ride-pirate-reef', to: 'w-pirate-shores', weight: 1 },
  { from: 'ride-splash-battle', to: 'w-pirate-shores', weight: 1 },
  { from: 'ride-treasure-falls', to: 'w-pirate-shores', weight: 1 },
  { from: 'food-burger-kitchen', to: 'w-pirate-shores', weight: 1 },

  // ---- Land of Adventure connections ----
  { from: 'ride-lost-kingdom', to: 'w-adventure-north', weight: 1 },
  { from: 'ride-beetle-bounce', to: 'w-adventure-north', weight: 1 },
  { from: 'ride-cargo-ace', to: 'w-adventure-south', weight: 1 },
  { from: 'ride-safari-trek', to: 'w-adventure-south', weight: 1 },

  // ---- Dino Valley connections ----
  { from: 'ride-coastersaurus', to: 'w-dino-valley', weight: 1 },
  { from: 'ride-dino-coaster', to: 'w-dino-valley', weight: 1 },
  { from: 'ride-dig-those-dinos', to: 'w-dino-valley', weight: 1 },
  { from: 'shop-dino-shop', to: 'w-dino-valley', weight: 1 },

  // ---- Heartlake City connections ----
  { from: 'ride-heartlake-horse', to: 'w-heartlake', weight: 1 },
  { from: 'ride-heartlake-express', to: 'w-heartlake', weight: 1 },
  { from: 'food-heartlake-pizza', to: 'w-heartlake', weight: 1 },

  // ---- Miniland USA connections ----
  { from: 'attraction-miniland-usa', to: 'w-miniland', weight: 1 },
  { from: 'attraction-star-wars-miniland', to: 'w-miniland', weight: 1 },

  // ---- Service connections ----
  { from: 'restroom-entrance-llc', to: 'w-entrance-llc', weight: 1 },
  { from: 'restroom-castle-hill', to: 'w-castle-hill', weight: 1 },
  { from: 'restroom-ninjago', to: 'w-ninjago', weight: 1 },
  { from: 'restroom-pirate-shores', to: 'w-pirate-shores', weight: 1 },
  { from: 'restroom-imagination', to: 'w-imagination', weight: 1 },
  { from: 'restroom-dino-valley', to: 'w-dino-valley', weight: 1 },
  { from: 'restroom-adventure', to: 'w-adventure-north', weight: 1 },
  { from: 'service-first-aid', to: 'w-main-center', weight: 1 },
  { from: 'service-guest-services', to: 'w-entrance-llc', weight: 1 },
];

export const LEGOLAND_CALIFORNIA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'legoland-california',
  pois: LEGOLAND_CALIFORNIA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
