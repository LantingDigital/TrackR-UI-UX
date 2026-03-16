import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { SEAWORLD_ORLANDO_POI } from './seaworldOrlandoPOI';

// ============================================
// SeaWorld Orlando — Unified Map Data
//
// Park center: 28.4112, -81.4612
// Layout: Circular path around central lake
// Entrance at south, clockwise: Shallows -> Legends ->
//   Mystery -> Power -> Ice -> Sesame -> Delight (back)
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Entrance & Port of Entry
  { id: 'w-entrance-swo', x: 0.50, y: 0.90 },
  { id: 'w-port-north', x: 0.50, y: 0.78 },

  // Main loop junctions (clockwise from entrance)
  { id: 'w-shallows-south', x: 0.38, y: 0.72 },
  { id: 'w-shallows-center', x: 0.35, y: 0.60 },
  { id: 'w-shallows-north', x: 0.30, y: 0.50 },

  { id: 'w-legends-center', x: 0.28, y: 0.42 },

  { id: 'w-mystery-south', x: 0.42, y: 0.38 },
  { id: 'w-mystery-center', x: 0.55, y: 0.38 },
  { id: 'w-mystery-north', x: 0.60, y: 0.42 },

  { id: 'w-power-south', x: 0.68, y: 0.38 },
  { id: 'w-power-center', x: 0.72, y: 0.35 },

  { id: 'w-ice-west', x: 0.75, y: 0.45 },
  { id: 'w-ice-center', x: 0.80, y: 0.52 },
  { id: 'w-ice-south', x: 0.78, y: 0.58 },

  { id: 'w-sesame-center', x: 0.84, y: 0.66 },
  { id: 'w-sesame-south', x: 0.80, y: 0.72 },

  { id: 'w-delight-center', x: 0.52, y: 0.25 },
  { id: 'w-delight-east', x: 0.60, y: 0.30 },

  // Cross paths
  { id: 'w-lake-west', x: 0.42, y: 0.55 },
  { id: 'w-lake-east', x: 0.62, y: 0.55 },
  { id: 'w-return-south', x: 0.65, y: 0.72 },
];

const EDGES: MapEdge[] = [
  // Entrance path
  { from: 'entrance-main-swo', to: 'w-entrance-swo', weight: 1 },
  { from: 'w-entrance-swo', to: 'w-port-north', weight: 2 },

  // Main loop: Port of Entry to Sea of Shallows
  { from: 'w-port-north', to: 'w-shallows-south', weight: 2 },
  { from: 'w-shallows-south', to: 'w-shallows-center', weight: 2 },
  { from: 'w-shallows-center', to: 'w-shallows-north', weight: 2 },

  // Sea of Shallows to Sea of Legends
  { from: 'w-shallows-north', to: 'w-legends-center', weight: 2 },

  // Sea of Legends to Sea of Mystery
  { from: 'w-legends-center', to: 'w-mystery-south', weight: 2 },
  { from: 'w-mystery-south', to: 'w-mystery-center', weight: 2 },
  { from: 'w-mystery-center', to: 'w-mystery-north', weight: 2 },

  // Sea of Mystery to Sea of Power
  { from: 'w-mystery-north', to: 'w-power-south', weight: 2 },
  { from: 'w-power-south', to: 'w-power-center', weight: 2 },

  // Sea of Power to Sea of Ice
  { from: 'w-power-center', to: 'w-ice-west', weight: 2 },
  { from: 'w-ice-west', to: 'w-ice-center', weight: 2 },
  { from: 'w-ice-center', to: 'w-ice-south', weight: 2 },

  // Sea of Ice to Sesame Street
  { from: 'w-ice-south', to: 'w-sesame-center', weight: 2 },
  { from: 'w-sesame-center', to: 'w-sesame-south', weight: 2 },

  // Sesame back to entrance (east side)
  { from: 'w-sesame-south', to: 'w-return-south', weight: 2 },
  { from: 'w-return-south', to: 'w-port-north', weight: 3 },

  // Sea of Delight (north loop)
  { from: 'w-power-center', to: 'w-delight-east', weight: 2 },
  { from: 'w-delight-east', to: 'w-delight-center', weight: 2 },
  { from: 'w-delight-center', to: 'w-mystery-center', weight: 2 },

  // Cross paths through center
  { from: 'w-shallows-center', to: 'w-lake-west', weight: 2 },
  { from: 'w-lake-west', to: 'w-lake-east', weight: 3 },
  { from: 'w-lake-east', to: 'w-ice-south', weight: 2 },

  // ---- Ride connections ----
  // Coasters
  { from: 'ride-mako-swo', to: 'w-power-center', weight: 1 },
  { from: 'ride-kraken-swo', to: 'w-legends-center', weight: 1 },
  { from: 'ride-manta-swo', to: 'w-shallows-south', weight: 1 },
  { from: 'ride-pipeline-swo', to: 'w-delight-center', weight: 1 },
  { from: 'ride-ice-breaker-swo', to: 'w-ice-west', weight: 1 },
  { from: 'ride-penguin-trek-swo', to: 'w-ice-center', weight: 1 },
  { from: 'ride-journey-to-atlantis-swo', to: 'w-mystery-north', weight: 1 },
  { from: 'ride-super-grover-swo', to: 'w-sesame-center', weight: 1 },

  // Other rides
  { from: 'ride-infinity-falls-swo', to: 'w-mystery-north', weight: 1 },
  { from: 'ride-expedition-odyssey-swo', to: 'w-ice-west', weight: 1 },
  { from: 'ride-wild-arctic-swo', to: 'w-ice-center', weight: 1 },
  { from: 'attraction-turtle-trek-swo', to: 'w-shallows-center', weight: 1 },
  { from: 'attraction-shark-encounter-swo', to: 'w-mystery-center', weight: 1 },
  { from: 'attraction-dolphin-cove-swo', to: 'w-shallows-center', weight: 1 },
  { from: 'attraction-stingray-lagoon-swo', to: 'w-shallows-center', weight: 1 },
  { from: 'attraction-pacific-point-swo', to: 'w-power-south', weight: 1 },

  // Shows
  { from: 'theater-orca-encounter-swo', to: 'w-power-center', weight: 1 },
  { from: 'theater-dolphin-adventures-swo', to: 'w-shallows-north', weight: 1 },
  { from: 'theater-sea-lion-high-swo', to: 'w-mystery-center', weight: 1 },
  { from: 'theater-nautilus-swo', to: 'w-mystery-south', weight: 1 },

  // Food connections
  { from: 'food-sharks-underwater-grill', to: 'w-mystery-south', weight: 1 },
  { from: 'food-voyagers-smokehouse', to: 'w-delight-center', weight: 1 },
  { from: 'food-expedition-cafe-swo', to: 'w-ice-west', weight: 1 },
  { from: 'food-seafire-grill-swo', to: 'w-power-south', weight: 1 },
  { from: 'food-lakeside-grill-swo', to: 'w-delight-center', weight: 1 },
  { from: 'food-altitude-burgers-swo', to: 'w-power-center', weight: 1 },
  { from: 'food-waterway-grill-swo', to: 'w-mystery-north', weight: 1 },
  { from: 'food-dockside-pizza-swo', to: 'w-shallows-south', weight: 1 },
  { from: 'food-coaster-coffee-swo', to: 'w-entrance-swo', weight: 1 },
  { from: 'food-chick-fil-a-swo', to: 'w-shallows-south', weight: 1 },
  { from: 'food-captain-petes-swo', to: 'w-shallows-center', weight: 1 },
  { from: 'food-panini-shore-swo', to: 'w-legends-center', weight: 1 },
  { from: 'food-sesame-abc-eats-swo', to: 'w-sesame-center', weight: 1 },

  // Service connections
  { from: 'restroom-entrance-swo', to: 'w-entrance-swo', weight: 1 },
  { from: 'restroom-sea-of-shallows', to: 'w-shallows-center', weight: 1 },
  { from: 'restroom-sea-of-mystery', to: 'w-mystery-center', weight: 1 },
  { from: 'restroom-sea-of-power', to: 'w-power-south', weight: 1 },
  { from: 'restroom-sea-of-ice', to: 'w-ice-center', weight: 1 },
  { from: 'restroom-sesame-swo', to: 'w-sesame-center', weight: 1 },
  { from: 'service-first-aid-swo', to: 'w-entrance-swo', weight: 1 },
  { from: 'service-guest-services-swo', to: 'w-entrance-swo', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'ride-seaquest-swo', to: 'w-mystery-north', weight: 1 },
  { from: 'shop-shamu-emporium-swo', to: 'w-port-north', weight: 1 },
  { from: 'shop-mako-shark-swo', to: 'w-power-center', weight: 1 },
  { from: 'shop-sesame-store-swo', to: 'w-sesame-center', weight: 1 },
];

export const SEAWORLD_ORLANDO_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'seaworld-orlando',
  pois: SEAWORLD_ORLANDO_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
