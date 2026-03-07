import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { KINGS_ISLAND_POI } from './kingsIslandPOI';

// ============================================
// Kings Island — Unified Map Data
//
// Park center: 39.3451, -84.2690
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'w-entrance-ki', x: 0.40, y: 0.85 },
  { id: 'w-international-street', x: 0.42, y: 0.72 },
  { id: 'w-fountain-plaza', x: 0.44, y: 0.58 },
  { id: 'w-coney-mall-west', x: 0.48, y: 0.55 },
  { id: 'w-coney-mall-east', x: 0.55, y: 0.60 },
  { id: 'w-action-zone-south', x: 0.30, y: 0.50 },
  { id: 'w-action-zone-north', x: 0.26, y: 0.38 },
  { id: 'w-oktoberfest', x: 0.46, y: 0.42 },
  { id: 'w-rivertown-west', x: 0.60, y: 0.44 },
  { id: 'w-rivertown-east', x: 0.72, y: 0.48 },
  { id: 'w-planet-snoopy', x: 0.40, y: 0.22 },
  { id: 'w-area-72', x: 0.72, y: 0.24 },
  { id: 'w-adventure-port', x: 0.45, y: 0.36 },
];

const EDGES: MapEdge[] = [
  // Entrance to International Street
  { from: 'entrance-main-ki', to: 'w-entrance-ki', weight: 1 },
  { from: 'w-entrance-ki', to: 'w-international-street', weight: 2 },
  { from: 'w-international-street', to: 'w-fountain-plaza', weight: 2 },

  // Fountain plaza branches
  { from: 'w-fountain-plaza', to: 'w-coney-mall-west', weight: 2 },
  { from: 'w-fountain-plaza', to: 'w-action-zone-south', weight: 2 },
  { from: 'w-fountain-plaza', to: 'w-oktoberfest', weight: 2 },

  // Coney Mall
  { from: 'w-coney-mall-west', to: 'w-coney-mall-east', weight: 2 },

  // Action Zone
  { from: 'w-action-zone-south', to: 'w-action-zone-north', weight: 2 },

  // Oktoberfest to other areas
  { from: 'w-oktoberfest', to: 'w-adventure-port', weight: 2 },
  { from: 'w-oktoberfest', to: 'w-rivertown-west', weight: 2 },
  { from: 'w-adventure-port', to: 'w-planet-snoopy', weight: 2 },
  { from: 'w-adventure-port', to: 'w-action-zone-north', weight: 2 },

  // Rivertown
  { from: 'w-rivertown-west', to: 'w-rivertown-east', weight: 2 },
  { from: 'w-coney-mall-east', to: 'w-rivertown-west', weight: 2 },

  // Area 72
  { from: 'w-rivertown-east', to: 'w-area-72', weight: 2 },
  { from: 'w-planet-snoopy', to: 'w-area-72', weight: 2 },

  // Coaster connections
  { from: 'ride-orion', to: 'w-area-72', weight: 1 },
  { from: 'ride-the-beast', to: 'w-rivertown-east', weight: 1 },
  { from: 'ride-diamondback', to: 'w-rivertown-west', weight: 1 },
  { from: 'ride-mystic-timbers', to: 'w-rivertown-east', weight: 1 },
  { from: 'ride-banshee', to: 'w-action-zone-north', weight: 1 },
  { from: 'ride-flight-of-fear', to: 'w-area-72', weight: 1 },
  { from: 'ride-the-racer', to: 'w-coney-mall-east', weight: 1 },
  { from: 'ride-invertigo', to: 'w-action-zone-south', weight: 1 },
  { from: 'ride-adventure-express', to: 'w-adventure-port', weight: 1 },
  { from: 'ride-queen-city-stunt-coaster', to: 'w-action-zone-south', weight: 1 },
  { from: 'ride-the-bat', to: 'w-action-zone-north', weight: 1 },
  { from: 'ride-woodstock-express-ki', to: 'w-planet-snoopy', weight: 1 },

  // Thrill ride connections
  { from: 'ride-drop-tower', to: 'w-action-zone-south', weight: 1 },
  { from: 'ride-delirium', to: 'w-action-zone-north', weight: 1 },
  { from: 'ride-windseeker-ki', to: 'w-coney-mall-west', weight: 1 },
  { from: 'ride-viking-fury', to: 'w-oktoberfest', weight: 1 },

  // Food connections
  { from: 'food-skyline-chili', to: 'w-coney-mall-east', weight: 1 },
  { from: 'food-larosas-pizza', to: 'w-coney-mall-west', weight: 1 },
  { from: 'food-miami-river-brewhouse', to: 'w-rivertown-west', weight: 1 },
  { from: 'food-grain-and-grill', to: 'w-oktoberfest', weight: 1 },
  { from: 'food-starbucks-ki', to: 'w-international-street', weight: 1 },

  // Service connections
  { from: 'restroom-international-street', to: 'w-international-street', weight: 1 },
  { from: 'restroom-coney-mall', to: 'w-coney-mall-west', weight: 1 },
  { from: 'restroom-action-zone', to: 'w-action-zone-south', weight: 1 },
  { from: 'restroom-rivertown', to: 'w-rivertown-west', weight: 1 },
  { from: 'restroom-planet-snoopy', to: 'w-planet-snoopy', weight: 1 },
  { from: 'service-first-aid-ki', to: 'w-international-street', weight: 1 },
  { from: 'service-guest-services-ki', to: 'w-entrance-ki', weight: 1 },
];

export const KINGS_ISLAND_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'kings-island',
  pois: KINGS_ISLAND_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
