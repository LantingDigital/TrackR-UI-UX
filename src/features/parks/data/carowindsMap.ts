import { ParkMapData } from '../types';

// ============================================
// Carowinds Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Main Entrance / Celebration Square
// - Left: Camp Snoopy (kids rides)
// - Left-center: Blue Ridge Junction (Copperhead Strike, Carolina Goldrusher)
// - Center: County Fair (Carolina Cyclone, Vortex, Hurler)
// - Right: Carolina Boardwalk (Fury 325, Thunder Striker, Afterburn)
// - Far right: Carolina Harbor waterpark
// ============================================

export const CAROWINDS_MAP: ParkMapData = {
  parkSlug: 'carowinds',
  nodes: [
    { id: 'entrance-main', x: 0.50, y: 0.85, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-fury-325', x: 0.65, y: 0.30, type: 'ride', name: 'Fury 325', coasterId: 'fury-325' },
    { id: 'ride-thunder-striker', x: 0.72, y: 0.45, type: 'ride', name: 'Thunder Striker', coasterId: 'intimidator-carowinds' },
    { id: 'ride-copperhead-strike', x: 0.35, y: 0.28, type: 'ride', name: 'Copperhead Strike', coasterId: 'copperhead-strike' },
    { id: 'food-harmony-hall', x: 0.52, y: 0.40, type: 'restaurant', name: 'Harmony Hall Marketplace' },
    { id: 'food-grannys-kitchen', x: 0.32, y: 0.32, type: 'restaurant', name: "Granny's Kitchen" },
    { id: 'restroom-entrance', x: 0.48, y: 0.78, type: 'restroom' },
    { id: 'restroom-boardwalk', x: 0.58, y: 0.40, type: 'restroom' },
    { id: 'int-entrance', x: 0.50, y: 0.82, type: 'intersection' },
    { id: 'int-main-plaza', x: 0.50, y: 0.68, type: 'intersection' },
    { id: 'int-celebration', x: 0.50, y: 0.44, type: 'intersection' },
    { id: 'int-county-fair', x: 0.42, y: 0.55, type: 'intersection' },
    { id: 'int-blue-ridge', x: 0.34, y: 0.35, type: 'intersection' },
    { id: 'int-camp-snoopy', x: 0.24, y: 0.48, type: 'intersection' },
    { id: 'int-boardwalk-west', x: 0.56, y: 0.38, type: 'intersection' },
    { id: 'int-boardwalk-east', x: 0.70, y: 0.42, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-plaza', weight: 2 },
    { from: 'int-main-plaza', to: 'int-celebration', weight: 2 },
    { from: 'int-celebration', to: 'int-county-fair', weight: 2 },
    { from: 'int-celebration', to: 'int-boardwalk-west', weight: 2 },
    { from: 'int-celebration', to: 'int-blue-ridge', weight: 2 },
    { from: 'int-county-fair', to: 'int-camp-snoopy', weight: 2 },
    { from: 'int-blue-ridge', to: 'int-camp-snoopy', weight: 2 },
    { from: 'int-boardwalk-west', to: 'int-boardwalk-east', weight: 2 },
    { from: 'ride-fury-325', to: 'int-boardwalk-west', weight: 1 },
    { from: 'ride-thunder-striker', to: 'int-boardwalk-east', weight: 1 },
    { from: 'ride-copperhead-strike', to: 'int-blue-ridge', weight: 1 },
    { from: 'food-harmony-hall', to: 'int-celebration', weight: 1 },
    { from: 'food-grannys-kitchen', to: 'int-blue-ridge', weight: 1 },
    { from: 'restroom-entrance', to: 'int-main-plaza', weight: 1 },
    { from: 'restroom-boardwalk', to: 'int-boardwalk-west', weight: 1 },
  ],
};
