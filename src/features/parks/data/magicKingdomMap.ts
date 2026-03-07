import { ParkMapData } from '../types';

// ============================================
// Walt Disney World Magic Kingdom Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout (hub and spoke from Cinderella Castle):
// - Bottom: Main Street USA (entrance to castle)
// - Left: Adventureland (Pirates, Jungle Cruise)
// - Far left: Frontierland (Big Thunder, Tiana's Bayou)
// - Top-left: Liberty Square (Haunted Mansion)
// - Top-center: Fantasyland (Seven Dwarfs, it's a small world)
// - Right: Tomorrowland (Space Mountain, TRON)
// ============================================

export const MAGIC_KINGDOM_MAP: ParkMapData = {
  parkSlug: 'magic-kingdom',
  nodes: [
    { id: 'entrance-main', x: 0.48, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-space-mountain', x: 0.72, y: 0.35, type: 'ride', name: 'Space Mountain', coasterId: 'space-mountain-wdw' },
    { id: 'ride-tron', x: 0.78, y: 0.25, type: 'ride', name: 'TRON Lightcycle / Run', coasterId: 'tron-lightcycle-run' },
    { id: 'ride-big-thunder', x: 0.22, y: 0.25, type: 'ride', name: 'Big Thunder Mountain', coasterId: 'big-thunder-mountain-railroad-wdw' },
    { id: 'food-cosmic-rays', x: 0.65, y: 0.42, type: 'restaurant', name: "Cosmic Ray's" },
    { id: 'restroom-main-street', x: 0.50, y: 0.72, type: 'restroom' },
    { id: 'int-entrance', x: 0.48, y: 0.82, type: 'intersection' },
    { id: 'int-main-street', x: 0.48, y: 0.65, type: 'intersection' },
    { id: 'int-hub', x: 0.48, y: 0.48, type: 'intersection' },
    { id: 'int-adventureland', x: 0.30, y: 0.50, type: 'intersection' },
    { id: 'int-frontierland', x: 0.22, y: 0.35, type: 'intersection' },
    { id: 'int-liberty', x: 0.35, y: 0.30, type: 'intersection' },
    { id: 'int-fantasyland', x: 0.52, y: 0.25, type: 'intersection' },
    { id: 'int-tomorrowland', x: 0.68, y: 0.38, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-street', weight: 2 },
    { from: 'int-main-street', to: 'int-hub', weight: 2 },
    { from: 'int-hub', to: 'int-adventureland', weight: 2 },
    { from: 'int-hub', to: 'int-tomorrowland', weight: 2 },
    { from: 'int-hub', to: 'int-fantasyland', weight: 2 },
    { from: 'int-hub', to: 'int-liberty', weight: 2 },
    { from: 'int-adventureland', to: 'int-frontierland', weight: 2 },
    { from: 'int-frontierland', to: 'ride-big-thunder', weight: 1 },
    { from: 'int-frontierland', to: 'int-liberty', weight: 2 },
    { from: 'int-liberty', to: 'int-fantasyland', weight: 2 },
    { from: 'int-tomorrowland', to: 'ride-space-mountain', weight: 1 },
    { from: 'int-tomorrowland', to: 'food-cosmic-rays', weight: 1 },
    { from: 'restroom-main-street', to: 'int-main-street', weight: 1 },
  ],
};
