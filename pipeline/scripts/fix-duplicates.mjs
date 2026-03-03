#!/usr/bin/env node
// Fix duplicate coaster entries where the same ride exists under two slugs
// (e.g., "top-thrill-2" and "top-thrill-2-cedar-point").
//
// Strategy: keep the richer version (more data sources, better quality),
// delete the other and its associated wiki files.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { readJson } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');

function main() {
  // Group coasters by name+parkId
  const byKey = new Map();

  const files = readdirSync(COASTERS_DIR).filter(
    f => f.endsWith('.json') && !f.includes('wiki')
  );

  for (const f of files) {
    try {
      const d = JSON.parse(readFileSync(resolve(COASTERS_DIR, f), 'utf-8'));
      const key = `${d.name}|${d.parkId}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({
        file: f,
        id: d.id,
        sources: d.dataSource || [],
        dataQuality: d.dataQuality,
        popularityRank: d.popularityRank,
      });
    } catch {}
  }

  let removed = 0;

  for (const [key, entries] of byKey) {
    if (entries.length <= 1) continue;

    // Score each entry: more sources = better, both > single > none
    // Tie-break: higher data quality, then shorter slug (usually the canonical one)
    entries.sort((a, b) => {
      const sourceScore = (e) => {
        if (e.sources.includes('wikipedia') && e.sources.includes('coasterpedia')) return 3;
        if (e.sources.includes('wikipedia')) return 2;
        if (e.sources.includes('coasterpedia')) return 1;
        return 0;
      };
      const qualityScore = (e) => {
        if (e.dataQuality === 'verified') return 2;
        if (e.dataQuality === 'partial') return 1;
        return 0;
      };

      const sDiff = sourceScore(b) - sourceScore(a);
      if (sDiff !== 0) return sDiff;

      const qDiff = qualityScore(b) - qualityScore(a);
      if (qDiff !== 0) return qDiff;

      // Shorter slug is usually the canonical one
      return a.id.length - b.id.length;
    });

    // Keep the first (best), remove the rest
    const keeper = entries[0];
    const toRemove = entries.slice(1);

    for (const entry of toRemove) {
      const mainPath = resolve(COASTERS_DIR, `${entry.id}.json`);
      const wikiPath = resolve(COASTERS_DIR, `${entry.id}.wiki.json`);
      const cpWikiPath = resolve(COASTERS_DIR, `${entry.id}.cp-wiki.json`);

      for (const p of [mainPath, wikiPath, cpWikiPath]) {
        if (existsSync(p)) {
          unlinkSync(p);
        }
      }

      removed++;
      console.log(`  Removed: ${entry.id} (keeping ${keeper.id})`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Deduplication Summary`);
  console.log(`  Duplicates removed: ${removed}`);
  console.log(`  Remaining coaster files: ${files.length - removed}`);
  console.log(`========================================\n`);
}

main();
