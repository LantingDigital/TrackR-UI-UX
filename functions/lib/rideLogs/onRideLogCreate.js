"use strict";
/**
 * onRideLogCreate — Firestore onCreate trigger
 *
 * Fired when a new ride log is created at rideLogs/{userId}/logs/{logId}.
 * Maintains denormalized counters in:
 * - rideLogs/{userId}/meta/meta (creditCount, totalRideCount, lastLogAt)
 * - users/{userId} (totalCredits, totalRides)
 *
 * Uses transactions to prevent counter drift from concurrent writes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRideLogCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const awardBadges_1 = require("../badges/awardBadges");
exports.onRideLogCreate = (0, firestore_1.onDocumentCreated)({
    document: 'rideLogs/{userId}/logs/{logId}',
    region: 'us-central1',
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const { userId } = event.params;
    const logData = snapshot.data();
    const coasterId = logData.coasterId;
    const db = (0, firestore_2.getFirestore)();
    const metaRef = db.doc(`rideLogs/${userId}/meta/meta`);
    const userRef = db.doc(`users/${userId}`);
    const logsRef = db.collection(`rideLogs/${userId}/logs`);
    await db.runTransaction(async (transaction) => {
        // Read current meta doc (may not exist yet for first log)
        const metaSnap = await transaction.get(metaRef);
        const currentMeta = metaSnap.exists
            ? metaSnap.data()
            : { creditCount: 0, totalRideCount: 0, lastLogAt: null };
        // Check if this is the first log for this coaster (new credit)
        const existingLogsForCoaster = await logsRef
            .where('coasterId', '==', coasterId)
            .limit(2) // We only need to know if there's more than 1 (the one just created)
            .get();
        // If only 1 doc exists for this coasterId, it's the one we just created = new credit
        const isNewCredit = existingLogsForCoaster.size <= 1;
        const newTotalRideCount = currentMeta.totalRideCount + 1;
        const newCreditCount = currentMeta.creditCount + (isNewCredit ? 1 : 0);
        // Update meta doc
        if (metaSnap.exists) {
            transaction.update(metaRef, {
                totalRideCount: newTotalRideCount,
                creditCount: newCreditCount,
                lastLogAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
        else {
            transaction.set(metaRef, {
                totalRideCount: newTotalRideCount,
                creditCount: newCreditCount,
                lastLogAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
        // Sync denormalized counts to user doc
        transaction.update(userRef, {
            totalRides: newTotalRideCount,
            totalCredits: newCreditCount,
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        });
    });
    console.log(`[onRideLogCreate] User ${userId}: totalRides+1, coasterId=${coasterId}`);
    // Check badge criteria (best-effort, don't fail the trigger)
    try {
        await (0, awardBadges_1.checkAndAwardBadges)(userId, 'ride-logged');
    }
    catch (e) {
        console.warn('[onRideLogCreate] Badge check failed:', e);
    }
});
//# sourceMappingURL=onRideLogCreate.js.map