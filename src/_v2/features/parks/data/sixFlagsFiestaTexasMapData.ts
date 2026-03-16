import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SIX_FLAGS_FIESTA_TEXAS_POI } from './sixFlagsFiestaTexasPOI';

// ============================================
// Six Flags Fiesta Texas — Unified Map Data
//
// Park center: 29.5987, -98.6098
// San Antonio, Texas
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-sfft', x: 0.45, y: 0.78 },
  { id: 'w-rockville-center', x: 0.42, y: 0.50 },
  { id: 'w-crackaxle-center', x: 0.50, y: 0.32 },
  { id: 'w-crackaxle-north', x: 0.48, y: 0.24 },
  { id: 'w-spassburg-center', x: 0.32, y: 0.40 },
  { id: 'w-los-festivales-center', x: 0.64, y: 0.42 },
  { id: 'w-screampunk-center', x: 0.58, y: 0.22 },
  { id: 'w-dc-universe-sfft', x: 0.26, y: 0.24 },
  { id: 'w-kiddie-center', x: 0.42, y: 0.66 },
  { id: 'w-rapids-center', x: 0.72, y: 0.44 },
  { id: 'w-rockville-north', x: 0.42, y: 0.40 },
  { id: 'w-los-festivales-south', x: 0.62, y: 0.50 },
];

const EDGES: MapEdge[] = [
  // Entrance spine
  { from: 'entrance-main-sfft', to: 'w-entrance-sfft', weight: 1 },
  { from: 'w-entrance-sfft', to: 'w-rockville-center', weight: 2 },
  { from: 'w-rockville-center', to: 'w-rockville-north', weight: 2 },
  { from: 'w-rockville-center', to: 'w-kiddie-center', weight: 2 },

  // Rockville to areas
  { from: 'w-rockville-north', to: 'w-crackaxle-center', weight: 2 },
  { from: 'w-rockville-north', to: 'w-spassburg-center', weight: 2 },
  { from: 'w-rockville-north', to: 'w-los-festivales-center', weight: 3 },

  // Crackaxle Canyon
  { from: 'w-crackaxle-center', to: 'w-crackaxle-north', weight: 2 },
  { from: 'w-crackaxle-center', to: 'w-los-festivales-center', weight: 2 },

  // Northern connections
  { from: 'w-crackaxle-north', to: 'w-screampunk-center', weight: 2 },
  { from: 'w-crackaxle-north', to: 'w-dc-universe-sfft', weight: 2 },

  // Spassburg to DC Universe
  { from: 'w-spassburg-center', to: 'w-dc-universe-sfft', weight: 2 },

  // Los Festivales to rapids
  { from: 'w-los-festivales-center', to: 'w-los-festivales-south', weight: 2 },
  { from: 'w-los-festivales-center', to: 'w-rapids-center', weight: 2 },
  { from: 'w-los-festivales-south', to: 'w-rapids-center', weight: 2 },

  // Cross connections
  { from: 'w-screampunk-center', to: 'w-los-festivales-center', weight: 2 },

  // ---- POI connections to nearest walkway node ----

  // Roller coasters
  { from: 'ride-iron-rattler', to: 'w-rockville-north', weight: 1 },
  { from: 'ride-chupacabra', to: 'w-los-festivales-center', weight: 1 },
  { from: 'ride-poltergeist', to: 'w-rockville-north', weight: 1 },
  { from: 'ride-dr-diabolicals', to: 'w-crackaxle-center', weight: 1 },
  { from: 'ride-wonder-woman', to: 'w-los-festivales-center', weight: 1 },
  { from: 'ride-superman-krypton', to: 'w-crackaxle-north', weight: 1 },
  { from: 'ride-road-runner-express', to: 'w-los-festivales-south', weight: 1 },
  { from: 'ride-batgirl-coaster-chase', to: 'w-dc-universe-sfft', weight: 1 },
  { from: 'ride-batman-sfft', to: 'w-dc-universe-sfft', weight: 1 },
  { from: 'ride-rattler-sfft', to: 'w-spassburg-center', weight: 1 },
  { from: 'ride-boomerang-sfft', to: 'w-spassburg-center', weight: 1 },

  // Thrill rides
  { from: 'ride-scream-sfft', to: 'w-screampunk-center', weight: 1 },
  { from: 'ride-pandemonium-sfft', to: 'w-screampunk-center', weight: 1 },
  { from: 'ride-thunder-rapids', to: 'w-rapids-center', weight: 1 },
  { from: 'ride-power-surge', to: 'w-crackaxle-center', weight: 1 },
  { from: 'ride-super-man-tower', to: 'w-crackaxle-north', weight: 1 },
  { from: 'ride-gully-washer', to: 'w-crackaxle-center', weight: 1 },

  // Family rides
  { from: 'ride-wagon-wheel', to: 'w-crackaxle-center', weight: 1 },
  { from: 'ride-whistle-stop', to: 'w-kiddie-center', weight: 1 },
  { from: 'ride-daffy-duck-bucket-blasters', to: 'w-kiddie-center', weight: 1 },

  // Food
  { from: 'food-sangerfest-halle', to: 'w-spassburg-center', weight: 1 },
  { from: 'food-crackaxle-grill', to: 'w-crackaxle-center', weight: 1 },
  { from: 'food-los-festivales-cantina', to: 'w-los-festivales-center', weight: 1 },
  { from: 'food-jb-smokehouse', to: 'w-rockville-center', weight: 1 },
  { from: 'food-starbucks-sfft', to: 'w-rockville-center', weight: 1 },
  { from: 'food-dippin-dots-sfft', to: 'w-crackaxle-center', weight: 1 },
  { from: 'food-funnel-cake-sfft', to: 'w-los-festivales-center', weight: 1 },
  { from: 'food-dc-diner-sfft', to: 'w-dc-universe-sfft', weight: 1 },
  { from: 'food-screampunk-eats', to: 'w-screampunk-center', weight: 1 },

  // Services
  { from: 'restroom-entrance-sfft', to: 'w-entrance-sfft', weight: 1 },
  { from: 'restroom-crackaxle', to: 'w-crackaxle-center', weight: 1 },
  { from: 'restroom-spassburg', to: 'w-spassburg-center', weight: 1 },
  { from: 'restroom-los-festivales', to: 'w-los-festivales-south', weight: 1 },
  { from: 'restroom-dc-universe-sfft', to: 'w-dc-universe-sfft', weight: 1 },
  { from: 'restroom-screampunk-sfft', to: 'w-screampunk-center', weight: 1 },
  { from: 'restroom-kiddie-sfft', to: 'w-kiddie-center', weight: 1 },
  { from: 'service-first-aid-sfft', to: 'w-rockville-center', weight: 1 },
  { from: 'service-guest-relations-sfft', to: 'w-entrance-sfft', weight: 1 },
  { from: 'service-lockers-sfft', to: 'w-entrance-sfft', weight: 1 },
  { from: 'service-stroller-sfft', to: 'w-entrance-sfft', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-rockville-trading-co', to: 'w-rockville-center', weight: 1 },
  { from: 'shop-dc-shop-sfft', to: 'w-dc-universe-sfft', weight: 1 },
  { from: 'shop-spassburg-gifts', to: 'w-spassburg-center', weight: 1 },
  { from: 'shop-los-festivales-market', to: 'w-los-festivales-center', weight: 1 },
  { from: 'show-lone-star-amphitheater', to: 'w-rockville-center', weight: 1 },
  { from: 'show-rockville-stage', to: 'w-rockville-center', weight: 1 },
];

export const SIX_FLAGS_FIESTA_TEXAS_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'six-flags-fiesta-texas',
  pois: SIX_FLAGS_FIESTA_TEXAS_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
