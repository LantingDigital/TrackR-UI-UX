"use strict";
/**
 * migrateLocalData — Callable Cloud Function
 *
 * Uploads a user's locally-stored data to Firestore on first authentication.
 * Called once after the user creates an account or signs in for the first time.
 *
 * Accepts ride logs, ratings, tickets, criteria config, and settings.
 * Uses batched writes for efficiency (Firestore batch limit: 500 ops).
 *
 * IMPORTANT: This function writes directly to Firestore via Admin SDK,
 * bypassing security rules. The onRideLogCreate trigger will fire for
 * each log written, automatically computing meta counters.
 * To avoid N trigger invocations during migration, we compute and write
 * meta counters directly, and suppress triggers via a migration flag.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocalData = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
// Firestore batch limit
const BATCH_LIMIT = 500;
exports.migrateLocalData = (0, https_1.onCall)({
    region: 'us-central1',
    // Allow larger payloads for migration (default is 10MB, should be enough)
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    const db = (0, firestore_1.getFirestore)();
    // Check if user has already migrated (prevent duplicate runs)
    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('failed-precondition', 'User document does not exist. Sign in first.');
    }
    const counts = { logs: 0, ratings: 0, tickets: 0 };
    // --- Ride Logs ---
    if (data.rideLogs && data.rideLogs.length > 0) {
        const logs = data.rideLogs;
        const batches = [];
        let currentBatch = db.batch();
        let opsInBatch = 0;
        for (const log of logs) {
            const logRef = db.doc(`rideLogs/${uid}/logs/${log.id}`);
            const now = firestore_1.Timestamp.now();
            currentBatch.set(logRef, {
                id: log.id,
                coasterId: log.coasterId,
                coasterName: log.coasterName,
                parkName: log.parkName,
                timestamp: log.timestamp,
                seat: log.seat,
                rideCount: log.rideCount,
                notes: log.notes,
                // Mark as migrated so triggers can detect and skip if needed
                _migrated: true,
                createdAt: now,
                updatedAt: now,
            }, { merge: false });
            opsInBatch++;
            if (opsInBatch >= BATCH_LIMIT) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                opsInBatch = 0;
            }
        }
        if (opsInBatch > 0) {
            batches.push(currentBatch);
        }
        for (const batch of batches) {
            await batch.commit();
        }
        // Compute meta counters directly (instead of relying on N trigger invocations)
        const distinctCoasters = new Set(logs.map((l) => l.coasterId));
        const metaRef = db.doc(`rideLogs/${uid}/meta/meta`);
        await metaRef.set({
            totalRideCount: logs.length,
            creditCount: distinctCoasters.size,
            lastLogAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // Sync to user doc
        await db.doc(`users/${uid}`).update({
            totalRides: logs.length,
            totalCredits: distinctCoasters.size,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        counts.logs = logs.length;
    }
    // --- Ratings ---
    if (data.ratings && data.ratings.length > 0) {
        const ratings = data.ratings;
        const batches = [];
        let currentBatch = db.batch();
        let opsInBatch = 0;
        for (const rating of ratings) {
            // Path matches client code: ratings/{userId}/ratings/{coasterId}
            const ratingRef = db.doc(`ratings/${uid}/ratings/${rating.coasterId}`);
            const now = firestore_1.Timestamp.now();
            currentBatch.set(ratingRef, {
                coasterId: rating.coasterId,
                coasterName: rating.coasterName,
                parkName: rating.parkName,
                criteriaRatings: rating.criteriaRatings,
                weightedScore: rating.weightedScore,
                notes: rating.notes,
                createdAt: now,
                updatedAt: now,
            });
            opsInBatch++;
            if (opsInBatch >= BATCH_LIMIT) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                opsInBatch = 0;
            }
        }
        if (opsInBatch > 0) {
            batches.push(currentBatch);
        }
        for (const batch of batches) {
            await batch.commit();
        }
        counts.ratings = ratings.length;
    }
    // --- Criteria Config ---
    if (data.criteriaConfig) {
        const configRef = db.doc(`users/${uid}/criteriaConfig/config`);
        await configRef.set(data.criteriaConfig);
    }
    // --- Settings (merge into user doc) ---
    if (data.settings) {
        const updates = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (data.settings.displayName) {
            updates.displayName = data.settings.displayName;
        }
        if (data.settings.homeParkName) {
            updates.homeParkName = data.settings.homeParkName;
        }
        if (data.settings.riderType) {
            updates.riderType = data.settings.riderType;
        }
        await db.doc(`users/${uid}`).update(updates);
    }
    console.log(`[migrateLocalData] User ${uid}: ${counts.logs} logs, ${counts.ratings} ratings migrated`);
    return {
        migrated: counts,
    };
});
//# sourceMappingURL=migrateLocalData.js.map