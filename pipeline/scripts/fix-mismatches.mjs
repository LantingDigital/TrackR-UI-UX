#!/usr/bin/env node
// Fix mismatched name_only/fuzzy merges where Coasterpedia data from a different
// ride was incorrectly merged into an existing Wikipedia coaster.
//
// Strategy:
// 1. Find all coasters with big conflicts (>30% diff on core fields)
// 2. Revert those coasters to Wikipedia-only data
// 3. Mark the wrongly-merged CP articles as "skipped" so enrichment never re-matches them
// 4. For coasters that also have a correct exact match, mark those for re-enrichment
//
// After running this, run: node scripts/07-enrich-coasterpedia.mjs
// (only the exact-match re-enrichments will run; wrong matches are permanently skipped)

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { readJson, writeJsonAtomic } from '../lib/progress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const COASTERS_DIR = resolve(DATA_DIR, 'coasters');
const CP_CONFLICTS_PATH = resolve(DATA_DIR, '_progress/cp-conflicts.json');
const CP_FETCH_STATUS_PATH = resolve(DATA_DIR, '_progress/cp-fetch-status.json');

function main() {
  const conflicts = readJson(CP_CONFLICTS_PATH, []);
  const status = readJson(CP_FETCH_STATUS_PATH, {});

  // Step 1: Find slugs with big conflicts on core fields
  const badSlugs = new Set();
  for (const c of conflicts) {
    if (['heightFt', 'speedMph', 'lengthFt', 'inversions'].includes(c.field)) {
      const diff = Math.abs(c.wikipedia - c.coasterpedia) / Math.max(c.wikipedia, 1);
      if (diff > 0.30) badSlugs.add(c.coaster);
    }
  }

  console.log(`Found ${badSlugs.size} coasters with significant conflicts\n`);

  // Step 2: Find CP articles involved — separate exact (correct) from name_only/fuzzy (wrong)
  const wrongMatches = [];
  const correctExacts = new Map(); // slug → title (for re-enrichment)

  for (const [title, entry] of Object.entries(status)) {
    if (entry.status !== 'success' || !entry.matchedSlug) continue;
    if (!badSlugs.has(entry.matchedSlug)) continue;

    if (entry.matchType === 'exact') {
      correctExacts.set(entry.matchedSlug, title);
    } else {
      wrongMatches.push({ title, slug: entry.matchedSlug, matchType: entry.matchType });
    }
  }

  console.log(`Wrong matches (name_only/fuzzy): ${wrongMatches.length}`);
  console.log(`Correct exact matches to re-apply: ${correctExacts.size}\n`);

  let reverted = 0;
  let skipped = 0;
  let markedReenrich = 0;

  // Step 3: Revert affected coasters to Wikipedia-only state
  for (const slug of badSlugs) {
    const coasterPath = resolve(COASTERS_DIR, `${slug}.json`);
    if (!existsSync(coasterPath)) continue;

    const coaster = readJson(coasterPath);
    if (!coaster) continue;

    // Only revert if it was enriched from both sources
    if (!coaster.dataSource || !coaster.dataSource.includes('coasterpedia')) continue;

    // Remove coasterpedia sub-object
    delete coaster.coasterpedia;

    // Reset dataSource to wikipedia only
    coaster.dataSource = coaster.dataSource.filter(s => s !== 'coasterpedia');

    // Delete the cp-wiki.json (it has wrong content from the bad match)
    const cpWikiPath = resolve(COASTERS_DIR, `${slug}.cp-wiki.json`);
    if (existsSync(cpWikiPath)) {
      try { unlinkSync(cpWikiPath); } catch {}
    }

    writeJsonAtomic(coasterPath, coaster);
    reverted++;
    console.log(`  Reverted: ${slug}`);
  }

  // Step 4: Mark wrong-match articles as "skipped" (isDone() returns true for "skipped")
  // This permanently prevents re-matching on future enrichment runs
  for (const article of wrongMatches) {
    status[article.title] = {
      status: 'skipped',
      reason: 'mismatch_conflict',
      previousSlug: article.slug,
      previousMatchType: article.matchType,
      fixedAt: new Date().toISOString(),
    };
    skipped++;
  }

  // Step 5: Mark correct exact matches for re-enrichment (delete status → enrichment will re-fetch)
  for (const [slug, title] of correctExacts) {
    delete status[title];
    markedReenrich++;
  }

  // Step 6: Remove conflicts that came from bad merges
  const cleanConflicts = conflicts.filter(c => !badSlugs.has(c.coaster));

  writeJsonAtomic(CP_FETCH_STATUS_PATH, status);
  writeJsonAtomic(CP_CONFLICTS_PATH, cleanConflicts);

  console.log(`\n========================================`);
  console.log(`Fix Summary`);
  console.log(`  Coasters reverted to Wikipedia-only: ${reverted}`);
  console.log(`  Wrong-match articles permanently skipped: ${skipped}`);
  console.log(`  Exact matches queued for re-enrichment: ${markedReenrich}`);
  console.log(`  Conflicts remaining: ${cleanConflicts.length}`);
  console.log(`\nRun: node scripts/07-enrich-coasterpedia.mjs`);
  console.log(`(Only ${markedReenrich} exact-match re-enrichments will fetch)`);
  console.log(`========================================\n`);
}

main();
