import { ParkMapData } from '../types';

// ============================================
// Kings Island Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Main Entrance / International Street
// - Center: Eiffel Tower replica (fountain plaza)
// - Left: Action Zone (Banshee, Drop Tower, Delirium)
// - Center-right: Coney Mall (The Racer, WindSeeker)
// - Right: Rivertown (Diamondback, Mystic Timbers, Beast)
// - Top-right: Area 72 (Orion, Flight of Fear)
// - Top-left: Planet Snoopy (kids area)
// - Center: Oktoberfest (Festhaus)
// ============================================

export const KINGS_ISLAND_MAP: ParkMapData = {
  parkSlug: 'kings-island',
  nodes: [
    { id: 'entrance-main', x: 0.40, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-orion', x: 0.75, y: 0.25, type: 'ride', name: 'Orion', coasterId: 'orion' },
    { id: 'ride-the-beast', x: 0.82, y: 0.55, type: 'ride', name: 'The Beast', coasterId: 'the-beast' },
    { id: 'ride-diamondback', x: 0.68, y: 0.45, type: 'ride', name: 'Diamondback', coasterId: 'diamondback' },
    { id: 'food-skyline-chili', x: 0.52, y: 0.65, type: 'restaurant', name: 'Skyline Chili' },
    { id: 'food-festhaus', x: 0.44, y: 0.40, type: 'restaurant', name: 'Festhaus' },
    { id: 'restroom-international', x: 0.42, y: 0.78, type: 'restroom' },
    { id: 'restroom-coney', x: 0.52, y: 0.56, type: 'restroom' },
    { id: 'int-entrance', x: 0.40, y: 0.85, type: 'intersection' },
    { id: 'int-international', x: 0.42, y: 0.72, type: 'intersection' },
    { id: 'int-fountain', x: 0.44, y: 0.58, type: 'intersection' },
    { id: 'int-coney-west', x: 0.48, y: 0.55, type: 'intersection' },
    { id: 'int-coney-east', x: 0.55, y: 0.60, type: 'intersection' },
    { id: 'int-action-south', x: 0.30, y: 0.50, type: 'intersection' },
    { id: 'int-action-north', x: 0.26, y: 0.38, type: 'intersection' },
    { id: 'int-oktoberfest', x: 0.46, y: 0.42, type: 'intersection' },
    { id: 'int-rivertown-west', x: 0.60, y: 0.44, type: 'intersection' },
    { id: 'int-rivertown-east', x: 0.72, y: 0.48, type: 'intersection' },
    { id: 'int-area-72', x: 0.72, y: 0.24, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-international', weight: 2 },
    { from: 'int-international', to: 'int-fountain', weight: 2 },
    { from: 'int-fountain', to: 'int-coney-west', weight: 2 },
    { from: 'int-fountain', to: 'int-action-south', weight: 2 },
    { from: 'int-fountain', to: 'int-oktoberfest', weight: 2 },
    { from: 'int-coney-west', to: 'int-coney-east', weight: 2 },
    { from: 'int-action-south', to: 'int-action-north', weight: 2 },
    { from: 'int-oktoberfest', to: 'int-rivertown-west', weight: 2 },
    { from: 'int-rivertown-west', to: 'int-rivertown-east', weight: 2 },
    { from: 'int-coney-east', to: 'int-rivertown-west', weight: 2 },
    { from: 'int-rivertown-east', to: 'int-area-72', weight: 2 },
    { from: 'ride-orion', to: 'int-area-72', weight: 1 },
    { from: 'ride-the-beast', to: 'int-rivertown-east', weight: 1 },
    { from: 'ride-diamondback', to: 'int-rivertown-west', weight: 1 },
    { from: 'food-skyline-chili', to: 'int-coney-east', weight: 1 },
    { from: 'food-festhaus', to: 'int-oktoberfest', weight: 1 },
    { from: 'restroom-international', to: 'int-international', weight: 1 },
    { from: 'restroom-coney', to: 'int-coney-west', weight: 1 },
  ],
};
