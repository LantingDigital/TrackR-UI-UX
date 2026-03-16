import { ParkMapData } from '../types';

// ============================================
// Knott's Berry Farm Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Map image layout (assets/parks/knotts-map.png):
// - Bottom-left: GhostRider (large wooden coaster, triangular lift hill)
// - Far right: Xcelerator (tall launch tower / top-hat)
// - Top-left: Water rides / Camp Snoopy area (blue slides)
// - Center-left: Ghost Town (western buildings, mine ride)
// - Top-center: Central plaza with fountain
// - Top-right: Steel coasters cluster
// - Bottom-center: Entrance / Marketplace buildings
// ============================================

export const KNOTTS_MAP: ParkMapData = {
  parkSlug: 'knotts-berry-farm',
  nodes: [
    // === ENTRANCE (bottom-center, building cluster) ===
    { id: 'entrance-main', x: 0.35, y: 0.88, type: 'entrance', name: 'Main Entrance' },

    // === RIDES (positions matched to illustrated map) ===
    { id: 'ride-ghostrider', x: 0.18, y: 0.62, type: 'ride', name: 'GhostRider', coasterId: 'ghostrider' },
    { id: 'ride-xcelerator', x: 0.92, y: 0.13, type: 'ride', name: 'Xcelerator', coasterId: 'xcelerator' },

    // === RESTAURANTS ===
    { id: 'food-chicken-dinner', x: 0.30, y: 0.82, type: 'restaurant', name: "Mrs. Knott's Chicken Dinner" },
    { id: 'food-ghost-town-grill', x: 0.32, y: 0.46, type: 'restaurant', name: 'Ghost Town Grill' },
    { id: 'food-boardwalk-bbq', x: 0.72, y: 0.68, type: 'restaurant', name: 'Boardwalk BBQ' },
    { id: 'food-fiesta-cantina', x: 0.62, y: 0.33, type: 'restaurant', name: 'Fiesta Village Cantina' },
    { id: 'food-snoopy-snacks', x: 0.18, y: 0.28, type: 'restaurant', name: "Snoopy's Snack Bar" },

    // === RESTROOMS ===
    { id: 'restroom-entrance', x: 0.40, y: 0.85, type: 'restroom' },
    { id: 'restroom-ghost-town', x: 0.25, y: 0.52, type: 'restroom' },
    { id: 'restroom-boardwalk', x: 0.68, y: 0.56, type: 'restroom' },
    { id: 'restroom-fiesta', x: 0.72, y: 0.26, type: 'restroom' },

    // === INTERSECTION NODES (path network along walkways) ===
    { id: 'int-entry-plaza', x: 0.35, y: 0.83, type: 'intersection' },
    { id: 'int-marketplace', x: 0.35, y: 0.74, type: 'intersection' },
    { id: 'int-ghost-town-entry', x: 0.28, y: 0.64, type: 'intersection' },
    { id: 'int-ghost-town-center', x: 0.30, y: 0.50, type: 'intersection' },
    { id: 'int-ghost-town-north', x: 0.30, y: 0.38, type: 'intersection' },
    { id: 'int-water-rides', x: 0.20, y: 0.25, type: 'intersection' },
    { id: 'int-central-plaza', x: 0.47, y: 0.27, type: 'intersection' },
    { id: 'int-central-path', x: 0.48, y: 0.44, type: 'intersection' },
    { id: 'int-central-south', x: 0.46, y: 0.58, type: 'intersection' },
    { id: 'int-fiesta-entry', x: 0.58, y: 0.30, type: 'intersection' },
    { id: 'int-coaster-alley', x: 0.75, y: 0.20, type: 'intersection' },
    { id: 'int-boardwalk-north', x: 0.65, y: 0.42, type: 'intersection' },
    { id: 'int-boardwalk-center', x: 0.68, y: 0.54, type: 'intersection' },
    { id: 'int-boardwalk-south', x: 0.62, y: 0.66, type: 'intersection' },
    { id: 'int-south-cross', x: 0.48, y: 0.72, type: 'intersection' },
    { id: 'int-east-path', x: 0.85, y: 0.18, type: 'intersection' },
  ],

  edges: [
    // Entrance to Entry Plaza
    { from: 'entrance-main', to: 'int-entry-plaza', weight: 1 },
    { from: 'int-entry-plaza', to: 'restroom-entrance', weight: 1 },
    { from: 'int-entry-plaza', to: 'food-chicken-dinner', weight: 1 },

    // Entry plaza through marketplace
    { from: 'int-entry-plaza', to: 'int-marketplace', weight: 1 },
    { from: 'int-marketplace', to: 'int-ghost-town-entry', weight: 2 },
    { from: 'int-marketplace', to: 'int-south-cross', weight: 2 },

    // Ghost Town path (left side of park)
    { from: 'int-ghost-town-entry', to: 'ride-ghostrider', weight: 1 },
    { from: 'int-ghost-town-entry', to: 'int-ghost-town-center', weight: 2 },
    { from: 'int-ghost-town-entry', to: 'int-central-south', weight: 2 },
    { from: 'int-ghost-town-center', to: 'food-ghost-town-grill', weight: 1 },
    { from: 'int-ghost-town-center', to: 'restroom-ghost-town', weight: 1 },
    { from: 'int-ghost-town-center', to: 'int-ghost-town-north', weight: 2 },
    { from: 'int-ghost-town-center', to: 'int-central-path', weight: 2 },

    // Ghost Town north to water rides / Camp Snoopy
    { from: 'int-ghost-town-north', to: 'int-water-rides', weight: 2 },
    { from: 'int-ghost-town-north', to: 'int-central-plaza', weight: 2 },
    { from: 'int-water-rides', to: 'food-snoopy-snacks', weight: 1 },

    // Central plaza (fountain area, top-center)
    { from: 'int-central-plaza', to: 'int-fiesta-entry', weight: 2 },
    { from: 'int-central-plaza', to: 'int-central-path', weight: 2 },
    { from: 'int-central-plaza', to: 'int-water-rides', weight: 2 },

    // Central path (middle spine of park)
    { from: 'int-central-path', to: 'int-central-south', weight: 2 },
    { from: 'int-central-path', to: 'int-boardwalk-north', weight: 2 },

    // Central south to south crossover
    { from: 'int-central-south', to: 'int-south-cross', weight: 2 },
    { from: 'int-central-south', to: 'int-boardwalk-center', weight: 2 },

    // Fiesta Village (right-center area)
    { from: 'int-fiesta-entry', to: 'food-fiesta-cantina', weight: 1 },
    { from: 'int-fiesta-entry', to: 'restroom-fiesta', weight: 1 },
    { from: 'int-fiesta-entry', to: 'int-coaster-alley', weight: 2 },
    { from: 'int-fiesta-entry', to: 'int-boardwalk-north', weight: 2 },

    // Coaster alley (top-right, steel coasters)
    { from: 'int-coaster-alley', to: 'int-east-path', weight: 2 },
    { from: 'int-coaster-alley', to: 'int-boardwalk-north', weight: 2 },

    // East path to Xcelerator (far right)
    { from: 'int-east-path', to: 'ride-xcelerator', weight: 2 },

    // Boardwalk area (right side of park)
    { from: 'int-boardwalk-north', to: 'int-boardwalk-center', weight: 2 },
    { from: 'int-boardwalk-center', to: 'restroom-boardwalk', weight: 1 },
    { from: 'int-boardwalk-center', to: 'int-boardwalk-south', weight: 2 },
    { from: 'int-boardwalk-south', to: 'food-boardwalk-bbq', weight: 1 },
    { from: 'int-boardwalk-south', to: 'int-south-cross', weight: 2 },

    // South crossover (connects bottom east-west)
    { from: 'int-south-cross', to: 'int-boardwalk-south', weight: 2 },
    { from: 'int-south-cross', to: 'int-ghost-town-entry', weight: 2 },
  ],
};
