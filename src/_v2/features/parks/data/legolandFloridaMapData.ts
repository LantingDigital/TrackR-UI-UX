import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { LEGOLAND_FLORIDA_POI } from './legolandFloridaPOI';

// ============================================
// LEGOLAND Florida — Unified Map Data
//
// Park center: 27.9889, -81.6913
// Layout: 14+ themed areas built on former Cypress Gardens site
// Entrance at south, loop through themed areas
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Entrance / The Beginning
  { id: 'w-entrance-llf', x: 0.50, y: 0.92 },
  { id: 'w-beginning', x: 0.51, y: 0.85 },

  // Fun Town
  { id: 'w-fun-town', x: 0.47, y: 0.75 },

  // DUPLO Valley
  { id: 'w-duplo-valley', x: 0.56, y: 0.70 },

  // LEGO Galaxy
  { id: 'w-galaxy-llf', x: 0.61, y: 0.62 },

  // LEGO Kingdoms
  { id: 'w-kingdoms', x: 0.40, y: 0.55 },

  // Land of Adventure
  { id: 'w-adventure-llf', x: 0.29, y: 0.49 },

  // LEGO City
  { id: 'w-lego-city', x: 0.24, y: 0.37 },

  // LEGO Technic
  { id: 'w-technic', x: 0.30, y: 0.28 },

  // Imagination Zone
  { id: 'w-imagination-llf', x: 0.42, y: 0.33 },

  // LEGO NINJAGO World
  { id: 'w-ninjago-llf', x: 0.55, y: 0.31 },

  // LEGO Movie World
  { id: 'w-movie-world-llf', x: 0.65, y: 0.38 },

  // Heartlake City
  { id: 'w-heartlake-llf', x: 0.71, y: 0.50 },

  // Pirates' Cove
  { id: 'w-pirates-cove', x: 0.67, y: 0.59 },

  // Miniland USA
  { id: 'w-miniland-llf', x: 0.55, y: 0.50 },

  // Cypress Gardens
  { id: 'w-cypress-gardens', x: 0.65, y: 0.68 },
];

const EDGES: MapEdge[] = [
  // Main path from entrance
  { from: 'entrance-main-llf', to: 'w-entrance-llf', weight: 1 },
  { from: 'w-entrance-llf', to: 'w-beginning', weight: 1 },
  { from: 'w-beginning', to: 'w-fun-town', weight: 2 },
  { from: 'w-fun-town', to: 'w-duplo-valley', weight: 2 },
  { from: 'w-duplo-valley', to: 'w-galaxy-llf', weight: 2 },

  // Central spine
  { from: 'w-fun-town', to: 'w-kingdoms', weight: 2 },
  { from: 'w-kingdoms', to: 'w-miniland-llf', weight: 2 },
  { from: 'w-miniland-llf', to: 'w-heartlake-llf', weight: 2 },

  // West loop
  { from: 'w-kingdoms', to: 'w-adventure-llf', weight: 2 },
  { from: 'w-adventure-llf', to: 'w-lego-city', weight: 2 },
  { from: 'w-lego-city', to: 'w-technic', weight: 2 },
  { from: 'w-technic', to: 'w-imagination-llf', weight: 2 },

  // North loop
  { from: 'w-imagination-llf', to: 'w-ninjago-llf', weight: 2 },
  { from: 'w-ninjago-llf', to: 'w-movie-world-llf', weight: 2 },
  { from: 'w-movie-world-llf', to: 'w-heartlake-llf', weight: 2 },

  // East side
  { from: 'w-heartlake-llf', to: 'w-pirates-cove', weight: 2 },
  { from: 'w-pirates-cove', to: 'w-cypress-gardens', weight: 2 },
  { from: 'w-cypress-gardens', to: 'w-galaxy-llf', weight: 2 },
  { from: 'w-pirates-cove', to: 'w-miniland-llf', weight: 2 },

  // Cross connections
  { from: 'w-miniland-llf', to: 'w-ninjago-llf', weight: 3 },
  { from: 'w-galaxy-llf', to: 'w-miniland-llf', weight: 2 },

  // ---- The Beginning connections ----
  { from: 'attraction-legoland-story-llf', to: 'w-beginning', weight: 1 },
  { from: 'ride-island-in-the-sky-llf', to: 'w-beginning', weight: 1 },

  // ---- Fun Town connections ----
  { from: 'ride-grand-carousel-llf', to: 'w-fun-town', weight: 1 },
  { from: 'ride-factory-tour-llf', to: 'w-fun-town', weight: 1 },
  { from: 'food-fun-town-pizza-llf', to: 'w-fun-town', weight: 1 },
  { from: 'food-grannys-apple-fries-llf', to: 'w-fun-town', weight: 1 },
  { from: 'food-funnel-cake-llf', to: 'w-fun-town', weight: 1 },
  { from: 'shop-big-shop-llf', to: 'w-fun-town', weight: 1 },

  // ---- DUPLO Valley connections ----
  { from: 'ride-duplo-train-llf', to: 'w-duplo-valley', weight: 1 },
  { from: 'ride-duplo-tractor-llf', to: 'w-duplo-valley', weight: 1 },
  { from: 'ride-duplo-tot-spot-llf', to: 'w-duplo-valley', weight: 1 },

  // ---- LEGO Galaxy connections ----
  { from: 'ride-galacticoaster-llf', to: 'w-galaxy-llf', weight: 1 },
  { from: 'ride-galaxy-spin-llf', to: 'w-galaxy-llf', weight: 1 },
  { from: 'food-cosmic-bites-llf', to: 'w-galaxy-llf', weight: 1 },
  { from: 'shop-galactic-gear-llf', to: 'w-galaxy-llf', weight: 1 },

  // ---- LEGO Kingdoms connections ----
  { from: 'ride-the-dragon-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'ride-royal-joust-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'ride-merlin-challenge-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'ride-forestmens-hideout-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'food-dragons-den-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'food-kingdom-cones-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'shop-kingdoms-shop-llf', to: 'w-kingdoms', weight: 1 },

  // ---- Land of Adventure connections ----
  { from: 'ride-coastersaurus-llf', to: 'w-adventure-llf', weight: 1 },
  { from: 'ride-lost-kingdom-llf', to: 'w-adventure-llf', weight: 1 },
  { from: 'ride-beetle-bounce-llf', to: 'w-adventure-llf', weight: 1 },
  { from: 'ride-safari-trek-llf', to: 'w-adventure-llf', weight: 1 },
  { from: 'ride-pharaohs-revenge-llf', to: 'w-adventure-llf', weight: 1 },

  // ---- LEGO City connections ----
  { from: 'ride-driving-school-llf', to: 'w-lego-city', weight: 1 },
  { from: 'ride-jr-driving-school-llf', to: 'w-lego-city', weight: 1 },
  { from: 'ride-boating-school-llf', to: 'w-lego-city', weight: 1 },
  { from: 'ride-rescue-academy-llf', to: 'w-lego-city', weight: 1 },
  { from: 'ride-coast-guard-academy-llf', to: 'w-lego-city', weight: 1 },
  { from: 'ride-flying-school-llf', to: 'w-lego-city', weight: 1 },
  { from: 'food-kickn-chicken-llf', to: 'w-lego-city', weight: 1 },
  { from: 'food-burger-kitchen-llf', to: 'w-lego-city', weight: 1 },
  { from: 'food-firehouse-icecream-llf', to: 'w-lego-city', weight: 1 },
  { from: 'shop-city-shop-llf', to: 'w-lego-city', weight: 1 },

  // ---- LEGO Technic connections ----
  { from: 'ride-great-lego-race-llf', to: 'w-technic', weight: 1 },
  { from: 'ride-aquazone-wave-racers-llf', to: 'w-technic', weight: 1 },
  { from: 'ride-technicycle-llf', to: 'w-technic', weight: 1 },
  { from: 'shop-technic-shop-llf', to: 'w-technic', weight: 1 },

  // ---- Imagination Zone connections ----
  { from: 'ride-kid-power-towers-llf', to: 'w-imagination-llf', weight: 1 },
  { from: 'ride-build-n-test-llf', to: 'w-imagination-llf', weight: 1 },
  { from: 'ride-hero-factory-llf', to: 'w-imagination-llf', weight: 1 },

  // ---- LEGO NINJAGO World connections ----
  { from: 'ride-ninjago-the-ride-llf', to: 'w-ninjago-llf', weight: 1 },
  { from: 'ride-cole-rock-climb-llf', to: 'w-ninjago-llf', weight: 1 },
  { from: 'ride-zane-temple-build-llf', to: 'w-ninjago-llf', weight: 1 },
  { from: 'shop-wus-warehouse-llf', to: 'w-ninjago-llf', weight: 1 },

  // ---- LEGO Movie World connections ----
  { from: 'ride-masters-of-flight-llf', to: 'w-movie-world-llf', weight: 1 },
  { from: 'ride-unikittys-disco-drop-llf', to: 'w-movie-world-llf', weight: 1 },
  { from: 'ride-bennys-play-ship-llf', to: 'w-movie-world-llf', weight: 1 },
  { from: 'food-taco-everyday-llf', to: 'w-movie-world-llf', weight: 1 },

  // ---- Heartlake City connections ----
  { from: 'ride-mias-riding-adventure-llf', to: 'w-heartlake-llf', weight: 1 },
  { from: 'ride-heartlake-horse-llf', to: 'w-heartlake-llf', weight: 1 },
  { from: 'food-heartlake-pizza-llf', to: 'w-heartlake-llf', weight: 1 },

  // ---- Pirates' Cove connections ----
  { from: 'ride-pirate-river-quest-llf', to: 'w-pirates-cove', weight: 1 },
  { from: 'ride-battle-of-brickbeard-llf', to: 'w-pirates-cove', weight: 1 },

  // ---- Miniland USA connections ----
  { from: 'attraction-miniland-usa-llf', to: 'w-miniland-llf', weight: 1 },
  { from: 'attraction-star-wars-miniland-llf', to: 'w-miniland-llf', weight: 1 },

  // ---- Cypress Gardens connections ----
  { from: 'attraction-cypress-gardens-llf', to: 'w-cypress-gardens', weight: 1 },

  // ---- Service connections ----
  { from: 'restroom-entrance-llf', to: 'w-entrance-llf', weight: 1 },
  { from: 'restroom-fun-town-llf', to: 'w-fun-town', weight: 1 },
  { from: 'restroom-lego-city-llf', to: 'w-lego-city', weight: 1 },
  { from: 'restroom-kingdoms-llf', to: 'w-kingdoms', weight: 1 },
  { from: 'restroom-adventure-llf', to: 'w-adventure-llf', weight: 1 },
  { from: 'restroom-ninjago-llf', to: 'w-ninjago-llf', weight: 1 },
  { from: 'restroom-movie-world-llf', to: 'w-movie-world-llf', weight: 1 },
  { from: 'restroom-heartlake-llf', to: 'w-heartlake-llf', weight: 1 },
  { from: 'service-first-aid-llf', to: 'w-fun-town', weight: 1 },
  { from: 'service-guest-services-llf', to: 'w-entrance-llf', weight: 1 },
];

export const LEGOLAND_FLORIDA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'legoland-florida',
  pois: LEGOLAND_FLORIDA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
