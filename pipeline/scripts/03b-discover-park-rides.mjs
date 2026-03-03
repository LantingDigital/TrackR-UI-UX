#!/usr/bin/env node
// Phase 3b: Discover coasters from park ride-list articles and inline park tables.
//
// For each park:
//   1. Search Wikipedia for "List of [Park] attractions" articles
//   2. Fetch and parse tables from those articles via wtf_wikipedia
//   3. Also re-parse the existing park wiki article for inline tables
//   4. Extract roller coaster rows from tables
//   5. Cross-reference against existing coasters
//   6. Create stub entries for missing rides
//
// Usage:
//   node scripts/03b-discover-park-rides.mjs
//   node scripts/03b-discover-park-rides.mjs --park cedar-point
//   node scripts/03b-discover-park-rides.mjs --dry-run
//   node scripts/03b-discover-park-rides.mjs --park cedar-point --dry-run

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, existsSync } from 'node:fs';
import { searchArticles } from '../lib/wiki-api.mjs';
import { fetchArticle } from '../lib/parser.mjs';
import { buildMatchIndex, findMatch } from '../lib/matcher.mjs';
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
import {
  scoreTable,
  parseTableRow,
  parseTableNum,
  parseTableYear,
  isLikelyCoaster,
} from '../lib/table-parser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const PARKS_DIR = resolve(DATA_DIR, 'parks');
const PROGRESS_PATH = resolve(DATA_DIR, '_progress/park-rides-status.json');

// ── CLI args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--park' && args[i + 1]) {
      flags.park = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      flags.dryRun = true;
    }
  }
  return flags;
}

// ── Search for list articles ────────────────────────────────
// Only search for roller-coaster-specific lists, NOT general attraction lists
const SEARCH_PATTERNS = [
  (name) => `"List of roller coasters at ${name}"`,
  (name) => `"roller coasters at ${name}"`,
];

async function findListArticles(parkName) {
  const found = new Map(); // title → pageid

  for (const pattern of SEARCH_PATTERNS) {
    const query = pattern(parkName);
    try {
      const results = await searchArticles(query, 3);
      for (const r of results) {
        const titleLower = r.title.toLowerCase();
        // Only accept articles that are specifically about roller coasters
        // Reject general "attractions" lists — they include flat rides, shows, etc.
        if (
          titleLower.includes('roller coaster') ||
          (titleLower.includes('list of') && titleLower.includes('coaster'))
        ) {
          if (!found.has(r.title)) {
            found.set(r.title, r.pageid);
          }
        }
      }
    } catch (err) {
      console.warn(`    Search failed for "${query}": ${err.message}`);
    }
  }

  return [...found.entries()].map(([title, pageid]) => ({ title, pageid }));
}

// ── Parse tables from a wtf document ────────────────────────
// Keywords in section titles that indicate a coaster table
// For coasterTablesOnly mode: section title must explicitly mention coasters
const COASTER_SECTION_KEYWORDS = [
  'roller coaster', 'coaster',
];
// Section titles that indicate non-coaster content
const SKIP_SECTION_KEYWORDS = [
  'relocated', 'relocation', 'transfer', 'moved to',
  'virtual reality', 'vr coaster', 'vr ride',
  'flat ride', 'water ride', 'dark ride', 'family ride',
  'thrill ride', 'children', 'kiddie',
  'show', 'dining', 'restaurant', 'shop', 'retail',
  'attendance', 'see also', 'references', 'external',
];

function extractRideTables(doc, coasterTablesOnly = false) {
  // Iterate sections → tables (not doc.tables()) so we get section context.
  // wtf_wikipedia tables don't have a .section() method, but sections have .tables().
  const sections = doc.sections() || [];
  const results = [];

  for (const section of sections) {
    const sectionTitle = (section.title() || '').toLowerCase();

    // Skip sections about relocations, VR overlays, flat rides, etc.
    if (SKIP_SECTION_KEYWORDS.some((k) => sectionTitle.includes(k))) continue;

    const tables = section.tables() || [];
    for (const table of tables) {
      try {
        const rows = table.json();
        if (!rows || rows.length === 0) continue;

        const headers = Object.keys(rows[0]);
        const score = scoreTable(headers);

        if (score < 4) continue; // Not a ride table

        // If coasterTablesOnly, require section title to explicitly mention coasters.
        // A "Type" column alone is not sufficient — many general attraction tables have one.
        if (coasterTablesOnly) {
          const hasCoasterSection = COASTER_SECTION_KEYWORDS.some((k) => sectionTitle.includes(k));
          if (!hasCoasterSection) continue;
        }

        results.push({ headers, rows, score, sectionTitle });
      } catch {
        // Skip malformed tables
      }
    }
  }

  // Sort by score descending — best table first
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ── Build coaster stub from table row ───────────────────────
function buildStubFromRow(mapped, parkId, parkName, country, countryName, region, continent) {
  if (!mapped.name || mapped.name.length < 2) return null;

  const { name: manufacturer, matched: manufacturerMatched } =
    normalizeManufacturer(mapped.manufacturer || '');

  // Parse numeric fields
  const heightFt = mapped.heightFt ? parseTableNum(mapped.heightFt) : null;
  const heightM = mapped.heightM ? parseTableNum(mapped.heightM) : null;
  const speedMph = mapped.speedMph ? parseTableNum(mapped.speedMph) : null;
  const speedKmh = mapped.speedKmh ? parseTableNum(mapped.speedKmh) : null;
  const lengthFt = mapped.lengthFt ? parseTableNum(mapped.lengthFt) : null;
  const lengthM = mapped.lengthM ? parseTableNum(mapped.lengthM) : null;
  const dropFt = mapped.dropFt ? parseTableNum(mapped.dropFt) : null;
  const dropM = mapped.dropM ? parseTableNum(mapped.dropM) : null;

  // Handle "raw" fields with units
  let hFt = heightFt, hM = heightM;
  if (!hFt && !hM && mapped.heightRaw) {
    const raw = mapped.heightRaw.toLowerCase();
    const num = parseTableNum(mapped.heightRaw);
    if (num) {
      if (raw.includes('m') && !raw.includes('mph')) hM = num;
      else hFt = num;
    }
  }

  let sMph = speedMph, sKmh = speedKmh;
  if (!sMph && !sKmh && mapped.speedRaw) {
    const raw = mapped.speedRaw.toLowerCase();
    const num = parseTableNum(mapped.speedRaw);
    if (num) {
      if (raw.includes('km')) sKmh = num;
      else sMph = num;
    }
  }

  let lFt = lengthFt, lM = lengthM;
  if (!lFt && !lM && mapped.lengthRaw) {
    const raw = mapped.lengthRaw.toLowerCase();
    const num = parseTableNum(mapped.lengthRaw);
    if (num) {
      if (raw.includes('m') && !raw.includes('mph')) lM = num;
      else lFt = num;
    }
  }

  let dFt = dropFt, dM = dropM;
  if (!dFt && !dM && mapped.dropRaw) {
    const raw = mapped.dropRaw.toLowerCase();
    const num = parseTableNum(mapped.dropRaw);
    if (num) {
      if (raw.includes('m') && !raw.includes('mph')) dM = num;
      else dFt = num;
    }
  }

  // Convert units
  const units = {
    heightFt: hFt ?? (hM ? round1(hM * M_TO_FT) : null),
    heightM: hM ?? (hFt ? round1(hFt * FT_TO_M) : null),
    speedMph: sMph ?? (sKmh ? round1(sKmh * KMH_TO_MPH) : null),
    speedKmh: sKmh ?? (sMph ? round1(sMph * MPH_TO_KMH) : null),
    lengthFt: lFt ?? (lM ? round1(lM * M_TO_FT) : null),
    lengthM: lM ?? (lFt ? round1(lFt * FT_TO_M) : null),
    dropFt: dFt ?? (dM ? round1(dM * M_TO_FT) : null),
    dropM: dM ?? (dFt ? round1(dFt * FT_TO_M) : null),
  };

  const material = normalizeMaterial(mapped.material || mapped.typeRaw || '');
  const type = normalizeType(mapped.typeRaw || '', units.heightFt);
  const propulsion = normalizePropulsion(mapped.propulsion || null);
  const status = normalizeStatus(mapped.status || 'operating');
  const yearOpened = parseTableYear(mapped.yearOpened || '');
  const yearClosed = parseTableYear(mapped.yearClosed || '');
  const inversions = mapped.inversions ? parseTableNum(mapped.inversions) : 0;

  // Compute data quality
  const coreFields = ['heightFt', 'speedMph', 'lengthFt', 'manufacturer', 'yearOpened'];
  const coasterData = { ...units, manufacturer, yearOpened };
  const filled = coreFields.filter(
    (f) => coasterData[f] != null && coasterData[f] !== 'Unknown'
  ).length;
  const dataQuality = filled >= 5 ? 'verified' : filled >= 3 ? 'partial' : 'stub';

  // Build search terms
  const searchTerms = new Set();
  searchTerms.add(mapped.name.toLowerCase());
  searchTerms.add(parkName.toLowerCase());
  searchTerms.add(manufacturer.toLowerCase());
  const abbrevs = getManufacturerAbbreviations(manufacturer);
  abbrevs.forEach((a) => searchTerms.add(a.toLowerCase()));
  if (mapped.model) searchTerms.add(mapped.model.toLowerCase());
  searchTerms.add(type.toLowerCase());
  if (region) searchTerms.add(region.toLowerCase());

  return {
    id: null, // assigned by caller
    name: mapped.name,
    formerNames: [],
    parkId,
    parkName,
    country,
    countryName,
    region,
    continent,
    ...units,
    inversions: inversions ?? 0,
    gForce: null,
    duration: null,
    material,
    type,
    propulsion,
    manufacturer,
    designer: null,
    model: mapped.model || null,
    status,
    yearOpened,
    yearClosed,
    description: null,
    history: null,
    notableFeatures: [],
    records: [],
    imageUrl: null,
    imageAttribution: null,
    wikiUrl: null,
    dataSource: ['wikipedia_table'],
    lastUpdated: new Date().toISOString(),
    dataQuality,
    searchTerms: [...searchTerms].filter((t) => t.length > 0),
    _meta: {
      manufacturerMatched,
      manufacturerRaw: mapped.manufacturer || '',
      tableSource: true,
    },
  };
}

// ── Name validation ─────────────────────────────────────────
// Skip entries that are clearly not real coaster names
function isValidCoasterName(name) {
  if (!name || name.length < 2 || name.length > 80) return false;
  // Skip names with "Formerly" chains (relocation tracking rows)
  if ((name.match(/Formerly/gi) || []).length > 1) return false;
  // Skip quoted names (often footnotes or headers)
  if (name.startsWith('"') || name.startsWith("'")) return false;
  // Skip generic non-ride names
  const skipNames = [
    'unknown', 'n/a', 'tba', 'tbd', 'none', 'various',
    'roller coaster', 'coaster', 'ride',
  ];
  if (skipNames.includes(name.toLowerCase().trim())) return false;
  return true;
}

// ── Process table rows ──────────────────────────────────────
function processTableRows(headers, rows, parkId, parkName, parkCountry, parkCountryName, parkRegion, parkContinent, matchIndex, existingSlugs, dryRun) {
  const newCoasters = [];
  let ridesExtracted = 0;

  for (const row of rows) {
    const mapped = parseTableRow(row, headers);
    if (!mapped.name) continue;
    if (!isValidCoasterName(mapped.name)) continue;
    if (!isLikelyCoaster(mapped)) continue;

    ridesExtracted++;

    // Check if already in database
    const match = findMatch(mapped.name, parkName, matchIndex);
    if (match) continue; // Already have it

    // Build stub
    const stub = buildStubFromRow(
      mapped, parkId, parkName,
      parkCountry, parkCountryName, parkRegion, parkContinent
    );
    if (!stub) continue;

    // Assign slug
    let slug = toSlug(stub.name);
    if (existingSlugs.has(slug)) {
      slug = `${slug}-${toSlug(parkName)}`;
    }
    stub.id = slug;

    // Avoid duplicates within this run
    if (existingSlugs.has(slug)) continue;
    existingSlugs.add(slug);

    if (!dryRun) {
      writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.json`), stub);
    }

    newCoasters.push({ name: stub.name, slug, dataQuality: stub.dataQuality });
  }

  return { newCoasters, ridesExtracted };
}

// ── Process a single park ───────────────────────────────────
async function processPark(park, parkId, matchIndex, existingSlugs, dryRun) {
  const results = { articlesSearched: 0, tablesFound: 0, ridesExtracted: 0, newCoasters: [] };

  // 1. Search for roller-coaster-specific list articles
  const listArticles = await findListArticles(park.name);
  results.articlesSearched = listArticles.length;

  // 2. Fetch and parse each list article (these are coaster-specific lists)
  for (const article of listArticles) {
    const { doc, error } = await fetchArticle(article.title);
    if (error || !doc) continue;

    // For coaster-specific list articles, we can be less strict about section context
    const rideTables = extractRideTables(doc, false);
    results.tablesFound += rideTables.length;

    for (const { headers, rows } of rideTables) {
      const { newCoasters, ridesExtracted } = processTableRows(
        headers, rows, parkId, park.name,
        park.country, park.countryName, park.region, park.continent,
        matchIndex, existingSlugs, dryRun
      );
      results.ridesExtracted += ridesExtracted;
      results.newCoasters.push(...newCoasters);
    }
  }

  // 3. Also check park's own Wikipedia article for inline coaster tables
  // Only look for tables in coaster-related sections (strict mode)
  const parkWikiPath = resolve(PARKS_DIR, `${parkId}.wiki.json`);
  if (existsSync(parkWikiPath)) {
    const { doc: parkDoc } = await fetchArticle(park.name);
    if (parkDoc) {
      // coasterTablesOnly = true: require coaster section context
      const parkTables = extractRideTables(parkDoc, true);
      results.tablesFound += parkTables.length;

      for (const { headers, rows } of parkTables) {
        const { newCoasters, ridesExtracted } = processTableRows(
          headers, rows, parkId, park.name,
          park.country, park.countryName, park.region, park.continent,
          matchIndex, existingSlugs, dryRun
        );
        results.ridesExtracted += ridesExtracted;
        results.newCoasters.push(...newCoasters);
      }
    }
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const flags = parseArgs();

  console.log(`\n========================================`);
  console.log(`TrackR Park Rides Discovery`);
  console.log(`${flags.dryRun ? '(DRY RUN) ' : ''}${flags.park ? `Park: ${flags.park}` : 'All parks'}`);
  console.log(`========================================\n`);

  // Build match index from existing coasters
  console.log('Building match index...');
  const matchIndex = buildMatchIndex(COASTERS_DIR);
  console.log(`  ${matchIndex.slugSet.size} existing coasters indexed`);

  // Collect existing slugs for collision detection
  const existingSlugs = new Set(matchIndex.slugSet);

  // Load progress
  const progress = createProgressTracker(PROGRESS_PATH, 5);

  // Load parks
  const parkFiles = readdirSync(PARKS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json')
  );

  let totalProcessed = 0;
  let totalNewCoasters = 0;
  let totalArticles = 0;
  let totalTables = 0;

  for (const file of parkFiles) {
    const parkId = file.replace('.json', '');
    if (flags.park && parkId !== flags.park) continue;

    // Skip if already done
    if (progress.isDone(parkId) && !flags.park) {
      totalProcessed++;
      continue;
    }

    const park = readJson(resolve(PARKS_DIR, file));
    if (!park) continue;

    console.log(`  Processing: ${park.name} (${parkId})`);

    try {
      const results = await processPark(park, parkId, matchIndex, existingSlugs, flags.dryRun);

      totalProcessed++;
      totalArticles += results.articlesSearched;
      totalTables += results.tablesFound;
      totalNewCoasters += results.newCoasters.length;

      if (results.newCoasters.length > 0) {
        for (const c of results.newCoasters) {
          console.log(`    ✅ NEW: ${c.name} → ${c.slug} [${c.dataQuality}]`);
        }
      }

      if (!flags.dryRun) {
        progress.set(parkId, {
          status: results.newCoasters.length > 0 || results.tablesFound > 0 ? 'success' : 'skipped',
          parkName: park.name,
          articlesSearched: results.articlesSearched,
          tablesFound: results.tablesFound,
          ridesExtracted: results.ridesExtracted,
          newCoastersCreated: results.newCoasters.length,
          lastRunAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`    ❌ ${park.name}: ${err.message}`);
      if (!flags.dryRun) {
        progress.set(parkId, {
          status: 'error',
          error: err.message,
          parkName: park.name,
          lastRunAt: new Date().toISOString(),
        });
      }
    }

    if (totalProcessed % 50 === 0 && totalProcessed > 0) {
      console.log(`\n  --- Progress: ${totalProcessed} parks, ${totalNewCoasters} new coasters ---\n`);
    }
  }

  if (!flags.dryRun) progress.flush();

  console.log(`\n========================================`);
  console.log(`Park Rides Discovery complete!`);
  console.log(`Parks processed: ${totalProcessed}`);
  console.log(`List articles found: ${totalArticles}`);
  console.log(`Ride tables parsed: ${totalTables}`);
  console.log(`New coasters created: ${totalNewCoasters}`);
  console.log(`Output: ${COASTERS_DIR}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Park rides discovery failed:', err);
  process.exit(1);
});
