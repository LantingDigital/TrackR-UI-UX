"use strict";
/**
 * onRideLogUpdate — Firestore onUpdate trigger
 *
 * Fired when a ride log is updated at rideLogs/{userId}/logs/{logId}.
 *
 * Handles:
 * 1. If timestamp changed across calendar days, recomputes rideCount
 *    (within-day sequence number) for affected days
 * 2. Updates meta.lastLogAt if this is now the most recent log
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRideLogUpdate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
exports.onRideLogUpdate = (0, firestore_1.onDocumentUpdated)({
    document: 'rideLogs/{userId}/logs/{logId}',
    region: 'us-central1',
}, async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after)
        return;
    const { userId } = event.params;
    const db = (0, firestore_2.getFirestore)();
    const oldTimestamp = before.timestamp;
    const newTimestamp = after.timestamp;
    // Only act if timestamp changed
    if (oldTimestamp === newTimestamp)
        return;
    const oldDate = new Date(oldTimestamp).toDateString();
    const newDate = new Date(newTimestamp).toDateString();
    const coasterId = after.coasterId;
    // If the log moved to a different calendar day, recompute rideCount
    // for both the old day and new day
    if (oldDate !== newDate) {
        const logsRef = db.collection(`rideLogs/${userId}/logs`);
        // Recompute rideCount for all logs of this coaster on the OLD day
        await recomputeDayRideCounts(logsRef, coasterId, oldDate);
        // Recompute rideCount for all logs of this coaster on the NEW day
        await recomputeDayRideCounts(logsRef, coasterId, newDate);
    }
    // Update lastLogAt in meta if this might be the most recent
    const metaRef = db.doc(`rideLogs/${userId}/meta/meta`);
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) {
        const currentLastLog = metaSnap.data()?.lastLogAt?.toDate?.();
        const newLogDate = new Date(newTimestamp);
        if (!currentLastLog || newLogDate > currentLastLog) {
            await metaRef.update({
                lastLogAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
    }
    console.log(`[onRideLogUpdate] User ${userId}: timestamp changed from ${oldDate} to ${newDate}`);
});
/**
 * Recompute rideCount (within-day sequence) for all logs of a given
 * coaster on a given calendar day. Logs are ordered by timestamp and
 * assigned sequential rideCount values (1, 2, 3...).
 */
async function recomputeDayRideCounts(logsRef, coasterId, dateString) {
    // Get all logs for this coaster, then filter to the target day
    // (Firestore can't query on a derived date field, so we filter client-side)
    const snap = await logsRef
        .where('coasterId', '==', coasterId)
        .orderBy('timestamp', 'asc')
        .get();
    const logsOnDay = snap.docs.filter((doc) => {
        const ts = doc.data().timestamp;
        return new Date(ts).toDateString() === dateString;
    });
    if (logsOnDay.length === 0)
        return;
    const db = logsRef.firestore;
    const batch = db.batch();
    logsOnDay.forEach((doc, index) => {
        const currentCount = doc.data().rideCount;
        const newCount = index + 1;
        if (currentCount !== newCount) {
            batch.update(doc.ref, { rideCount: newCount });
        }
    });
    await batch.commit();
}
//# sourceMappingURL=onRideLogUpdate.js.map