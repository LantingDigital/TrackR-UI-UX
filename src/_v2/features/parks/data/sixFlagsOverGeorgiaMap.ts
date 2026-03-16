import { ParkMapData } from '../types';

// ============================================
// Six Flags Over Georgia Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Main Entrance / Main Street
// - West: Gotham City (Batman, Goliath, Riddler Mindbender)
// - Center-west: Metropolis (Superman, Blue Hawk, Justice League)
// - Center: Peachtree Square / Scorcher Knoll
// - East: Lickskillet (Twisted Cyclone, Scream Machine, Thunder River)
// - Far east: Dare Devil Territory & Joker Junction
// ============================================

export const SIX_FLAGS_OVER_GEORGIA_MAP: ParkMapData = {
  parkSlug: 'six-flags-over-georgia',
  nodes: [
    { id: 'entrance-main', x: 0.42, y: 0.92, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-goliath', x: 0.35, y: 0.30, type: 'ride', name: 'Goliath', coasterId: 'goliath-six-flags-over-georgia' },
    { id: 'ride-twisted-cyclone', x: 0.60, y: 0.25, type: 'ride', name: 'Twisted Cyclone', coasterId: 'twisted-cyclone' },
    { id: 'ride-batman', x: 0.28, y: 0.38, type: 'ride', name: 'Batman The Ride', coasterId: 'batman-the-ride-six-flags-over-georgia' },
    { id: 'ride-riddler', x: 0.32, y: 0.22, type: 'ride', name: 'The Riddler Mindbender', coasterId: 'the-riddler-mindbender' },
    { id: 'ride-scream-machine', x: 0.55, y: 0.18, type: 'ride', name: 'Great American Scream Machine', coasterId: 'great-american-scream-machine' },
    { id: 'ride-dare-devil', x: 0.70, y: 0.40, type: 'ride', name: 'Dare Devil Dive', coasterId: 'dare-devil-dive' },
    { id: 'ride-scorcher', x: 0.50, y: 0.45, type: 'ride', name: 'Georgia Scorcher', coasterId: 'georgia-scorcher' },
    { id: 'food-jbs', x: 0.57, y: 0.28, type: 'restaurant', name: "JB's Smokehouse" },
    { id: 'restroom-main', x: 0.40, y: 0.86, type: 'restroom' },
    { id: 'int-entrance', x: 0.42, y: 0.88, type: 'intersection' },
    { id: 'int-main-street', x: 0.42, y: 0.78, type: 'intersection' },
    { id: 'int-peachtree', x: 0.48, y: 0.58, type: 'intersection' },
    { id: 'int-scorcher', x: 0.50, y: 0.45, type: 'intersection' },
    { id: 'int-gotham', x: 0.30, y: 0.35, type: 'intersection' },
    { id: 'int-lickskillet', x: 0.58, y: 0.28, type: 'intersection' },
    { id: 'int-daredevil', x: 0.68, y: 0.40, type: 'intersection' },
    { id: 'int-metropolis', x: 0.40, y: 0.52, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-street', weight: 2 },
    { from: 'int-main-street', to: 'int-peachtree', weight: 2 },
    { from: 'int-peachtree', to: 'int-scorcher', weight: 2 },
    { from: 'int-peachtree', to: 'int-metropolis', weight: 2 },
    { from: 'int-scorcher', to: 'int-gotham', weight: 2 },
    { from: 'int-scorcher', to: 'int-lickskillet', weight: 2 },
    { from: 'int-lickskillet', to: 'int-daredevil', weight: 2 },
    { from: 'int-gotham', to: 'ride-goliath', weight: 1 },
    { from: 'int-gotham', to: 'ride-batman', weight: 1 },
    { from: 'int-gotham', to: 'ride-riddler', weight: 1 },
    { from: 'int-lickskillet', to: 'ride-twisted-cyclone', weight: 1 },
    { from: 'int-lickskillet', to: 'ride-scream-machine', weight: 1 },
    { from: 'int-lickskillet', to: 'food-jbs', weight: 1 },
    { from: 'int-daredevil', to: 'ride-dare-devil', weight: 1 },
    { from: 'int-scorcher', to: 'ride-scorcher', weight: 1 },
    { from: 'restroom-main', to: 'int-entrance', weight: 1 },
  ],
};
