import { ParkMapData } from '../types';

// ============================================
// Six Flags Fiesta Texas Park Map — Graph Data
// Coordinates are 0-1 percentages mapped to the illustrated map image.
//
// Park layout:
// - South: Rockville (entrance, Iron Rattler, Poltergeist)
// - Center: Crackaxle Canyon (Superman, Dr. Diabolical's)
// - West: Spassburg (Rattler, Boomerang)
// - East: Los Festivales (Wonder Woman, Chupacabra)
// - Northeast: Screampunk District
// - Northwest: DC Universe (Batman)
// ============================================

export const SIX_FLAGS_FIESTA_TEXAS_MAP: ParkMapData = {
  parkSlug: 'six-flags-fiesta-texas',
  nodes: [
    { id: 'entrance-main', x: 0.45, y: 0.82, type: 'entrance', name: 'Main Entrance' },
    { id: 'ride-iron-rattler', x: 0.42, y: 0.35, type: 'ride', name: 'Iron Rattler', coasterId: 'iron-rattler' },
    { id: 'ride-chupacabra', x: 0.65, y: 0.40, type: 'ride', name: 'Chupacabra', coasterId: 'chupacabra' },
    { id: 'ride-poltergeist', x: 0.38, y: 0.42, type: 'ride', name: 'Poltergeist', coasterId: 'poltergeist' },
    { id: 'ride-dr-diabolicals', x: 0.50, y: 0.30, type: 'ride', name: "Dr. Diabolical's Cliffhanger", coasterId: 'dr-diabolicals-cliffhanger' },
    { id: 'ride-wonder-woman', x: 0.68, y: 0.35, type: 'ride', name: 'Wonder Woman Golden Lasso Coaster', coasterId: 'wonder-woman-golden-lasso-coaster' },
    { id: 'ride-superman-krypton', x: 0.48, y: 0.22, type: 'ride', name: 'Superman: Krypton Coaster', coasterId: 'superman-krypton-coaster' },
    { id: 'ride-batman-sfft', x: 0.25, y: 0.20, type: 'ride', name: 'Batman The Ride', coasterId: 'batman-the-ride-six-flags-fiesta-texas' },
    { id: 'ride-boomerang-sfft', x: 0.30, y: 0.45, type: 'ride', name: 'Boomerang', coasterId: 'boomerang-six-flags-fiesta-texas' },
    { id: 'ride-rattler-sfft', x: 0.32, y: 0.38, type: 'ride', name: 'Rattler', coasterId: 'rattler-six-flags-fiesta-texas' },
    { id: 'ride-road-runner-express', x: 0.62, y: 0.50, type: 'ride', name: 'Road Runner Express', coasterId: 'road-runner-express-six-flags-fiesta-texas' },
    { id: 'food-crackaxle-grill', x: 0.52, y: 0.34, type: 'restaurant', name: 'Crackaxle Grill' },
    { id: 'food-sangerfest-halle', x: 0.34, y: 0.40, type: 'restaurant', name: 'Sangerfest Halle' },
    { id: 'restroom-entrance', x: 0.43, y: 0.78, type: 'restroom' },
    { id: 'int-entrance', x: 0.45, y: 0.75, type: 'intersection' },
    { id: 'int-rockville', x: 0.42, y: 0.50, type: 'intersection' },
    { id: 'int-rockville-north', x: 0.42, y: 0.40, type: 'intersection' },
    { id: 'int-crackaxle', x: 0.50, y: 0.32, type: 'intersection' },
    { id: 'int-crackaxle-north', x: 0.48, y: 0.24, type: 'intersection' },
    { id: 'int-spassburg', x: 0.32, y: 0.40, type: 'intersection' },
    { id: 'int-los-festivales', x: 0.64, y: 0.42, type: 'intersection' },
    { id: 'int-screampunk', x: 0.58, y: 0.22, type: 'intersection' },
    { id: 'int-dc-universe', x: 0.26, y: 0.24, type: 'intersection' },
  ],
  edges: [
    { from: 'entrance-main', to: 'int-entrance', weight: 1 },
    { from: 'int-entrance', to: 'int-rockville', weight: 2 },
    { from: 'int-rockville', to: 'int-rockville-north', weight: 2 },
    { from: 'int-rockville-north', to: 'int-crackaxle', weight: 2 },
    { from: 'int-rockville-north', to: 'int-spassburg', weight: 2 },
    { from: 'int-crackaxle', to: 'int-crackaxle-north', weight: 2 },
    { from: 'int-crackaxle', to: 'int-los-festivales', weight: 2 },
    { from: 'int-crackaxle-north', to: 'int-screampunk', weight: 2 },
    { from: 'int-crackaxle-north', to: 'int-dc-universe', weight: 2 },
    { from: 'int-spassburg', to: 'int-dc-universe', weight: 2 },
    { from: 'int-crackaxle', to: 'ride-dr-diabolicals', weight: 1 },
    { from: 'int-crackaxle-north', to: 'ride-superman-krypton', weight: 1 },
    { from: 'int-rockville-north', to: 'ride-iron-rattler', weight: 1 },
    { from: 'int-rockville-north', to: 'ride-poltergeist', weight: 1 },
    { from: 'int-los-festivales', to: 'ride-chupacabra', weight: 1 },
    { from: 'int-los-festivales', to: 'ride-wonder-woman', weight: 1 },
    { from: 'int-los-festivales', to: 'ride-road-runner-express', weight: 1 },
    { from: 'int-dc-universe', to: 'ride-batman-sfft', weight: 1 },
    { from: 'int-spassburg', to: 'ride-boomerang-sfft', weight: 1 },
    { from: 'int-spassburg', to: 'ride-rattler-sfft', weight: 1 },
    { from: 'int-crackaxle', to: 'food-crackaxle-grill', weight: 1 },
    { from: 'int-spassburg', to: 'food-sangerfest-halle', weight: 1 },
    { from: 'restroom-entrance', to: 'int-entrance', weight: 1 },
  ],
};
