// Data normalizer: transforms raw Wikipedia infobox data into schema-compliant output.

import {
  FT_TO_M,
  M_TO_FT,
  MPH_TO_KMH,
  KMH_TO_MPH,
  round1,
  normalizeMaterial,
  normalizeType,
  normalizePropulsion,
  normalizeStatus,
} from '../config/constants.mjs';
import {
  normalizeManufacturer,
  getManufacturerAbbreviations,
} from '../config/manufacturers.mjs';
import { getField, extractDescription } from './parser.mjs';
import { toSlug } from './slug.mjs';

/**
 * Parse a numeric value from an infobox field.
 * Handles commas, whitespace, and unit suffixes.
 */
function parseNum(field) {
  if (!field) return null;
  if (field.number != null && !isNaN(field.number)) return field.number;
  if (!field.text) return null;

  // Strip commas, whitespace, and common unit suffixes
  const cleaned = field.text
    .replace(/,/g, '')
    .replace(/\s*(ft|feet|m|meters|metres|mph|km\/h|kmh|kph|s|sec|seconds)\s*/gi, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse year from various date formats.
 * Handles "May 5, 2018", "2018", "{{Start date|2018|05|05}}" (already resolved by wtf).
 */
function parseYear(field) {
  if (!field) return null;
  const text = field.text || '';
  if (!text) return null;

  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Parse duration from "M:SS" or "M:SS.ss" format to total seconds.
 */
function parseDuration(field) {
  if (!field) return null;
  const text = field.text || '';
  const match = text.match(/(\d+):(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/**
 * Parse coordinates from wtf_wikipedia output.
 */
function parseCoordinates(field) {
  if (!field) return { latitude: null, longitude: null };
  const text = field.text || '';

  // Try decimal format: "41.486°N, 82.693°W" or "41.486N 82.693W"
  const decMatch = text.match(
    /([\d.]+)\s*°?\s*([NS])\s*[,\s]\s*([\d.]+)\s*°?\s*([EW])/i
  );
  if (decMatch) {
    const lat =
      parseFloat(decMatch[1]) * (decMatch[2].toUpperCase() === 'S' ? -1 : 1);
    const lng =
      parseFloat(decMatch[3]) * (decMatch[4].toUpperCase() === 'W' ? -1 : 1);
    return { latitude: lat, longitude: lng };
  }

  // Try plain decimal: "41.486, -82.693"
  const plainMatch = text.match(/([-\d.]+)\s*[,\s]\s*([-\d.]+)/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }

  return { latitude: null, longitude: null };
}

/**
 * Parse former names from the previousnames field.
 * Handles "Mean Streak (1991–2017)" and comma/newline separated lists.
 */
function parseFormerNames(field) {
  if (!field || !field.text) return [];
  return field.text
    .split(/[,\n]/)
    .map((n) => n.replace(/\(.*?\)/g, '').trim())
    .filter((n) => n.length > 0);
}

/**
 * Build Wikimedia Commons URL from an image filename.
 */
function buildImageUrl(field) {
  if (!field || !field.text) return null;
  const filename = field.text.trim();
  if (!filename) return null;
  // Wikimedia Commons uses MD5 hash-based paths, but the simple URL works for direct access
  const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://en.wikipedia.org/wiki/Special:FilePath/${encoded}`;
}

/**
 * Convert units — store both imperial and metric.
 */
function convertUnits(infobox) {
  const heightFt = parseNum(getField(infobox, 'height_ft', 'height'));
  const heightM = parseNum(getField(infobox, 'height_m'));
  const speedMph = parseNum(getField(infobox, 'speed_mph', 'speed'));
  const speedKmh = parseNum(getField(infobox, 'speed_km/h', 'speed_kmh', 'speed_kph'));
  const lengthFt = parseNum(getField(infobox, 'length_ft', 'length'));
  const lengthM = parseNum(getField(infobox, 'length_m'));
  const dropFt = parseNum(getField(infobox, 'drop_ft', 'drop'));
  const dropM = parseNum(getField(infobox, 'drop_m'));

  return {
    heightFt: heightFt ?? (heightM ? round1(heightM * M_TO_FT) : null),
    heightM: heightM ?? (heightFt ? round1(heightFt * FT_TO_M) : null),
    speedMph: speedMph ?? (speedKmh ? round1(speedKmh * KMH_TO_MPH) : null),
    speedKmh: speedKmh ?? (speedMph ? round1(speedMph * MPH_TO_KMH) : null),
    lengthFt: lengthFt ?? (lengthM ? round1(lengthM * M_TO_FT) : null),
    lengthM: lengthM ?? (lengthFt ? round1(lengthFt * FT_TO_M) : null),
    dropFt: dropFt ?? (dropM ? round1(dropM * M_TO_FT) : null),
    dropM: dropM ?? (dropFt ? round1(dropFt * FT_TO_M) : null),
  };
}

/**
 * Determine data quality based on field completeness.
 */
function computeDataQuality(coaster) {
  const coreFields = [
    'heightFt',
    'speedMph',
    'lengthFt',
    'manufacturer',
    'yearOpened',
  ];
  const filled = coreFields.filter(
    (f) => coaster[f] != null && coaster[f] !== 'Unknown'
  ).length;

  if (filled >= 5) return 'verified';
  if (filled >= 3) return 'partial';
  return 'stub';
}

/**
 * Build searchTerms array for a coaster.
 */
function buildSearchTerms(coaster) {
  const terms = new Set();

  terms.add(coaster.name.toLowerCase());
  (coaster.formerNames || []).forEach((n) => terms.add(n.toLowerCase()));
  terms.add(coaster.parkName.toLowerCase());
  terms.add(coaster.manufacturer.toLowerCase());

  // Add manufacturer abbreviations
  const abbrevs = getManufacturerAbbreviations(coaster.manufacturer);
  abbrevs.forEach((a) => terms.add(a.toLowerCase()));

  if (coaster.model) terms.add(coaster.model.toLowerCase());
  terms.add(coaster.type.toLowerCase());
  if (coaster.region) terms.add(coaster.region.toLowerCase());

  return [...terms].filter((t) => t.length > 0);
}

/**
 * Main normalization: raw infobox → schema-compliant coaster document.
 *
 * @param {object} infobox - Raw infobox from parser.extractInfobox()
 * @param {object} doc - wtf_wikipedia document (for description extraction)
 * @param {object} meta - { country, countryName, region, continent, pageid, title }
 * @param {string} slug - Pre-assigned slug
 */
export function normalizeCoaster(infobox, doc, meta, slug) {
  const nameField = getField(infobox, 'name', 'ride_name', 'roller_coaster_name');
  const name = nameField?.text?.trim() || doc.title() || meta.title;

  const locationField = getField(infobox, 'location', 'park');
  const parkName = locationField?.text?.trim() || 'Unknown Park';
  const parkId = toSlug(parkName);

  const manufacturerField = getField(infobox, 'manufacturer');
  const manufacturerRaw = manufacturerField?.text?.trim() || '';
  const { name: manufacturer, matched: manufacturerMatched } =
    normalizeManufacturer(manufacturerRaw);

  const typeField = getField(infobox, 'type');
  const type2Field = getField(infobox, 'type2', 'type_2');
  const materialRaw = typeField?.text?.trim() || '';
  const type2Raw = type2Field?.text?.trim() || '';

  const units = convertUnits(infobox);
  let material = normalizeMaterial(materialRaw);

  // RMC Hybrid override: if manufacturer is RMC and there's a previous attraction
  // (previousattraction = the old ride this was converted FROM, e.g., Mean Streak → Steel Vengeance)
  const prevAttrField = getField(infobox, 'previousattraction');
  if (
    manufacturer === 'Rocky Mountain Construction' &&
    prevAttrField?.text?.trim()
  ) {
    material = 'Hybrid';
  }

  const liftField = getField(infobox, 'lift', 'propulsion', 'launch');
  const statusField = getField(infobox, 'status');
  const openedField = getField(infobox, 'opened', 'year', 'opening_date');
  const closedField = getField(infobox, 'closed', 'closing_date');
  const durationField = getField(infobox, 'duration', 'ride_time');
  const inversionsField = getField(infobox, 'inversions');
  const gforceField = getField(infobox, 'gforce', 'g_force', 'max_g');
  const designerField = getField(infobox, 'designer');
  const modelField = getField(infobox, 'model');
  const imageField = getField(infobox, 'image');
  const captionField = getField(infobox, 'caption');
  const coordField = getField(infobox, 'coordinates', 'coords', 'coord');
  // Note: 'previousattraction' is the ride that was on this plot before — NOT a former name.
  // Only use 'previousnames' / 'previous_names' / 'former_names' for actual name history.
  const formerNamesField = getField(
    infobox,
    'previousnames',
    'previous_names',
    'former_names'
  );

  const description = extractDescription(doc);

  const coaster = {
    id: slug,
    name,
    formerNames: parseFormerNames(formerNamesField),
    parkId,
    parkName,
    country: meta.country,
    countryName: meta.countryName,
    region: meta.region,
    continent: meta.continent,
    ...units,
    inversions: parseNum(inversionsField) ?? 0,
    gForce: parseNum(gforceField),
    duration: parseDuration(durationField),
    material,
    type: normalizeType(type2Raw, units.heightFt),
    propulsion: normalizePropulsion(liftField?.text),
    manufacturer,
    designer: designerField?.text?.trim() || null,
    model: modelField?.text?.trim() || null,
    status: normalizeStatus(statusField?.text),
    yearOpened: parseYear(openedField),
    yearClosed: parseYear(closedField),
    description,
    history: null, // Populated from wiki content if needed
    notableFeatures: [],
    records: [],
    imageUrl: buildImageUrl(imageField),
    imageAttribution: captionField?.text?.trim() || null,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent((doc.title() || meta.title).replace(/ /g, '_'))}`,
    dataSource: ['wikipedia'],
    lastUpdated: new Date().toISOString(),
    dataQuality: 'stub', // Will be computed below
    searchTerms: [],
    _meta: {
      manufacturerMatched,
      manufacturerRaw,
    },
  };

  coaster.dataQuality = computeDataQuality(coaster);
  coaster.searchTerms = buildSearchTerms(coaster);

  return coaster;
}

/**
 * Normalize a park from its Wikipedia infobox.
 */
export function normalizePark(infobox, doc, meta, slug, coasterCount, totalCoasterCount) {
  const nameField = getField(infobox, 'name', 'park_name');
  const name = nameField?.text?.trim() || doc.title() || meta.parkName;

  const ownerField = getField(infobox, 'owner', 'operator');
  const chainField = getField(infobox, 'parent', 'group', 'chain');
  const websiteField = getField(infobox, 'website', 'homepage');
  const openedField = getField(infobox, 'opened', 'opening_date', 'year');
  const closedField = getField(infobox, 'closed', 'closing_date');
  const statusField = getField(infobox, 'status');
  const coordField = getField(infobox, 'coordinates', 'coords', 'coord', 'location');
  const imageField = getField(infobox, 'image');
  const captionField = getField(infobox, 'caption');
  const cityField = getField(infobox, 'location_city', 'city', 'location');
  const addressField = getField(infobox, 'address', 'location_address');
  const formerNamesField = getField(infobox, 'previousnames', 'previous_names', 'former_names');

  const coords = parseCoordinates(coordField);
  const description = extractDescription(doc);

  let parkStatus = 'operating';
  if (statusField) {
    const lower = (statusField.text || '').toLowerCase();
    if (lower.includes('closed') || lower.includes('defunct')) parkStatus = 'closed';
    else if (lower.includes('seasonal')) parkStatus = 'seasonal';
  }

  return {
    id: slug,
    name,
    formerNames: parseFormerNames(formerNamesField),
    country: meta.country,
    countryName: meta.countryName,
    region: meta.region,
    continent: meta.continent,
    city: cityField?.text?.trim() || null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    address: addressField?.text?.trim() || null,
    status: parkStatus,
    yearOpened: parseYear(openedField),
    yearClosed: parseYear(closedField),
    owner: ownerField?.text?.trim() || null,
    chain: chainField?.text?.trim() || null,
    website: websiteField?.text?.trim() || null,
    coasterCount: coasterCount || 0,
    totalCoasterCount: totalCoasterCount || 0,
    description,
    imageUrl: buildImageUrl(imageField),
    imageAttribution: captionField?.text?.trim() || null,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent((doc.title() || name).replace(/ /g, '_'))}`,
    dataSource: ['wikipedia'],
    lastUpdated: new Date().toISOString(),
  };
}
