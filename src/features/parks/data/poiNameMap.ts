import { ParkPOI } from '../types';
import { KNOTTS_POI } from './knottsPOI';

// ============================================
// POI Name Map — for text linking in guides
//
// Maps display names (as they appear in guide text)
// to POI IDs. Covers rides, food, shops, attractions.
// Sorted by length descending during regex building
// to match longest first.
// ============================================

export const POI_NAME_MAP: Record<string, string> = {
  // ---- Coasters ----
  'GhostRider': 'ride-ghostrider',
  'Ghost Rider': 'ride-ghostrider',
  'Xcelerator': 'ride-xcelerator',
  'Silver Bullet': 'ride-silver-bullet',
  'HangTime': 'ride-hangtime',
  'Hang Time': 'ride-hangtime',
  'MonteZOOMa': 'ride-montezooma',
  "Montezooma's Revenge": 'ride-montezooma',
  'Jaguar!': 'ride-jaguar',
  'Jaguar': 'ride-jaguar',
  'Sierra Sidewinder': 'ride-sierra-sidewinder',
  'Pony Express': 'ride-pony-express',
  'Coast Rider': 'ride-coast-rider',

  // ---- Other Rides ----
  'Calico Mine Ride': 'ride-calico-mine-ride',
  'Timber Mountain Log Ride': 'ride-timber-mountain-log-ride',
  'Log Ride': 'ride-timber-mountain-log-ride',
  'Calico Railroad': 'ride-calico-railroad',
  'Calico River Rapids': 'ride-calico-river-rapids',
  'Supreme Scream': 'ride-supreme-scream',
  'Sky Cabin': 'ride-sky-cabin',
  'Wipeout': 'ride-wipeout',
  'Surfside Gliders': 'ride-surfside-gliders',
  'Pacific Scrambler': 'ride-pacific-scrambler',
  "Knott's Bear-y Tales": 'ride-beary-tales',
  'Bear-y Tales': 'ride-beary-tales',
  'Wheeler Dealer Bumper Cars': 'ride-wheeler-dealer-bumper-cars',
  'La Revolución': 'ride-la-revolucion',
  'Hat Dance': 'ride-hat-dance',
  'Dragon Swing': 'ride-dragon-swing',
  'Los Voladores': 'ride-los-voladores',
  'Sol Spin': 'ride-sol-spin',
  'Carnaval de California': 'ride-carnaval-de-california',
  'Butterfield Stagecoach': 'ride-butterfield-stagecoach',
  'Flying Ace': 'ride-flying-ace',
  'Balloon Race': 'ride-balloon-race',
  'Rapid River Run': 'ride-rapid-river-run',
  'Linus Launcher': 'ride-linus-launcher',
  'Beagle Express Railroad': 'ride-beagle-express-railroad',

  // ---- Food ----
  "Mrs. Knott's Chicken Dinner Restaurant": 'food-mrs-knotts-chicken-dinner',
  "Mrs. Knott's": 'food-mrs-knotts-chicken-dinner',
  'Ghost Town Bakery': 'food-ghost-town-bakery',
  'Calico Saloon': 'food-calico-saloon',
  'Boardwalk BBQ': 'food-boardwalk-bbq',
  "Fireman's BBQ": 'food-firemans-bbq',
  'Johnny Rockets': 'food-johnny-rockets',
  'Panda Express': 'food-panda-express',
  'Coasters Diner': 'food-coasters-diner',
  'Gourmet Churro Factory': 'food-gourmet-churro-factory',
  'Casa California Restaurante': 'food-casa-california',
  'Casa California': 'food-casa-california',
  'Grizzly Creek Lodge': 'food-grizzly-creek-lodge',
  'Prop Shop Pizzeria': 'food-prop-shop-pizzeria',
  'Starbucks': 'food-starbucks-marketplace',
  'Charleston Circle Coffee': 'food-charleston-circle-coffee',
  'Cable Car Kitchen': 'food-cable-car-kitchen',
  'Farm Bakery': 'food-farm-bakery',
  'Chicken-To-Go': 'food-chicken-to-go',
  'Ghost Town Deli': 'food-ghost-town-deli',
  'Judge Roy Bean': 'food-judge-roy-bean',
  'Baja Taqueria': 'food-baja-taqueria',
  'Papas Mexicanas': 'food-papas-mexicanas',

  // ---- Shops ----
  'General Store': 'shop-general-store',
  'Fiesta Mercado': 'shop-fiesta-mercado',
  'Berry Market': 'shop-berry-market-candy-parlor',
  'Marketplace Emporium': 'shop-marketplace-emporium',
  'Build-A-Bear Workshop': 'shop-build-a-bear',
  'Independence Hall': 'shop-independence-hall',

  // ---- Attractions ----
  'The Walter Knott Theater': 'attraction-walter-knott-theater',
  'Bird Cage Theatre': 'attraction-bird-cage-theatre',
  'Western Trails Museum': 'attraction-western-trails-museum',
  'Pan for Gold': 'attraction-pan-for-gold',
  'Calico Mine Stage': 'attraction-calico-mine-stage',
  'Boardwalk Arcade': 'attraction-boardwalk-arcade',
};

// ============================================
// POI Lookup by ID
// ============================================

const POI_BY_ID = new Map<string, ParkPOI>();
for (const poi of KNOTTS_POI) {
  POI_BY_ID.set(poi.id, poi);
}

/** Look up a POI by its ID (handles ride- prefix variants) */
export function getPOIById(id: string): ParkPOI | null {
  // Direct lookup first
  const direct = POI_BY_ID.get(id);
  if (direct) return direct;

  // Try adding ride- prefix
  if (!id.startsWith('ride-')) {
    const withPrefix = POI_BY_ID.get(`ride-${id}`);
    if (withPrefix) return withPrefix;
  }

  return null;
}

// ============================================
// POI Lookup by Coaster Index ID
// ============================================

const POI_BY_COASTER_ID = new Map<string, ParkPOI>();
for (const poi of KNOTTS_POI) {
  if (poi.coasterId) {
    POI_BY_COASTER_ID.set(poi.coasterId, poi);
  }
}

/** Look up a ParkPOI by its coaster index ID (reverse of coasterId → POI) */
export function getPOIByCoasterId(coasterId: string): ParkPOI | null {
  return POI_BY_COASTER_ID.get(coasterId) ?? null;
}

// ============================================
// Wait Time ID Resolution
// ============================================

const WAIT_TIME_ALIASES: Record<string, string> = {
  'ride-montezooma': 'ride-montezooma',
  montezooma: 'ride-montezooma',
};

/** Resolve a wait time raw ID to a POI ID */
export function resolveWaitTimeId(rawId: string): string {
  if (WAIT_TIME_ALIASES[rawId]) return WAIT_TIME_ALIASES[rawId];
  // Strip ride- prefix as fallback
  return rawId.startsWith('ride-') ? rawId : `ride-${rawId}`;
}
