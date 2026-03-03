#!/usr/bin/env node
// Phase 3: Extract unique parks from coaster data, fetch park Wikipedia articles.
//
// Usage:
//   node scripts/03-fetch-parks.mjs

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import {
  fetchArticle,
  isAmusementPark,
  extractInfobox,
  extractDescription,
  buildWikiContent,
} from '../lib/parser.mjs';
import { normalizePark } from '../lib/normalizer.mjs';
import { toSlug } from '../lib/slug.mjs';
import { readJson, writeJsonAtomic, createProgressTracker } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const PARKS_DIR = resolve(DATA_DIR, 'parks');
const PARK_STATUS_PATH = resolve(DATA_DIR, '_progress/park-status.json');

if (!existsSync(PARKS_DIR)) mkdirSync(PARKS_DIR, { recursive: true });

// ── Collect unique parks from coaster data ──────────────────

function collectParks() {
  const parks = new Map(); // parkId → { parkName, country, countryName, region, continent, coasterIds }

  const files = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json')
  );

  for (const file of files) {
    const coaster = readJson(resolve(COASTERS_DIR, file));
    if (!coaster || !coaster.parkId) continue;

    if (!parks.has(coaster.parkId)) {
      parks.set(coaster.parkId, {
        parkName: coaster.parkName,
        parkId: coaster.parkId,
        country: coaster.country,
        countryName: coaster.countryName,
        region: coaster.region,
        continent: coaster.continent,
        coasterIds: [],
        activeCount: 0,
        totalCount: 0,
      });
    }

    const park = parks.get(coaster.parkId);
    park.coasterIds.push(coaster.id);
    park.totalCount++;
    if (coaster.status === 'operating') park.activeCount++;
  }

  return parks;
}

// ── Process a single park ───────────────────────────────────

async function processPark(parkData) {
  const { parkName, parkId, country, countryName, region, continent, activeCount, totalCount } =
    parkData;

  // Try fetching the park article
  let { doc, error } = await fetchArticle(parkName);

  // If not found or not a park, try with " amusement park" suffix
  if (!doc || !isAmusementPark(doc)) {
    const altResult = await fetchArticle(`${parkName} amusement park`);
    if (altResult.doc && isAmusementPark(altResult.doc)) {
      doc = altResult.doc;
      error = null;
    } else {
      // Try "(theme park)" disambiguation
      const altResult2 = await fetchArticle(`${parkName} (theme park)`);
      if (altResult2.doc && isAmusementPark(altResult2.doc)) {
        doc = altResult2.doc;
        error = null;
      }
    }
  }

  // If we still don't have a park doc, create a stub
  if (!doc) {
    const stub = {
      id: parkId,
      name: parkName,
      formerNames: [],
      country,
      countryName,
      region,
      continent,
      city: null,
      latitude: null,
      longitude: null,
      address: null,
      status: 'operating',
      yearOpened: null,
      yearClosed: null,
      owner: null,
      chain: null,
      website: null,
      coasterCount: activeCount,
      totalCoasterCount: totalCount,
      description: null,
      imageUrl: null,
      imageAttribution: null,
      wikiUrl: null,
      dataSource: ['coaster_derived'],
      lastUpdated: new Date().toISOString(),
    };
    writeJsonAtomic(resolve(PARKS_DIR, `${parkId}.json`), stub);
    return { status: 'stub', id: parkId, parkName };
  }

  // Extract infobox and normalize
  const infobox = extractInfobox(doc);
  const meta = { country, countryName, region, continent, parkName };

  if (infobox) {
    const park = normalizePark(infobox, doc, meta, parkId, activeCount, totalCount);
    writeJsonAtomic(resolve(PARKS_DIR, `${parkId}.json`), park);
  } else {
    // Has article but no infobox — extract what we can
    const description = extractDescription(doc);
    const stub = {
      id: parkId,
      name: parkName,
      formerNames: [],
      country,
      countryName,
      region,
      continent,
      city: null,
      latitude: null,
      longitude: null,
      address: null,
      status: 'operating',
      yearOpened: null,
      yearClosed: null,
      owner: null,
      chain: null,
      website: null,
      coasterCount: activeCount,
      totalCoasterCount: totalCount,
      description,
      imageUrl: null,
      imageAttribution: null,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent((doc.title() || parkName).replace(/ /g, '_'))}`,
      dataSource: ['wikipedia'],
      lastUpdated: new Date().toISOString(),
    };
    writeJsonAtomic(resolve(PARKS_DIR, `${parkId}.json`), stub);
  }

  // Build wiki content regardless
  const wikiContent = buildWikiContent(doc, parkName, null);
  writeJsonAtomic(resolve(PARKS_DIR, `${parkId}.wiki.json`), wikiContent);

  return { status: 'success', id: parkId, parkName };
}

// ── Entry point ─────────────────────────────────────────────

async function main() {
  const parks = collectParks();

  console.log(`\n========================================`);
  console.log(`TrackR Park Fetch Pipeline`);
  console.log(`Unique parks found: ${parks.size}`);
  console.log(`========================================\n`);

  const progress = createProgressTracker(PARK_STATUS_PATH, 5);
  let processed = 0;
  let success = 0;
  let stubs = 0;

  for (const [parkId, parkData] of parks) {
    if (progress.isDone(parkId)) {
      processed++;
      success++;
      continue;
    }

    try {
      const result = await processPark(parkData);
      progress.set(parkId, {
        ...result,
        fetchedAt: new Date().toISOString(),
      });

      if (result.status === 'success') {
        success++;
        console.log(`  ✅ ${result.parkName} → ${result.id}`);
      } else {
        stubs++;
        console.log(`  📄 ${result.parkName} → ${result.id} (stub)`);
      }
    } catch (err) {
      stubs++;
      console.log(`  ❌ ${parkData.parkName}: ${err.message}`);
      progress.set(parkId, {
        status: 'error',
        error: err.message,
        parkName: parkData.parkName,
      });
    }

    processed++;
    if (processed % 25 === 0) {
      console.log(`\n  --- Progress: ${processed}/${parks.size} ---\n`);
    }
  }

  progress.flush();

  console.log(`\n========================================`);
  console.log(`Park fetch complete!`);
  console.log(`Total: ${parks.size} | Full: ${success} | Stubs: ${stubs}`);
  console.log(`Output: ${PARKS_DIR}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Park fetch failed:', err);
  process.exit(1);
});
