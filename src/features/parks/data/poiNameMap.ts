import { ParkPOI } from '../types';
import { KNOTTS_POI } from './knottsPOI';

// ============================================
// POI Name Map — for text linking in guides
//
// Auto-generated from ALL park POI data at init time,
// with manual aliases as overrides for common variants.
//
// Maps display names (as they appear in guide text)
// to POI IDs. Sorted by length descending during
// regex building to match longest first.
// ============================================

/**
 * Manual aliases — variants, abbreviations, and alternate
 * spellings that can't be derived from poi.name alone.
 * These take priority over auto-generated entries.
 */
const MANUAL_ALIASES: Record<string, string> = {
  // ---- Knott's alternate names ----
  'Ghost Rider': 'ride-ghostrider',
  'Hang Time': 'ride-hangtime',
  'MonteZOOMa': 'ride-montezooma',
  "Montezooma's Revenge": 'ride-montezooma',
  'Jaguar': 'ride-jaguar',
  'Log Ride': 'ride-timber-mountain-log-ride',
  "Knott's Bear-y Tales": 'ride-beary-tales',
  'Bear-y Tales': 'ride-beary-tales',
  "Mrs. Knott's": 'food-mrs-knotts-chicken-dinner',
  'Casa California': 'food-casa-california',
  'Berry Market': 'shop-berry-market-candy-parlor',
  'Starbucks': 'food-starbucks-marketplace',
};

/** The final name map — populated lazily on first access */
let _nameMapBuilt = false;
export const POI_NAME_MAP: Record<string, string> = {};

/** Build the name map from all park POIs + manual aliases */
function ensureNameMapBuilt() {
  if (_nameMapBuilt) return;
  _nameMapBuilt = true;

  // First, load all POIs (this populates POI_BY_ID)
  ensureAllPoisLoaded();

  // Auto-generate: map every POI's name → its id
  POI_BY_ID.forEach((poi) => {
    // Only add if not already in manual aliases (manual wins)
    if (!MANUAL_ALIASES[poi.name]) {
      POI_NAME_MAP[poi.name] = poi.id;
    }
  });

  // Apply manual aliases as overrides
  Object.assign(POI_NAME_MAP, MANUAL_ALIASES);
}

/**
 * Get the fully-populated POI name map.
 * Triggers lazy initialization on first call.
 * Use this instead of accessing POI_NAME_MAP directly
 * to ensure all parks are loaded.
 */
export function getPOINameMap(): Record<string, string> {
  ensureNameMapBuilt();
  return POI_NAME_MAP;
}

// ============================================
// POI Lookup by ID (all parks)
// ============================================

// Lazy-initialize the full POI index across all parks
let _allPoisLoaded = false;
const POI_BY_ID = new Map<string, ParkPOI>();
const POI_BY_COASTER_ID = new Map<string, ParkPOI>();

function ensureAllPoisLoaded() {
  if (_allPoisLoaded) return;
  _allPoisLoaded = true;

  // Knott's (already imported)
  for (const poi of KNOTTS_POI) {
    POI_BY_ID.set(poi.id, poi);
    if (poi.coasterId) POI_BY_COASTER_ID.set(poi.coasterId, poi);
  }

  // Other parks — lazy require to avoid circular deps
  const parkModules: Array<{ pois: ParkPOI[] }> = [
    { pois: require('./cedarPointPOI').CEDAR_POINT_POI },
    { pois: require('./kingsIslandPOI').KINGS_ISLAND_POI },
    { pois: require('./carowindsPOI').CAROWINDS_POI },
    { pois: require('./magicMountainPOI').MAGIC_MOUNTAIN_POI },
    { pois: require('./universalHollywoodPOI').UNIVERSAL_HOLLYWOOD_POI },
    { pois: require('./sixFlagsGreatAdventurePOI').SIX_FLAGS_GREAT_ADVENTURE_POI },
    { pois: require('./buschGardensTampaPOI').BUSCH_GARDENS_TAMPA_POI },
    { pois: require('./hersheyparkPOI').HERSHEYPARK_POI },
    { pois: require('./dollywoodPOI').DOLLYWOOD_POI },
    { pois: require('./islandsOfAdventurePOI').ISLANDS_OF_ADVENTURE_POI },
    { pois: require('./magicKingdomPOI').MAGIC_KINGDOM_POI },
    { pois: require('./epicUniversePOI').EPIC_UNIVERSE_POI },
    { pois: require('./universalStudiosFloridaPOI').UNIVERSAL_STUDIOS_FLORIDA_POI },
    { pois: require('./disneylandPOI').DISNEYLAND_POI },
    { pois: require('./legolandCaliforniaPOI').LEGOLAND_CALIFORNIA_POI },
    { pois: require('./dorneyParkPOI').DORNEY_PARK_POI },
    { pois: require('./canadasWonderlandPOI').CANADAS_WONDERLAND_POI },
    { pois: require('./legolandFloridaPOI').LEGOLAND_FLORIDA_POI },
    { pois: require('./seaworldOrlandoPOI').SEAWORLD_ORLANDO_POI },
    { pois: require('./seaworldSanDiegoPOI').SEAWORLD_SAN_DIEGO_POI },
    { pois: require('./hollywoodStudiosPOI').HOLLYWOOD_STUDIOS_POI },
    { pois: require('./animalKingdomPOI').ANIMAL_KINGDOM_POI },
  ];
  for (const mod of parkModules) {
    for (const poi of mod.pois) {
      POI_BY_ID.set(poi.id, poi);
      if (poi.coasterId) POI_BY_COASTER_ID.set(poi.coasterId, poi);
    }
  }
}

/** Look up a POI by its ID (handles ride- prefix variants). Searches all parks. */
export function getPOIById(id: string): ParkPOI | null {
  ensureAllPoisLoaded();
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
// POI Lookup by Coaster Index ID (all parks)
// ============================================

/** Look up a ParkPOI by its coaster index ID (reverse of coasterId → POI). Searches all parks. */
export function getPOIByCoasterId(coasterId: string): ParkPOI | null {
  ensureAllPoisLoaded();
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
