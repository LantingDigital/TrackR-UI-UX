import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { MAGIC_MOUNTAIN_POI } from './magicMountainPOI';

// ============================================
// Six Flags Magic Mountain — Unified Map Data
//
// Park center: 34.4253, -118.5972
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-mm', x: 0.48, y: 0.85 },
  { id: 'w-main-plaza-mm', x: 0.48, y: 0.70 },
  { id: 'w-movie-district-center', x: 0.45, y: 0.52 },
  { id: 'w-dc-universe-south', x: 0.52, y: 0.62 },
  { id: 'w-dc-universe-north', x: 0.55, y: 0.55 },
  { id: 'w-screampunk-south', x: 0.30, y: 0.45 },
  { id: 'w-screampunk-north', x: 0.26, y: 0.30 },
  { id: 'w-rapids-junction', x: 0.62, y: 0.40 },
  { id: 'w-baja-ridge', x: 0.72, y: 0.30 },
  { id: 'w-samurai-summit', x: 0.82, y: 0.18 },
  { id: 'w-cyclone-bay', x: 0.15, y: 0.52 },
  { id: 'w-looney-tunes', x: 0.40, y: 0.68 },
];

const EDGES: MapEdge[] = [
  // Entrance to main plaza
  { from: 'entrance-main-mm', to: 'w-entrance-mm', weight: 1 },
  { from: 'w-entrance-mm', to: 'w-main-plaza-mm', weight: 2 },
  { from: 'w-main-plaza-mm', to: 'w-movie-district-center', weight: 2 },
  { from: 'w-main-plaza-mm', to: 'w-looney-tunes', weight: 2 },

  // Movie District branches
  { from: 'w-movie-district-center', to: 'w-dc-universe-south', weight: 2 },
  { from: 'w-movie-district-center', to: 'w-screampunk-south', weight: 2 },
  { from: 'w-dc-universe-south', to: 'w-dc-universe-north', weight: 2 },

  // Screampunk path
  { from: 'w-screampunk-south', to: 'w-screampunk-north', weight: 2 },
  { from: 'w-screampunk-south', to: 'w-cyclone-bay', weight: 2 },

  // North path: DC -> Rapids -> Baja -> Samurai
  { from: 'w-dc-universe-north', to: 'w-rapids-junction', weight: 2 },
  { from: 'w-rapids-junction', to: 'w-baja-ridge', weight: 2 },
  { from: 'w-baja-ridge', to: 'w-samurai-summit', weight: 2 },

  // Cross connections
  { from: 'w-screampunk-north', to: 'w-rapids-junction', weight: 3 },

  // Coaster connections
  { from: 'ride-twisted-colossus', to: 'w-screampunk-north', weight: 1 },
  { from: 'ride-x2', to: 'w-baja-ridge', weight: 1 },
  { from: 'ride-tatsu', to: 'w-samurai-summit', weight: 1 },
  { from: 'ride-full-throttle', to: 'w-screampunk-north', weight: 1 },
  { from: 'ride-goliath-mm', to: 'w-screampunk-north', weight: 1 },
  { from: 'ride-batman-the-ride', to: 'w-dc-universe-north', weight: 1 },
  { from: 'ride-riddlers-revenge', to: 'w-dc-universe-north', weight: 1 },
  { from: 'ride-scream-mm', to: 'w-screampunk-south', weight: 1 },
  { from: 'ride-viper-mm', to: 'w-baja-ridge', weight: 1 },
  { from: 'ride-west-coast-racers', to: 'w-cyclone-bay', weight: 1 },
  { from: 'ride-wonder-woman-foc', to: 'w-dc-universe-north', weight: 1 },
  { from: 'ride-apocalypse', to: 'w-movie-district-center', weight: 1 },
  { from: 'ride-ninja', to: 'w-samurai-summit', weight: 1 },
  { from: 'ride-gold-rusher', to: 'w-rapids-junction', weight: 1 },
  { from: 'ride-new-revolution', to: 'w-baja-ridge', weight: 1 },
  { from: 'ride-canyon-blaster', to: 'w-looney-tunes', weight: 1 },
  { from: 'ride-road-runner-express', to: 'w-looney-tunes', weight: 1 },
  { from: 'ride-magic-flyer', to: 'w-looney-tunes', weight: 1 },

  // Thrill ride connections
  { from: 'ride-lex-luthor', to: 'w-dc-universe-south', weight: 1 },
  { from: 'ride-crazanity', to: 'w-screampunk-south', weight: 1 },
  { from: 'ride-roaring-rapids', to: 'w-rapids-junction', weight: 1 },
  { from: 'ride-tidal-wave', to: 'w-rapids-junction', weight: 1 },

  // Food connections
  { from: 'food-food-etc', to: 'w-movie-district-center', weight: 1 },
  { from: 'food-panda-express-mm', to: 'w-dc-universe-south', weight: 1 },
  { from: 'food-johnny-rockets-mm', to: 'w-dc-universe-south', weight: 1 },
  { from: 'food-laughing-dragon-pizza', to: 'w-samurai-summit', weight: 1 },
  { from: 'food-mooseburger-lodge', to: 'w-rapids-junction', weight: 1 },
  { from: 'food-starbucks-mm', to: 'w-main-plaza-mm', weight: 1 },
  { from: 'food-colossus-grill', to: 'w-screampunk-south', weight: 1 },

  // Service connections
  { from: 'restroom-main-mm', to: 'w-movie-district-center', weight: 1 },
  { from: 'restroom-dc-universe', to: 'w-dc-universe-south', weight: 1 },
  { from: 'restroom-screampunk', to: 'w-screampunk-south', weight: 1 },
  { from: 'restroom-rapids', to: 'w-rapids-junction', weight: 1 },
  { from: 'restroom-samurai', to: 'w-samurai-summit', weight: 1 },
  { from: 'service-first-aid-mm', to: 'w-main-plaza-mm', weight: 1 },
  { from: 'service-guest-services-mm', to: 'w-entrance-mm', weight: 1 },
];

export const MAGIC_MOUNTAIN_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'six-flags-magic-mountain',
  pois: MAGIC_MOUNTAIN_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
