#!/usr/bin/env node
// Phase 7: Enrich existing coasters and discover new ones from Coasterpedia.
//
// For each Coasterpedia article:
//   - Match against existing Wikipedia coasters by name + park
//   - If match: gap-fill null fields + add coasterpedia sub-object
//   - If no match: create new coaster with dataSource: ["coasterpedia"]
//
// Usage:
//   node scripts/07-enrich-coasterpedia.mjs                       # All discovered
//   node scripts/07-enrich-coasterpedia.mjs --limit 50            # First 50 only
//   node scripts/07-enrich-coasterpedia.mjs --article "Taron"     # Single article
//   node scripts/07-enrich-coasterpedia.mjs --match-only          # Dry run: show matches

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { cpFetchWikitext } from '../lib/cp-api.mjs';
import { parseCpWikitext, parseCoasterpediaInfobox } from '../lib/cp-normalizer.mjs';
import { extractInfobox } from '../lib/parser.mjs';
import { buildMatchIndex, findMatch } from '../lib/matcher.mjs';
import { toSlug } from '../lib/slug.mjs';
import { readJson, writeJsonAtomic, createProgressTracker } from '../lib/progress.mjs';
import { lookupCpCountry } from '../config/cp-countries.mjs';
import {
  normalizeManufacturer,
  getManufacturerAbbreviations,
} from '../config/manufacturers.mjs';
import { normalizeType } from '../config/constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const CP_DISCOVERY_PATH = resolve(DATA_DIR, '_progress/cp-discovery.json');
const CP_FETCH_STATUS_PATH = resolve(DATA_DIR, '_progress/cp-fetch-status.json');
const CP_CONFLICTS_PATH = resolve(DATA_DIR, '_progress/cp-conflicts.json');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');

if (!existsSync(COASTERS_DIR)) mkdirSync(COASTERS_DIR, { recursive: true });

// ── CLI argument parsing ────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      flags.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--article' && args[i + 1]) {
      flags.article = args[i + 1];
      i++;
    } else if (args[i] === '--match-only') {
      flags.matchOnly = true;
    }
  }
  return flags;
}

// ── Merge Coasterpedia data into an existing coaster ────────

function mergeIntoExisting(existing, cpParsed, conflicts) {
  const { shared, exclusive } = cpParsed;

  // Gap-fill: if existing field is null, use Coasterpedia's value
  const gapFillFields = [
    'heightFt', 'heightM', 'speedMph', 'speedKmh',
    'lengthFt', 'lengthM', 'dropFt', 'dropM',
    'inversions', 'gForce', 'duration', 'designer', 'model',
    'yearOpened', 'yearClosed', 'description',
  ];

  for (const field of gapFillFields) {
    if (existing[field] == null && shared[field] != null) {
      existing[field] = shared[field];
    } else if (
      existing[field] != null &&
      shared[field] != null &&
      existing[field] !== shared[field]
    ) {
      // Log conflict if values differ by more than 5% (for numbers) or differ at all (strings)
      const isNumeric = typeof existing[field] === 'number';
      if (isNumeric) {
        const diff = Math.abs(existing[field] - shared[field]) / Math.max(existing[field], 1);
        if (diff > 0.05) {
          conflicts.push({
            coaster: existing.id,
            field,
            wikipedia: existing[field],
            coasterpedia: shared[field],
            chosen: 'wikipedia',
          });
        }
      }
    }
  }

  // Gap-fill propulsion
  if (!existing.propulsion && shared.propulsion) {
    existing.propulsion = shared.propulsion;
  }

  // Gap-fill manufacturer if currently "Unknown"
  if (existing.manufacturer === 'Unknown' && shared.manufacturer && shared.manufacturer !== 'Unknown') {
    existing.manufacturer = shared.manufacturer;
  }

  // Also fill gForce from Coasterpedia exclusive data
  if (existing.gForce == null && exclusive.gForce != null) {
    existing.gForce = exclusive.gForce;
  }

  // Add coasterpedia sub-object
  existing.coasterpedia = exclusive;

  // Update dataSource
  if (!existing.dataSource) existing.dataSource = ['wikipedia'];
  if (!existing.dataSource.includes('coasterpedia')) {
    existing.dataSource.push('coasterpedia');
  }

  // Update timestamp
  existing.lastUpdated = new Date().toISOString();

  // Recompute data quality
  existing.dataQuality = computeDataQuality(existing);

  return existing;
}

// ── Create a new coaster from Coasterpedia-only data ────────

function createNewCoaster(cpParsed, slug, pageTitle) {
  const { shared, exclusive } = cpParsed;

  // Look up country info
  const countryInfo = lookupCpCountry(shared.country);

  const coaster = {
    id: slug,
    name: shared.name,
    formerNames: [],
    parkId: toSlug(shared.parkName || 'unknown-park'),
    parkName: shared.parkName || 'Unknown Park',
    country: countryInfo?.isoCode || null,
    countryName: countryInfo?.name || shared.country || null,
    region: shared.state || null,
    continent: countryInfo?.continent || null,
    heightFt: shared.heightFt,
    heightM: shared.heightM,
    speedMph: shared.speedMph,
    speedKmh: shared.speedKmh,
    lengthFt: shared.lengthFt,
    lengthM: shared.lengthM,
    dropFt: shared.dropFt,
    dropM: shared.dropM,
    inversions: shared.inversions,
    gForce: exclusive.gForce,
    duration: shared.duration,
    material: shared.material,
    type: shared.type,
    propulsion: shared.propulsion,
    manufacturer: shared.manufacturer,
    designer: shared.designer,
    model: shared.model,
    status: shared.status,
    yearOpened: shared.yearOpened,
    yearClosed: shared.yearClosed,
    description: shared.description,
    history: null,
    notableFeatures: [],
    records: [],
    imageUrl: null,
    imageAttribution: null,
    wikiUrl: null,
    coasterpedia: exclusive,
    dataSource: ['coasterpedia'],
    lastUpdated: new Date().toISOString(),
    dataQuality: 'stub',
    searchTerms: [],
    _meta: {
      manufacturerMatched: shared._meta?.manufacturerMatched || false,
      manufacturerRaw: shared._meta?.manufacturerRaw || '',
    },
  };

  coaster.dataQuality = computeDataQuality(coaster);
  coaster.searchTerms = buildSearchTerms(coaster);

  return coaster;
}

function computeDataQuality(coaster) {
  const coreFields = ['heightFt', 'speedMph', 'lengthFt', 'manufacturer', 'yearOpened'];
  const filled = coreFields.filter(
    (f) => coaster[f] != null && coaster[f] !== 'Unknown'
  ).length;
  if (filled >= 5) return 'verified';
  if (filled >= 3) return 'partial';
  return 'stub';
}

function buildSearchTerms(coaster) {
  const terms = new Set();
  terms.add(coaster.name.toLowerCase());
  (coaster.formerNames || []).forEach((n) => terms.add(n.toLowerCase()));
  if (coaster.parkName) terms.add(coaster.parkName.toLowerCase());
  if (coaster.manufacturer) terms.add(coaster.manufacturer.toLowerCase());
  const abbrevs = getManufacturerAbbreviations(coaster.manufacturer);
  abbrevs.forEach((a) => terms.add(a.toLowerCase()));
  if (coaster.model) terms.add(coaster.model.toLowerCase());
  if (coaster.type) terms.add(coaster.type.toLowerCase());
  if (coaster.region) terms.add(coaster.region.toLowerCase());
  return [...terms].filter((t) => t.length > 0);
}

// ── Build raw wiki content for Coasterpedia (parallel to .wiki.json) ──

function buildCpWikiContent(doc, wikitext, pageTitle, pageid, categories) {
  const sections = doc.sections() || [];
  const introSection =
    sections.length > 0 && !sections[0].title() ? sections[0].text() || '' : '';

  return {
    source: 'coasterpedia',
    articleTitle: doc.title() || pageTitle,
    introSection,
    sections: sections
      .filter((s) => s.title())
      .map((s) => ({ title: s.title(), content: s.text() || '' }))
      .filter((s) => s.content.trim().length > 0),
    fullText: doc.text() || '',
    categories: categories || [],
    url: `https://coasterpedia.net/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
    pageId: pageid,
    fetchedAt: new Date().toISOString(),
    articleLength: (doc.text() || '').length,
  };
}

// ── Entry point ─────────────────────────────────────────────

async function main() {
  const flags = parseArgs();
  const discovery = readJson(CP_DISCOVERY_PATH);

  if (!discovery && !flags.article) {
    console.error('No cp-discovery.json found. Run 06-discover-coasterpedia.mjs first.');
    process.exit(1);
  }

  // Build list of articles to process
  let articles;
  if (flags.article) {
    articles = [{ title: flags.article, pageid: null }];
  } else {
    articles = discovery.articles || [];
    if (flags.limit) articles = articles.slice(0, flags.limit);
  }

  console.log(`\n========================================`);
  console.log(`Coasterpedia Enrichment Pipeline`);
  console.log(`Articles to process: ${articles.length}`);
  if (flags.matchOnly) console.log(`Mode: MATCH-ONLY (dry run)`);
  console.log(`========================================\n`);

  // Build match index from existing coasters
  console.log(`Building match index from existing coasters...`);
  const matchIndex = buildMatchIndex(COASTERS_DIR);
  console.log(`  Indexed ${matchIndex.slugSet.size} existing coasters\n`);

  // Match-only mode: just show match statistics
  if (flags.matchOnly) {
    let matched = 0;
    let unmatched = 0;
    const byConfidence = { exact: 0, name_only: 0, former_name: 0, fuzzy: 0 };

    for (const article of articles) {
      // For match-only, use title as name and see if it matches
      const match = findMatch(article.title, '', matchIndex);
      if (match) {
        matched++;
        byConfidence[match.confidence]++;
      } else {
        unmatched++;
      }
    }

    console.log(`Match results (dry run):`);
    console.log(`  Matched: ${matched}`);
    console.log(`    exact: ${byConfidence.exact}`);
    console.log(`    name_only: ${byConfidence.name_only}`);
    console.log(`    former_name: ${byConfidence.former_name}`);
    console.log(`    fuzzy: ${byConfidence.fuzzy}`);
    console.log(`  New (unmatched): ${unmatched}`);
    return;
  }

  // Full enrichment mode
  const progress = createProgressTracker(CP_FETCH_STATUS_PATH, 10);
  const conflicts = readJson(CP_CONFLICTS_PATH, []);
  const existingSlugs = new Set(matchIndex.slugSet);

  let processed = 0;
  let enriched = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    // Skip if already done
    if (progress.isDone(article.title)) {
      const existing = progress.get(article.title);
      if (existing.matchType === 'new') created++;
      else if (existing.status === 'success') enriched++;
      else skipped++;
      processed++;
      continue;
    }

    if (!progress.shouldRetry(article.title)) {
      processed++;
      errors++;
      continue;
    }

    try {
      // Fetch wikitext from Coasterpedia
      const { wikitext, categories, pageid, error } = await cpFetchWikitext(article.title);

      if (error || !wikitext) {
        progress.set(article.title, {
          status: 'error',
          error: error || 'empty wikitext',
          title: article.title,
          fetchedAt: new Date().toISOString(),
          attempts: (progress.get(article.title)?.attempts || 0) + 1,
        });
        errors++;
        console.log(`  ❌ ${article.title}: ${error || 'empty wikitext'}`);
        processed++;
        continue;
      }

      // Parse wikitext
      const doc = parseCpWikitext(wikitext);
      if (!doc) {
        progress.set(article.title, {
          status: 'skipped',
          reason: 'parse_failed',
          title: article.title,
          fetchedAt: new Date().toISOString(),
          attempts: (progress.get(article.title)?.attempts || 0) + 1,
        });
        skipped++;
        console.log(`  ⏭️  ${article.title}: parse failed`);
        processed++;
        continue;
      }

      // Extract infobox
      const infobox = extractInfobox(doc);
      if (!infobox) {
        progress.set(article.title, {
          status: 'skipped',
          reason: 'no_infobox',
          title: article.title,
          fetchedAt: new Date().toISOString(),
          attempts: (progress.get(article.title)?.attempts || 0) + 1,
        });
        skipped++;
        console.log(`  ⏭️  ${article.title}: no infobox`);
        processed++;
        continue;
      }

      // Parse Coasterpedia infobox
      const cpParsed = parseCoasterpediaInfobox(infobox, doc, article.title);
      if (!cpParsed) {
        progress.set(article.title, {
          status: 'skipped',
          reason: 'normalization_failed',
          title: article.title,
          fetchedAt: new Date().toISOString(),
          attempts: (progress.get(article.title)?.attempts || 0) + 1,
        });
        skipped++;
        processed++;
        continue;
      }

      // Try to match against existing coasters
      const match = findMatch(cpParsed.shared.name, cpParsed.shared.parkName, matchIndex);

      if (match) {
        // ── ENRICH existing coaster ──
        const existingPath = resolve(COASTERS_DIR, `${match.slug}.json`);
        const existing = readJson(existingPath);

        if (existing) {
          mergeIntoExisting(existing, cpParsed, conflicts);
          writeJsonAtomic(existingPath, existing);

          // Write Coasterpedia wiki content
          const cpContent = buildCpWikiContent(doc, wikitext, article.title, pageid, categories);
          writeJsonAtomic(resolve(COASTERS_DIR, `${match.slug}.cp-wiki.json`), cpContent);

          progress.set(article.title, {
            status: 'success',
            matchedSlug: match.slug,
            matchType: match.confidence,
            title: article.title,
            fetchedAt: new Date().toISOString(),
            attempts: (progress.get(article.title)?.attempts || 0) + 1,
          });

          enriched++;
          console.log(
            `  ✅ ${cpParsed.shared.name} → ${match.slug} [${match.confidence}]`
          );
        } else {
          errors++;
          console.log(`  ❌ ${article.title}: matched slug ${match.slug} but file not found`);
        }
      } else {
        // ── CREATE new coaster ──
        let slug = toSlug(cpParsed.shared.name);
        if (existingSlugs.has(slug)) {
          slug = `${slug}-${toSlug(cpParsed.shared.parkName || 'unknown')}`;
        }
        existingSlugs.add(slug);

        const coaster = createNewCoaster(cpParsed, slug, article.title);
        writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.json`), coaster);

        // Write Coasterpedia wiki content
        const cpContent = buildCpWikiContent(doc, wikitext, article.title, pageid, categories);
        writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.cp-wiki.json`), cpContent);

        progress.set(article.title, {
          status: 'success',
          matchType: 'new',
          newSlug: slug,
          title: article.title,
          fetchedAt: new Date().toISOString(),
          attempts: (progress.get(article.title)?.attempts || 0) + 1,
        });

        created++;
        console.log(
          `  🆕 ${cpParsed.shared.name} (${cpParsed.shared.parkName || '?'}) → ${slug}`
        );
      }
    } catch (err) {
      errors++;
      progress.set(article.title, {
        status: 'error',
        error: err.message,
        title: article.title,
        fetchedAt: new Date().toISOString(),
        attempts: (progress.get(article.title)?.attempts || 0) + 1,
      });
      console.log(`  ❌ ${article.title}: ${err.message}`);
    }

    processed++;
    if (processed % 50 === 0) {
      console.log(
        `\n  --- Progress: ${processed}/${articles.length} (${enriched} enriched, ${created} new, ${skipped} skipped, ${errors} errors) ---\n`
      );
    }
  }

  progress.flush();

  // Save conflicts
  if (conflicts.length > 0) {
    writeJsonAtomic(CP_CONFLICTS_PATH, conflicts);
  }

  console.log(`\n========================================`);
  console.log(`Enrichment complete!`);
  console.log(`Total: ${processed} | Enriched: ${enriched} | New: ${created} | Skipped: ${skipped} | Errors: ${errors}`);
  if (conflicts.length > 0) console.log(`Conflicts logged: ${conflicts.length}`);
  console.log(`Output: ${COASTERS_DIR}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
