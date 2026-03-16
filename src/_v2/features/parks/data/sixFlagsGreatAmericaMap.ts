import { ParkMapData } from '../types';

// ============================================
// Six Flags Great America Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Hometown Square (entrance)
// - Center: Carousel Plaza (Maxx Force, X-Flight, Whizzer)
// - West: County Fair (Raging Bull, Goliath, American Eagle)
// - Far west: Southwest Territory (Giant Drop, Roaring Rapids)
// - East: DC Universe (Batman, Joker)
// - Far east: Mardi Gras (Wrath of Rakshasa)
// - Center-south: Yankee Harbor, Kidzopolis
// ============================================

export const SIX_FLAGS_GREAT_AMERICA_MAP: ParkMapData = {
  parkSlug: 'six-flags-great-america',
  nodes: [
    { id: 'entrance-main', x: 0.46, y: 0.88, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-raging-bull', x: 0.35, y: 0.25, type: 'ride', name: 'Raging Bull', coasterId: 'raging-bull' },
    { id: 'ride-goliath', x: 0.30, y: 0.20, type: 'ride', name: 'Goliath', coasterId: 'goliath-six-flags-great-america' },
    { id: 'ride-maxx-force', x: 0.48, y: 0.35, type: 'ride', name: 'Maxx Force', coasterId: 'maxx-force' },
    { id: 'ride-batman', x: 0.62, y: 0.42, type: 'ride', name: 'Batman The Ride', coasterId: 'batman-the-ride-six-flags-great-america' },
    { id: 'ride-american-eagle', x: 0.25, y: 0.15, type: 'ride', name: 'American Eagle', coasterId: 'american-eagle' },
    { id: 'ride-wrath', x: 0.72, y: 0.30, type: 'ride', name: 'Wrath of Rakshasa', coasterId: 'wrath-of-rakshasa' },
    { id: 'food-mooseburger', x: 0.32, y: 0.28, type: 'restaurant', name: 'Mooseburger Lodge' },
    { id: 'restroom-main', x: 0.44, y: 0.82, type: 'restroom' },
    { id: 'int-entrance', x: 0.46, y: 0.85, type: 'intersection' },
    { id: 'int-hometown', x: 0.46, y: 0.75, type: 'intersection' },
    { id: 'int-carousel', x: 0.48, y: 0.38, type: 'intersection' },
    { id: 'int-county-fair', x: 0.32, y: 0.30, type: 'intersection' },
    { id: 'int-dc-universe', x: 0.62, y: 0.42, type: 'intersection' },
    { id: 'int-mardi-gras', x: 0.70, y: 0.34, type: 'intersection' },
    { id: 'int-southwest', x: 0.20, y: 0.38, type: 'intersection' },
    { id: 'int-yankee', x: 0.56, y: 0.52, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-hometown', weight: 2 },
    { from: 'int-hometown', to: 'int-carousel', weight: 2 },
    { from: 'int-carousel', to: 'int-county-fair', weight: 2 },
    { from: 'int-carousel', to: 'int-dc-universe', weight: 2 },
    { from: 'int-county-fair', to: 'int-southwest', weight: 2 },
    { from: 'int-county-fair', to: 'ride-raging-bull', weight: 1 },
    { from: 'int-county-fair', to: 'ride-goliath', weight: 1 },
    { from: 'int-county-fair', to: 'ride-american-eagle', weight: 1 },
    { from: 'int-carousel', to: 'ride-maxx-force', weight: 1 },
    { from: 'int-dc-universe', to: 'ride-batman', weight: 1 },
    { from: 'int-dc-universe', to: 'int-mardi-gras', weight: 2 },
    { from: 'int-dc-universe', to: 'int-yankee', weight: 2 },
    { from: 'int-mardi-gras', to: 'ride-wrath', weight: 1 },
    { from: 'int-county-fair', to: 'food-mooseburger', weight: 1 },
    { from: 'restroom-main', to: 'int-entrance', weight: 1 },
  ],
};
