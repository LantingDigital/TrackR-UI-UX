// Table parser for Wikipedia ride-list tables.
// Normalizes column headers and extracts coaster data from table rows.

// ── Column name normalization ───────────────────────────────
// Maps various Wikipedia table header spellings to canonical field names.

const COLUMN_MAP = {
  // Name
  'name': 'name',
  'ride': 'name',
  'ride name': 'name',
  'attraction': 'name',
  'attraction name': 'name',
  'coaster': 'name',
  'roller coaster': 'name',
  'coaster name': 'name',

  // Type / Material
  'type': 'typeRaw',
  'style': 'typeRaw',
  'ride type': 'typeRaw',
  'track type': 'typeRaw',
  'material': 'material',

  // Manufacturer
  'manufacturer': 'manufacturer',
  'made by': 'manufacturer',
  'builder': 'manufacturer',
  'constructed by': 'manufacturer',
  'mfr': 'manufacturer',
  'mfr.': 'manufacturer',
  'designed by': 'manufacturer',
  'supplier': 'manufacturer',

  // Height
  'height': 'heightRaw',
  'max height': 'heightRaw',
  'max. height': 'heightRaw',
  'height (ft)': 'heightFt',
  'height (m)': 'heightM',
  'height ft': 'heightFt',
  'height m': 'heightM',

  // Speed
  'speed': 'speedRaw',
  'max speed': 'speedRaw',
  'max. speed': 'speedRaw',
  'top speed': 'speedRaw',
  'speed (mph)': 'speedMph',
  'speed (km/h)': 'speedKmh',
  'speed mph': 'speedMph',
  'speed km/h': 'speedKmh',

  // Length
  'length': 'lengthRaw',
  'track length': 'lengthRaw',
  'length (ft)': 'lengthFt',
  'length (m)': 'lengthM',
  'length ft': 'lengthFt',
  'length m': 'lengthM',

  // Drop
  'drop': 'dropRaw',
  'max drop': 'dropRaw',
  'drop (ft)': 'dropFt',
  'drop (m)': 'dropM',

  // Year / Opened
  'opened': 'yearOpened',
  'year': 'yearOpened',
  'year opened': 'yearOpened',
  'opening date': 'yearOpened',
  'open': 'yearOpened',
  'debut': 'yearOpened',
  'year built': 'yearOpened',
  'built': 'yearOpened',

  // Closed
  'closed': 'yearClosed',
  'year closed': 'yearClosed',

  // Status
  'status': 'status',
  'current status': 'status',

  // Inversions
  'inversions': 'inversions',
  'loops': 'inversions',

  // Duration
  'duration': 'duration',
  'ride time': 'duration',

  // Propulsion
  'propulsion': 'propulsion',
  'launch': 'propulsion',
  'lift': 'propulsion',

  // Model
  'model': 'model',
  'ride model': 'model',
};

/**
 * Normalize a column header to a canonical field name.
 * Returns null if unrecognized.
 */
export function normalizeColumnName(header) {
  if (!header) return null;
  const lower = header.toLowerCase().trim();
  return COLUMN_MAP[lower] || null;
}

/**
 * Score a table to determine if it's likely a roller coaster listing.
 * Returns 0-10, higher = more likely.
 *
 * @param {string[]} headers - Column header names from the table
 * @returns {number}
 */
export function scoreTable(headers) {
  if (!headers || headers.length === 0) return 0;

  const normalized = headers.map((h) => normalizeColumnName(h));
  let score = 0;

  // Must have a name column
  if (normalized.includes('name')) score += 3;
  else return 0; // No name column = definitely not a ride table

  // Bonus for each relevant field
  if (normalized.includes('manufacturer')) score += 2;
  if (normalized.includes('typeRaw') || normalized.includes('material')) score += 1;
  if (normalized.includes('heightRaw') || normalized.includes('heightFt') || normalized.includes('heightM')) score += 1;
  if (normalized.includes('speedRaw') || normalized.includes('speedMph') || normalized.includes('speedKmh')) score += 1;
  if (normalized.includes('yearOpened')) score += 1;
  if (normalized.includes('status')) score += 1;

  return Math.min(score, 10);
}

/**
 * Parse a numeric value from a table cell.
 * Handles "205 ft", "62 mph", "1,524 m", "5,000", etc.
 *
 * @param {string} text - Cell text
 * @returns {number|null}
 */
export function parseTableNum(text) {
  if (!text) return null;

  // Strip commas and common unit suffixes
  const cleaned = text
    .replace(/,/g, '')
    .replace(/\s*(ft|feet|m|meters|metres|mph|km\/h|kmh|kph|s|sec|seconds|'|")\s*/gi, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse year from table cell text.
 * Handles "2025", "May 22, 2025", "1999-present", etc.
 */
export function parseTableYear(text) {
  if (!text) return null;
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Determine if a table row is likely a roller coaster based on type column.
 *
 * @param {object} mappedRow - Row with canonical field names
 * @returns {boolean}
 */
export function isLikelyCoaster(mappedRow) {
  const type = (mappedRow.typeRaw || '').toLowerCase();

  // If there's a type field, check for coaster indicators
  if (type) {
    const coasterKeywords = [
      'coaster', 'steel', 'wooden', 'wood', 'hybrid', 'inverted',
      'launched', 'flying', 'spinning', 'suspended', 'floorless',
      'wing', 'dive', 'stand-up', 'standing', '4th dimension',
      '4-d', '4d', 'wild mouse', 'mine train', 'bobsled',
      'family', 'kiddie', 'junior', 'sit-down', 'sitting',
      'shuttle', 'alpine', 'terrain',
    ];

    // Positive match
    if (coasterKeywords.some((k) => type.includes(k))) return true;

    // Negative match — definitely not a coaster
    const notCoaster = [
      'dark ride', 'flat ride', 'water ride', 'log flume', 'carousel',
      'ferris wheel', 'drop tower', 'simulator', 'omnimover',
      'boat ride', 'bumper car', 'show', 'walk-through', 'playground',
      'observation', 'train ride', 'go-kart', 'monorail', 'tram',
      'parachute', 'swing', 'pendulum', 'gyro', 'rapids',
    ];
    if (notCoaster.some((k) => type.includes(k))) return false;
  }

  // No type info or ambiguous — include it (better to over-include)
  return true;
}

/**
 * Parse a single wtf_wikipedia table row into canonical fields.
 *
 * @param {object} row - Key-value row from wtf table.json()
 * @param {string[]} headers - Original column headers
 * @returns {object} Mapped fields with canonical names
 */
export function parseTableRow(row, headers) {
  const mapped = {};

  for (const header of headers) {
    const canonical = normalizeColumnName(header);
    if (!canonical) continue;

    const cell = row[header];
    if (!cell) continue;

    // wtf_wikipedia table cells can be strings or objects with .text
    const text = typeof cell === 'string' ? cell : (cell.text || cell.toString());
    if (!text || text.trim() === '') continue;

    mapped[canonical] = text.trim();
  }

  return mapped;
}
