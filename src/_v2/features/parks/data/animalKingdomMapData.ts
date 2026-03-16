import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { ANIMAL_KINGDOM_POI } from './animalKingdomPOI';

// ============================================
// Disney's Animal Kingdom — Unified Map Data
//
// Park center: 28.3553, -81.5901
// Layout: Oasis entrance south, Tree of Life hub center,
// Pandora west, Africa northwest, Asia east, DinoLand southeast
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-ak', x: 0.50, y: 0.90 },
  { id: 'w-oasis', x: 0.50, y: 0.78 },
  { id: 'w-discovery-island', x: 0.50, y: 0.60 },
  { id: 'w-pandora', x: 0.30, y: 0.48 },
  { id: 'w-africa', x: 0.38, y: 0.35 },
  { id: 'w-asia', x: 0.65, y: 0.38 },
  { id: 'w-dinoland', x: 0.60, y: 0.60 },
];

const EDGES: MapEdge[] = [
  // Main path
  { from: 'entrance-main-ak', to: 'w-entrance-ak', weight: 1 },
  { from: 'w-entrance-ak', to: 'w-oasis', weight: 2 },
  { from: 'w-oasis', to: 'w-discovery-island', weight: 3 },

  // Hub connections
  { from: 'w-discovery-island', to: 'w-pandora', weight: 3 },
  { from: 'w-discovery-island', to: 'w-africa', weight: 2 },
  { from: 'w-discovery-island', to: 'w-asia', weight: 3 },
  { from: 'w-discovery-island', to: 'w-dinoland', weight: 2 },

  // Cross connections
  { from: 'w-africa', to: 'w-pandora', weight: 2 },
  { from: 'w-africa', to: 'w-asia', weight: 3 },
  { from: 'w-asia', to: 'w-dinoland', weight: 2 },

  // ---- Oasis connections ----
  { from: 'restroom-oasis-ak', to: 'w-oasis', weight: 1 },
  { from: 'service-guest-services-ak', to: 'w-entrance-ak', weight: 1 },

  // ---- Discovery Island connections ----
  { from: 'attraction-tree-of-life', to: 'w-discovery-island', weight: 1 },
  { from: 'ride-its-tough-to-be-a-bug', to: 'w-discovery-island', weight: 1 },
  { from: 'food-flame-tree-bbq', to: 'w-discovery-island', weight: 1 },
  { from: 'food-pizzafari', to: 'w-discovery-island', weight: 1 },
  { from: 'shop-island-mercantile', to: 'w-discovery-island', weight: 1 },
  { from: 'restroom-discovery-ak', to: 'w-discovery-island', weight: 1 },
  { from: 'service-first-aid-ak', to: 'w-discovery-island', weight: 1 },

  // ---- Pandora connections ----
  { from: 'ride-flight-of-passage', to: 'w-pandora', weight: 1 },
  { from: 'ride-navi-river-journey', to: 'w-pandora', weight: 1 },
  { from: 'food-satuli-canteen', to: 'w-pandora', weight: 1 },
  { from: 'food-pongu-pongu', to: 'w-pandora', weight: 1 },
  { from: 'restroom-pandora-ak', to: 'w-pandora', weight: 1 },

  // ---- Africa connections ----
  { from: 'ride-kilimanjaro-safaris', to: 'w-africa', weight: 1 },
  { from: 'ride-gorilla-falls', to: 'w-africa', weight: 1 },
  { from: 'attraction-festival-lion-king', to: 'w-africa', weight: 1 },
  { from: 'food-tusker-house', to: 'w-africa', weight: 1 },
  { from: 'food-harambe-market', to: 'w-africa', weight: 1 },
  { from: 'restroom-africa-ak', to: 'w-africa', weight: 1 },

  // ---- Asia connections ----
  { from: 'ride-expedition-everest', to: 'w-asia', weight: 1 },
  { from: 'ride-kali-river-rapids', to: 'w-asia', weight: 1 },
  { from: 'ride-feathered-friends', to: 'w-asia', weight: 1 },
  { from: 'ride-maharajah-trail', to: 'w-asia', weight: 1 },
  { from: 'food-yak-yeti', to: 'w-asia', weight: 1 },
  { from: 'restroom-asia-ak', to: 'w-asia', weight: 1 },

  // ---- DinoLand U.S.A. connections ----
  { from: 'ride-dinosaur', to: 'w-dinoland', weight: 1 },
  { from: 'ride-triceratop-spin', to: 'w-dinoland', weight: 1 },
  { from: 'show-finding-nemo', to: 'w-dinoland', weight: 1 },
  { from: 'food-restaurantosaurus', to: 'w-dinoland', weight: 1 },
  { from: 'restroom-dinoland-ak', to: 'w-dinoland', weight: 1 },
];

export const ANIMAL_KINGDOM_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'animal-kingdom',
  pois: ANIMAL_KINGDOM_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
