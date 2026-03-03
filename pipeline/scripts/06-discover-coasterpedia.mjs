#!/usr/bin/env node
// Phase 6: Discover roller coaster articles on Coasterpedia.
//
// Walks Category:Roller coasters by name to get all coaster pages.
// Output: data/_progress/cp-discovery.json
//
// Usage:
//   node scripts/06-discover-coasterpedia.mjs             # Full discovery
//   node scripts/06-discover-coasterpedia.mjs --limit 100  # First 100 only (testing)

import { cpGetCategoryPages } from '../lib/cp-api.mjs';
import { writeJsonAtomic, readJson } from '../lib/progress.mjs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DISCOVERY_PATH = resolve(__dirname, '../data/_progress/cp-discovery.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      flags.limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs();

  console.log(`\n========================================`);
  console.log(`Coasterpedia Discovery Pipeline`);
  console.log(`========================================`);

  // Check for existing discovery
  const existing = readJson(DISCOVERY_PATH, null);
  if (existing && existing.status === 'complete' && !flags.limit) {
    console.log(`\nAlready discovered ${existing.totalCount} articles.`);
    console.log(`Delete ${DISCOVERY_PATH} to re-run.`);
    return;
  }

  console.log(`\nWalking Category:Roller coasters by name...`);

  const articles = await cpGetCategoryPages('Category:Roller coasters by name');
  console.log(`  Found ${articles.length} articles`);

  // Apply limit if specified
  const finalArticles = flags.limit ? articles.slice(0, flags.limit) : articles;

  // Deduplicate by pageid
  const seen = new Set();
  const unique = finalArticles.filter((a) => {
    if (seen.has(a.pageid)) return false;
    seen.add(a.pageid);
    return true;
  });

  const discovery = {
    source: 'coasterpedia',
    discoveredAt: new Date().toISOString(),
    articles: unique,
    totalCount: unique.length,
    status: flags.limit ? 'partial' : 'complete',
  };

  writeJsonAtomic(DISCOVERY_PATH, discovery);

  console.log(`\n========================================`);
  console.log(`Discovery complete!`);
  console.log(`Total articles: ${unique.length}${flags.limit ? ` (limited to ${flags.limit})` : ''}`);
  console.log(`Saved to: ${DISCOVERY_PATH}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Coasterpedia discovery failed:', err);
  process.exit(1);
});
