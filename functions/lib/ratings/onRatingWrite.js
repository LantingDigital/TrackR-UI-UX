"use strict";
/**
 * onRatingWrite — Firestore onWrite trigger
 *
 * Fired when a rating is created, updated, or deleted at
 * ratings/{userId}/ratings/{coasterId}.
 *
 * Handles:
 * 1. Marks the relevant rankings for recomputation (sets a dirty flag
 *    on a rankings metadata doc so the scheduled computeRankings CF
 *    knows which categories need updating)
 *
 * NOTE: Full global average recomputation is deferred to the scheduled
 * computeRankings function (daily). This trigger only marks categories
 * as dirty to avoid expensive aggregation on every single rating write.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRatingWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const awardBadges_1 = require("../badges/awardBadges");
exports.onRatingWrite = (0, firestore_1.onDocumentWritten)({
    document: 'ratings/{userId}/ratings/{coasterId}',
    region: 'us-central1',
}, async (event) => {
    const { userId, coasterId } = event.params;
    const db = (0, firestore_2.getFirestore)();
    const afterData = event.data?.after?.data();
    const beforeData = event.data?.before?.data();
    // Determine which criteria categories were affected
    const affectedCategories = new Set();
    if (afterData?.criteriaRatings) {
        for (const key of Object.keys(afterData.criteriaRatings)) {
            affectedCategories.add(key);
        }
    }
    if (beforeData?.criteriaRatings) {
        for (const key of Object.keys(beforeData.criteriaRatings)) {
            affectedCategories.add(key);
        }
    }
    // Always mark 'overall' as dirty since any rating change affects it
    affectedCategories.add('overall');
    // Mark categories as dirty for next computeRankings run
    const dirtyRef = db.doc('_internal/rankingsDirty');
    const dirtySnap = await dirtyRef.get();
    if (dirtySnap.exists) {
        await dirtyRef.update({
            categories: firestore_2.FieldValue.arrayUnion(...Array.from(affectedCategories)),
            lastDirtied: firestore_2.FieldValue.serverTimestamp(),
            dirtyCoasterIds: firestore_2.FieldValue.arrayUnion(coasterId),
        });
    }
    else {
        await dirtyRef.set({
            categories: Array.from(affectedCategories),
            lastDirtied: firestore_2.FieldValue.serverTimestamp(),
            dirtyCoasterIds: [coasterId],
        });
    }
    console.log(`[onRatingWrite] User ${userId}, coaster ${coasterId}: marked ${affectedCategories.size} categories dirty`);
    // Check badge criteria on create/update only (not delete)
    if (afterData) {
        try {
            await (0, awardBadges_1.checkAndAwardBadges)(userId, 'rating-created');
        }
        catch (e) {
            console.warn('[onRatingWrite] Badge check failed:', e);
        }
    }
});
//# sourceMappingURL=onRatingWrite.js.map