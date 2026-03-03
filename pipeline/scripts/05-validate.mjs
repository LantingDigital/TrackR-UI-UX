#!/usr/bin/env node
// Phase 5: Validate all output data, generate quality report.
//
// Usage:
//   node scripts/05-validate.mjs

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, existsSync } from 'node:fs';
import { readJson, writeJsonAtomic } from '../lib/progress.mjs';
import { CANONICAL_MANUFACTURERS } from '../config/manufacturers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const PARKS_DIR = resolve(DATA_DIR, 'parks');
const REPORT_PATH = resolve(DATA_DIR, 'validation-report.json');

const VALID_MATERIALS = ['Wood', 'Steel', 'Hybrid'];
const VALID_STATUSES = ['operating', 'closed', 'sbno', 'under_construction', 'announced'];
const VALID_CONTINENTS = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Oceania',
  'Africa',
];

function main() {
  console.log(`\n========================================`);
  console.log(`TrackR Data Validator`);
  console.log(`========================================\n`);

  const issues = {
    errors: [],
    warnings: [],
    stats: {
      totalCoasters: 0,
      totalParks: 0,
      qualityDistribution: { verified: 0, partial: 0, stub: 0 },
      missingFields: {},
      unknownManufacturers: [],
      duplicateIds: [],
      orphanedParkIds: [],
      suspiciousValues: [],
    },
  };

  // ── Validate coasters ──────────────────────────
  const coasterFiles = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.includes('wiki')
  );

  const coasterIds = new Set();
  const parkIdsFromCoasters = new Set();
  const canonicalSet = new Set(CANONICAL_MANUFACTURERS.map((m) => m.toLowerCase()));

  console.log(`  Validating ${coasterFiles.length} coasters...`);

  for (const file of coasterFiles) {
    const coaster = readJson(resolve(COASTERS_DIR, file));
    if (!coaster) {
      issues.errors.push({ file, error: 'Could not read file' });
      continue;
    }

    issues.stats.totalCoasters++;

    // Duplicate ID check
    if (coasterIds.has(coaster.id)) {
      issues.stats.duplicateIds.push(coaster.id);
      issues.errors.push({ file, error: `Duplicate ID: ${coaster.id}` });
    }
    coasterIds.add(coaster.id);

    // Track park references
    if (coaster.parkId) parkIdsFromCoasters.add(coaster.parkId);

    // Quality distribution
    const quality = coaster.dataQuality || 'stub';
    issues.stats.qualityDistribution[quality] =
      (issues.stats.qualityDistribution[quality] || 0) + 1;

    // Required fields
    const required = ['name', 'parkName', 'country', 'continent', 'manufacturer', 'material'];
    for (const field of required) {
      if (!coaster[field] || coaster[field] === 'Unknown') {
        issues.stats.missingFields[field] = (issues.stats.missingFields[field] || 0) + 1;
        issues.warnings.push({
          file,
          warning: `Missing required field: ${field}`,
        });
      }
    }

    // Desired fields (not errors, just tracking)
    const desired = ['heightFt', 'speedMph', 'lengthFt', 'yearOpened'];
    for (const field of desired) {
      if (coaster[field] == null) {
        issues.stats.missingFields[field] = (issues.stats.missingFields[field] || 0) + 1;
      }
    }

    // Material validation
    if (coaster.material && !VALID_MATERIALS.includes(coaster.material)) {
      issues.errors.push({ file, error: `Invalid material: ${coaster.material}` });
    }

    // Status validation
    if (coaster.status && !VALID_STATUSES.includes(coaster.status)) {
      issues.errors.push({ file, error: `Invalid status: ${coaster.status}` });
    }

    // Continent validation
    if (coaster.continent && !VALID_CONTINENTS.includes(coaster.continent)) {
      issues.errors.push({ file, error: `Invalid continent: ${coaster.continent}` });
    }

    // Manufacturer check
    if (
      coaster.manufacturer &&
      coaster.manufacturer !== 'Unknown' &&
      !canonicalSet.has(coaster.manufacturer.toLowerCase())
    ) {
      if (!issues.stats.unknownManufacturers.includes(coaster.manufacturer)) {
        issues.stats.unknownManufacturers.push(coaster.manufacturer);
      }
      issues.warnings.push({
        file,
        warning: `Unknown manufacturer: ${coaster.manufacturer}`,
      });
    }

    // Suspicious values
    if (coaster.speedMph && coaster.speedMph > 200) {
      issues.stats.suspiciousValues.push({
        file,
        field: 'speedMph',
        value: coaster.speedMph,
        reason: 'Speed > 200mph',
      });
    }
    if (coaster.heightFt && coaster.heightFt > 500) {
      issues.stats.suspiciousValues.push({
        file,
        field: 'heightFt',
        value: coaster.heightFt,
        reason: 'Height > 500ft',
      });
    }
    if (coaster.inversions && coaster.inversions > 20) {
      issues.stats.suspiciousValues.push({
        file,
        field: 'inversions',
        value: coaster.inversions,
        reason: 'Inversions > 20',
      });
    }
    if (coaster.yearOpened && (coaster.yearOpened < 1880 || coaster.yearOpened > 2030)) {
      issues.stats.suspiciousValues.push({
        file,
        field: 'yearOpened',
        value: coaster.yearOpened,
        reason: 'Year out of range (1880-2030)',
      });
    }

    // Wiki content check
    const wikiFile = file.replace('.json', '.wiki.json');
    if (!existsSync(resolve(COASTERS_DIR, wikiFile))) {
      issues.warnings.push({ file, warning: 'Missing wiki content file' });
    }
  }

  // ── Validate parks ─────────────────────────────
  if (existsSync(PARKS_DIR)) {
    const parkFiles = readdirSync(PARKS_DIR).filter(
      (f) => f.endsWith('.json') && !f.endsWith('.wiki.json')
    );

    console.log(`  Validating ${parkFiles.length} parks...`);

    const parkIds = new Set();
    for (const file of parkFiles) {
      const park = readJson(resolve(PARKS_DIR, file));
      if (!park) continue;
      issues.stats.totalParks++;
      parkIds.add(park.id);
    }

    // Find orphaned park references (coasters pointing to non-existent parks)
    for (const parkId of parkIdsFromCoasters) {
      if (!parkIds.has(parkId)) {
        issues.stats.orphanedParkIds.push(parkId);
      }
    }
  }

  // ── Write report ───────────────────────────────
  writeJsonAtomic(REPORT_PATH, issues);

  // ── Print summary ──────────────────────────────
  console.log(`\n  --- Summary ---`);
  console.log(`  Coasters: ${issues.stats.totalCoasters}`);
  console.log(`  Parks: ${issues.stats.totalParks}`);
  console.log(`  Quality: ${JSON.stringify(issues.stats.qualityDistribution)}`);
  console.log(`  Errors: ${issues.errors.length}`);
  console.log(`  Warnings: ${issues.warnings.length}`);

  if (issues.stats.duplicateIds.length > 0) {
    console.log(`\n  ❌ Duplicate IDs (${issues.stats.duplicateIds.length}):`);
    issues.stats.duplicateIds.forEach((id) => console.log(`     - ${id}`));
  }

  if (issues.stats.unknownManufacturers.length > 0) {
    console.log(
      `\n  ⚠️  Unknown manufacturers (${issues.stats.unknownManufacturers.length}):`
    );
    issues.stats.unknownManufacturers.forEach((m) => console.log(`     - ${m}`));
  }

  if (issues.stats.orphanedParkIds.length > 0) {
    console.log(
      `\n  ⚠️  Orphaned park references (${issues.stats.orphanedParkIds.length}):`
    );
    issues.stats.orphanedParkIds.slice(0, 10).forEach((id) => console.log(`     - ${id}`));
    if (issues.stats.orphanedParkIds.length > 10) {
      console.log(`     ... and ${issues.stats.orphanedParkIds.length - 10} more`);
    }
  }

  if (issues.stats.suspiciousValues.length > 0) {
    console.log(
      `\n  ⚠️  Suspicious values (${issues.stats.suspiciousValues.length}):`
    );
    issues.stats.suspiciousValues.forEach((sv) =>
      console.log(`     - ${sv.file}: ${sv.field}=${sv.value} (${sv.reason})`)
    );
  }

  if (Object.keys(issues.stats.missingFields).length > 0) {
    console.log(`\n  Missing fields:`);
    for (const [field, count] of Object.entries(issues.stats.missingFields)) {
      const pct = ((count / issues.stats.totalCoasters) * 100).toFixed(1);
      console.log(`     ${field}: ${count} (${pct}%)`);
    }
  }

  console.log(`\n  Report saved to: ${REPORT_PATH}`);
  console.log(`\n========================================\n`);
}

main();
