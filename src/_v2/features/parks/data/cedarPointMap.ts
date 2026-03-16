import { ParkMapData } from '../types';

// ============================================
// Cedar Point Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Far left: Main entrance, GateKeeper arch
// - Left: Boardwalk area (Siren's Curse, Wild Mouse)
// - Center-left: Main Midway (Raptor, Power Tower, Blue Streak)
// - Center: Celebration Plaza (Valravn, maXair, WindSeeker)
// - Center-right: Gemini Midway (Gemini, Magnum XL-200)
// - Right: Frontier Town (Cedar Creek Mine Ride, Skyhawk)
// - Far right: Steel Vengeance, Millennium Force, Maverick
// ============================================

export const CEDAR_POINT_MAP: ParkMapData = {
  parkSlug: 'cedar-point',
  nodes: [
    // === ENTRANCE ===
    { id: 'entrance-main', x: 0.15, y: 0.65, type: 'entrance', name: 'Main Entrance' },

    // === RIDES ===
    { id: 'ride-steel-vengeance', x: 0.72, y: 0.55, type: 'ride', name: 'Steel Vengeance', coasterId: 'steel-vengeance' },
    { id: 'ride-millennium-force', x: 0.82, y: 0.40, type: 'ride', name: 'Millennium Force', coasterId: 'millennium-force' },
    { id: 'ride-maverick', x: 0.88, y: 0.52, type: 'ride', name: 'Maverick', coasterId: 'maverick' },

    // === RESTAURANTS ===
    { id: 'food-grand-pavilion', x: 0.20, y: 0.30, type: 'restaurant', name: 'Cedar Point Grand Pavilion' },
    { id: 'food-backbeat-que', x: 0.66, y: 0.52, type: 'restaurant', name: 'BackBeatQue' },

    // === RESTROOMS ===
    { id: 'restroom-main', x: 0.28, y: 0.52, type: 'restroom' },
    { id: 'restroom-frontier', x: 0.66, y: 0.46, type: 'restroom' },

    // === INTERSECTION NODES ===
    { id: 'int-entrance', x: 0.15, y: 0.62, type: 'intersection' },
    { id: 'int-main-midway', x: 0.32, y: 0.45, type: 'intersection' },
    { id: 'int-celebration', x: 0.40, y: 0.32, type: 'intersection' },
    { id: 'int-boardwalk', x: 0.18, y: 0.32, type: 'intersection' },
    { id: 'int-gemini', x: 0.56, y: 0.36, type: 'intersection' },
    { id: 'int-frontier-center', x: 0.66, y: 0.48, type: 'intersection' },
    { id: 'int-frontier-east', x: 0.74, y: 0.52, type: 'intersection' },
    { id: 'int-millennium', x: 0.80, y: 0.42, type: 'intersection' },
    { id: 'int-maverick', x: 0.86, y: 0.50, type: 'intersection' },
  ],

  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-main-midway', weight: 2 },
    { from: 'int-main-midway', to: 'int-celebration', weight: 2 },
    { from: 'int-main-midway', to: 'int-boardwalk', weight: 2 },
    { from: 'int-celebration', to: 'int-gemini', weight: 2 },
    { from: 'int-gemini', to: 'int-frontier-center', weight: 2 },
    { from: 'int-frontier-center', to: 'int-frontier-east', weight: 2 },
    { from: 'int-frontier-east', to: 'int-millennium', weight: 2 },
    { from: 'int-millennium', to: 'int-maverick', weight: 2 },
    { from: 'ride-steel-vengeance', to: 'int-frontier-east', weight: 1 },
    { from: 'ride-millennium-force', to: 'int-millennium', weight: 1 },
    { from: 'ride-maverick', to: 'int-maverick', weight: 1 },
    { from: 'food-grand-pavilion', to: 'int-boardwalk', weight: 1 },
    { from: 'food-backbeat-que', to: 'int-frontier-center', weight: 1 },
    { from: 'restroom-main', to: 'int-main-midway', weight: 1 },
    { from: 'restroom-frontier', to: 'int-frontier-center', weight: 1 },
  ],
};
