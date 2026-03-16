import { ParkMapData } from '../types';

// ============================================
// Busch Gardens Williamsburg Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - Bottom-center: England (entrance)
// - West: Scotland → Ireland → New France
// - Center-west: France
// - Center-north: Italy (Pantheon, Apollo's Chariot)
// - Center-east: Germany (Alpengeist, Verbolten)
// - East: Oktoberfest → Sesame Street Forest of Fun
// ============================================

export const BUSCH_GARDENS_WILLIAMSBURG_MAP: ParkMapData = {
  parkSlug: 'busch-gardens-williamsburg',
  nodes: [
    { id: 'entrance-main', x: 0.42, y: 0.90, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-pantheon', x: 0.55, y: 0.20, type: 'ride', name: 'Pantheon', coasterId: 'pantheon' },
    { id: 'ride-apollos-chariot', x: 0.50, y: 0.15, type: 'ride', name: "Apollo's Chariot", coasterId: 'apollos-chariot' },
    { id: 'ride-griffon', x: 0.38, y: 0.32, type: 'ride', name: 'Griffon', coasterId: 'griffon' },
    { id: 'ride-alpengeist', x: 0.62, y: 0.40, type: 'ride', name: 'Alpengeist', coasterId: 'alpengeist' },
    { id: 'ride-verbolten', x: 0.65, y: 0.48, type: 'ride', name: 'Verbolten', coasterId: 'verbolten' },
    { id: 'ride-loch-ness', x: 0.30, y: 0.50, type: 'ride', name: 'Loch Ness Monster', coasterId: 'loch-ness-monster' },
    { id: 'ride-invadr', x: 0.22, y: 0.45, type: 'ride', name: 'InvadR', coasterId: 'invadr' },
    { id: 'food-das-festhaus', x: 0.68, y: 0.50, type: 'restaurant', name: 'Das Festhaus' },
    { id: 'restroom-main', x: 0.44, y: 0.82, type: 'restroom' },
    { id: 'int-entrance', x: 0.42, y: 0.86, type: 'intersection' },
    { id: 'int-england', x: 0.43, y: 0.75, type: 'intersection' },
    { id: 'int-crossroads', x: 0.45, y: 0.50, type: 'intersection' },
    { id: 'int-france', x: 0.36, y: 0.32, type: 'intersection' },
    { id: 'int-italy', x: 0.52, y: 0.28, type: 'intersection' },
    { id: 'int-germany', x: 0.64, y: 0.42, type: 'intersection' },
    { id: 'int-scotland', x: 0.30, y: 0.48, type: 'intersection' },
    { id: 'int-oktoberfest', x: 0.70, y: 0.52, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-england', weight: 2 },
    { from: 'int-england', to: 'int-crossroads', weight: 2 },
    { from: 'int-crossroads', to: 'int-france', weight: 2 },
    { from: 'int-crossroads', to: 'int-germany', weight: 2 },
    { from: 'int-crossroads', to: 'int-scotland', weight: 2 },
    { from: 'int-france', to: 'int-italy', weight: 2 },
    { from: 'int-germany', to: 'int-oktoberfest', weight: 2 },
    { from: 'int-italy', to: 'ride-pantheon', weight: 1 },
    { from: 'int-italy', to: 'ride-apollos-chariot', weight: 1 },
    { from: 'int-france', to: 'ride-griffon', weight: 1 },
    { from: 'int-germany', to: 'ride-alpengeist', weight: 1 },
    { from: 'int-germany', to: 'ride-verbolten', weight: 1 },
    { from: 'int-scotland', to: 'ride-loch-ness', weight: 1 },
    { from: 'int-scotland', to: 'ride-invadr', weight: 1 },
    { from: 'int-oktoberfest', to: 'food-das-festhaus', weight: 1 },
    { from: 'restroom-main', to: 'int-entrance', weight: 1 },
  ],
};
