import { ParkMapData } from '../types';

// ============================================
// Universal Studios Hollywood Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout (two-level park):
// - Left/Bottom: Main Entrance (from CityWalk)
// - Left: Upper Lot West (WaterWorld, Secret Life of Pets, Despicable Me)
// - Center: Upper Lot Center (Simpsons, Springfield, Studio Tour)
// - Right: Wizarding World of Harry Potter
// - Far right: Super Nintendo World
// - Center-bottom: Starway (escalators between lots)
// - Lower level: Lower Lot (Jurassic World, Transformers, Mummy)
// ============================================

export const UNIVERSAL_HOLLYWOOD_MAP: ParkMapData = {
  parkSlug: 'universal-studios-hollywood',
  nodes: [
    { id: 'entrance-main', x: 0.25, y: 0.55, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-harry-potter', x: 0.72, y: 0.25, type: 'ride', name: 'Forbidden Journey' },
    { id: 'ride-mario-kart', x: 0.82, y: 0.32, type: 'ride', name: "Mario Kart: Bowser's Challenge" },
    { id: 'ride-jurassic-world', x: 0.60, y: 0.72, type: 'ride', name: 'Jurassic World: The Ride' },
    { id: 'food-three-broomsticks', x: 0.74, y: 0.24, type: 'restaurant', name: 'Three Broomsticks' },
    { id: 'food-krusty-burger', x: 0.44, y: 0.36, type: 'restaurant', name: 'Krusty Burger' },
    { id: 'restroom-upper-entrance', x: 0.28, y: 0.52, type: 'restroom' },
    { id: 'restroom-lower', x: 0.52, y: 0.70, type: 'restroom' },
    { id: 'int-entrance', x: 0.25, y: 0.55, type: 'intersection' },
    { id: 'int-upper-west', x: 0.32, y: 0.45, type: 'intersection' },
    { id: 'int-upper-center', x: 0.42, y: 0.40, type: 'intersection' },
    { id: 'int-springfield', x: 0.44, y: 0.36, type: 'intersection' },
    { id: 'int-wizarding-south', x: 0.65, y: 0.30, type: 'intersection' },
    { id: 'int-wizarding-north', x: 0.72, y: 0.24, type: 'intersection' },
    { id: 'int-nintendo', x: 0.80, y: 0.34, type: 'intersection' },
    { id: 'int-starway-upper', x: 0.50, y: 0.58, type: 'intersection' },
    { id: 'int-starway-lower', x: 0.50, y: 0.65, type: 'intersection' },
    { id: 'int-lower-center', x: 0.52, y: 0.70, type: 'intersection' },
    { id: 'int-jurassic', x: 0.60, y: 0.72, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-upper-west', weight: 2 },
    { from: 'int-upper-west', to: 'int-upper-center', weight: 2 },
    { from: 'int-upper-center', to: 'int-springfield', weight: 1 },
    { from: 'int-upper-center', to: 'int-starway-upper', weight: 2 },
    { from: 'int-springfield', to: 'int-wizarding-south', weight: 2 },
    { from: 'int-wizarding-south', to: 'int-wizarding-north', weight: 2 },
    { from: 'int-wizarding-south', to: 'int-nintendo', weight: 2 },
    { from: 'int-starway-upper', to: 'int-starway-lower', weight: 3 },
    { from: 'int-starway-lower', to: 'int-lower-center', weight: 2 },
    { from: 'int-lower-center', to: 'int-jurassic', weight: 2 },
    { from: 'ride-harry-potter', to: 'int-wizarding-north', weight: 1 },
    { from: 'ride-mario-kart', to: 'int-nintendo', weight: 1 },
    { from: 'ride-jurassic-world', to: 'int-jurassic', weight: 1 },
    { from: 'food-three-broomsticks', to: 'int-wizarding-north', weight: 1 },
    { from: 'food-krusty-burger', to: 'int-springfield', weight: 1 },
    { from: 'restroom-upper-entrance', to: 'int-entrance', weight: 1 },
    { from: 'restroom-lower', to: 'int-lower-center', weight: 1 },
  ],
};
