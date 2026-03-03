#!/usr/bin/env node
// Phase 4: Build geography.json index from coaster and park data.
// Pure local computation — no API calls.
//
// Usage:
//   node scripts/04-build-geography.mjs

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { readJson, writeJsonAtomic } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const GEOGRAPHY_PATH = resolve(DATA_DIR, 'geography.json');

function main() {
  console.log(`\n========================================`);
  console.log(`TrackR Geography Builder`);
  console.log(`========================================\n`);

  // Read all coaster documents
  const files = readdirSync(COASTERS_DIR).filter(
    (f) => f.endsWith('.json') && !f.includes('wiki')
  );

  console.log(`  Reading ${files.length} coaster files...`);

  // Aggregate: continent → country → region → counts
  const tree = {};

  for (const file of files) {
    const coaster = readJson(resolve(COASTERS_DIR, file));
    if (!coaster) continue;

    const { continent, country, countryName, region } = coaster;
    if (!continent || !country) continue;

    // Initialize nested structure
    if (!tree[continent]) tree[continent] = { countries: {} };
    if (!tree[continent].countries[country]) {
      tree[continent].countries[country] = {
        name: countryName || country,
        regions: new Set(),
        parkCount: 0,
        coasterCount: 0,
        _parks: new Set(),
      };
    }

    const countryNode = tree[continent].countries[country];
    if (region && !region.startsWith('_')) {
      countryNode.regions.add(region);
    }
    countryNode.coasterCount++;
    if (coaster.parkId) countryNode._parks.add(coaster.parkId);
  }

  // Convert Sets to arrays and compute park counts
  const geography = { continents: {}, lastUpdated: new Date().toISOString() };

  for (const [continent, continentData] of Object.entries(tree)) {
    geography.continents[continent] = { countries: {} };

    for (const [countryCode, countryData] of Object.entries(continentData.countries)) {
      geography.continents[continent].countries[countryCode] = {
        name: countryData.name,
        regions: [...countryData.regions].sort(),
        parkCount: countryData._parks.size,
        coasterCount: countryData.coasterCount,
      };
    }
  }

  writeJsonAtomic(GEOGRAPHY_PATH, geography);

  // Print summary
  let totalCoasters = 0;
  let totalParks = 0;
  let totalCountries = 0;

  for (const [continent, data] of Object.entries(geography.continents)) {
    const countries = Object.entries(data.countries);
    console.log(`\n  ${continent}:`);

    for (const [code, country] of countries) {
      console.log(
        `    ${country.name} (${code}): ${country.coasterCount} coasters, ${country.parkCount} parks, ${country.regions.length} regions`
      );
      totalCoasters += country.coasterCount;
      totalParks += country.parkCount;
      totalCountries++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Geography index built!`);
  console.log(`Countries: ${totalCountries} | Parks: ${totalParks} | Coasters: ${totalCoasters}`);
  console.log(`Saved to: ${GEOGRAPHY_PATH}`);
  console.log(`========================================\n`);
}

main();
