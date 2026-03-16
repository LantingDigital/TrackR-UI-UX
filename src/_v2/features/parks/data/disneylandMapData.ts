import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { DISNEYLAND_POI } from './disneylandPOI';

// ============================================
// Disneyland Park (Anaheim) — Unified Map Data
//
// Park center: 33.8121, -117.9190
// Hub-and-spoke from Sleeping Beauty Castle
// 9 themed lands radiating from central hub
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Main Street
  { id: 'w-entrance-dl', x: 0.50, y: 0.92 },
  { id: 'w-main-street-south', x: 0.50, y: 0.85 },
  { id: 'w-main-street-center', x: 0.50, y: 0.78 },
  { id: 'w-main-street-north', x: 0.50, y: 0.72 },

  // Central Hub (in front of castle)
  { id: 'w-hub-center', x: 0.48, y: 0.65 },
  { id: 'w-hub-west', x: 0.38, y: 0.65 },
  { id: 'w-hub-east', x: 0.60, y: 0.62 },

  // Adventureland
  { id: 'w-adventureland', x: 0.30, y: 0.62 },
  { id: 'w-adventureland-deep', x: 0.28, y: 0.58 },

  // New Orleans Square
  { id: 'w-new-orleans', x: 0.22, y: 0.50 },
  { id: 'w-new-orleans-north', x: 0.20, y: 0.45 },

  // Critter Country
  { id: 'w-critter-country', x: 0.16, y: 0.38 },

  // Star Wars: Galaxy's Edge
  { id: 'w-galaxys-edge-south', x: 0.18, y: 0.30 },
  { id: 'w-galaxys-edge-center', x: 0.18, y: 0.24 },

  // Frontierland
  { id: 'w-frontierland', x: 0.25, y: 0.42 },
  { id: 'w-frontierland-north', x: 0.22, y: 0.32 },

  // Fantasyland (through castle)
  { id: 'w-fantasyland-south', x: 0.48, y: 0.58 },
  { id: 'w-fantasyland-center', x: 0.48, y: 0.50 },
  { id: 'w-fantasyland-east', x: 0.55, y: 0.48 },
  { id: 'w-fantasyland-north', x: 0.52, y: 0.38 },

  // Toontown
  { id: 'w-toontown-south', x: 0.58, y: 0.28 },
  { id: 'w-toontown-center', x: 0.62, y: 0.22 },

  // Tomorrowland
  { id: 'w-tomorrowland-south', x: 0.65, y: 0.55 },
  { id: 'w-tomorrowland-center', x: 0.68, y: 0.45 },
  { id: 'w-tomorrowland-north', x: 0.72, y: 0.35 },
];

const EDGES: MapEdge[] = [
  // Main Street spine
  { from: 'entrance-main-dl', to: 'w-entrance-dl', weight: 1 },
  { from: 'w-entrance-dl', to: 'w-main-street-south', weight: 2 },
  { from: 'w-main-street-south', to: 'w-main-street-center', weight: 2 },
  { from: 'w-main-street-center', to: 'w-main-street-north', weight: 2 },
  { from: 'w-main-street-north', to: 'w-hub-center', weight: 2 },

  // Hub connections
  { from: 'w-hub-center', to: 'w-hub-west', weight: 2 },
  { from: 'w-hub-center', to: 'w-hub-east', weight: 2 },
  { from: 'w-hub-center', to: 'w-fantasyland-south', weight: 2 },

  // West side: Adventureland → New Orleans Square → Critter Country → Galaxy's Edge → Frontierland
  { from: 'w-hub-west', to: 'w-adventureland', weight: 2 },
  { from: 'w-adventureland', to: 'w-adventureland-deep', weight: 2 },
  { from: 'w-adventureland', to: 'w-new-orleans', weight: 2 },
  { from: 'w-new-orleans', to: 'w-new-orleans-north', weight: 2 },
  { from: 'w-new-orleans-north', to: 'w-frontierland', weight: 2 },
  { from: 'w-new-orleans-north', to: 'w-critter-country', weight: 2 },
  { from: 'w-critter-country', to: 'w-galaxys-edge-south', weight: 2 },
  { from: 'w-galaxys-edge-south', to: 'w-galaxys-edge-center', weight: 2 },
  { from: 'w-frontierland', to: 'w-frontierland-north', weight: 2 },
  { from: 'w-frontierland-north', to: 'w-galaxys-edge-south', weight: 2 },

  // Through castle to Fantasyland
  { from: 'w-fantasyland-south', to: 'w-fantasyland-center', weight: 2 },
  { from: 'w-fantasyland-center', to: 'w-fantasyland-east', weight: 2 },
  { from: 'w-fantasyland-center', to: 'w-fantasyland-north', weight: 2 },
  { from: 'w-fantasyland-north', to: 'w-toontown-south', weight: 2 },

  // Toontown
  { from: 'w-toontown-south', to: 'w-toontown-center', weight: 2 },

  // East side: Hub → Tomorrowland
  { from: 'w-hub-east', to: 'w-tomorrowland-south', weight: 2 },
  { from: 'w-tomorrowland-south', to: 'w-tomorrowland-center', weight: 2 },
  { from: 'w-tomorrowland-center', to: 'w-tomorrowland-north', weight: 2 },
  { from: 'w-tomorrowland-north', to: 'w-fantasyland-north', weight: 3 },

  // === Ride connections ===

  // Main Street
  { from: 'ride-disneyland-railroad-main-st', to: 'w-entrance-dl', weight: 1 },
  { from: 'ride-main-street-vehicles', to: 'w-main-street-center', weight: 1 },

  // Adventureland
  { from: 'ride-indiana-jones-adventure', to: 'w-adventureland-deep', weight: 1 },
  { from: 'ride-jungle-cruise', to: 'w-adventureland', weight: 1 },
  { from: 'attraction-enchanted-tiki-room', to: 'w-adventureland', weight: 1 },

  // New Orleans Square
  { from: 'ride-pirates-of-the-caribbean', to: 'w-new-orleans', weight: 1 },
  { from: 'ride-haunted-mansion', to: 'w-new-orleans-north', weight: 1 },

  // Critter Country
  { from: 'ride-tiana-bayou-adventure', to: 'w-critter-country', weight: 1 },
  { from: 'ride-winnie-the-pooh', to: 'w-critter-country', weight: 1 },

  // Galaxy's Edge
  { from: 'ride-rise-of-the-resistance', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'ride-millennium-falcon', to: 'w-galaxys-edge-south', weight: 1 },

  // Frontierland
  { from: 'ride-big-thunder-mountain', to: 'w-frontierland-north', weight: 1 },
  { from: 'ride-mark-twain-riverboat', to: 'w-frontierland', weight: 1 },
  { from: 'ride-sailing-ship-columbia', to: 'w-frontierland', weight: 1 },

  // Fantasyland
  { from: 'ride-matterhorn-bobsleds', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-peter-pans-flight', to: 'w-fantasyland-south', weight: 1 },
  { from: 'ride-its-a-small-world', to: 'w-fantasyland-north', weight: 1 },
  { from: 'ride-alice-in-wonderland', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-mr-toads-wild-ride', to: 'w-fantasyland-south', weight: 1 },
  { from: 'ride-snow-whites-enchanted-wish', to: 'w-fantasyland-south', weight: 1 },
  { from: 'ride-pinocchios-daring-journey', to: 'w-fantasyland-center', weight: 1 },
  { from: 'ride-king-arthur-carrousel', to: 'w-fantasyland-south', weight: 1 },
  { from: 'ride-dumbo', to: 'w-fantasyland-east', weight: 1 },
  { from: 'ride-casey-jr-circus-train', to: 'w-fantasyland-north', weight: 1 },
  { from: 'ride-storybook-land-canal-boats', to: 'w-fantasyland-north', weight: 1 },
  { from: 'ride-mad-tea-party', to: 'w-fantasyland-east', weight: 1 },

  // Toontown
  { from: 'ride-mickey-minnies-runaway-railway', to: 'w-toontown-center', weight: 1 },
  { from: 'ride-roger-rabbits-car-toon-spin', to: 'w-toontown-center', weight: 1 },
  { from: 'ride-gadgets-go-coaster', to: 'w-toontown-center', weight: 1 },

  // Tomorrowland
  { from: 'ride-space-mountain-dl', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-buzz-lightyear', to: 'w-tomorrowland-center', weight: 1 },
  { from: 'ride-finding-nemo-submarine', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-autopia', to: 'w-tomorrowland-north', weight: 1 },
  { from: 'ride-astro-orbiter', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'ride-star-tours', to: 'w-tomorrowland-center', weight: 1 },

  // Show connections
  { from: 'attraction-sleeping-beauty-castle', to: 'w-hub-center', weight: 1 },
  { from: 'attraction-fantasmic', to: 'w-frontierland', weight: 1 },
  { from: 'attraction-great-moments-lincoln', to: 'w-main-street-south', weight: 1 },

  // === Food connections ===
  { from: 'food-jolly-holiday-bakery', to: 'w-main-street-north', weight: 1 },
  { from: 'food-carnation-cafe', to: 'w-main-street-center', weight: 1 },
  { from: 'food-gibson-girl-ice-cream', to: 'w-main-street-center', weight: 1 },
  { from: 'food-bengal-bbq', to: 'w-adventureland', weight: 1 },
  { from: 'food-tiki-juice-bar', to: 'w-adventureland', weight: 1 },
  { from: 'food-blue-bayou', to: 'w-new-orleans', weight: 1 },
  { from: 'food-cafe-orleans', to: 'w-new-orleans', weight: 1 },
  { from: 'food-french-market', to: 'w-new-orleans-north', weight: 1 },
  { from: 'food-mint-julep-bar', to: 'w-new-orleans-north', weight: 1 },
  { from: 'food-golden-horseshoe', to: 'w-frontierland', weight: 1 },
  { from: 'food-rancho-del-zocalo', to: 'w-frontierland', weight: 1 },
  { from: 'food-hungry-bear-bbq', to: 'w-critter-country', weight: 1 },
  { from: 'food-docking-bay-7', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'food-ogas-cantina', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'food-milk-stand', to: 'w-galaxys-edge-south', weight: 1 },
  { from: 'food-red-rose-taverne', to: 'w-fantasyland-center', weight: 1 },
  { from: 'food-edelweiss-snacks', to: 'w-fantasyland-east', weight: 1 },
  { from: 'food-galactic-grill', to: 'w-tomorrowland-south', weight: 1 },
  { from: 'food-alien-pizza-planet', to: 'w-tomorrowland-south', weight: 1 },

  // === Service connections ===
  { from: 'restroom-main-street-dl', to: 'w-main-street-south', weight: 1 },
  { from: 'restroom-adventureland-dl', to: 'w-adventureland', weight: 1 },
  { from: 'restroom-new-orleans-dl', to: 'w-new-orleans', weight: 1 },
  { from: 'restroom-galaxys-edge-dl', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'restroom-fantasyland-dl', to: 'w-fantasyland-center', weight: 1 },
  { from: 'restroom-tomorrowland-dl', to: 'w-tomorrowland-center', weight: 1 },
  { from: 'restroom-toontown-dl', to: 'w-toontown-center', weight: 1 },
  { from: 'service-first-aid-dl', to: 'w-main-street-south', weight: 1 },
  { from: 'service-guest-relations-dl', to: 'w-entrance-dl', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-emporium-dl', to: 'w-main-street-center', weight: 1 },
  { from: 'shop-star-trader', to: 'w-tomorrowland-center', weight: 1 },
  { from: 'shop-savis-workshop', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'shop-droid-depot', to: 'w-galaxys-edge-center', weight: 1 },
  { from: 'shop-pieces-of-eight', to: 'w-new-orleans', weight: 1 },
  { from: 'shop-bibbidi-bobbidi-boutique', to: 'w-hub-center', weight: 1 },
  { from: 'shop-fantasy-faire-gifts', to: 'w-hub-west', weight: 1 },
];

export const DISNEYLAND_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'disneyland',
  pois: DISNEYLAND_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
