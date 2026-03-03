// Unit conversion factors, type/material/status mappings, and other constants.

// ── Unit Conversion ─────────────────────────────────────────
export const FT_TO_M = 0.3048;
export const M_TO_FT = 3.28084;
export const MPH_TO_KMH = 1.60934;
export const KMH_TO_MPH = 0.621371;

export function round1(n) {
  return Math.round(n * 10) / 10;
}

// ── Material (from Wikipedia "type" field) ──────────────────
export const MATERIAL_MAP = {
  steel: 'Steel',
  wood: 'Steel', // Counterintuitive: Wikipedia "wood" type is just track material
  wooden: 'Wood',
  hybrid: 'Hybrid',
};

// Default: Steel. Override logic for RMC hybrids is in normalizer.
export function normalizeMaterial(typeField) {
  if (!typeField) return 'Steel';
  const lower = typeField.toLowerCase().trim();
  if (lower === 'wood' || lower === 'wooden') return 'Wood';
  if (lower === 'hybrid') return 'Hybrid';
  return 'Steel';
}

// ── Coaster Type (from Wikipedia "type2" field — ride style) ─
export const TYPE_MAP = {
  'sit-down': 'Sit-down',
  'sitting': 'Sit-down',
  inverted: 'Inverted',
  flying: 'Flying',
  wing: 'Wing',
  'wing coaster': 'Wing',
  floorless: 'Floorless',
  dive: 'Dive',
  'dive coaster': 'Dive',
  'stand-up': 'Stand-up',
  standing: 'Stand-up',
  suspended: 'Suspended',
  'suspended swinging': 'Suspended',
  spinning: 'Spinning',
  'spinning coaster': 'Spinning',
  bobsled: 'Bobsled',
  '4th dimension': '4th Dimension',
  '4-d': '4th Dimension',
  '4d': '4th Dimension',
  pipeline: 'Pipeline',
  shuttle: 'Shuttle',
  water: 'Water',
  'water coaster': 'Water',
  family: 'Family',
  kiddie: 'Kiddie',
  junior: 'Kiddie',
  alpine: 'Alpine / Mountain',
  'alpine coaster': 'Alpine / Mountain',
  'mountain coaster': 'Alpine / Mountain',
  'mine train': 'Mine Train',
  'wild mouse': 'Wild Mouse',
  launched: 'Sit-down', // "Launched" describes propulsion, not type
  motorbike: 'Sit-down',
  'powered coaster': 'Family',
  'virginia reel': 'Spinning',
  'side friction': 'Sit-down',
  'terrain': 'Sit-down',
};

export function normalizeType(type2Field, heightFt) {
  if (type2Field) {
    const lower = type2Field.toLowerCase().trim();
    if (TYPE_MAP[lower]) return TYPE_MAP[lower];

    // Try partial matching
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (lower.includes(key)) return value;
    }
  }

  // Fallback: height-based classification
  return classifyByHeight(heightFt) || 'Sit-down';
}

function classifyByHeight(heightFt) {
  if (!heightFt) return null;
  if (heightFt >= 400) return 'Strata';
  if (heightFt >= 300) return 'Giga';
  if (heightFt >= 200) return 'Hyper';
  return null;
}

// ── Propulsion (from Wikipedia "lift" field) ────────────────
export const PROPULSION_MAP = {
  chain: 'Chain lift',
  'chain lift': 'Chain lift',
  cable: 'Cable lift',
  'cable lift': 'Cable lift',
  lsm: 'LSM launch',
  'lsm launch': 'LSM launch',
  'linear synchronous motor': 'LSM launch',
  lim: 'LIM launch',
  'lim launch': 'LIM launch',
  'linear induction motor': 'LIM launch',
  hydraulic: 'Hydraulic launch',
  'hydraulic launch': 'Hydraulic launch',
  pneumatic: 'Pneumatic launch',
  'compressed air': 'Pneumatic launch',
  catapult: 'Catapult',
  'tire drive': 'Tire drive',
  'friction drive': 'Tire drive',
  gravity: 'Gravity',
  'vertical lift': 'Vertical lift',
  'elevator lift': 'Vertical lift',
  'spinning lift': 'Spinning lift',
  launched: 'LSM launch', // Generic "launched" defaults to LSM
};

export function normalizePropulsion(liftField) {
  if (!liftField) return null;
  const lower = liftField.toLowerCase().trim();
  if (PROPULSION_MAP[lower]) return PROPULSION_MAP[lower];

  // Partial match
  for (const [key, value] of Object.entries(PROPULSION_MAP)) {
    if (lower.includes(key)) return value;
  }
  return liftField.trim(); // Return as-is if unrecognized
}

// ── Status ──────────────────────────────────────────────────
export const STATUS_MAP = {
  operating: 'operating',
  open: 'operating',
  opened: 'operating',
  active: 'operating',
  closed: 'closed',
  removed: 'closed',
  demolished: 'closed',
  destroyed: 'closed',
  relocated: 'closed',
  defunct: 'closed',
  sbno: 'sbno',
  'standing but not operating': 'sbno',
  'under construction': 'under_construction',
  'in construction': 'under_construction',
  building: 'under_construction',
  announced: 'announced',
  proposed: 'announced',
  planned: 'announced',
};

export function normalizeStatus(statusField) {
  if (!statusField) return 'operating';
  const lower = statusField.toLowerCase().trim();
  if (STATUS_MAP[lower]) return STATUS_MAP[lower];

  // Partial match
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'operating'; // Default
}

// ── Continent lookup by ISO code ────────────────────────────
export const CONTINENT_MAP = {
  US: 'North America',
  CA: 'North America',
  MX: 'North America',
  GB: 'Europe',
  DE: 'Europe',
  ES: 'Europe',
  FR: 'Europe',
  NL: 'Europe',
  SE: 'Europe',
  DK: 'Europe',
  IT: 'Europe',
  FI: 'Europe',
  PL: 'Europe',
  AT: 'Europe',
  BE: 'Europe',
  JP: 'Asia',
  CN: 'Asia',
  KR: 'Asia',
  AE: 'Asia',
  SG: 'Asia',
  MY: 'Asia',
  TW: 'Asia',
  IN: 'Asia',
  AU: 'Oceania',
  BR: 'South America',
};

// ── Wikipedia API ───────────────────────────────────────────
export const WIKI_API_BASE = 'https://en.wikipedia.org/w/api.php';
export const USER_AGENT = 'TrackR-DataPipeline/1.0 (caleb@lantingdigital.com)';
export const REQUEST_DELAY_MS = 500; // 2 req/sec — conservative for sustained runs
export const MAX_RETRIES = 3;
export const RETRY_BACKOFF_MS = [1000, 2000, 4000]; // Exponential backoff

// ── Coasterpedia API ────────────────────────────────────────
export const CP_API_BASE = 'https://coasterpedia.net/w/api.php';
export const CP_USER_AGENT = 'TrackR-DataPipeline/1.0 (caleb@lantingdigital.com)';
export const CP_REQUEST_DELAY_MS = 1500; // ~0.67 req/sec — respectful for small wiki
export const CP_MAX_RETRIES = 3;
export const CP_RETRY_BACKOFF_MS = [2000, 4000, 8000];
