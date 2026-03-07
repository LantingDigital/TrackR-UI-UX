import { ParkMapData } from '../types';

// ============================================
// Universal Islands of Adventure Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout (circular, clockwise from entrance):
// - Bottom: Port of Entry (entrance)
// - Left: Marvel Super Hero Island (Hulk, Spider-Man)
// - Top-left: Toon Lagoon (Dudley Do-Right, Popeye)
// - Top-center: Skull Island (Kong)
// - Top-right: Jurassic Park (VelociCoaster, River Adventure)
// - Right: Wizarding World of Harry Potter (Hagrid's, Forbidden Journey)
// - Bottom-right: The Lost Continent, Seuss Landing
// ============================================

export const ISLANDS_OF_ADVENTURE_MAP: ParkMapData = {
  parkSlug: 'islands-of-adventure',
  nodes: [
    { id: 'entrance-main', x: 0.12, y: 0.65, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-velocicoaster', x: 0.72, y: 0.25, type: 'ride', name: 'VelociCoaster', coasterId: 'velocicoaster' },
    { id: 'ride-hagrid', x: 0.82, y: 0.35, type: 'ride', name: "Hagrid's Motorbike Adventure", coasterId: 'hagrids-magical-creatures-motorbike-adventure' },
    { id: 'ride-hulk', x: 0.22, y: 0.38, type: 'ride', name: 'Incredible Hulk Coaster', coasterId: 'the-incredible-hulk-coaster' },
    { id: 'food-three-broomsticks', x: 0.78, y: 0.42, type: 'restaurant', name: 'Three Broomsticks' },
    { id: 'restroom-port', x: 0.14, y: 0.62, type: 'restroom' },
    { id: 'int-port-of-entry', x: 0.15, y: 0.58, type: 'intersection' },
    { id: 'int-marvel', x: 0.24, y: 0.42, type: 'intersection' },
    { id: 'int-toon-lagoon', x: 0.40, y: 0.25, type: 'intersection' },
    { id: 'int-skull-island', x: 0.55, y: 0.22, type: 'intersection' },
    { id: 'int-jurassic', x: 0.68, y: 0.28, type: 'intersection' },
    { id: 'int-hogsmeade', x: 0.80, y: 0.40, type: 'intersection' },
    { id: 'int-lost-continent', x: 0.74, y: 0.48, type: 'intersection' },
    { id: 'int-seuss', x: 0.88, y: 0.52, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-port-of-entry', weight: 1 },
    { from: 'int-port-of-entry', to: 'int-marvel', weight: 2 },
    { from: 'int-port-of-entry', to: 'int-seuss', weight: 2 },
    { from: 'int-marvel', to: 'int-toon-lagoon', weight: 2 },
    { from: 'int-toon-lagoon', to: 'int-skull-island', weight: 2 },
    { from: 'int-skull-island', to: 'int-jurassic', weight: 2 },
    { from: 'int-jurassic', to: 'int-hogsmeade', weight: 2 },
    { from: 'int-jurassic', to: 'ride-velocicoaster', weight: 1 },
    { from: 'int-hogsmeade', to: 'ride-hagrid', weight: 1 },
    { from: 'int-hogsmeade', to: 'food-three-broomsticks', weight: 1 },
    { from: 'int-hogsmeade', to: 'int-lost-continent', weight: 2 },
    { from: 'int-lost-continent', to: 'int-seuss', weight: 2 },
    { from: 'int-marvel', to: 'ride-hulk', weight: 1 },
    { from: 'restroom-port', to: 'int-port-of-entry', weight: 1 },
  ],
};
