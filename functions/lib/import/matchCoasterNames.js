"use strict";
/**
 * matchCoasterNames — Callable Cloud Function
 *
 * Fuzzy-matches imported coaster names against the TrackR coaster database.
 * Returns confidence scores and alternatives for each name.
 *
 * Matching strategy:
 * - Normalize: lowercase, strip "the", strip common suffixes
 * - Levenshtein distance + token-based similarity
 * - Boost confidence if park name also matches
 * - Threshold: >= 0.85 = confident match, < 0.85 = needs manual match
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchCoasterNames = void 0;
const https_1 = require("firebase-functions/v2/https");
// ============================================
// Normalization
// ============================================
const STRIP_SUFFIXES = [
    'roller coaster',
    'rollercoaster',
    'coaster',
    'ride',
    'the ride',
    'the experience',
];
const STRIP_PREFIXES = ['the', 'a'];
/**
 * Normalize a coaster name for comparison.
 * Lowercase, strip common prefixes/suffixes, trim.
 */
function normalize(name) {
    let n = name.toLowerCase().trim();
    // Remove special characters but keep spaces
    n = n.replace(/[''`]/g, '').replace(/[^\w\s]/g, ' ');
    // Strip prefixes
    for (const prefix of STRIP_PREFIXES) {
        if (n.startsWith(prefix + ' ')) {
            n = n.slice(prefix.length + 1);
        }
    }
    // Strip suffixes
    for (const suffix of STRIP_SUFFIXES) {
        if (n.endsWith(' ' + suffix)) {
            n = n.slice(0, -(suffix.length + 1));
        }
    }
    // Collapse whitespace
    n = n.replace(/\s+/g, ' ').trim();
    return n;
}
/**
 * Tokenize a name into unique lowercase words.
 */
function tokenize(name) {
    return new Set(normalize(name)
        .split(/\s+/)
        .filter((w) => w.length > 0));
}
// ============================================
// Similarity Functions
// ============================================
/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0)
        return n;
    if (n === 0)
        return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++)
        dp[i][0] = i;
    for (let j = 0; j <= n; j++)
        dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}
/**
 * Levenshtein-based string similarity (0-1).
 */
function stringSimilarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb)
        return 1.0;
    if (na.length === 0 || nb.length === 0)
        return 0.0;
    const dist = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);
    return 1.0 - dist / maxLen;
}
/**
 * Jaccard-based token similarity (0-1).
 * Measures overlap of word tokens.
 */
function tokenSimilarity(a, b) {
    const tokensA = tokenize(a);
    const tokensB = tokenize(b);
    if (tokensA.size === 0 || tokensB.size === 0)
        return 0;
    let intersection = 0;
    for (const t of tokensA) {
        if (tokensB.has(t))
            intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return intersection / union;
}
/**
 * Combined similarity score (0-1).
 * Weights: 60% string similarity, 40% token similarity.
 */
function combinedSimilarity(imported, database) {
    const strSim = stringSimilarity(imported, database);
    const tokSim = tokenSimilarity(imported, database);
    return strSim * 0.6 + tokSim * 0.4;
}
/**
 * Park name similarity boost.
 * If the imported park name loosely matches the database park, boost confidence.
 */
function parkBoost(importedPark, databasePark) {
    if (!importedPark)
        return 0;
    const sim = stringSimilarity(importedPark, databasePark);
    if (sim >= 0.7)
        return 0.1; // Strong park match
    if (sim >= 0.5)
        return 0.05; // Partial park match
    return 0;
}
// ============================================
// Main Cloud Function
// ============================================
exports.matchCoasterNames = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '1GiB', // Coaster DB can be large
    timeoutSeconds: 120,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const data = request.data;
    if (!data.names || !Array.isArray(data.names)) {
        throw new https_1.HttpsError('invalid-argument', 'names array is required.');
    }
    if (!data.coasterDatabase ||
        !Array.isArray(data.coasterDatabase) ||
        data.coasterDatabase.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'coasterDatabase array is required.');
    }
    // Pre-normalize all database entries for faster matching
    const dbEntries = data.coasterDatabase.map((c) => ({
        ...c,
        normalized: normalize(c.name),
    }));
    const results = [];
    for (const input of data.names) {
        const { rawName, rawParkName } = input;
        if (!rawName) {
            results.push({ rawName: '', bestMatch: null, alternatives: [] });
            continue;
        }
        const normalizedInput = normalize(rawName);
        // Score every coaster
        const scored = [];
        for (const entry of dbEntries) {
            // Quick skip: if normalized lengths differ by more than 3x, unlikely match
            if (entry.normalized.length > normalizedInput.length * 3 ||
                normalizedInput.length > entry.normalized.length * 3) {
                continue;
            }
            let score = combinedSimilarity(rawName, entry.name);
            // Park name boost
            score += parkBoost(rawParkName, entry.park);
            // Exact normalized match = perfect
            if (normalizedInput === entry.normalized) {
                score = 1.0;
            }
            // Only consider scores above a minimum threshold
            if (score >= 0.3) {
                scored.push({
                    coasterId: entry.id,
                    coasterName: entry.name,
                    parkName: entry.park,
                    confidence: Math.min(score, 1.0),
                    score,
                });
            }
        }
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        const bestMatch = scored.length > 0
            ? {
                coasterId: scored[0].coasterId,
                coasterName: scored[0].coasterName,
                parkName: scored[0].parkName,
                confidence: scored[0].confidence,
            }
            : null;
        // Return alternatives if best match confidence < 0.9
        const alternatives = bestMatch && bestMatch.confidence < 0.9
            ? scored.slice(1, 4).map((s) => ({
                coasterId: s.coasterId,
                coasterName: s.coasterName,
                parkName: s.parkName,
                confidence: s.confidence,
            }))
            : [];
        results.push({ rawName, bestMatch, alternatives });
    }
    console.log(`[matchCoasterNames] User ${request.auth.uid}: matched ${data.names.length} names against ${data.coasterDatabase.length} coasters`);
    return { results };
});
//# sourceMappingURL=matchCoasterNames.js.map