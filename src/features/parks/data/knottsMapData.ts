import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { KNOTTS_POI } from './knottsPOI';

// ============================================
// Knott's Berry Farm — Unified Map Data
//
// Combines:
// - 118 POIs from knottsPOI.ts (rendered as markers)
// - Walkway intersection nodes (pathfinding only, not rendered)
// - Edges connecting POIs ↔ walkway nodes
//
// Walkway nodes are a sparse initial set. They will be
// expanded to 100+ nodes in knottsWalkways.ts (Phase 4)
// once marker positions are finalized via the position editor.
// ============================================

// Initial walkway intersection nodes (migrated from old knottsMap.ts)
const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entry-plaza', x: 0.35, y: 0.83 },
  { id: 'w-marketplace', x: 0.35, y: 0.74 },
  { id: 'w-ghost-town-entry', x: 0.28, y: 0.64 },
  { id: 'w-ghost-town-center', x: 0.30, y: 0.50 },
  { id: 'w-ghost-town-north', x: 0.30, y: 0.38 },
  { id: 'w-water-rides', x: 0.20, y: 0.25 },
  { id: 'w-central-plaza', x: 0.47, y: 0.27 },
  { id: 'w-central-path', x: 0.48, y: 0.44 },
  { id: 'w-central-south', x: 0.46, y: 0.58 },
  { id: 'w-fiesta-entry', x: 0.58, y: 0.30 },
  { id: 'w-coaster-alley', x: 0.75, y: 0.20 },
  { id: 'w-boardwalk-north', x: 0.65, y: 0.42 },
  { id: 'w-boardwalk-center', x: 0.68, y: 0.54 },
  { id: 'w-boardwalk-south', x: 0.62, y: 0.66 },
  { id: 'w-south-cross', x: 0.48, y: 0.72 },
  { id: 'w-east-path', x: 0.85, y: 0.18 },
];

// Edges: walkway-to-walkway + POI-to-nearest-walkway
const EDGES: MapEdge[] = [
  // Walkway network (same as old knottsMap.ts edges, with updated node IDs)
  { from: 'entrance-main', to: 'w-entry-plaza', weight: 1 },
  { from: 'w-entry-plaza', to: 'w-marketplace', weight: 1 },
  { from: 'w-marketplace', to: 'w-ghost-town-entry', weight: 2 },
  { from: 'w-marketplace', to: 'w-south-cross', weight: 2 },
  { from: 'w-ghost-town-entry', to: 'w-ghost-town-center', weight: 2 },
  { from: 'w-ghost-town-entry', to: 'w-central-south', weight: 2 },
  { from: 'w-ghost-town-center', to: 'w-ghost-town-north', weight: 2 },
  { from: 'w-ghost-town-center', to: 'w-central-path', weight: 2 },
  { from: 'w-ghost-town-north', to: 'w-water-rides', weight: 2 },
  { from: 'w-ghost-town-north', to: 'w-central-plaza', weight: 2 },
  { from: 'w-central-plaza', to: 'w-fiesta-entry', weight: 2 },
  { from: 'w-central-plaza', to: 'w-central-path', weight: 2 },
  { from: 'w-central-plaza', to: 'w-water-rides', weight: 2 },
  { from: 'w-central-path', to: 'w-central-south', weight: 2 },
  { from: 'w-central-path', to: 'w-boardwalk-north', weight: 2 },
  { from: 'w-central-south', to: 'w-south-cross', weight: 2 },
  { from: 'w-central-south', to: 'w-boardwalk-center', weight: 2 },
  { from: 'w-fiesta-entry', to: 'w-coaster-alley', weight: 2 },
  { from: 'w-fiesta-entry', to: 'w-boardwalk-north', weight: 2 },
  { from: 'w-coaster-alley', to: 'w-east-path', weight: 2 },
  { from: 'w-coaster-alley', to: 'w-boardwalk-north', weight: 2 },
  { from: 'w-east-path', to: 'ride-xcelerator', weight: 2 },
  { from: 'w-boardwalk-north', to: 'w-boardwalk-center', weight: 2 },
  { from: 'w-boardwalk-center', to: 'w-boardwalk-south', weight: 2 },
  { from: 'w-boardwalk-south', to: 'w-south-cross', weight: 2 },
  { from: 'w-south-cross', to: 'w-ghost-town-entry', weight: 2 },

  // POI connections to nearest walkway node
  // Ghost Town rides
  { from: 'ride-ghostrider', to: 'w-ghost-town-entry', weight: 1 },
  { from: 'ride-pony-express', to: 'w-ghost-town-north', weight: 1 },
  { from: 'ride-calico-river-rapids', to: 'w-ghost-town-north', weight: 1 },
  { from: 'ride-silver-bullet', to: 'w-central-plaza', weight: 1 },
  { from: 'ride-calico-railroad', to: 'w-ghost-town-center', weight: 1 },
  { from: 'ride-timber-mountain-log-ride', to: 'w-ghost-town-north', weight: 1 },
  { from: 'ride-calico-mine-ride', to: 'w-ghost-town-north', weight: 1 },
  { from: 'ride-butterfield-stagecoach', to: 'w-ghost-town-center', weight: 1 },

  // Boardwalk rides
  { from: 'ride-xcelerator', to: 'w-east-path', weight: 1 },
  { from: 'ride-supreme-scream', to: 'w-coaster-alley', weight: 1 },
  { from: 'ride-hangtime', to: 'w-coaster-alley', weight: 1 },
  { from: 'ride-sky-cabin', to: 'w-coaster-alley', weight: 1 },
  { from: 'ride-wipeout', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-coast-rider', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-surfside-gliders', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-pacific-scrambler', to: 'w-boardwalk-north', weight: 1 },
  { from: 'ride-beary-tales', to: 'w-boardwalk-center', weight: 1 },
  { from: 'ride-wheeler-dealer-bumper-cars', to: 'w-boardwalk-center', weight: 1 },

  // Fiesta Village rides
  { from: 'ride-montezooma', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-la-revolucion', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-hat-dance', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-dragon-swing', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-los-voladores', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-jaguar', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-sol-spin', to: 'w-fiesta-entry', weight: 1 },
  { from: 'ride-carnaval-de-california', to: 'w-fiesta-entry', weight: 1 },

  // Camp Snoopy rides
  { from: 'ride-sierra-sidewinder', to: 'w-water-rides', weight: 1 },
  { from: 'ride-flying-ace', to: 'w-water-rides', weight: 1 },
  { from: 'ride-tenderpaw-twister', to: 'w-water-rides', weight: 1 },
  { from: 'ride-rapid-river-run', to: 'w-water-rides', weight: 1 },
  { from: 'ride-pigpens-mud-buggies', to: 'w-water-rides', weight: 1 },
  { from: 'ride-sallys-swing-along', to: 'w-water-rides', weight: 1 },
  { from: 'ride-off-road-rally', to: 'w-water-rides', weight: 1 },
  { from: 'ride-charlie-browns-kite-flyer', to: 'w-water-rides', weight: 1 },
  { from: 'ride-linus-launcher', to: 'w-water-rides', weight: 1 },
  { from: 'ride-beagle-express-railroad', to: 'w-water-rides', weight: 1 },
  { from: 'ride-balloon-race', to: 'w-water-rides', weight: 1 },

  // Key food locations connected to nearest walkway
  { from: 'food-mrs-knotts-chicken-dinner', to: 'w-entry-plaza', weight: 1 },
  { from: 'food-boardwalk-bbq', to: 'w-boardwalk-south', weight: 1 },
  { from: 'food-ghost-town-bakery', to: 'w-ghost-town-center', weight: 1 },
  { from: 'food-firemans-bbq', to: 'w-ghost-town-center', weight: 1 },
  { from: 'food-coasters-diner', to: 'w-boardwalk-north', weight: 1 },
  { from: 'food-johnny-rockets', to: 'w-coaster-alley', weight: 1 },
  { from: 'food-casa-california', to: 'w-fiesta-entry', weight: 1 },
  { from: 'food-grizzly-creek-lodge', to: 'w-water-rides', weight: 1 },
  { from: 'food-prop-shop-pizzeria', to: 'w-central-plaza', weight: 1 },
  { from: 'food-starbucks-marketplace', to: 'w-entry-plaza', weight: 1 },

  // Services
  { from: 'entrance-main', to: 'w-entry-plaza', weight: 1 },
  { from: 'restroom-entrance', to: 'w-entry-plaza', weight: 1 },
  { from: 'restroom-ghost-town', to: 'w-ghost-town-center', weight: 1 },
  { from: 'restroom-boardwalk', to: 'w-boardwalk-center', weight: 1 },
  { from: 'restroom-fiesta', to: 'w-fiesta-entry', weight: 1 },
  { from: 'restroom-camp-snoopy', to: 'w-water-rides', weight: 1 },
];

export const KNOTTS_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'knotts-berry-farm',
  pois: KNOTTS_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
