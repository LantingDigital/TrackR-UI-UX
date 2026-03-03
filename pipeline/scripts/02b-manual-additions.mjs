#!/usr/bin/env node
// Phase 2b: Inject manually-curated coaster entries.
//
// Reads config/manual-additions.json and creates coaster JSON files
// identical in schema to what 02-fetch-coasters.mjs produces.
//
// Idempotent: re-running overwrites existing manual entries (same slug).
// Will NOT overwrite entries that have dataSource other than ["manual"].
//
// Usage:
//   node scripts/02b-manual-additions.mjs
//   node scripts/02b-manual-additions.mjs --dry-run

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { toSlug } from '../lib/slug.mjs';
import { readJson, writeJsonAtomic, createProgressTracker } from '../lib/progress.mjs';
import { normalizeManufacturer, getManufacturerAbbreviations } from '../config/manufacturers.mjs';
import {
  round1,
  FT_TO_M,
  M_TO_FT,
  MPH_TO_KMH,
  KMH_TO_MPH,
  normalizeMaterial,
  normalizeType,
  normalizePropulsion,
  normalizeStatus,
} from '../config/constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '../config/manual-additions.json');
const COASTERS_DIR = resolve(__dirname, '../data/coasters');
const PROGRESS_PATH = resolve(__dirname, '../data/_progress/manual-additions-status.json');

// ── CLI args ────────────────────────────────────────────────
function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
}

// ── Data quality (mirrors normalizer.mjs logic) ─────────────
function computeDataQuality(coaster) {
  const coreFields = ['heightFt', 'speedMph', 'lengthFt', 'manufacturer', 'yearOpened'];
  const filled = coreFields.filter(
    (f) => coaster[f] != null && coaster[f] !== 'Unknown'
  ).length;
  if (filled >= 5) return 'verified';
  if (filled >= 3) return 'partial';
  return 'stub';
}

// ── Search terms (mirrors normalizer.mjs logic) ─────────────
function buildSearchTerms(coaster) {
  const terms = new Set();
  terms.add(coaster.name.toLowerCase());
  (coaster.formerNames || []).forEach((n) => terms.add(n.toLowerCase()));
  terms.add(coaster.parkName.toLowerCase());
  terms.add(coaster.manufacturer.toLowerCase());
  const abbrevs = getManufacturerAbbreviations(coaster.manufacturer);
  abbrevs.forEach((a) => terms.add(a.toLowerCase()));
  if (coaster.model) terms.add(coaster.model.toLowerCase());
  terms.add(coaster.type.toLowerCase());
  if (coaster.region) terms.add(coaster.region.toLowerCase());
  return [...terms].filter((t) => t.length > 0);
}

// ── Unit conversion ─────────────────────────────────────────
function convertUnits(entry) {
  const heightFt = entry.heightFt ?? null;
  const heightM = entry.heightM ?? null;
  const speedMph = entry.speedMph ?? null;
  const speedKmh = entry.speedKmh ?? null;
  const lengthFt = entry.lengthFt ?? null;
  const lengthM = entry.lengthM ?? null;
  const dropFt = entry.dropFt ?? null;
  const dropM = entry.dropM ?? null;

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

// ── Build full coaster object ───────────────────────────────
function buildManualCoaster(entry, slug) {
  const { name: manufacturer, matched: manufacturerMatched } =
    normalizeManufacturer(entry.manufacturer || '');
  const units = convertUnits(entry);
  const material = normalizeMaterial(entry.material || '');
  const type = normalizeType(entry.type || '', units.heightFt);
  const propulsion = normalizePropulsion(entry.propulsion || null);
  const status = normalizeStatus(entry.status || 'operating');
  const parkId = toSlug(entry.parkName);

  const coaster = {
    id: slug,
    name: entry.name,
    formerNames: entry.formerNames || [],
    parkId,
    parkName: entry.parkName,
    country: entry.country,
    countryName: entry.countryName,
    region: entry.region,
    continent: entry.continent,
    ...units,
    inversions: entry.inversions ?? 0,
    gForce: entry.gForce ?? null,
    duration: entry.duration ?? null,
    material,
    type,
    propulsion,
    manufacturer,
    designer: entry.designer || null,
    model: entry.model || null,
    status,
    yearOpened: entry.yearOpened || null,
    yearClosed: entry.yearClosed || null,
    description: entry.description || null,
    history: entry.history || null,
    notableFeatures: entry.notableFeatures || [],
    records: entry.records || [],
    imageUrl: entry.imageUrl || null,
    imageAttribution: entry.imageAttribution || null,
    wikiUrl: entry.wikiUrl || null,
    dataSource: ['manual'],
    lastUpdated: new Date().toISOString(),
    dataQuality: 'stub', // computed below
    searchTerms: [],
    _meta: {
      manufacturerMatched,
      manufacturerRaw: entry.manufacturer || '',
      manualAddition: true,
      notes: entry.notes || null,
    },
  };

  coaster.dataQuality = computeDataQuality(coaster);
  coaster.searchTerms = buildSearchTerms(coaster);

  return coaster;
}

// ── Validation ──────────────────────────────────────────────
const REQUIRED_FIELDS = ['name', 'parkName', 'country', 'countryName', 'region', 'continent'];

function validateEntry(entry, index) {
  const missing = REQUIRED_FIELDS.filter((f) => !entry[f]);
  if (missing.length > 0) {
    console.warn(`  ⚠️  Entry ${index} ("${entry.name || '???'}") missing required fields: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const { dryRun } = parseArgs();

  // Load config
  const entries = readJson(CONFIG_PATH, null);
  if (!entries || !Array.isArray(entries)) {
    console.error(`No manual-additions.json found at ${CONFIG_PATH}`);
    console.error('Create the file with an array of coaster entries.');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`TrackR Manual Additions`);
  console.log(`Entries: ${entries.length}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`========================================\n`);

  const progress = createProgressTracker(PROGRESS_PATH, 5);
  let added = 0;
  let skipped = 0;
  let errors = 0;

  // Collect existing slugs for collision detection
  const existingSlugs = new Set();
  const progressData = progress.getAll();
  for (const entry of Object.values(progressData)) {
    if (entry.status === 'success' && entry.slug) {
      existingSlugs.add(entry.slug);
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!validateEntry(entry, i)) {
      errors++;
      continue;
    }

    // Generate slug
    let slug = toSlug(entry.name);
    if (existingSlugs.has(slug)) {
      slug = `${slug}-${toSlug(entry.parkName)}`;
    }

    // Check if a non-manual coaster already exists with this slug
    const existingPath = resolve(COASTERS_DIR, `${slug}.json`);
    if (existsSync(existingPath)) {
      const existing = readJson(existingPath);
      if (existing && existing.dataSource && !existing.dataSource.includes('manual')) {
        console.log(`  ⏭️  ${entry.name}: slug "${slug}" already exists with dataSource [${existing.dataSource.join(', ')}] — skipping`);
        skipped++;
        continue;
      }
    }

    // Build coaster
    const coaster = buildManualCoaster(entry, slug);

    if (dryRun) {
      console.log(`  🔍 ${coaster.name} → ${slug} [${coaster.dataQuality}] (dry run)`);
      added++;
      continue;
    }

    // Write output
    writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.json`), coaster);
    existingSlugs.add(slug);

    progress.set(entry.name, {
      status: 'success',
      slug,
      dataQuality: coaster.dataQuality,
      writtenAt: new Date().toISOString(),
    });

    added++;
    console.log(`  ✅ ${coaster.name} (${coaster.parkName}) → ${slug} [${coaster.dataQuality}]`);
  }

  if (!dryRun) progress.flush();

  console.log(`\n========================================`);
  console.log(`Manual additions complete!`);
  console.log(`Added: ${added} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`Output: ${COASTERS_DIR}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Manual additions failed:', err);
  process.exit(1);
});
