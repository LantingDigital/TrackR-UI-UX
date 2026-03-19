"use strict";
/**
 * computeRankings — Scheduled Cloud Function
 *
 * Runs daily at 3am PT. Aggregates all ratings across all users,
 * computes average weighted scores per coaster per category,
 * and writes pre-computed ranking documents.
 *
 * Output: rankings/{category}_{timeWindow} docs (18 total: 6 categories x 3 windows)
 *
 * Categories: overall, airtime, intensity, smoothness, theming, pacing
 * Time windows: all-time, this-year, this-month
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRankings = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const CATEGORIES = [
    'overall',
    'airtime',
    'intensity',
    'smoothness',
    'theming',
    'pacing',
];
const TIME_WINDOWS = ['all-time', 'this-year', 'this-month'];
exports.computeRankings = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * *', // 3am every day
    timeZone: 'America/Los_Angeles',
    region: 'us-central1',
}, async () => {
    const db = (0, firestore_1.getFirestore)();
    // Fetch ALL ratings across all users using collection group query
    // Path: ratings/{userId}/ratings/{coasterId}
    const allRatings = await db.collectionGroup('ratings').get();
    if (allRatings.empty) {
        console.log('[computeRankings] No ratings found. Skipping.');
        return;
    }
    // Time boundary calculations
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Aggregate ratings by category and time window
    // Structure: { [category_timeWindow]: { [coasterId]: RatingAggregation } }
    const aggregations = new Map();
    // Initialize all category/window combos
    for (const category of CATEGORIES) {
        for (const window of TIME_WINDOWS) {
            aggregations.set(`${category}_${window}`, new Map());
        }
    }
    for (const doc of allRatings.docs) {
        const data = doc.data();
        // Skip docs that aren't actual rating documents
        // (the collection group query might pick up other subcollections named "ratings")
        if (!data.coasterId || !data.criteriaRatings)
            continue;
        const coasterId = data.coasterId;
        const coasterName = data.coasterName || '';
        const parkName = data.parkName || '';
        const criteriaRatings = data.criteriaRatings;
        const weightedScore = data.weightedScore || 0;
        // Determine time window eligibility
        const updatedAt = data.updatedAt?.toDate?.() ?? new Date(0);
        const isThisYear = updatedAt >= startOfYear;
        const isThisMonth = updatedAt >= startOfMonth;
        const applicableWindows = [
            'all-time',
        ];
        if (isThisYear)
            applicableWindows.push('this-year');
        if (isThisMonth)
            applicableWindows.push('this-month');
        for (const window of applicableWindows) {
            // Overall category uses weightedScore
            addToAggregation(aggregations.get(`overall_${window}`), coasterId, coasterName, parkName, weightedScore);
            // Individual criteria categories
            for (const category of CATEGORIES) {
                if (category === 'overall')
                    continue;
                const score = criteriaRatings[category];
                if (score != null && score > 0) {
                    addToAggregation(aggregations.get(`${category}_${window}`), coasterId, coasterName, parkName, score * 10);
                }
            }
        }
    }
    // Read previous rankings for rankChange computation
    const prevRankings = new Map();
    for (const category of CATEGORIES) {
        const prevDoc = await db
            .doc(`rankings/${category}_all-time`)
            .get();
        if (prevDoc.exists) {
            const entries = prevDoc.data()?.entries ?? [];
            const rankMap = new Map();
            for (const e of entries) {
                rankMap.set(e.coasterId, e.rank);
            }
            prevRankings.set(category, rankMap);
        }
    }
    // Write ranking documents
    const batch = db.batch();
    let batchOps = 0;
    for (const [key, coasterMap] of aggregations.entries()) {
        const [category, timeWindow] = key.split('_');
        const prevRankMap = prevRankings.get(category);
        // Sort by average score descending
        const sorted = Array.from(coasterMap.values())
            .map((agg) => ({
            ...agg,
            averageScore: Math.round(agg.totalScore / agg.count),
        }))
            .sort((a, b) => b.averageScore - a.averageScore);
        const entries = sorted.map((agg, index) => {
            const rank = index + 1;
            const prevRank = prevRankMap?.get(agg.coasterId);
            const rankChange = prevRank != null ? prevRank - rank : 0;
            return {
                coasterId: agg.coasterId,
                coasterName: agg.coasterName,
                parkName: agg.parkName,
                averageScore: agg.averageScore,
                totalRatings: agg.count,
                rank,
                rankChange,
            };
        });
        // Only write top 100 per category/window
        const topEntries = entries.slice(0, 100);
        const docRef = db.doc(`rankings/${key}`);
        batch.set(docRef, {
            category,
            timeWindow,
            entries: topEntries,
            lastComputed: firestore_1.FieldValue.serverTimestamp(),
        });
        batchOps++;
    }
    await batch.commit();
    // Clear dirty flags
    const dirtyRef = db.doc('_internal/rankingsDirty');
    const dirtySnap = await dirtyRef.get();
    if (dirtySnap.exists) {
        await dirtyRef.delete();
    }
    console.log(`[computeRankings] Computed ${batchOps} ranking docs from ${allRatings.size} ratings`);
});
function addToAggregation(map, coasterId, coasterName, parkName, score) {
    const existing = map.get(coasterId);
    if (existing) {
        existing.totalScore += score;
        existing.count += 1;
    }
    else {
        map.set(coasterId, {
            coasterId,
            coasterName,
            parkName,
            totalScore: score,
            count: 1,
        });
    }
}
//# sourceMappingURL=computeRankings.js.map