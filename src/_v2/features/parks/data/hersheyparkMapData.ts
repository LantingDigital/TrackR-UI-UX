import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { HERSHEYPARK_POI } from './hersheyparkPOI';

// ============================================
// Hersheypark — Unified Map Data
//
// Park center: 40.2870, -76.6555
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-hp', x: 0.20, y: 0.85 },
  { id: 'w-chocolatetown', x: 0.24, y: 0.78 },
  { id: 'w-founders', x: 0.32, y: 0.68 },
  { id: 'w-kissing-tower', x: 0.44, y: 0.52 },
  { id: 'w-hollow', x: 0.52, y: 0.44 },
  { id: 'w-midway-west', x: 0.58, y: 0.38 },
  { id: 'w-midway-east', x: 0.65, y: 0.42 },
  { id: 'w-pioneer-west', x: 0.70, y: 0.30 },
  { id: 'w-pioneer-east', x: 0.78, y: 0.24 },
  { id: 'w-minetown', x: 0.48, y: 0.60 },
  { id: 'w-music-box', x: 0.38, y: 0.58 },
];

const EDGES: MapEdge[] = [
  // Main path
  { from: 'entrance-main-hp', to: 'w-entrance-hp', weight: 1 },
  { from: 'w-entrance-hp', to: 'w-chocolatetown', weight: 2 },
  { from: 'w-chocolatetown', to: 'w-founders', weight: 2 },
  { from: 'w-founders', to: 'w-kissing-tower', weight: 2 },
  { from: 'w-founders', to: 'w-music-box', weight: 2 },
  { from: 'w-kissing-tower', to: 'w-hollow', weight: 2 },
  { from: 'w-kissing-tower', to: 'w-minetown', weight: 2 },
  { from: 'w-hollow', to: 'w-midway-west', weight: 2 },
  { from: 'w-midway-west', to: 'w-midway-east', weight: 2 },
  { from: 'w-midway-east', to: 'w-pioneer-west', weight: 2 },
  { from: 'w-pioneer-west', to: 'w-pioneer-east', weight: 2 },
  { from: 'w-music-box', to: 'w-minetown', weight: 2 },

  // Coaster connections
  { from: 'ride-candymonium', to: 'w-chocolatetown', weight: 1 },
  { from: 'ride-fahrenheit', to: 'w-hollow', weight: 1 },
  { from: 'ride-skyrush', to: 'w-pioneer-west', weight: 1 },
  { from: 'ride-storm-runner', to: 'w-midway-west', weight: 1 },
  { from: 'ride-great-bear', to: 'w-midway-east', weight: 1 },
  { from: 'ride-superdooperlooper', to: 'w-midway-east', weight: 1 },
  { from: 'ride-comet', to: 'w-pioneer-west', weight: 1 },
  { from: 'ride-wildcat-revenge', to: 'w-midway-west', weight: 1 },
  { from: 'ride-sooperdooperlooper', to: 'w-hollow', weight: 1 },
  { from: 'ride-lightning-racer', to: 'w-pioneer-east', weight: 1 },
  { from: 'ride-laff-trakk', to: 'w-kissing-tower', weight: 1 },
  { from: 'ride-trailblazer', to: 'w-pioneer-west', weight: 1 },
  { from: 'ride-cocoa-cruiser', to: 'w-founders', weight: 1 },

  // Thrill ride connections
  { from: 'ride-kissing-tower', to: 'w-kissing-tower', weight: 1 },
  { from: 'ride-hershey-triple-tower', to: 'w-kissing-tower', weight: 1 },
  { from: 'ride-coal-cracker', to: 'w-pioneer-west', weight: 1 },
  { from: 'ride-tidal-force', to: 'w-pioneer-east', weight: 1 },

  // Food connections
  { from: 'food-chocolatier', to: 'w-chocolatetown', weight: 1 },
  { from: 'food-simply-good', to: 'w-founders', weight: 1 },
  { from: 'food-spring-creek-smokehouse', to: 'w-pioneer-west', weight: 1 },
  { from: 'food-food-hall-chocolatetown', to: 'w-chocolatetown', weight: 1 },
  { from: 'food-kettle-kitchen', to: 'w-hollow', weight: 1 },

  // Service connections
  { from: 'restroom-chocolatetown', to: 'w-chocolatetown', weight: 1 },
  { from: 'restroom-midway-hp', to: 'w-midway-east', weight: 1 },
  { from: 'restroom-pioneer-hp', to: 'w-pioneer-west', weight: 1 },
  { from: 'restroom-hollow-hp', to: 'w-hollow', weight: 1 },
  { from: 'service-first-aid-hp', to: 'w-founders', weight: 1 },
  { from: 'service-guest-services-hp', to: 'w-entrance-hp', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'ride-wave-swinger', to: 'w-midway-east', weight: 1 },
  { from: 'food-dippin-dots-hp', to: 'w-midway-west', weight: 1 },
  { from: 'shop-chocolatetown-sweet-shop', to: 'w-chocolatetown', weight: 1 },
  { from: 'shop-emporium-hp', to: 'w-founders', weight: 1 },
  { from: 'shop-frontier-general', to: 'w-pioneer-west', weight: 1 },
];

export const HERSHEYPARK_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'hersheypark',
  pois: HERSHEYPARK_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
