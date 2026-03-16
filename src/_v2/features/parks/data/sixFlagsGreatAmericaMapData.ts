import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SIX_FLAGS_GREAT_AMERICA_POI } from './sixFlagsGreatAmericaPOI';

// ============================================
// Six Flags Great America — Unified Map Data
//
// Park center: 42.3716, -87.9354
// Gurnee, Illinois
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-sfga', x: 0.46, y: 0.85 },
  { id: 'w-hometown-center', x: 0.46, y: 0.75 },
  { id: 'w-carousel-south', x: 0.47, y: 0.55 },
  { id: 'w-carousel-center', x: 0.48, y: 0.38 },
  { id: 'w-county-fair-south', x: 0.32, y: 0.30 },
  { id: 'w-county-fair-north', x: 0.28, y: 0.20 },
  { id: 'w-southwest-center', x: 0.20, y: 0.38 },
  { id: 'w-dc-universe-center', x: 0.62, y: 0.42 },
  { id: 'w-mardi-gras-center', x: 0.70, y: 0.34 },
  { id: 'w-yankee-center', x: 0.56, y: 0.52 },
  { id: 'w-kidzopolis-center', x: 0.40, y: 0.64 },
];

const EDGES: MapEdge[] = [
  // Entrance to Hometown Square
  { from: 'entrance-main-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'w-entrance-sfga', to: 'w-hometown-center', weight: 2 },
  { from: 'w-hometown-center', to: 'w-carousel-south', weight: 2 },
  { from: 'w-hometown-center', to: 'w-kidzopolis-center', weight: 2 },

  // Carousel Plaza branches
  { from: 'w-carousel-south', to: 'w-carousel-center', weight: 2 },
  { from: 'w-carousel-center', to: 'w-county-fair-south', weight: 2 },
  { from: 'w-carousel-center', to: 'w-dc-universe-center', weight: 2 },

  // County Fair path
  { from: 'w-county-fair-south', to: 'w-county-fair-north', weight: 2 },
  { from: 'w-county-fair-south', to: 'w-southwest-center', weight: 2 },

  // DC Universe to Mardi Gras
  { from: 'w-dc-universe-center', to: 'w-mardi-gras-center', weight: 2 },
  { from: 'w-dc-universe-center', to: 'w-yankee-center', weight: 2 },

  // Cross connections
  { from: 'w-carousel-south', to: 'w-yankee-center', weight: 2 },
  { from: 'w-kidzopolis-center', to: 'w-carousel-south', weight: 2 },

  // ---- POI connections to nearest walkway node ----

  // Roller coasters
  { from: 'ride-raging-bull', to: 'w-county-fair-south', weight: 1 },
  { from: 'ride-goliath-sfga', to: 'w-county-fair-north', weight: 1 },
  { from: 'ride-maxx-force', to: 'w-carousel-center', weight: 1 },
  { from: 'ride-x-flight', to: 'w-carousel-center', weight: 1 },
  { from: 'ride-batman-sfga', to: 'w-dc-universe-center', weight: 1 },
  { from: 'ride-american-eagle', to: 'w-county-fair-north', weight: 1 },
  { from: 'ride-wrath-of-rakshasa', to: 'w-mardi-gras-center', weight: 1 },
  { from: 'ride-viper-sfga', to: 'w-county-fair-south', weight: 1 },
  { from: 'ride-whizzer', to: 'w-carousel-center', weight: 1 },
  { from: 'ride-flash-vertical-velocity', to: 'w-yankee-center', weight: 1 },
  { from: 'ride-joker-sfga', to: 'w-dc-universe-center', weight: 1 },
  { from: 'ride-little-dipper', to: 'w-kidzopolis-center', weight: 1 },
  { from: 'ride-sprocket-rockets', to: 'w-kidzopolis-center', weight: 1 },

  // Thrill rides
  { from: 'ride-revolution', to: 'w-carousel-center', weight: 1 },
  { from: 'ride-king-chaos', to: 'w-mardi-gras-center', weight: 1 },
  { from: 'ride-giant-drop', to: 'w-southwest-center', weight: 1 },
  { from: 'ride-roaring-rapids', to: 'w-southwest-center', weight: 1 },
  { from: 'ride-buccaneer-battle', to: 'w-yankee-center', weight: 1 },
  { from: 'ride-dare-devil-dive-sfga', to: 'w-carousel-center', weight: 1 },

  // Food
  { from: 'food-big-orleans', to: 'w-mardi-gras-center', weight: 1 },
  { from: 'food-hometown-hotdogs', to: 'w-hometown-center', weight: 1 },
  { from: 'food-mooseburger-lodge', to: 'w-county-fair-south', weight: 1 },
  { from: 'food-southwest-cooking-co', to: 'w-southwest-center', weight: 1 },
  { from: 'food-starbucks-sfga', to: 'w-hometown-center', weight: 1 },
  { from: 'food-dc-diner', to: 'w-dc-universe-center', weight: 1 },
  { from: 'food-harbor-house', to: 'w-yankee-center', weight: 1 },
  { from: 'food-dippin-dots-sfga', to: 'w-carousel-center', weight: 1 },
  { from: 'food-funnel-cake-sfga', to: 'w-county-fair-south', weight: 1 },

  // Services
  { from: 'restroom-entrance-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'restroom-county-fair', to: 'w-county-fair-south', weight: 1 },
  { from: 'restroom-dc-universe', to: 'w-dc-universe-center', weight: 1 },
  { from: 'restroom-mardi-gras', to: 'w-mardi-gras-center', weight: 1 },
  { from: 'restroom-southwest', to: 'w-southwest-center', weight: 1 },
  { from: 'restroom-yankee', to: 'w-yankee-center', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-hometown-general-store', to: 'w-hometown-center', weight: 1 },
  { from: 'shop-dc-comics-shop', to: 'w-dc-universe-center', weight: 1 },
  { from: 'shop-southwest-traders', to: 'w-southwest-center', weight: 1 },
  { from: 'shop-county-fair-gifts', to: 'w-county-fair-north', weight: 1 },
  { from: 'show-grand-music-hall', to: 'w-carousel-center', weight: 1 },
  { from: 'show-dc-stunt-show', to: 'w-dc-universe-center', weight: 1 },
  { from: 'service-first-aid-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'service-guest-relations-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'service-flash-pass-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'service-lockers-sfga', to: 'w-entrance-sfga', weight: 1 },
  { from: 'service-atm-entrance-sfga', to: 'w-entrance-sfga', weight: 1 },
];

export const SIX_FLAGS_GREAT_AMERICA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'six-flags-great-america',
  pois: SIX_FLAGS_GREAT_AMERICA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
