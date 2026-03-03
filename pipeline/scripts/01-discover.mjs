#!/usr/bin/env node
// Phase 1: Discover roller coaster articles via Wikipedia category traversal.
//
// Usage:
//   node scripts/01-discover.mjs                    # All Wave 1+ countries
//   node scripts/01-discover.mjs --country US        # US only
//   node scripts/01-discover.mjs --country US,GB,DE  # Multiple countries

import { getCategoryPages, getSubcategories } from '../lib/wiki-api.mjs';
import { writeJsonAtomic, readJson } from '../lib/progress.mjs';
import { COUNTRIES, getCountry } from '../config/countries.mjs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DISCOVERY_PATH = resolve(__dirname, '../data/_progress/discovery.json');

// ── CLI argument parsing ────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--country' && args[i + 1]) {
      flags.countries = args[i + 1].split(',').map((c) => c.trim().toUpperCase());
      i++;
    }
  }
  return flags;
}

// ── Main discovery logic ────────────────────────────────────

async function discoverCountry(config) {
  const { isoCode, name, category, hasRegions } = config;
  console.log(`\n🌍 Discovering: ${name} (${isoCode})`);

  const result = {
    status: 'complete',
    regions: {},
    articleCount: 0,
  };

  if (hasRegions && config.regionCategory) {
    // Walk region subcategories (US states, CA provinces)
    console.log(`  Looking for region subcategories...`);
    const regionSubcats = await getSubcategories(config.regionCategory);
    console.log(`  Found ${regionSubcats.length} region subcategories`);

    for (const subcat of regionSubcats) {
      const regionName = config.regionExtractor
        ? config.regionExtractor(subcat.title)
        : subcat.title.replace('Category:', '');

      const articles = await getCategoryPages(subcat.title);

      // Also walk any sub-subcategories (e.g., park-specific categories)
      const subSubcats = await getSubcategories(subcat.title);
      for (const ssc of subSubcats) {
        const moreArticles = await getCategoryPages(ssc.title);
        articles.push(...moreArticles);
      }

      // Deduplicate by pageid
      const unique = deduplicateByPageId(articles);
      result.regions[regionName] = {
        category: subcat.title,
        articles: unique,
      };
      result.articleCount += unique.length;
      console.log(`  ${regionName}: ${unique.length} articles`);
    }

    // Also check the main country category for direct articles
    const directArticles = await getCategoryPages(category);
    if (directArticles.length > 0) {
      const existing = new Set();
      for (const region of Object.values(result.regions)) {
        for (const a of region.articles) existing.add(a.pageid);
      }
      const newArticles = directArticles.filter((a) => !existing.has(a.pageid));
      if (newArticles.length > 0) {
        result.regions['_unregioned'] = {
          category: category,
          articles: newArticles,
        };
        result.articleCount += newArticles.length;
        console.log(`  [unregioned]: ${newArticles.length} articles`);
      }
    }
  } else {
    // Flat category — all articles in one bucket
    const articles = await getCategoryPages(category);

    // Also walk subcategories (e.g., park-specific categories)
    const subcats = await getSubcategories(category);
    for (const subcat of subcats) {
      const moreArticles = await getCategoryPages(subcat.title);
      articles.push(...moreArticles);
    }

    const unique = deduplicateByPageId(articles);
    const regionName = config.defaultRegion || name;
    result.regions[regionName] = {
      category: category,
      articles: unique,
    };
    result.articleCount = unique.length;
    console.log(`  ${regionName}: ${unique.length} articles`);
  }

  // Walk "Former" category if defined (US closed coasters)
  if (config.formerCategory) {
    console.log(`  Looking for former/closed coasters...`);
    await discoverFormer(config, result);
  }

  return result;
}

async function discoverFormer(config, result) {
  const formerArticles = await getCategoryPages(config.formerCategory);

  // Walk subcategories of the former category
  const formerSubcats = await getSubcategories(config.formerCategory);
  for (const subcat of formerSubcats) {
    const moreArticles = await getCategoryPages(subcat.title);
    formerArticles.push(...moreArticles);

    // Walk sub-subcategories too
    const subSubcats = await getSubcategories(subcat.title);
    for (const ssc of subSubcats) {
      const moreMore = await getCategoryPages(ssc.title);
      formerArticles.push(...moreMore);
    }
  }

  // Deduplicate and merge with existing regions
  const existingIds = new Set();
  for (const region of Object.values(result.regions)) {
    for (const a of region.articles) existingIds.add(a.pageid);
  }

  const newFormer = formerArticles.filter((a) => !existingIds.has(a.pageid));
  const uniqueFormer = deduplicateByPageId(newFormer);

  if (uniqueFormer.length > 0) {
    if (!result.regions['_former']) {
      result.regions['_former'] = { category: config.formerCategory, articles: [] };
    }
    result.regions['_former'].articles.push(...uniqueFormer);
    result.articleCount += uniqueFormer.length;
    console.log(`  [former]: ${uniqueFormer.length} new articles`);
  }
}

function deduplicateByPageId(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (seen.has(a.pageid)) return false;
    seen.add(a.pageid);
    return true;
  });
}

// ── Entry point ─────────────────────────────────────────────

async function main() {
  const flags = parseArgs();
  const discovery = readJson(DISCOVERY_PATH, { countries: {}, stats: {} });

  // Determine which countries to process
  let countriesToProcess = COUNTRIES;
  if (flags.countries) {
    countriesToProcess = flags.countries
      .map((code) => COUNTRIES.find((c) => c.isoCode === code))
      .filter(Boolean);

    if (countriesToProcess.length === 0) {
      console.error(
        `No valid country codes found. Available: ${COUNTRIES.map((c) => c.isoCode).join(', ')}`
      );
      process.exit(1);
    }
  }

  console.log(`\n========================================`);
  console.log(`TrackR Discovery Pipeline`);
  console.log(`Countries: ${countriesToProcess.map((c) => c.isoCode).join(', ')}`);
  console.log(`========================================`);

  let totalArticles = 0;

  for (const config of countriesToProcess) {
    // Skip if already complete (unless force re-run)
    if (discovery.countries[config.isoCode]?.status === 'complete') {
      const existing = discovery.countries[config.isoCode].articleCount || 0;
      console.log(`\n⏭️  Skipping ${config.name} (already discovered: ${existing} articles)`);
      totalArticles += existing;
      continue;
    }

    const result = await discoverCountry(config);
    discovery.countries[config.isoCode] = result;
    totalArticles += result.articleCount;

    // Save after each country
    discovery.stats = {
      totalArticles,
      countriesComplete: Object.keys(discovery.countries).length,
      lastRun: new Date().toISOString(),
    };
    writeJsonAtomic(DISCOVERY_PATH, discovery);
  }

  // Final stats
  discovery.stats = {
    totalArticles,
    countriesComplete: Object.keys(discovery.countries).length,
    lastRun: new Date().toISOString(),
  };
  writeJsonAtomic(DISCOVERY_PATH, discovery);

  console.log(`\n========================================`);
  console.log(`Discovery complete!`);
  console.log(`Total articles found: ${totalArticles}`);
  console.log(`Countries processed: ${Object.keys(discovery.countries).length}`);
  console.log(`Saved to: ${DISCOVERY_PATH}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
