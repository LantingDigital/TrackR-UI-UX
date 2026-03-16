import { UnifiedParkMapData, MapEdge, WalkwayNode } from '../types';
import { EPIC_UNIVERSE_POI } from './epicUniversePOI';

// ============================================
// Universal Epic Universe — Unified Map Data
//
// Park center: 28.4735, -81.4477
// Hub-and-spoke: Celestial Park hub with 4 portals to themed worlds
// ============================================

const WALKWAY_NODES: WalkwayNode[] = [
  // Celestial Park (hub)
  { id: 'w-entrance-eu', x: 0.50, y: 0.88 },
  { id: 'w-celestial-south', x: 0.50, y: 0.75 },
  { id: 'w-celestial-center', x: 0.50, y: 0.60 },
  { id: 'w-celestial-north', x: 0.50, y: 0.48 },

  // Portal junctions (connecting hub to worlds)
  { id: 'w-portal-nintendo', x: 0.30, y: 0.48 },
  { id: 'w-portal-dark-universe', x: 0.40, y: 0.35 },
  { id: 'w-portal-ministry', x: 0.60, y: 0.35 },
  { id: 'w-portal-berk', x: 0.72, y: 0.42 },

  // Super Nintendo World
  { id: 'w-nintendo-center', x: 0.20, y: 0.38 },
  { id: 'w-nintendo-north', x: 0.18, y: 0.30 },

  // Dark Universe
  { id: 'w-dark-center', x: 0.38, y: 0.22 },
  { id: 'w-dark-north', x: 0.36, y: 0.18 },

  // Ministry of Magic
  { id: 'w-ministry-center', x: 0.64, y: 0.22 },
  { id: 'w-ministry-north', x: 0.66, y: 0.18 },

  // Isle of Berk
  { id: 'w-berk-center', x: 0.80, y: 0.34 },
  { id: 'w-berk-north', x: 0.82, y: 0.26 },
];

const EDGES: MapEdge[] = [
  // Celestial Park main path
  { from: 'entrance-main-eu', to: 'w-entrance-eu', weight: 1 },
  { from: 'w-entrance-eu', to: 'w-celestial-south', weight: 2 },
  { from: 'w-celestial-south', to: 'w-celestial-center', weight: 2 },
  { from: 'w-celestial-center', to: 'w-celestial-north', weight: 2 },

  // Portal connections from hub
  { from: 'w-celestial-north', to: 'w-portal-nintendo', weight: 2 },
  { from: 'w-celestial-north', to: 'w-portal-dark-universe', weight: 2 },
  { from: 'w-celestial-north', to: 'w-portal-ministry', weight: 2 },
  { from: 'w-celestial-north', to: 'w-portal-berk', weight: 2 },

  // Super Nintendo World paths
  { from: 'w-portal-nintendo', to: 'w-nintendo-center', weight: 2 },
  { from: 'w-nintendo-center', to: 'w-nintendo-north', weight: 2 },

  // Dark Universe paths
  { from: 'w-portal-dark-universe', to: 'w-dark-center', weight: 2 },
  { from: 'w-dark-center', to: 'w-dark-north', weight: 2 },

  // Ministry of Magic paths
  { from: 'w-portal-ministry', to: 'w-ministry-center', weight: 2 },
  { from: 'w-ministry-center', to: 'w-ministry-north', weight: 2 },

  // Isle of Berk paths
  { from: 'w-portal-berk', to: 'w-berk-center', weight: 2 },
  { from: 'w-berk-center', to: 'w-berk-north', weight: 2 },

  // Celestial Park ride connections
  { from: 'ride-stardust-racers', to: 'w-celestial-center', weight: 1 },
  { from: 'ride-constellation-carousel', to: 'w-celestial-south', weight: 1 },

  // Nintendo ride connections
  { from: 'ride-mario-kart-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'ride-yoshis-adventure-eu', to: 'w-nintendo-north', weight: 1 },
  { from: 'ride-dk-mine-cart-madness', to: 'w-nintendo-north', weight: 1 },

  // Dark Universe ride connections
  { from: 'ride-monsters-unchained', to: 'w-dark-center', weight: 1 },
  { from: 'ride-curse-of-the-werewolf', to: 'w-dark-north', weight: 1 },

  // Ministry ride connections
  { from: 'ride-battle-at-the-ministry', to: 'w-ministry-center', weight: 1 },

  // Isle of Berk ride connections
  { from: 'ride-hiccups-wing-gliders', to: 'w-berk-center', weight: 1 },
  { from: 'ride-dragon-racers-rally', to: 'w-berk-north', weight: 1 },
  { from: 'ride-fyre-drill', to: 'w-berk-center', weight: 1 },

  // Celestial Park food connections
  { from: 'food-atlantic-eu', to: 'w-celestial-south', weight: 1 },
  { from: 'food-blue-dragon', to: 'w-celestial-south', weight: 1 },
  { from: 'food-pizza-moon', to: 'w-celestial-center', weight: 1 },
  { from: 'food-frosty-moon', to: 'w-celestial-center', weight: 1 },
  { from: 'food-meteor-astropub', to: 'w-celestial-center', weight: 1 },
  { from: 'food-oak-and-star', to: 'w-celestial-center', weight: 1 },

  // Nintendo food connections
  { from: 'food-toadstool-cafe-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'food-yoshis-snack-island-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'food-turbo-boost-treats', to: 'w-nintendo-center', weight: 1 },

  // Dark Universe food connections
  { from: 'food-das-stakehaus', to: 'w-dark-center', weight: 1 },
  { from: 'food-de-laceys-cottage', to: 'w-dark-north', weight: 1 },

  // Ministry food connections
  { from: 'food-cafe-la-sirene', to: 'w-ministry-center', weight: 1 },
  { from: 'food-k-rammelle', to: 'w-ministry-north', weight: 1 },

  // Isle of Berk food connections
  { from: 'food-mead-hall', to: 'w-berk-center', weight: 1 },
  { from: 'food-spit-fyre-grill', to: 'w-berk-center', weight: 1 },
  { from: 'food-hooligans-grog', to: 'w-berk-center', weight: 1 },

  // Service connections
  { from: 'restroom-celestial-park-entrance', to: 'w-entrance-eu', weight: 1 },
  { from: 'restroom-celestial-park-center', to: 'w-celestial-center', weight: 1 },
  { from: 'restroom-nintendo-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'restroom-dark-universe', to: 'w-dark-center', weight: 1 },
  { from: 'restroom-ministry', to: 'w-ministry-center', weight: 1 },
  { from: 'restroom-isle-of-berk', to: 'w-berk-center', weight: 1 },
  { from: 'service-first-aid-eu', to: 'w-entrance-eu', weight: 1 },
  { from: 'service-guest-services-eu', to: 'w-entrance-eu', weight: 1 },

  // Orphan POI connections (auto-connected to nearest walkway node)
  { from: 'shop-other-worlds-mercantile', to: 'w-celestial-south', weight: 1 },
  { from: 'shop-moonship-chocolates', to: 'w-celestial-south', weight: 1 },
  { from: 'shop-nintendo-super-star-store', to: 'w-celestial-center', weight: 1 },
  { from: 'shop-sensorium-emporium', to: 'w-celestial-south', weight: 1 },
  { from: 'shop-1-up-factory-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'shop-mario-motors-eu', to: 'w-nintendo-center', weight: 1 },
  { from: 'shop-funkys-fly-n-buy', to: 'w-nintendo-north', weight: 1 },
  { from: 'shop-pretorius-oddities', to: 'w-dark-center', weight: 1 },
  { from: 'shop-darkmoor-makeup', to: 'w-dark-center', weight: 1 },
  { from: 'shop-acajor-baguettes', to: 'w-ministry-center', weight: 1 },
  { from: 'shop-les-galeries', to: 'w-ministry-center', weight: 1 },
  { from: 'shop-tour-en-floo', to: 'w-portal-ministry', weight: 1 },
  { from: 'shop-toothless-treasures', to: 'w-berk-center', weight: 1 },
  { from: 'shop-viking-traders', to: 'w-berk-north', weight: 1 },
  { from: 'shop-hiccups-workshop', to: 'w-berk-center', weight: 1 },
];

export const EPIC_UNIVERSE_MAP_DATA: UnifiedParkMapData = {
  parkSlug: 'epic-universe',
  pois: EPIC_UNIVERSE_POI,
  walkwayNodes: WALKWAY_NODES,
  edges: EDGES,
};
