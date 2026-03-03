#!/usr/bin/env node
// Phase 2: Fetch and parse individual coaster articles from Wikipedia.
//
// Usage:
//   node scripts/02-fetch-coasters.mjs                          # All discovered
//   node scripts/02-fetch-coasters.mjs --country US             # US only
//   node scripts/02-fetch-coasters.mjs --country US --region Ohio
//   node scripts/02-fetch-coasters.mjs --article "Steel Vengeance"

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import {
  fetchArticle,
  isRollerCoaster,
  extractInfobox,
  buildWikiContent,
} from '../lib/parser.mjs';
import { normalizeCoaster } from '../lib/normalizer.mjs';
import { toSlug, assignSlugs } from '../lib/slug.mjs';
import { readJson, writeJsonAtomic, createProgressTracker } from '../lib/progress.mjs';
import { COUNTRIES } from '../config/countries.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const DISCOVERY_PATH = resolve(DATA_DIR, '_progress/discovery.json');
const FETCH_STATUS_PATH = resolve(DATA_DIR, '_progress/fetch-status.json');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');

// Ensure output directory exists
if (!existsSync(COASTERS_DIR)) mkdirSync(COASTERS_DIR, { recursive: true });

// ── CLI argument parsing ────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--country' && args[i + 1]) {
      flags.country = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--region' && args[i + 1]) {
      flags.region = args[i + 1];
      i++;
    } else if (args[i] === '--article' && args[i + 1]) {
      flags.article = args[i + 1];
      i++;
    }
  }
  return flags;
}

// ── Build article list from discovery ───────────────────────

function getArticlesToFetch(discovery, flags) {
  const articles = [];

  // Single article mode (debugging)
  if (flags.article) {
    return [
      {
        title: flags.article,
        pageid: null,
        country: 'US',
        countryName: 'United States',
        region: 'Unknown',
        continent: 'North America',
      },
    ];
  }

  for (const [isoCode, countryData] of Object.entries(discovery.countries)) {
    if (flags.country && isoCode !== flags.country) continue;

    const countryConfig = COUNTRIES.find((c) => c.isoCode === isoCode);
    if (!countryConfig) continue;

    for (const [regionName, regionData] of Object.entries(countryData.regions)) {
      if (flags.region && regionName !== flags.region) continue;

      for (const article of regionData.articles) {
        articles.push({
          title: article.title,
          pageid: article.pageid,
          country: isoCode,
          countryName: countryConfig.name,
          region: regionName.startsWith('_') ? countryConfig.defaultRegion || countryConfig.name : regionName,
          continent: countryConfig.continent,
        });
      }
    }
  }

  return articles;
}

// ── Two-pass slug assignment ────────────────────────────────

function preAssignSlugs(articles, progress) {
  // Collect all articles that will produce coasters
  // For already-processed ones, use the slug from progress
  const entries = [];
  const progressData = progress.getAll();

  for (const article of articles) {
    const existing = progressData[article.title];
    if (existing?.status === 'success' && existing.parkName) {
      entries.push({ name: existing.coasterName || article.title, parkName: existing.parkName });
    } else {
      // We don't know the park name yet — use article title as placeholder
      entries.push({ name: article.title, parkName: '__unknown__' });
    }
  }

  // For the first pass, just use simple slugs
  // Collisions will be resolved after we know park names
  return null; // We'll do incremental slug assignment
}

// ── Process a single article ────────────────────────────────

async function processArticle(article, existingSlugs) {
  const { title, pageid, country, countryName, region, continent } = article;

  // Fetch the article
  const { doc, error } = await fetchArticle(title);
  if (error || !doc) {
    return { status: 'error', error: error || 'null document', title };
  }

  // Check if it's actually a roller coaster
  if (!isRollerCoaster(doc)) {
    return { status: 'skipped', reason: 'not_roller_coaster', title };
  }

  // Extract infobox
  const infobox = extractInfobox(doc);
  if (!infobox) {
    return { status: 'skipped', reason: 'no_infobox', title };
  }

  // Get park name for slug assignment
  const locationField = infobox.location || infobox.park;
  const parkName = locationField?.text?.trim() || 'Unknown Park';
  const coasterName =
    infobox.name?.text?.trim() || infobox.ride_name?.text?.trim() || doc.title() || title;

  // Generate slug
  let slug = toSlug(coasterName);
  if (existingSlugs.has(slug)) {
    slug = `${slug}-${toSlug(parkName)}`;
  }
  existingSlugs.add(slug);

  // Normalize into schema
  const meta = { country, countryName, region, continent, pageid, title };
  const coaster = normalizeCoaster(infobox, doc, meta, slug);

  // Build wiki content document
  const wikiContent = buildWikiContent(doc, title, pageid);

  // Write output files
  writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.json`), coaster);
  writeJsonAtomic(resolve(COASTERS_DIR, `${slug}.wiki.json`), wikiContent);

  return {
    status: 'success',
    id: slug,
    coasterName,
    parkName,
    title,
    dataQuality: coaster.dataQuality,
  };
}

// ── Entry point ─────────────────────────────────────────────

async function main() {
  const flags = parseArgs();
  const discovery = readJson(DISCOVERY_PATH);

  if (!discovery && !flags.article) {
    console.error('No discovery.json found. Run 01-discover.mjs first.');
    process.exit(1);
  }

  const articles = flags.article
    ? getArticlesToFetch({}, flags)
    : getArticlesToFetch(discovery, flags);

  console.log(`\n========================================`);
  console.log(`TrackR Coaster Fetch Pipeline`);
  console.log(`Articles to process: ${articles.length}`);
  if (flags.country) console.log(`Country filter: ${flags.country}`);
  if (flags.region) console.log(`Region filter: ${flags.region}`);
  console.log(`========================================\n`);

  const progress = createProgressTracker(FETCH_STATUS_PATH, 10);

  // Collect existing slugs from already-processed coasters
  const existingSlugs = new Set();
  const progressData = progress.getAll();
  for (const entry of Object.values(progressData)) {
    if (entry.status === 'success' && entry.id) {
      existingSlugs.add(entry.id);
    }
  }

  let processed = 0;
  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    // Check progress — skip if already done
    if (progress.isDone(article.title)) {
      const existing = progress.get(article.title);
      if (existing.status === 'success') success++;
      else skipped++;
      processed++;
      continue;
    }

    // Check if should retry
    if (!progress.shouldRetry(article.title)) {
      processed++;
      errors++;
      continue;
    }

    try {
      const result = await processArticle(article, existingSlugs);

      progress.set(article.title, {
        ...result,
        fetchedAt: new Date().toISOString(),
        attempts: (progress.get(article.title)?.attempts || 0) + 1,
      });

      if (result.status === 'success') {
        success++;
        console.log(
          `  ✅ ${result.coasterName} (${result.parkName}) → ${result.id} [${result.dataQuality}]`
        );
      } else if (result.status === 'skipped') {
        skipped++;
        console.log(`  ⏭️  ${article.title}: ${result.reason}`);
      } else {
        errors++;
        console.log(`  ❌ ${article.title}: ${result.error}`);
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
      console.log(`\n  --- Progress: ${processed}/${articles.length} (${success} ok, ${skipped} skipped, ${errors} errors) ---\n`);
    }
  }

  progress.flush();

  console.log(`\n========================================`);
  console.log(`Fetch complete!`);
  console.log(`Total: ${processed} | Success: ${success} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`Output: ${COASTERS_DIR}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
