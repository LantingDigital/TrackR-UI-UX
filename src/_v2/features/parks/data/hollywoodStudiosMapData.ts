import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { HOLLYWOOD_STUDIOS_POI } from './hollywoodStudiosPOI';

// ============================================
// Disney's Hollywood Studios — Unified Map Data
//
// Park center: 28.3575, -81.5594
// Layout: Hollywood Boulevard entrance leads to a hub,
// with Sunset Blvd west, Echo Lake/Galaxy's Edge east,
// Toy Story Land southeast, Animation Courtyard south
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-hs', x: 0.50, y: 0.88 },
  { id: 'w-hollywood-blvd', x: 0.50, y: 0.75 },
  { id: 'w-hub-hs', x: 0.48, y: 0.65 },
  { id: 'w-sunset-blvd', x: 0.30, y: 0.58 },
  { id: 'w-echo-lake', x: 0.56, y: 0.58 },
  { id: 'w-grand-avenue', x: 0.54, y: 0.50 },
  { id: 'w-galaxys-edge', x: 0.73, y: 0.36 },
  { id: 'w-toy-story-land', x: 0.65, y: 0.55 },
  { id: 'w-animation-courtyard', x: 0.46, y: 0.62 },
];

const EDGES: MapEdge[] = [
  // Main path
  { from: 'entrance-main-hs', to: 'w-entrance-hs', weight: 1 },
  { from: 'w-entrance-hs', to: 'w-hollywood-blvd', weight: 2 },
  { from: 'w-hollywood-blvd', to: 'w-hub-hs', weight: 2 },

  // Hub connections
  { from: 'w-hub-hs', to: 'w-sunset-blvd', weight: 2 },
  { from: 'w-hub-hs', to: 'w-echo-lake', weight: 2 },
  { from: 'w-hub-hs', to: 'w-animation-courtyard', weight: 1 },

  // Branches
  { from: 'w-echo-lake', to: 'w-grand-avenue', weight: 2 },
  { from: 'w-grand-avenue', to: 'w-galaxys-edge', weight: 3 },
  { from: 'w-echo-lake', to: 'w-toy-story-land', weight: 2 },
  { from: 'w-toy-story-land', to: 'w-galaxys-edge', weight: 3 },
  { from: 'w-animation-courtyard', to: 'w-toy-story-land', weight: 2 },

  // ---- Hollywood Boulevard connections ----
  { from: 'shop-celebrity-5-10', to: 'w-hollywood-blvd', weight: 1 },
  { from: 'shop-keystone-clothiers', to: 'w-hollywood-blvd', weight: 1 },
  { from: 'food-hollywoodland-cafe', to: 'w-hollywood-blvd', weight: 1 },

  // ---- Sunset Boulevard connections ----
  { from: 'ride-tower-of-terror', to: 'w-sunset-blvd', weight: 1 },
  { from: 'ride-rock-n-roller-coaster', to: 'w-sunset-blvd', weight: 1 },
  { from: 'show-beauty-beast', to: 'w-sunset-blvd', weight: 1 },
  { from: 'show-fantasmic', to: 'w-sunset-blvd', weight: 1 },
  { from: 'food-sunset-ranch-market', to: 'w-sunset-blvd', weight: 1 },

  // ---- Echo Lake connections ----
  { from: 'ride-star-tours', to: 'w-echo-lake', weight: 1 },
  { from: 'show-indiana-jones', to: 'w-echo-lake', weight: 1 },
  { from: 'food-backlot-express-hs', to: 'w-echo-lake', weight: 1 },
  { from: 'food-50s-prime-time', to: 'w-echo-lake', weight: 1 },

  // ---- Galaxy's Edge connections ----
  { from: 'ride-millennium-falcon', to: 'w-galaxys-edge', weight: 1 },
  { from: 'ride-rise-of-resistance', to: 'w-galaxys-edge', weight: 1 },
  { from: 'attraction-savis-workshop', to: 'w-galaxys-edge', weight: 1 },
  { from: 'attraction-droid-depot', to: 'w-galaxys-edge', weight: 1 },
  { from: 'food-ogas-cantina', to: 'w-galaxys-edge', weight: 1 },
  { from: 'food-docking-bay-7', to: 'w-galaxys-edge', weight: 1 },

  // ---- Toy Story Land connections ----
  { from: 'ride-slinky-dog-dash', to: 'w-toy-story-land', weight: 1 },
  { from: 'ride-toy-story-mania', to: 'w-toy-story-land', weight: 1 },
  { from: 'ride-alien-swirling-saucers', to: 'w-toy-story-land', weight: 1 },
  { from: 'food-woody-lunch-box', to: 'w-toy-story-land', weight: 1 },

  // ---- Animation Courtyard connections ----
  { from: 'ride-mickey-runaway-railway', to: 'w-animation-courtyard', weight: 1 },
  { from: 'attraction-disney-jr-live', to: 'w-animation-courtyard', weight: 1 },
  { from: 'attraction-voyage-mermaid', to: 'w-animation-courtyard', weight: 1 },

  // ---- Grand Avenue connections ----
  { from: 'ride-muppet-vision-3d', to: 'w-grand-avenue', weight: 1 },
  { from: 'food-baseline-taphouse', to: 'w-grand-avenue', weight: 1 },

  // ---- Service connections ----
  { from: 'restroom-entrance-hs', to: 'w-entrance-hs', weight: 1 },
  { from: 'restroom-sunset-hs', to: 'w-sunset-blvd', weight: 1 },
  { from: 'restroom-echo-lake-hs', to: 'w-echo-lake', weight: 1 },
  { from: 'restroom-galaxys-edge-hs', to: 'w-galaxys-edge', weight: 1 },
  { from: 'restroom-toy-story-hs', to: 'w-toy-story-land', weight: 1 },
  { from: 'service-first-aid-hs', to: 'w-hollywood-blvd', weight: 1 },
  { from: 'service-guest-services-hs', to: 'w-entrance-hs', weight: 1 },
];

export const HOLLYWOOD_STUDIOS_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'hollywood-studios',
  pois: HOLLYWOOD_STUDIOS_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
