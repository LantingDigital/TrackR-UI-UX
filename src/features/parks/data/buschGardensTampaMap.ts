import { ParkMapData } from '../types';

// ============================================
// Busch Gardens Tampa Bay Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-left: Morocco (entrance)
// - Left: Egypt (Montu, Cobra's Curse)
// - Center-left: Congo/Nairobi (Kumba, Congo River Rapids)
// - Center: Pantopia (Iron Gwazi, Cheetah Hunt, Falcon's Fury)
// - Right: Stanleyville (SheiKra, Tigris)
// - Far right: Sesame Street Safari, Bird Gardens
// ============================================

export const BUSCH_GARDENS_TAMPA_MAP: ParkMapData = {
  parkSlug: 'busch-gardens-tampa',
  nodes: [
    { id: 'entrance-main', x: 0.18, y: 0.82, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-iron-gwazi', x: 0.55, y: 0.35, type: 'ride', name: 'Iron Gwazi', coasterId: 'iron-gwazi' },
    { id: 'ride-sheikra', x: 0.65, y: 0.45, type: 'ride', name: 'SheiKra', coasterId: 'sheikra' },
    { id: 'ride-montu', x: 0.30, y: 0.25, type: 'ride', name: 'Montu', coasterId: 'montu' },
    { id: 'food-zambia', x: 0.62, y: 0.48, type: 'restaurant', name: 'Zambia Smokehouse' },
    { id: 'restroom-morocco', x: 0.20, y: 0.78, type: 'restroom' },
    { id: 'int-entrance', x: 0.18, y: 0.78, type: 'intersection' },
    { id: 'int-morocco', x: 0.22, y: 0.68, type: 'intersection' },
    { id: 'int-egypt', x: 0.28, y: 0.30, type: 'intersection' },
    { id: 'int-congo', x: 0.40, y: 0.42, type: 'intersection' },
    { id: 'int-nairobi', x: 0.36, y: 0.50, type: 'intersection' },
    { id: 'int-pantopia', x: 0.52, y: 0.34, type: 'intersection' },
    { id: 'int-stanleyville', x: 0.62, y: 0.50, type: 'intersection' },
    { id: 'int-bird-gardens', x: 0.75, y: 0.72, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-morocco', weight: 2 },
    { from: 'int-morocco', to: 'int-egypt', weight: 2 },
    { from: 'int-morocco', to: 'int-nairobi', weight: 2 },
    { from: 'int-egypt', to: 'int-congo', weight: 2 },
    { from: 'int-egypt', to: 'ride-montu', weight: 1 },
    { from: 'int-congo', to: 'int-pantopia', weight: 2 },
    { from: 'int-congo', to: 'int-nairobi', weight: 2 },
    { from: 'int-pantopia', to: 'ride-iron-gwazi', weight: 1 },
    { from: 'int-pantopia', to: 'int-stanleyville', weight: 2 },
    { from: 'int-stanleyville', to: 'ride-sheikra', weight: 1 },
    { from: 'int-stanleyville', to: 'food-zambia', weight: 1 },
    { from: 'int-stanleyville', to: 'int-bird-gardens', weight: 2 },
    { from: 'restroom-morocco', to: 'int-entrance', weight: 1 },
  ],
};
