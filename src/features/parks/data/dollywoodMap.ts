import { ParkMapData } from '../types';

// ============================================
// Dollywood Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-left: Showstreet (entrance)
// - Left: Adventures in Imagination
// - Center-left: Jukebox Junction (Lightning Rod)
// - Center: Country Fair, Timber Canyon (Thunderhead, Mystery Mine)
// - Center-right: Wilderness Pass (Wild Eagle, FireChaser)
// - Right: Craftsman's Valley (Tennessee Tornado, Blazing Fury)
// - Far right: Wildwood Grove (Big Bear Mountain, Dragonflier)
// ============================================

export const DOLLYWOOD_MAP: ParkMapData = {
  parkSlug: 'dollywood',
  nodes: [
    { id: 'entrance-main', x: 0.25, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-lightning-rod', x: 0.35, y: 0.30, type: 'ride', name: 'Lightning Rod', coasterId: 'lightning-rod' },
    { id: 'ride-wild-eagle', x: 0.65, y: 0.22, type: 'ride', name: 'Wild Eagle', coasterId: 'wild-eagle' },
    { id: 'ride-tennessee-tornado', x: 0.75, y: 0.45, type: 'ride', name: 'Tennessee Tornado', coasterId: 'tennessee-tornado' },
    { id: 'food-aunt-grannys', x: 0.25, y: 0.72, type: 'restaurant', name: "Aunt Granny's Buffet" },
    { id: 'restroom-showstreet', x: 0.28, y: 0.82, type: 'restroom' },
    { id: 'int-entrance', x: 0.25, y: 0.85, type: 'intersection' },
    { id: 'int-showstreet', x: 0.28, y: 0.72, type: 'intersection' },
    { id: 'int-jukebox', x: 0.35, y: 0.35, type: 'intersection' },
    { id: 'int-country-fair', x: 0.42, y: 0.52, type: 'intersection' },
    { id: 'int-timber', x: 0.52, y: 0.35, type: 'intersection' },
    { id: 'int-wilderness', x: 0.62, y: 0.28, type: 'intersection' },
    { id: 'int-craftsmans', x: 0.72, y: 0.42, type: 'intersection' },
    { id: 'int-wildwood', x: 0.82, y: 0.52, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-showstreet', weight: 2 },
    { from: 'int-showstreet', to: 'int-jukebox', weight: 2 },
    { from: 'int-showstreet', to: 'int-country-fair', weight: 2 },
    { from: 'int-jukebox', to: 'ride-lightning-rod', weight: 1 },
    { from: 'int-jukebox', to: 'int-timber', weight: 2 },
    { from: 'int-country-fair', to: 'int-timber', weight: 2 },
    { from: 'int-timber', to: 'int-wilderness', weight: 2 },
    { from: 'int-wilderness', to: 'ride-wild-eagle', weight: 1 },
    { from: 'int-wilderness', to: 'int-craftsmans', weight: 2 },
    { from: 'int-craftsmans', to: 'ride-tennessee-tornado', weight: 1 },
    { from: 'int-craftsmans', to: 'int-wildwood', weight: 2 },
    { from: 'food-aunt-grannys', to: 'int-showstreet', weight: 1 },
    { from: 'restroom-showstreet', to: 'int-showstreet', weight: 1 },
  ],
};
