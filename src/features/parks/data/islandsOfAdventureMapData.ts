import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { ISLANDS_OF_ADVENTURE_POI } from './islandsOfAdventurePOI';

// ============================================
// Universal Islands of Adventure — Unified Map Data
//
// Park center: 28.4722, -81.4687
// Layout: circular lagoon with themed islands around the perimeter
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-ioa', x: 0.12, y: 0.65 },
  { id: 'w-port-of-entry', x: 0.16, y: 0.58 },
  { id: 'w-marvel', x: 0.22, y: 0.42 },
  { id: 'w-toon-lagoon', x: 0.38, y: 0.25 },
  { id: 'w-skull-island', x: 0.55, y: 0.22 },
  { id: 'w-jurassic', x: 0.70, y: 0.28 },
  { id: 'w-hogsmeade', x: 0.82, y: 0.38 },
  { id: 'w-lost-continent', x: 0.75, y: 0.45 },
  { id: 'w-seuss', x: 0.88, y: 0.52 },
  { id: 'w-seuss-south', x: 0.85, y: 0.60 },
];

const EDGES: MapEdge[] = [
  // Main path (circular around lagoon)
  { from: 'entrance-main-ioa', to: 'w-entrance-ioa', weight: 1 },
  { from: 'w-entrance-ioa', to: 'w-port-of-entry', weight: 2 },
  { from: 'w-port-of-entry', to: 'w-marvel', weight: 2 },
  { from: 'w-marvel', to: 'w-toon-lagoon', weight: 2 },
  { from: 'w-toon-lagoon', to: 'w-skull-island', weight: 2 },
  { from: 'w-skull-island', to: 'w-jurassic', weight: 2 },
  { from: 'w-jurassic', to: 'w-hogsmeade', weight: 2 },
  { from: 'w-hogsmeade', to: 'w-lost-continent', weight: 2 },
  { from: 'w-lost-continent', to: 'w-seuss', weight: 2 },
  { from: 'w-seuss', to: 'w-seuss-south', weight: 2 },
  { from: 'w-seuss-south', to: 'w-port-of-entry', weight: 2 },

  // Coaster connections
  { from: 'ride-velocicoaster', to: 'w-jurassic', weight: 1 },
  { from: 'ride-hagrid', to: 'w-hogsmeade', weight: 1 },
  { from: 'ride-incredible-hulk', to: 'w-marvel', weight: 1 },
  { from: 'ride-flight-of-the-hippogriff-ioa', to: 'w-hogsmeade', weight: 1 },

  // Major ride connections
  { from: 'ride-harry-potter-forbidden-journey-ioa', to: 'w-hogsmeade', weight: 1 },
  { from: 'ride-spider-man', to: 'w-marvel', weight: 1 },
  { from: 'ride-jurassic-world', to: 'w-jurassic', weight: 1 },
  { from: 'ride-jurassic-river-adventure', to: 'w-jurassic', weight: 1 },
  { from: 'ride-popeyes-bilge-rat-barges', to: 'w-toon-lagoon', weight: 1 },
  { from: 'ride-dudley-do-right', to: 'w-toon-lagoon', weight: 1 },
  { from: 'ride-doctor-doom', to: 'w-marvel', weight: 1 },
  { from: 'ride-storm-force-accelatron', to: 'w-marvel', weight: 1 },
  { from: 'ride-skull-island-reign-of-kong', to: 'w-skull-island', weight: 1 },
  { from: 'ride-cat-in-the-hat', to: 'w-seuss', weight: 1 },
  { from: 'ride-one-fish-two-fish', to: 'w-seuss', weight: 1 },
  { from: 'ride-caro-seuss-el', to: 'w-seuss', weight: 1 },
  { from: 'ride-high-in-the-sky-trolley', to: 'w-seuss', weight: 1 },

  // Food connections
  { from: 'food-three-broomsticks', to: 'w-hogsmeade', weight: 1 },
  { from: 'food-hogs-head', to: 'w-hogsmeade', weight: 1 },
  { from: 'food-captain-americas-diner', to: 'w-marvel', weight: 1 },
  { from: 'food-cafe-4', to: 'w-marvel', weight: 1 },
  { from: 'food-thunder-falls-terrace', to: 'w-jurassic', weight: 1 },
  { from: 'food-blondies', to: 'w-toon-lagoon', weight: 1 },
  { from: 'food-fire-eaters-grill', to: 'w-lost-continent', weight: 1 },
  { from: 'food-circus-mcgurkus', to: 'w-seuss', weight: 1 },
  { from: 'food-confisco-grille', to: 'w-port-of-entry', weight: 1 },

  // Service connections
  { from: 'restroom-port-of-entry', to: 'w-port-of-entry', weight: 1 },
  { from: 'restroom-marvel', to: 'w-marvel', weight: 1 },
  { from: 'restroom-jurassic', to: 'w-jurassic', weight: 1 },
  { from: 'restroom-hogsmeade', to: 'w-hogsmeade', weight: 1 },
  { from: 'restroom-seuss', to: 'w-seuss', weight: 1 },
  { from: 'service-first-aid-ioa', to: 'w-lost-continent', weight: 1 },
  { from: 'service-guest-services-ioa', to: 'w-entrance-ioa', weight: 1 },
];

export const ISLANDS_OF_ADVENTURE_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'islands-of-adventure',
  pois: ISLANDS_OF_ADVENTURE_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
