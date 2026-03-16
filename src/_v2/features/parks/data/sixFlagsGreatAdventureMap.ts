import { ParkMapData } from '../types';

// ============================================
// Six Flags Great Adventure Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: Main Entrance / Main Street
// - Left: Fantasy Forest, Adventure Seeker areas
// - Center: Movietown (Batman, Green Lantern, Joker)
// - Center-right: Frontier Adventures (Mine Train, Log Flume)
// - Right: Plaza del Carnaval (Kingda Ka, El Toro)
// - Far right: Lakefront (Medusa, Jersey Devil)
// ============================================

export const SIX_FLAGS_GREAT_ADVENTURE_MAP: ParkMapData = {
  parkSlug: 'six-flags-great-adventure',
  nodes: [
    { id: 'entrance-main', x: 0.38, y: 0.90, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-kingda-ka', x: 0.62, y: 0.28, type: 'ride', name: 'Kingda Ka', coasterId: 'kingda-ka' },
    { id: 'ride-el-toro', x: 0.55, y: 0.22, type: 'ride', name: 'El Toro', coasterId: 'el-toro' },
    { id: 'ride-nitro', x: 0.35, y: 0.30, type: 'ride', name: 'Nitro', coasterId: 'nitro' },
    { id: 'food-best-of-west', x: 0.48, y: 0.62, type: 'restaurant', name: 'Best of the West' },
    { id: 'restroom-main', x: 0.40, y: 0.82, type: 'restroom' },
    { id: 'int-entrance', x: 0.38, y: 0.85, type: 'intersection' },
    { id: 'int-main-street', x: 0.40, y: 0.75, type: 'intersection' },
    { id: 'int-movietown', x: 0.42, y: 0.50, type: 'intersection' },
    { id: 'int-frontier', x: 0.50, y: 0.62, type: 'intersection' },
    { id: 'int-plaza', x: 0.58, y: 0.30, type: 'intersection' },
    { id: 'int-lakefront', x: 0.72, y: 0.45, type: 'intersection' },
    { id: 'int-adventure', x: 0.32, y: 0.38, type: 'intersection' },
    { id: 'int-fantasy', x: 0.22, y: 0.55, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-street', weight: 2 },
    { from: 'int-main-street', to: 'int-movietown', weight: 2 },
    { from: 'int-main-street', to: 'int-frontier', weight: 2 },
    { from: 'int-movietown', to: 'int-adventure', weight: 2 },
    { from: 'int-movietown', to: 'int-plaza', weight: 2 },
    { from: 'int-adventure', to: 'int-fantasy', weight: 2 },
    { from: 'int-adventure', to: 'ride-nitro', weight: 1 },
    { from: 'int-plaza', to: 'ride-kingda-ka', weight: 1 },
    { from: 'int-plaza', to: 'ride-el-toro', weight: 1 },
    { from: 'int-plaza', to: 'int-lakefront', weight: 2 },
    { from: 'int-frontier', to: 'food-best-of-west', weight: 1 },
    { from: 'restroom-main', to: 'int-main-street', weight: 1 },
  ],
};
