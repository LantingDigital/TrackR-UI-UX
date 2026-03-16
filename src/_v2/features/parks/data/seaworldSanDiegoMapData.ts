import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SEAWORLD_SAN_DIEGO_POI } from './seaworldSanDiegoPOI';

// ============================================
// SeaWorld San Diego — Unified Map Data
//
// Park center: 32.7657, -117.2263
// Layout: Oval along Mission Bay, entrance at south
// West side: Bayside, Orca, Dolphin shows
// East side: Ocean Explorer, rides
// North: Shipwreck Reef, Arctic Rescue, Wild Arctic
// South: Entrance, Sesame Street, Rescue Jr.
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Entrance area
  { id: 'w-entrance-swsd', x: 0.50, y: 0.90 },
  { id: 'w-entrance-north', x: 0.50, y: 0.78 },

  // Main loop (clockwise from entrance)
  { id: 'w-sesame-center', x: 0.48, y: 0.68 },
  { id: 'w-rescue-center', x: 0.40, y: 0.60 },

  // West side (Bayside / Orca)
  { id: 'w-bayside-south', x: 0.36, y: 0.52 },
  { id: 'w-bayside-center', x: 0.38, y: 0.45 },
  { id: 'w-bayside-north', x: 0.35, y: 0.38 },
  { id: 'w-orca-area', x: 0.30, y: 0.32 },

  // North (Shipwreck / Arctic)
  { id: 'w-emperor-junction', x: 0.42, y: 0.30 },
  { id: 'w-shipwreck-center', x: 0.55, y: 0.24 },
  { id: 'w-arctic-west', x: 0.68, y: 0.28 },
  { id: 'w-arctic-center', x: 0.74, y: 0.26 },

  // East side (Ocean Explorer)
  { id: 'w-ocean-north', x: 0.65, y: 0.36 },
  { id: 'w-ocean-center', x: 0.62, y: 0.42 },
  { id: 'w-ocean-south', x: 0.58, y: 0.50 },

  // Return path (east)
  { id: 'w-east-return', x: 0.55, y: 0.60 },
];

const EDGES: MapEdge[] = [
  // Entrance path
  { from: 'entrance-main-swsd', to: 'w-entrance-swsd', weight: 1 },
  { from: 'w-entrance-swsd', to: 'w-entrance-north', weight: 2 },

  // South loop
  { from: 'w-entrance-north', to: 'w-sesame-center', weight: 2 },
  { from: 'w-sesame-center', to: 'w-rescue-center', weight: 2 },
  { from: 'w-sesame-center', to: 'w-east-return', weight: 2 },

  // West side path
  { from: 'w-rescue-center', to: 'w-bayside-south', weight: 2 },
  { from: 'w-bayside-south', to: 'w-bayside-center', weight: 2 },
  { from: 'w-bayside-center', to: 'w-bayside-north', weight: 2 },
  { from: 'w-bayside-north', to: 'w-orca-area', weight: 2 },

  // North loop
  { from: 'w-orca-area', to: 'w-emperor-junction', weight: 2 },
  { from: 'w-emperor-junction', to: 'w-shipwreck-center', weight: 2 },
  { from: 'w-shipwreck-center', to: 'w-arctic-west', weight: 2 },
  { from: 'w-arctic-west', to: 'w-arctic-center', weight: 2 },

  // East side path
  { from: 'w-arctic-west', to: 'w-ocean-north', weight: 2 },
  { from: 'w-ocean-north', to: 'w-ocean-center', weight: 2 },
  { from: 'w-ocean-center', to: 'w-ocean-south', weight: 2 },
  { from: 'w-ocean-south', to: 'w-east-return', weight: 2 },

  // Cross paths
  { from: 'w-bayside-center', to: 'w-ocean-south', weight: 3 },
  { from: 'w-east-return', to: 'w-entrance-north', weight: 2 },

  // ---- Ride connections ----
  { from: 'ride-emperor-swsd', to: 'w-emperor-junction', weight: 1 },
  { from: 'ride-electric-eel-swsd', to: 'w-ocean-north', weight: 1 },
  { from: 'ride-arctic-rescue-swsd', to: 'w-arctic-center', weight: 1 },
  { from: 'ride-manta-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'ride-journey-to-atlantis-swsd', to: 'w-bayside-center', weight: 1 },
  { from: 'ride-shipwreck-rapids-swsd', to: 'w-shipwreck-center', weight: 1 },
  { from: 'ride-tentacle-twirl-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'ride-sea-dragon-drop-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'ride-octarock-swsd', to: 'w-sesame-center', weight: 1 },
  { from: 'ride-rescue-rafter-swsd', to: 'w-rescue-center', weight: 1 },
  { from: 'ride-tidepool-twist-swsd', to: 'w-sesame-center', weight: 1 },

  // Attractions
  { from: 'attraction-skytower-swsd', to: 'w-bayside-north', weight: 1 },
  { from: 'attraction-explorers-reef-swsd', to: 'w-entrance-north', weight: 1 },
  { from: 'attraction-shark-encounter-swsd', to: 'w-bayside-center', weight: 1 },
  { from: 'attraction-wild-arctic-swsd', to: 'w-arctic-west', weight: 1 },
  { from: 'attraction-turtle-reef-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'attraction-penguin-encounter-swsd', to: 'w-arctic-center', weight: 1 },

  // Shows
  { from: 'theater-orca-encounter-swsd', to: 'w-orca-area', weight: 1 },
  { from: 'theater-dolphin-adventures-swsd', to: 'w-bayside-south', weight: 1 },
  { from: 'theater-sea-lion-live-swsd', to: 'w-bayside-south', weight: 1 },
  { from: 'theater-cirque-swsd', to: 'w-bayside-center', weight: 1 },

  // Food connections
  { from: 'food-calypso-bay-swsd', to: 'w-shipwreck-center', weight: 1 },
  { from: 'food-explorers-cafe-swsd', to: 'w-entrance-north', weight: 1 },
  { from: 'food-shipwreck-reef-cafe-swsd', to: 'w-shipwreck-center', weight: 1 },
  { from: 'food-manta-pizza-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'food-chicken-snack-shack-swsd', to: 'w-bayside-center', weight: 1 },
  { from: 'food-hibisco-swsd', to: 'w-bayside-south', weight: 1 },
  { from: 'food-tidal-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'food-dine-with-orcas-swsd', to: 'w-orca-area', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-swsd', to: 'w-entrance-swsd', weight: 1 },
  { from: 'restroom-bayside-swsd', to: 'w-bayside-center', weight: 1 },
  { from: 'restroom-ocean-explorer-swsd', to: 'w-ocean-center', weight: 1 },
  { from: 'restroom-shipwreck-swsd', to: 'w-shipwreck-center', weight: 1 },
  { from: 'restroom-sesame-swsd', to: 'w-sesame-center', weight: 1 },
  { from: 'service-first-aid-swsd', to: 'w-entrance-swsd', weight: 1 },
  { from: 'service-guest-services-swsd', to: 'w-entrance-swsd', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-park-entrance-swsd', to: 'w-entrance-swsd', weight: 1 },
  { from: 'shop-arctic-gifts-swsd', to: 'w-arctic-center', weight: 1 },
  { from: 'shop-ocean-explorer-swsd', to: 'w-ocean-north', weight: 1 },
];

export const SEAWORLD_SAN_DIEGO_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'seaworld-san-diego',
  pois: SEAWORLD_SAN_DIEGO_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
