#!/usr/bin/env node
// Phase 5b: Coverage audit — detect parks with missing coasters.
//
// For each park:
//   1. Read park wiki.json infobox for "coasters" count
//   2. Count actual coaster files referencing that parkId
//   3. Flag discrepancies (Wikipedia says more than we have)
//   4. Scan park wiki fullText for roller coaster name mentions not in our DB
//
// Output: data/coverage-audit-report.json + console summary
//
// Usage:
//   node scripts/05b-coverage-audit.mjs
//   node scripts/05b-coverage-audit.mjs --park universal-epic-universe

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, existsSync } from 'node:fs';
import { readJson, writeJsonAtomic } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const PARKS_DIR = resolve(DATA_DIR, 'parks');
const REPORT_PATH = resolve(DATA_DIR, 'coverage-audit-report.json');

// Major markets get higher severity
const MAJOR_MARKETS = new Set(['US', 'GB', 'DE', 'JP', 'CN', 'CA', 'FR', 'ES', 'AU', 'KR']);

// ── CLI args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--park' && args[i + 1]) {
      flags.park = args[i + 1];
      i++;
    }
  }
  return flags;
}

// ── Load all coasters and index by parkId ───────────────────
function loadCoastersByPark() {
  const byPark = new Map(); // parkId → Set<coasterName>
  const coasterNames = new Set(); // all coaster names (lowercase)

  const files = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json') && !f.endsWith('.cp-wiki.json')
  );

  for (const file of files) {
    const coaster = readJson(resolve(COASTERS_DIR, file));
    if (!coaster || !coaster.parkId) continue;

    if (!byPark.has(coaster.parkId)) {
      byPark.set(coaster.parkId, new Set());
    }
    byPark.get(coaster.parkId).add(coaster.name);
    coasterNames.add(coaster.name.toLowerCase());

    // Also add former names
    if (coaster.formerNames) {
      for (const fn of coaster.formerNames) {
        coasterNames.add(fn.toLowerCase());
      }
    }
  }

  return { byPark, coasterNames };
}

// ── Parse coaster count from park wiki infobox ──────────────
function getWikiCoasterCount(parkWiki) {
  if (!parkWiki || !parkWiki.infoboxRaw) return null;

  const raw = parkWiki.infoboxRaw.coasters
    || parkWiki.infoboxRaw.roller_coasters
    || parkWiki.infoboxRaw.rollercoasters;

  if (!raw) return null;

  const num = parseInt(raw, 10);
  return isNaN(num) ? null : num;
}

// ── Scan park wiki text for coaster mentions ────────────────
function scanForMentionedRides(parkWiki, existingCoasterNames) {
  if (!parkWiki || !parkWiki.fullText) return [];

  const text = parkWiki.fullText;
  const mentions = [];

  // Patterns that indicate a roller coaster mention
  const patterns = [
    // "Name, a [adjective] roller coaster manufactured by Manufacturer"
    /([\w\s'''–-]{3,40}),\s*a\s+(?:[\w-]+\s+)*(?:roller coaster|coaster)\s+(?:manufactured|built|designed|made)\s+by/gi,
    // "Name, a dual-tracked/launched/steel/wooden/inverted roller coaster"
    /([\w\s'''–-]{3,40}),\s*a\s+(?:dual[- ]tracked|launched|steel|wooden|hybrid|inverted|flying|spinning|racing|family|wild mouse)\s+(?:[\w-]+\s+)*(?:roller coaster|coaster)/gi,
    // "launched roller coaster called Name" / "roller coaster named Name"
    /(?:roller coaster|coaster)\s+(?:called|named|known as)\s+([\w\s'''–-]{3,40})/gi,
  ];

  const found = new Set();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // The ride name is in capture group 1
      const rideName = (match[1] || match[2] || '').trim();
      if (!rideName || rideName.length < 3) continue;

      // Clean up: remove leading articles
      const cleaned = rideName.replace(/^(?:the|a|an)\s+/i, '').trim();
      if (!cleaned) continue;

      // Skip if it's already in our database
      if (existingCoasterNames.has(cleaned.toLowerCase())) continue;

      // Skip generic words that aren't ride names
      const generic = ['roller coaster', 'coaster', 'ride', 'attraction', 'new', 'the park'];
      if (generic.some((g) => cleaned.toLowerCase() === g)) continue;

      if (!found.has(cleaned.toLowerCase())) {
        found.add(cleaned.toLowerCase());

        // Extract surrounding context (50 chars each side)
        const idx = text.indexOf(cleaned);
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + cleaned.length + 50);
        const context = text.slice(start, end).replace(/\n/g, ' ');

        mentions.push({ name: cleaned, context: `...${context}...` });
      }
    }
  }

  return mentions;
}

// ── Compute severity ────────────────────────────────────────
function computeSeverity(missing, country, mentionCount) {
  if (missing >= 2 && MAJOR_MARKETS.has(country)) return 'high';
  if (missing >= 1 && MAJOR_MARKETS.has(country)) return 'medium';
  if (missing >= 1) return 'medium';
  if (mentionCount > 0) return 'low';
  return 'none';
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const flags = parseArgs();

  console.log(`\n========================================`);
  console.log(`TrackR Coverage Audit`);
  console.log(`========================================\n`);

  // Load all coaster data
  console.log('Loading coaster data...');
  const { byPark, coasterNames } = loadCoastersByPark();
  console.log(`  ${coasterNames.size} unique coaster names across ${byPark.size} parks`);

  // Load park files
  const parkFiles = readdirSync(PARKS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json')
  );

  const discrepancies = [];
  const mentionedRidesNotInDb = [];
  let totalParksAudited = 0;

  for (const file of parkFiles) {
    const parkId = file.replace('.json', '');
    if (flags.park && parkId !== flags.park) continue;

    const park = readJson(resolve(PARKS_DIR, file));
    if (!park) continue;

    totalParksAudited++;

    // Get wiki coaster count
    const wikiPath = resolve(PARKS_DIR, `${parkId}.wiki.json`);
    const parkWiki = existsSync(wikiPath) ? readJson(wikiPath) : null;
    const wikiCoasterCount = getWikiCoasterCount(parkWiki);

    // Get actual coaster count
    const actualCoasters = byPark.get(parkId) || new Set();
    const actualCount = actualCoasters.size;

    // Scan for mentioned rides not in DB
    const mentions = parkWiki ? scanForMentionedRides(parkWiki, coasterNames) : [];

    // Compute discrepancy
    const missing = wikiCoasterCount != null ? wikiCoasterCount - actualCount : 0;
    const severity = computeSeverity(
      Math.max(0, missing),
      park.country,
      mentions.length
    );

    if (severity !== 'none') {
      discrepancies.push({
        parkId,
        parkName: park.name,
        country: park.country,
        wikiCoasterCount,
        actualCoasterCount: actualCount,
        missing: Math.max(0, missing),
        existingCoasters: [...actualCoasters],
        mentionedRidesNotInDb: mentions.map((m) => m.name),
        severity,
      });

      for (const mention of mentions) {
        mentionedRidesNotInDb.push({
          parkId,
          parkName: park.name,
          rideName: mention.name,
          context: mention.context,
        });
      }
    }
  }

  // Sort: high severity first, then by missing count
  discrepancies.sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    return b.missing - a.missing;
  });

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalParksAudited,
      parksWithDiscrepancy: discrepancies.filter((d) => d.missing > 0).length,
      parksWithMentions: discrepancies.filter((d) => d.mentionedRidesNotInDb.length > 0).length,
      totalMissingCoasters: discrepancies.reduce((sum, d) => sum + d.missing, 0),
      totalMentionedNotInDb: mentionedRidesNotInDb.length,
    },
    discrepancies,
    mentionedRidesNotInDb,
  };

  writeJsonAtomic(REPORT_PATH, report);

  // Console output
  console.log(`\nParks audited: ${totalParksAudited}`);
  console.log(`Parks with count discrepancy: ${report.summary.parksWithDiscrepancy}`);
  console.log(`Parks with unmatched ride mentions: ${report.summary.parksWithMentions}`);
  console.log(`Total missing coasters (by count): ${report.summary.totalMissingCoasters}`);
  console.log(`Total unmatched ride mentions: ${report.summary.totalMentionedNotInDb}`);

  if (discrepancies.length > 0) {
    console.log(`\n── Discrepancies ──────────────────────\n`);

    for (const d of discrepancies) {
      const icon = d.severity === 'high' ? '🔴' : d.severity === 'medium' ? '🟡' : '🔵';
      console.log(`${icon} ${d.parkName} (${d.parkId})`);

      if (d.wikiCoasterCount != null) {
        console.log(`   Wikipedia says: ${d.wikiCoasterCount} coasters | We have: ${d.actualCoasterCount} | Missing: ${d.missing}`);
      }

      if (d.existingCoasters.length > 0 && d.existingCoasters.length <= 10) {
        console.log(`   Our coasters: ${d.existingCoasters.join(', ')}`);
      }

      if (d.mentionedRidesNotInDb.length > 0) {
        console.log(`   Mentioned but not in DB: ${d.mentionedRidesNotInDb.join(', ')}`);
      }

      console.log('');
    }

    // Actionable: suggest manual additions
    if (mentionedRidesNotInDb.length > 0) {
      console.log(`── Suggested manual-additions.json entries ──\n`);
      for (const m of mentionedRidesNotInDb.slice(0, 20)) {
        console.log(`  { "name": "${m.rideName}", "parkName": "${m.parkName}" }`);
      }
      if (mentionedRidesNotInDb.length > 20) {
        console.log(`  ... and ${mentionedRidesNotInDb.length - 20} more (see full report)`);
      }
      console.log('');
    }
  } else {
    console.log(`\n✅ No discrepancies found!\n`);
  }

  console.log(`Report saved to: ${REPORT_PATH}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Coverage audit failed:', err);
  process.exit(1);
});
