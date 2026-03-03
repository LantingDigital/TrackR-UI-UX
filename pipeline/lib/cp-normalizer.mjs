// Coasterpedia infobox normalizer.
// Extracts shared fields (for matching/conflict resolution) and
// exclusive fields (for the coasterpedia sub-object).

import wtf from 'wtf_wikipedia';
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
import { normalizeManufacturer } from '../config/manufacturers.mjs';
import { getField, extractDescription } from './parser.mjs';

/**
 * Parse Coasterpedia wikitext into a wtf_wikipedia document.
 */
export function parseCpWikitext(wikitext) {
  if (!wikitext) return null;
  return wtf(wikitext);
}

/**
 * Parse a numeric value from a Coasterpedia infobox field.
 */
function parseNum(field) {
  if (!field) return null;
  if (field.number != null && !isNaN(field.number)) return field.number;
  if (!field.text) return null;
  const cleaned = field.text
    .replace(/,/g, '')
    .replace(/\s*(ft|feet|m|meters|metres|mph|km\/h|kmh|kph|s|sec|seconds|inches|in|°)\s*/gi, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseYear(field) {
  if (!field) return null;
  const text = field.text || '';
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

function parseDuration(field) {
  if (!field) return null;
  const text = field.text || '';
  const match = text.match(/(\d+):(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/**
 * Extract and normalize a Coasterpedia infobox into shared + exclusive fields.
 *
 * @param {object} infobox - Raw infobox from extractInfobox()
 * @param {object} doc - wtf_wikipedia document
 * @param {string} pageTitle - Coasterpedia article title
 * @returns {{ shared: object, exclusive: object, meta: object } | null}
 */
export function parseCoasterpediaInfobox(infobox, doc, pageTitle) {
  if (!infobox) return null;

  // Detect units (imperial vs metric) — Coasterpedia stores this in the infobox
  const unitsField = getField(infobox, 'units');
  const isMetric = unitsField?.text?.toLowerCase()?.includes('metric');

  // ── Shared fields (overlap with Wikipedia) ──────────────────
  const nameField = getField(infobox, 'name');
  const parkField = getField(infobox, 'park');
  const locationField = getField(infobox, 'location');
  const countryField = getField(infobox, 'country');
  const stateField = getField(infobox, 'state');
  const manufacturerField = getField(infobox, 'manufacturer');
  const designerField = getField(infobox, 'designer');
  const statusField = getField(infobox, 'status');
  const openedField = getField(infobox, 'opened', 'opening');
  const closedField = getField(infobox, 'closed', 'closing');

  // Category fields — Coasterpedia uses category1-6 instead of type/type2
  const cat1 = getField(infobox, 'category1')?.text?.trim() || '';
  const cat2 = getField(infobox, 'category2')?.text?.trim() || '';
  const cat3 = getField(infobox, 'category3')?.text?.trim() || '';
  const cat4 = getField(infobox, 'category4')?.text?.trim() || '';
  const cat5 = getField(infobox, 'category5')?.text?.trim() || '';
  const cat6 = getField(infobox, 'category6')?.text?.trim() || '';
  const categories = [cat1, cat2, cat3, cat4, cat5, cat6].filter(Boolean);

  // Height/speed/length — unit-aware parsing
  const rawHeight = parseNum(getField(infobox, 'height'));
  const rawDrop = parseNum(getField(infobox, 'tallest_drop', 'drop'));
  const rawSpeed = parseNum(getField(infobox, 'speed'));
  const rawLength = parseNum(getField(infobox, 'length', 'track_length'));

  let heightFt, heightM, speedMph, speedKmh, lengthFt, lengthM, dropFt, dropM;

  if (isMetric) {
    heightM = rawHeight;
    heightFt = rawHeight ? round1(rawHeight * M_TO_FT) : null;
    dropM = rawDrop;
    dropFt = rawDrop ? round1(rawDrop * M_TO_FT) : null;
    speedKmh = rawSpeed;
    speedMph = rawSpeed ? round1(rawSpeed * KMH_TO_MPH) : null;
    lengthM = rawLength;
    lengthFt = rawLength ? round1(rawLength * M_TO_FT) : null;
  } else {
    heightFt = rawHeight;
    heightM = rawHeight ? round1(rawHeight * FT_TO_M) : null;
    dropFt = rawDrop;
    dropM = rawDrop ? round1(rawDrop * FT_TO_M) : null;
    speedMph = rawSpeed;
    speedKmh = rawSpeed ? round1(rawSpeed * MPH_TO_KMH) : null;
    lengthFt = rawLength;
    lengthM = rawLength ? round1(rawLength * FT_TO_M) : null;
  }

  const inversionsField = getField(infobox, 'inversions');
  const liftField = getField(infobox, 'lift_launch');
  const durationField = getField(infobox, 'duration');
  const modelField = getField(infobox, 'model', 'product');

  const manufacturerRaw = manufacturerField?.text?.trim() || '';
  const { name: manufacturer, matched: manufacturerMatched } =
    normalizeManufacturer(manufacturerRaw);

  // Determine material from category1 (usually "Steel" or "Wood")
  const material = normalizeMaterial(cat1);
  // Determine type from category2+ (usually "Hyper", "Inverted", etc.)
  const typeRaw = cat2 || cat3 || '';

  const shared = {
    name: nameField?.text?.trim() || doc?.title() || pageTitle,
    parkName: parkField?.text?.trim() || '',
    location: locationField?.text?.trim() || '',
    country: countryField?.text?.trim() || '',
    state: stateField?.text?.trim() || '',
    heightFt,
    heightM,
    speedMph,
    speedKmh,
    lengthFt,
    lengthM,
    dropFt,
    dropM,
    inversions: parseNum(inversionsField) ?? 0,
    duration: parseDuration(durationField),
    material,
    type: normalizeType(typeRaw, heightFt),
    propulsion: normalizePropulsion(liftField?.text),
    manufacturer,
    designer: designerField?.text?.trim() || null,
    model: modelField?.text?.trim() || null,
    status: normalizeStatus(statusField?.text),
    yearOpened: parseYear(openedField),
    yearClosed: parseYear(closedField),
    description: extractDescription(doc),
    _meta: { manufacturerMatched, manufacturerRaw },
  };

  // ── Exclusive fields (only on Coasterpedia) ─────────────────
  const minHeightField = getField(infobox, 'min_height');
  const minUnaccompaniedField = getField(infobox, 'min_unaccompanied_height');
  const maxHeightField = getField(infobox, 'max_height');
  const ridersTrainField = getField(infobox, 'riders_train', 'riders/train');
  const ridersHourField = getField(infobox, 'riders_hour', 'riders/hour');
  const sectionField = getField(infobox, 'section');
  const subsectionField = getField(infobox, 'subsection');
  const costField = getField(infobox, 'cost');
  const themeField = getField(infobox, 'theme');
  const soundtrackField = getField(infobox, 'soundtrack');
  const serialField = getField(infobox, 'serial_number');
  const trainMfgField = getField(infobox, 'train_manufacturer');
  const trackInvField = getField(infobox, 'track_inversions');
  const riderInvField = getField(infobox, 'rider_inversions');
  const layoutField = getField(infobox, 'layout');
  const angleField = getField(infobox, 'angle');
  const bankAngleField = getField(infobox, 'bank_angle');
  const replacedField = getField(infobox, 'replaced');
  const replacementField = getField(infobox, 'replacement');
  const builderField = getField(infobox, 'builder');
  const gforceField = getField(infobox, 'gforce', 'g_force');

  const exclusive = {
    url: `https://coasterpedia.net/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
    minRiderHeight: parseNum(minHeightField),
    minUnaccompaniedHeight: parseNum(minUnaccompaniedField),
    maxRiderHeight: parseNum(maxHeightField),
    ridersPerTrain: parseNum(ridersTrainField),
    ridersPerHour: parseNum(ridersHourField),
    section: sectionField?.text?.trim() || null,
    subsection: subsectionField?.text?.trim() || null,
    steepestDrop: parseNum(angleField),
    cost: costField?.text?.trim() || null,
    theme: themeField?.text?.trim() || null,
    soundtrack: soundtrackField?.text?.trim() || null,
    serialNumber: serialField?.text?.trim() || null,
    trainManufacturer: trainMfgField?.text?.trim() || null,
    trackInversions: parseNum(trackInvField),
    riderInversions: parseNum(riderInvField),
    categories,
    product: modelField?.text?.trim() || null,
    layout: layoutField?.text?.trim() || null,
    bankAngle: parseNum(bankAngleField),
    builder: builderField?.text?.trim() || null,
    gForce: parseNum(gforceField),
    replaced: replacedField?.text?.trim() || null,
    replacement: replacementField?.text?.trim() || null,
    fetchedAt: new Date().toISOString(),
  };

  const meta = {
    pageTitle,
    categories: categories,
    isMetric,
  };

  return { shared, exclusive, meta };
}
