import { ParkMapData } from '../types';

// ============================================
// Hersheypark Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-left: Chocolatetown (entrance, Candymonium)
// - Left-center: Founders Way
// - Center: Kissing Tower Hill (Laff Trakk, Kissing Tower)
// - Center: The Hollow (Fahrenheit, Jolly Rancher Remix)
// - Center-right: Midway America (Great Bear, Storm Runner, Wildcat's Revenge)
// - Right: Pioneer Frontier (Skyrush, Lightning Racer, Comet)
// ============================================

export const HERSHEYPARK_MAP: ParkMapData = {
  parkSlug: 'hersheypark',
  nodes: [
    { id: 'entrance-main', x: 0.20, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-candymonium', x: 0.25, y: 0.75, type: 'ride', name: 'Candymonium', coasterId: 'candymonium' },
    { id: 'ride-skyrush', x: 0.72, y: 0.25, type: 'ride', name: 'Skyrush', coasterId: 'skyrush' },
    { id: 'ride-fahrenheit', x: 0.55, y: 0.40, type: 'ride', name: 'Fahrenheit', coasterId: 'fahrenheit' },
    { id: 'food-chocolatier', x: 0.22, y: 0.80, type: 'restaurant', name: 'The Chocolatier' },
    { id: 'restroom-chocolatetown', x: 0.26, y: 0.82, type: 'restroom' },
    { id: 'int-entrance', x: 0.20, y: 0.85, type: 'intersection' },
    { id: 'int-chocolatetown', x: 0.24, y: 0.78, type: 'intersection' },
    { id: 'int-founders', x: 0.32, y: 0.68, type: 'intersection' },
    { id: 'int-kissing-tower', x: 0.44, y: 0.52, type: 'intersection' },
    { id: 'int-hollow', x: 0.52, y: 0.44, type: 'intersection' },
    { id: 'int-midway', x: 0.62, y: 0.40, type: 'intersection' },
    { id: 'int-pioneer', x: 0.72, y: 0.28, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-chocolatetown', weight: 2 },
    { from: 'int-chocolatetown', to: 'ride-candymonium', weight: 1 },
    { from: 'int-chocolatetown', to: 'food-chocolatier', weight: 1 },
    { from: 'int-chocolatetown', to: 'int-founders', weight: 2 },
    { from: 'int-founders', to: 'int-kissing-tower', weight: 2 },
    { from: 'int-kissing-tower', to: 'int-hollow', weight: 2 },
    { from: 'int-hollow', to: 'ride-fahrenheit', weight: 1 },
    { from: 'int-hollow', to: 'int-midway', weight: 2 },
    { from: 'int-midway', to: 'int-pioneer', weight: 2 },
    { from: 'int-pioneer', to: 'ride-skyrush', weight: 1 },
    { from: 'restroom-chocolatetown', to: 'int-chocolatetown', weight: 1 },
  ],
};
