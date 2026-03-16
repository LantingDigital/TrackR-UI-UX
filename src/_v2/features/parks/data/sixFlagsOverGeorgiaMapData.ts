import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SIX_FLAGS_OVER_GEORGIA_POI } from './sixFlagsOverGeorgiaPOI';

// ============================================
// Six Flags Over Georgia — Unified Map Data
//
// Park center: 33.7685, -84.5516
// Austell, Georgia
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-sfog', x: 0.42, y: 0.88 },
  { id: 'w-main-street-sfog', x: 0.42, y: 0.78 },
  { id: 'w-peachtree-south', x: 0.46, y: 0.68 },
  { id: 'w-peachtree-center', x: 0.48, y: 0.58 },
  { id: 'w-scorcher-junction', x: 0.50, y: 0.45 },
  { id: 'w-gotham-south', x: 0.35, y: 0.42 },
  { id: 'w-gotham-center', x: 0.30, y: 0.35 },
  { id: 'w-gotham-north', x: 0.32, y: 0.25 },
  { id: 'w-metropolis-center', x: 0.40, y: 0.52 },
  { id: 'w-lickskillet-south', x: 0.55, y: 0.35 },
  { id: 'w-lickskillet-center', x: 0.58, y: 0.28 },
  { id: 'w-lickskillet-north', x: 0.58, y: 0.20 },
  { id: 'w-daredevil-junction', x: 0.68, y: 0.40 },
  { id: 'w-joker-area', x: 0.74, y: 0.52 },
];

const EDGES: MapEdge[] = [
  // Entrance to main plaza
  { from: 'entrance-main-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'w-entrance-sfog', to: 'w-main-street-sfog', weight: 2 },
  { from: 'w-main-street-sfog', to: 'w-peachtree-south', weight: 2 },

  // Peachtree Square path (center of park)
  { from: 'w-peachtree-south', to: 'w-peachtree-center', weight: 2 },
  { from: 'w-peachtree-center', to: 'w-scorcher-junction', weight: 2 },
  { from: 'w-peachtree-center', to: 'w-metropolis-center', weight: 2 },

  // Gotham City path (west side)
  { from: 'w-scorcher-junction', to: 'w-gotham-south', weight: 2 },
  { from: 'w-gotham-south', to: 'w-gotham-center', weight: 2 },
  { from: 'w-gotham-center', to: 'w-gotham-north', weight: 2 },

  // Lickskillet path (east side, heading north)
  { from: 'w-scorcher-junction', to: 'w-lickskillet-south', weight: 2 },
  { from: 'w-lickskillet-south', to: 'w-lickskillet-center', weight: 2 },
  { from: 'w-lickskillet-center', to: 'w-lickskillet-north', weight: 2 },

  // Dare Devil / Joker path (east side)
  { from: 'w-lickskillet-south', to: 'w-daredevil-junction', weight: 2 },
  { from: 'w-daredevil-junction', to: 'w-joker-area', weight: 2 },

  // Cross connections
  { from: 'w-gotham-north', to: 'w-lickskillet-north', weight: 3 },
  { from: 'w-metropolis-center', to: 'w-gotham-south', weight: 2 },
  { from: 'w-joker-area', to: 'w-peachtree-south', weight: 3 },

  // ---- POI connections to nearest walkway node ----

  // Roller coasters
  { from: 'ride-goliath-sfog', to: 'w-gotham-center', weight: 1 },
  { from: 'ride-batman-sfog', to: 'w-gotham-south', weight: 1 },
  { from: 'ride-riddler-mindbender', to: 'w-gotham-north', weight: 1 },
  { from: 'ride-twisted-cyclone', to: 'w-lickskillet-center', weight: 1 },
  { from: 'ride-great-american-scream-machine', to: 'w-lickskillet-north', weight: 1 },
  { from: 'ride-dare-devil-dive', to: 'w-daredevil-junction', weight: 1 },
  { from: 'ride-georgia-scorcher', to: 'w-scorcher-junction', weight: 1 },
  { from: 'ride-blue-hawk', to: 'w-metropolis-center', weight: 1 },
  { from: 'ride-georgia-gold-rusher', to: 'w-peachtree-center', weight: 1 },
  { from: 'ride-dahlonega-mine-train', to: 'w-peachtree-center', weight: 1 },
  { from: 'ride-joker-funhouse-coaster', to: 'w-joker-area', weight: 1 },
  { from: 'ride-mini-mine-train', to: 'w-peachtree-south', weight: 1 },

  // Thrill rides
  { from: 'ride-acrophobia', to: 'w-gotham-center', weight: 1 },
  { from: 'ride-pandemonium', to: 'w-daredevil-junction', weight: 1 },
  { from: 'ride-justice-league', to: 'w-metropolis-center', weight: 1 },
  { from: 'ride-superman-sfog', to: 'w-metropolis-center', weight: 1 },
  { from: 'ride-monster-mansion', to: 'w-peachtree-south', weight: 1 },
  { from: 'ride-thunder-river', to: 'w-lickskillet-center', weight: 1 },
  { from: 'ride-log-jamboree', to: 'w-lickskillet-south', weight: 1 },
  { from: 'ride-sky-buckets', to: 'w-scorcher-junction', weight: 1 },
  { from: 'ride-great-gasp', to: 'w-scorcher-junction', weight: 1 },
  { from: 'ride-catwoman-whip', to: 'w-gotham-south', weight: 1 },
  { from: 'ride-swashbuckler', to: 'w-peachtree-south', weight: 1 },

  // Family rides
  { from: 'ride-rally-racers', to: 'w-gotham-south', weight: 1 },
  { from: 'ride-hanson-cars', to: 'w-peachtree-south', weight: 1 },
  { from: 'ride-carousel', to: 'w-peachtree-south', weight: 1 },
  { from: 'ride-dodge-city-bumper-cars', to: 'w-lickskillet-south', weight: 1 },

  // Food
  { from: 'food-jbs-smokehouse', to: 'w-lickskillet-center', weight: 1 },
  { from: 'food-diner-55', to: 'w-main-street-sfog', weight: 1 },
  { from: 'food-gotham-city-grill', to: 'w-gotham-center', weight: 1 },
  { from: 'food-peachtree-pizza', to: 'w-peachtree-south', weight: 1 },
  { from: 'food-big-boy-burgers', to: 'w-scorcher-junction', weight: 1 },
  { from: 'food-metro-grill', to: 'w-metropolis-center', weight: 1 },
  { from: 'food-dare-devil-dogs', to: 'w-daredevil-junction', weight: 1 },
  { from: 'food-dippin-dots-entrance', to: 'w-main-street-sfog', weight: 1 },
  { from: 'food-funnel-cake-factory', to: 'w-peachtree-center', weight: 1 },
  { from: 'food-joker-snacks', to: 'w-joker-area', weight: 1 },
  { from: 'food-starbucks-sfog', to: 'w-main-street-sfog', weight: 1 },

  // Services
  { from: 'restroom-entrance-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'restroom-gotham', to: 'w-gotham-south', weight: 1 },
  { from: 'restroom-lickskillet', to: 'w-lickskillet-center', weight: 1 },
  { from: 'restroom-peachtree', to: 'w-peachtree-center', weight: 1 },
  { from: 'restroom-daredevil', to: 'w-daredevil-junction', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-main-street-emporium', to: 'w-entrance-sfog', weight: 1 },
  { from: 'shop-gotham-gifts', to: 'w-gotham-south', weight: 1 },
  { from: 'shop-photo-spot', to: 'w-peachtree-center', weight: 1 },
  { from: 'shop-lickskillet-trading-post', to: 'w-lickskillet-center', weight: 1 },
  { from: 'shop-justice-league-gear', to: 'w-metropolis-center', weight: 1 },
  { from: 'show-crystal-pistol', to: 'w-lickskillet-center', weight: 1 },
  { from: 'show-gotham-city-stunt-show', to: 'w-gotham-center', weight: 1 },
  { from: 'service-first-aid-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'service-guest-relations', to: 'w-entrance-sfog', weight: 1 },
  { from: 'service-flash-pass-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'service-lockers-entrance-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'service-atm-entrance-sfog', to: 'w-entrance-sfog', weight: 1 },
  { from: 'service-atm-peachtree', to: 'w-peachtree-center', weight: 1 },
];

export const SIX_FLAGS_OVER_GEORGIA_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'six-flags-over-georgia',
  pois: SIX_FLAGS_OVER_GEORGIA_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
