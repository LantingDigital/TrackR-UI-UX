#!/usr/bin/env node
// Phase 8: Cross-source reconciliation and conflict audit.
//
// Reads all coaster files and the conflict log to produce a reconciliation report.
// Pure offline computation — no network calls.
//
// Usage:
//   node scripts/08-reconcile.mjs

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { readJson, writeJsonAtomic } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const CP_CONFLICTS_PATH = resolve(DATA_DIR, '_progress/cp-conflicts.json');
const CP_FETCH_STATUS_PATH = resolve(DATA_DIR, '_progress/cp-fetch-status.json');
const REPORT_PATH = resolve(DATA_DIR, 'cp-reconciliation-report.json');

function main() {
  console.log(`\n========================================`);
  console.log(`Coasterpedia Reconciliation Report`);
  console.log(`========================================\n`);

  // Load all coaster files
  const files = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json') && !f.endsWith('.cp-wiki.json')
  );

  let total = 0;
  let wikipediaOnly = 0;
  let coasterpediaOnly = 0;
  let bothSources = 0;
  const qualityBefore = { verified: 0, partial: 0, stub: 0 };
  const qualityAfter = { verified: 0, partial: 0, stub: 0 };
  const missingFields = {};
  const countryCounts = {};
  const newCountries = new Set();

  for (const file of files) {
    try {
      const coaster = JSON.parse(readFileSync(resolve(COASTERS_DIR, file), 'utf-8'));
      total++;

      const sources = coaster.dataSource || [];
      const hasWiki = sources.includes('wikipedia');
      const hasCp = sources.includes('coasterpedia');

      if (hasWiki && hasCp) bothSources++;
      else if (hasWiki) wikipediaOnly++;
      else if (hasCp) coasterpediaOnly++;

      // Track quality
      const quality = coaster.dataQuality || 'stub';
      qualityAfter[quality] = (qualityAfter[quality] || 0) + 1;

      // Track countries
      const country = coaster.countryName || coaster.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;

      // Check for missing important fields
      const importantFields = [
        'heightFt', 'speedMph', 'lengthFt', 'manufacturer',
        'yearOpened', 'description', 'parkName',
      ];
      for (const field of importantFields) {
        if (coaster[field] == null || coaster[field] === '' || coaster[field] === 'Unknown') {
          missingFields[field] = (missingFields[field] || 0) + 1;
        }
      }
    } catch {
      // Skip malformed files
    }
  }

  // Load conflicts
  const conflicts = readJson(CP_CONFLICTS_PATH, []);

  // Load fetch status for match quality distribution
  const fetchStatus = readJson(CP_FETCH_STATUS_PATH, {});
  const matchTypes = { exact: 0, name_only: 0, former_name: 0, fuzzy: 0, new: 0 };
  let fetchErrors = 0;
  let fetchSkipped = 0;

  for (const entry of Object.values(fetchStatus)) {
    if (entry.status === 'success' && entry.matchType) {
      matchTypes[entry.matchType] = (matchTypes[entry.matchType] || 0) + 1;
    } else if (entry.status === 'error') {
      fetchErrors++;
    } else if (entry.status === 'skipped') {
      fetchSkipped++;
    }
  }

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCoasters: total,
      wikipediaOnly,
      coasterpediaOnly,
      bothSources,
    },
    matchQuality: matchTypes,
    fetchStats: {
      errors: fetchErrors,
      skipped: fetchSkipped,
    },
    dataQuality: qualityAfter,
    conflicts: {
      total: conflicts.length,
      byField: {},
    },
    missingFields,
    countryCoverage: {
      totalCountries: Object.keys(countryCounts).length,
      top20: Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([country, count]) => ({ country, count })),
    },
  };

  // Aggregate conflicts by field
  for (const conflict of conflicts) {
    const field = conflict.field;
    report.conflicts.byField[field] = (report.conflicts.byField[field] || 0) + 1;
  }

  writeJsonAtomic(REPORT_PATH, report);

  // Print summary
  console.log(`Total coasters: ${total}`);
  console.log(`  Wikipedia only: ${wikipediaOnly}`);
  console.log(`  Coasterpedia only: ${coasterpediaOnly}`);
  console.log(`  Both sources: ${bothSources}`);
  console.log();
  console.log(`Match quality:`);
  console.log(`  Exact (name+park): ${matchTypes.exact}`);
  console.log(`  Name only: ${matchTypes.name_only}`);
  console.log(`  Former name: ${matchTypes.former_name}`);
  console.log(`  Fuzzy: ${matchTypes.fuzzy}`);
  console.log(`  New coasters: ${matchTypes.new}`);
  console.log();
  console.log(`Data quality:`);
  console.log(`  Verified: ${qualityAfter.verified}`);
  console.log(`  Partial: ${qualityAfter.partial}`);
  console.log(`  Stub: ${qualityAfter.stub}`);
  console.log();
  console.log(`Conflicts: ${conflicts.length}`);
  if (conflicts.length > 0) {
    for (const [field, count] of Object.entries(report.conflicts.byField)) {
      console.log(`  ${field}: ${count}`);
    }
  }
  console.log();
  console.log(`Missing fields:`);
  for (const [field, count] of Object.entries(missingFields).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${field}: ${count}/${total} missing`);
  }
  console.log();
  console.log(`Country coverage: ${Object.keys(countryCounts).length} countries`);
  console.log(`Top 5:`);
  report.countryCoverage.top20.slice(0, 5).forEach((c) => {
    console.log(`  ${c.country}: ${c.count}`);
  });
  console.log();
  console.log(`Report saved to: ${REPORT_PATH}`);
  console.log(`========================================\n`);
}

main();
