#!/usr/bin/env node
// Phase 9: Compute popularity rankings for all coasters.
//
// Signals:
//   1. Wikipedia monthly pageviews (strongest — fetched from Wikimedia REST API)
//   2. Wikipedia article length
//   3. Has Wikipedia article at all (bonus)
//   4. Coasterpedia article length
//   5. Height + speed (record-breakers are famous)
//   6. Park coaster count (proxy for park prestige)
//   7. Data quality level
//
// Output:
//   - Updates each coaster JSON with popularityScore, popularityTier, popularityRank
//   - Writes data/popularity-rankings.json (sorted list)
//
// Usage:
//   node scripts/09-rank-popularity.mjs                # Full run
//   node scripts/09-rank-popularity.mjs --skip-pageviews  # Offline only (no API calls)

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { writeJsonAtomic, readJson } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const PAGEVIEWS_CACHE_PATH = resolve(DATA_DIR, '_progress/pageviews-cache.json');
const RANKINGS_PATH = resolve(DATA_DIR, 'popularity-rankings.json');

const USER_AGENT = 'TrackR-DataPipeline/1.0 (caleb@lantingdigital.com)';

// ── CLI args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    skipPageviews: args.includes('--skip-pageviews'),
  };
}

// ── Wikipedia Pageview API ──────────────────────────────────
// Free, no auth. Generous rate limits (100 req/s).
// We fetch last 12 months and average monthly views.

async function fetchPageviews(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);

  const fmt = (d) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}01`;

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encoded}/monthly/${fmt(start)}/${fmt(end)}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.items || [];
    if (items.length === 0) return null;

    const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const avgMonthly = Math.round(totalViews / items.length);
    return { totalViews, avgMonthly, months: items.length };
  } catch {
    return null;
  }
}

async function fetchAllPageviews(coasters) {
  // Load cache
  const cache = readJson(PAGEVIEWS_CACHE_PATH, {});
  const wikiCoasters = coasters.filter((c) => c.wikiUrl);

  console.log(`Fetching pageviews for ${wikiCoasters.length} Wikipedia coasters...`);

  let fetched = 0;
  let cached = 0;
  let failed = 0;

  for (const coaster of wikiCoasters) {
    // Extract title from wikiUrl
    const urlPath = coaster.wikiUrl.split('/wiki/')[1];
    if (!urlPath) continue;
    const title = decodeURIComponent(urlPath);

    // Check cache (valid for 7 days)
    if (cache[coaster.id]) {
      const age = Date.now() - new Date(cache[coaster.id].fetchedAt).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) {
        cached++;
        continue;
      }
    }

    const views = await fetchPageviews(title);
    if (views) {
      cache[coaster.id] = {
        ...views,
        title,
        fetchedAt: new Date().toISOString(),
      };
      fetched++;
    } else {
      cache[coaster.id] = {
        totalViews: 0,
        avgMonthly: 0,
        months: 0,
        title,
        fetchedAt: new Date().toISOString(),
      };
      failed++;
    }

    // Batch save every 50
    if ((fetched + failed) % 50 === 0) {
      writeJsonAtomic(PAGEVIEWS_CACHE_PATH, cache);
      console.log(
        `  Progress: ${fetched + failed + cached}/${wikiCoasters.length} (${fetched} fetched, ${cached} cached, ${failed} failed)`
      );
    }

    // Small delay — API is generous but be polite
    await new Promise((r) => setTimeout(r, 50));
  }

  writeJsonAtomic(PAGEVIEWS_CACHE_PATH, cache);
  console.log(
    `  Done: ${fetched} fetched, ${cached} cached, ${failed} failed\n`
  );

  return cache;
}

// ── Scoring ─────────────────────────────────────────────────

function computeScores(coasters, pageviewCache, parkCoasterCounts) {
  // Step 1: Collect raw signal values for normalization
  const signals = coasters.map((c) => {
    const pv = pageviewCache[c.id];
    const avgMonthly = pv?.avgMonthly || 0;

    // Wiki article length
    const wikiPath = resolve(COASTERS_DIR, `${c.id}.wiki.json`);
    const wikiContent = existsSync(wikiPath)
      ? readJson(wikiPath, null)
      : null;
    const wikiLength = wikiContent?.articleLength || 0;

    // CP article length
    const cpPath = resolve(COASTERS_DIR, `${c.id}.cp-wiki.json`);
    const cpContent = existsSync(cpPath) ? readJson(cpPath, null) : null;
    const cpLength = cpContent?.articleLength || 0;

    // Park prestige (coaster count as proxy)
    const parkPrestige = parkCoasterCounts[c.parkId] || 0;

    return {
      id: c.id,
      name: c.name,
      parkName: c.parkName,
      avgMonthly,
      wikiLength,
      cpLength,
      hasWiki: c.dataSource?.includes('wikipedia') ? 1 : 0,
      heightFt: c.heightFt || 0,
      speedMph: c.speedMph || 0,
      parkPrestige,
      dataQuality: c.dataQuality === 'verified' ? 2 : c.dataQuality === 'partial' ? 1 : 0,
    };
  });

  // Step 2: Find max values for normalization
  const maxPageviews = Math.max(...signals.map((s) => s.avgMonthly), 1);
  const maxWikiLength = Math.max(...signals.map((s) => s.wikiLength), 1);
  const maxCpLength = Math.max(...signals.map((s) => s.cpLength), 1);
  const maxHeight = Math.max(...signals.map((s) => s.heightFt), 1);
  const maxSpeed = Math.max(...signals.map((s) => s.speedMph), 1);
  const maxParkPrestige = Math.max(...signals.map((s) => s.parkPrestige), 1);

  // Step 3: Compute weighted composite score (0-100)
  //
  // Weights:
  //   Pageviews:     35%  (strongest direct popularity signal)
  //   Wiki article:  15%  (longer article = more notable)
  //   Has Wikipedia: 15%  (Wikipedia's notability bar is high)
  //   CP article:     5%  (supplementary)
  //   Park prestige: 10%  (famous park = famous coasters)
  //   Height+Speed:  10%  (record-breakers are famous)
  //   Data quality:  10%  (well-documented = well-known)

  const scored = signals.map((s) => {
    // Use log scale for pageviews (diminishing returns past a certain point)
    const pvNorm = s.avgMonthly > 0 ? Math.log(s.avgMonthly + 1) / Math.log(maxPageviews + 1) : 0;
    const wikiNorm = s.wikiLength > 0 ? Math.log(s.wikiLength + 1) / Math.log(maxWikiLength + 1) : 0;
    const cpNorm = s.cpLength > 0 ? Math.log(s.cpLength + 1) / Math.log(maxCpLength + 1) : 0;
    const heightNorm = s.heightFt / maxHeight;
    const speedNorm = s.speedMph / maxSpeed;
    const parkNorm = s.parkPrestige / maxParkPrestige;
    const qualityNorm = s.dataQuality / 2;

    const score =
      pvNorm * 35 +
      wikiNorm * 15 +
      s.hasWiki * 15 +
      cpNorm * 5 +
      parkNorm * 10 +
      ((heightNorm + speedNorm) / 2) * 10 +
      qualityNorm * 10;

    return {
      id: s.id,
      name: s.name,
      parkName: s.parkName,
      score: Math.round(score * 10) / 10,
      signals: {
        pageviewsMonthly: s.avgMonthly,
        wikiArticleLength: s.wikiLength,
        cpArticleLength: s.cpLength,
        hasWikipedia: s.hasWiki === 1,
        heightFt: s.heightFt,
        speedMph: s.speedMph,
        parkCoasterCount: s.parkPrestige,
        dataQuality: s.dataQuality === 2 ? 'verified' : s.dataQuality === 1 ? 'partial' : 'stub',
      },
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks and tiers
  scored.forEach((s, i) => {
    s.rank = i + 1;
    if (i < 500) s.tier = 'iconic';
    else if (i < 800) s.tier = 'notable';
    else s.tier = 'standard';
  });

  return scored;
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs();

  console.log(`\n========================================`);
  console.log(`Popularity Ranking Pipeline`);
  console.log(`========================================\n`);

  // Load all coasters
  console.log(`Loading coaster data...`);
  const files = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.includes('wiki')
  );

  const coasters = [];
  const parkCoasterCounts = {};

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(resolve(COASTERS_DIR, file), 'utf-8'));
      coasters.push(data);
      // Count coasters per park
      if (data.parkId) {
        parkCoasterCounts[data.parkId] = (parkCoasterCounts[data.parkId] || 0) + 1;
      }
    } catch {
      // skip malformed
    }
  }

  console.log(`  Loaded ${coasters.length} coasters across ${Object.keys(parkCoasterCounts).length} parks\n`);

  // Fetch pageviews (unless --skip-pageviews)
  let pageviewCache = readJson(PAGEVIEWS_CACHE_PATH, {});
  if (!flags.skipPageviews) {
    pageviewCache = await fetchAllPageviews(coasters);
  } else {
    console.log(`Skipping pageview fetch (using cache)\n`);
  }

  // Compute scores
  console.log(`Computing popularity scores...`);
  const rankings = computeScores(coasters, pageviewCache, parkCoasterCounts);

  // Write rankings summary
  const summary = {
    generatedAt: new Date().toISOString(),
    totalCoasters: rankings.length,
    tiers: {
      iconic: rankings.filter((r) => r.tier === 'iconic').length,
      notable: rankings.filter((r) => r.tier === 'notable').length,
      standard: rankings.filter((r) => r.tier === 'standard').length,
    },
    rankings: rankings.map((r) => ({
      rank: r.rank,
      id: r.id,
      name: r.name,
      parkName: r.parkName,
      score: r.score,
      tier: r.tier,
      pageviewsMonthly: r.signals.pageviewsMonthly,
    })),
  };

  writeJsonAtomic(RANKINGS_PATH, summary);

  // Update each coaster JSON with popularity data
  console.log(`Writing popularity data to coaster files...`);
  let updated = 0;
  for (const ranked of rankings) {
    const coasterPath = resolve(COASTERS_DIR, `${ranked.id}.json`);
    if (!existsSync(coasterPath)) continue;

    const coaster = readJson(coasterPath);
    if (!coaster) continue;

    coaster.popularityScore = ranked.score;
    coaster.popularityTier = ranked.tier;
    coaster.popularityRank = ranked.rank;

    writeJsonAtomic(coasterPath, coaster);
    updated++;
  }

  // Print top 30
  console.log(`\n========================================`);
  console.log(`Top 30 Most Popular Coasters`);
  console.log(`========================================\n`);

  for (const r of rankings.slice(0, 30)) {
    const pvStr = r.signals.pageviewsMonthly
      ? `${(r.signals.pageviewsMonthly / 1000).toFixed(1)}K views/mo`
      : 'no wiki';
    console.log(
      `  #${String(r.rank).padStart(2)} ${r.score.toFixed(1).padStart(5)} ${r.tier.padEnd(8)} ${r.name} (${r.parkName}) [${pvStr}]`
    );
  }

  // Print tier boundaries
  console.log(`\n========================================`);
  console.log(`Tier Boundaries`);
  console.log(`========================================\n`);

  const iconicCutoff = rankings[499]?.score || 0;
  const notableCutoff = rankings[799]?.score || 0;

  console.log(`  Iconic (top 500):   score >= ${iconicCutoff}`);
  console.log(`  Notable (501-800):  score >= ${notableCutoff}`);
  console.log(`  Standard (801+):    score < ${notableCutoff}`);
  console.log(`\n  Total coasters ranked: ${rankings.length}`);
  console.log(`  Coaster files updated: ${updated}`);
  console.log(`  Rankings saved to: ${RANKINGS_PATH}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Ranking failed:', err);
  process.exit(1);
});
