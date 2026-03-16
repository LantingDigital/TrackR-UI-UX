import { ParkMapData } from '../types';

// ============================================
// Six Flags Magic Mountain Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Main Entrance / Movie District
// - Bottom-left: Looney Tunes Land (kids area)
// - Left: Screampunk District (Twisted Colossus, Goliath, Scream)
// - Far left: Cyclone Bay (West Coast Racers)
// - Center: DC Universe (Batman, Riddler's Revenge, Lex Luthor)
// - Center-right: Rapids Camp Crossing (Gold Rusher, Roaring Rapids)
// - Right: Baja Ridge (X2, Viper, New Revolution)
// - Far right/top: Samurai Summit (Tatsu, Ninja)
// ============================================

export const MAGIC_MOUNTAIN_MAP: ParkMapData = {
  parkSlug: 'six-flags-magic-mountain',
  nodes: [
    { id: 'entrance-main', x: 0.48, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-twisted-colossus', x: 0.25, y: 0.35, type: 'ride', name: 'Twisted Colossus', coasterId: 'twisted-colossus' },
    { id: 'ride-x2', x: 0.78, y: 0.22, type: 'ride', name: 'X2', coasterId: 'x2' },
    { id: 'ride-tatsu', x: 0.85, y: 0.15, type: 'ride', name: 'Tatsu', coasterId: 'tatsu' },
    { id: 'food-johnny-rockets', x: 0.50, y: 0.65, type: 'restaurant', name: 'Johnny Rockets' },
    { id: 'food-panda-express', x: 0.52, y: 0.60, type: 'restaurant', name: 'Panda Express' },
    { id: 'restroom-main', x: 0.46, y: 0.62, type: 'restroom' },
    { id: 'restroom-dc', x: 0.52, y: 0.62, type: 'restroom' },
    { id: 'int-entrance', x: 0.48, y: 0.85, type: 'intersection' },
    { id: 'int-main-plaza', x: 0.48, y: 0.70, type: 'intersection' },
    { id: 'int-movie-center', x: 0.45, y: 0.52, type: 'intersection' },
    { id: 'int-dc-south', x: 0.52, y: 0.62, type: 'intersection' },
    { id: 'int-dc-north', x: 0.55, y: 0.55, type: 'intersection' },
    { id: 'int-screampunk', x: 0.28, y: 0.38, type: 'intersection' },
    { id: 'int-rapids', x: 0.62, y: 0.40, type: 'intersection' },
    { id: 'int-baja', x: 0.72, y: 0.30, type: 'intersection' },
    { id: 'int-samurai', x: 0.82, y: 0.18, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-plaza', weight: 2 },
    { from: 'int-main-plaza', to: 'int-movie-center', weight: 2 },
    { from: 'int-movie-center', to: 'int-dc-south', weight: 2 },
    { from: 'int-movie-center', to: 'int-screampunk', weight: 2 },
    { from: 'int-dc-south', to: 'int-dc-north', weight: 2 },
    { from: 'int-dc-north', to: 'int-rapids', weight: 2 },
    { from: 'int-rapids', to: 'int-baja', weight: 2 },
    { from: 'int-baja', to: 'int-samurai', weight: 2 },
    { from: 'ride-twisted-colossus', to: 'int-screampunk', weight: 1 },
    { from: 'ride-x2', to: 'int-baja', weight: 1 },
    { from: 'ride-tatsu', to: 'int-samurai', weight: 1 },
    { from: 'food-johnny-rockets', to: 'int-dc-south', weight: 1 },
    { from: 'food-panda-express', to: 'int-dc-south', weight: 1 },
    { from: 'restroom-main', to: 'int-movie-center', weight: 1 },
    { from: 'restroom-dc', to: 'int-dc-south', weight: 1 },
  ],
};
