// Match Coasterpedia entries against existing Wikipedia coasters.

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Normalize a string for fuzzy matching.
 * Strips articles, common suffixes, punctuation, extra whitespace.
 */
function normalizeForMatch(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\b(amusement park|theme park|resort|park|fun park|funpark)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build match indexes from existing coaster JSON files.
 *
 * @param {string} coastersDir - Path to data/coasters/
 * @returns {{
 *   parkNameIndex: Map<string, string>,
 *   nameIndex: Map<string, string[]>,
 *   formerNameIndex: Map<string, string[]>,
 *   slugSet: Set<string>
 * }}
 */
export function buildMatchIndex(coastersDir) {
  const parkNameIndex = new Map();  // "name|parkName" → slug
  const nameIndex = new Map();       // lowercase name → [slugs]
  const formerNameIndex = new Map(); // lowercase former name → [slugs]
  const slugSet = new Set();

  const files = readdirSync(coastersDir).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.wiki.json') && !f.endsWith('.cp-wiki.json')
  );

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(resolve(coastersDir, file), 'utf-8'));
      const slug = data.id;
      if (!slug) continue;

      slugSet.add(slug);

      // Exact name + park index
      const key = `${data.name?.toLowerCase()}|${data.parkName?.toLowerCase()}`;
      parkNameIndex.set(key, slug);

      // Name-only index
      const nameLower = data.name?.toLowerCase();
      if (nameLower) {
        if (!nameIndex.has(nameLower)) nameIndex.set(nameLower, []);
        nameIndex.get(nameLower).push(slug);
      }

      // Former names index
      if (data.formerNames) {
        for (const fn of data.formerNames) {
          const fnLower = fn.toLowerCase();
          if (!formerNameIndex.has(fnLower)) formerNameIndex.set(fnLower, []);
          formerNameIndex.get(fnLower).push(slug);
        }
      }
    } catch {
      // Skip malformed files
    }
  }

  return { parkNameIndex, nameIndex, formerNameIndex, slugSet };
}

/**
 * Find a matching existing coaster for a Coasterpedia entry.
 *
 * @param {string} cpName - Coaster name from Coasterpedia
 * @param {string} cpParkName - Park name from Coasterpedia
 * @param {object} index - From buildMatchIndex()
 * @returns {{ slug: string, confidence: string } | null}
 */
export function findMatch(cpName, cpParkName, index) {
  const nameLower = cpName.toLowerCase();
  const parkLower = (cpParkName || '').toLowerCase();

  // 1. Exact name + park match (highest confidence)
  const exactKey = `${nameLower}|${parkLower}`;
  if (index.parkNameIndex.has(exactKey)) {
    return { slug: index.parkNameIndex.get(exactKey), confidence: 'exact' };
  }

  // 1b. Try with normalized park name (strip "Amusement Park" etc.)
  if (parkLower) {
    const normPark = normalizeForMatch(cpParkName);
    for (const [key, slug] of index.parkNameIndex) {
      const [, existingPark] = key.split('|');
      if (key.startsWith(nameLower + '|') && normalizeForMatch(existingPark) === normPark) {
        return { slug, confidence: 'exact' };
      }
    }
  }

  // 2. Exact name match (only if unique)
  const nameMatches = index.nameIndex.get(nameLower);
  if (nameMatches && nameMatches.length === 1) {
    return { slug: nameMatches[0], confidence: 'name_only' };
  }

  // 3. Former name match
  const formerMatches = index.formerNameIndex.get(nameLower);
  if (formerMatches && formerMatches.length === 1) {
    return { slug: formerMatches[0], confidence: 'former_name' };
  }

  // 4. Fuzzy match — normalize both sides
  const normName = normalizeForMatch(cpName);
  if (normName.length > 2) {
    for (const [existingName, slugs] of index.nameIndex) {
      if (slugs.length === 1 && normalizeForMatch(existingName) === normName) {
        return { slug: slugs[0], confidence: 'fuzzy' };
      }
    }
  }

  // No match
  return null;
}
