"use strict";
/**
 * exportRideLog — Callable Cloud Function
 *
 * Exports a user's ride log data as CSV or JSON.
 * Uploads to Firebase Storage with a 24-hour expiring signed URL.
 *
 * Optionally filtered by date range.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRideLog = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
exports.exportRideLog = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    if (!data.format || !['csv', 'json'].includes(data.format)) {
        throw new https_1.HttpsError('invalid-argument', 'format must be "csv" or "json".');
    }
    const db = (0, firestore_1.getFirestore)();
    let query = db.collection(`rideLogs/${uid}/logs`);
    // Apply date range filter if provided
    if (data.dateRange) {
        query = query
            .where('timestamp', '>=', data.dateRange.from)
            .where('timestamp', '<=', data.dateRange.to);
    }
    query = query.orderBy('timestamp', 'desc');
    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => doc.data());
    if (logs.length === 0) {
        return { downloadUrl: null, count: 0 };
    }
    // Also fetch ratings to join
    const ratingsSnap = await db
        .collection(`ratings/${uid}/ratings`)
        .get();
    const ratingsMap = new Map();
    ratingsSnap.forEach((doc) => {
        const d = doc.data();
        ratingsMap.set(doc.id, d.weightedScore);
    });
    let content;
    let contentType;
    let extension;
    if (data.format === 'csv') {
        const headers = [
            'Date',
            'Coaster',
            'Park',
            'Ride #',
            'Seat Row',
            'Seat Position',
            'Rating',
            'Notes',
        ];
        const rows = logs.map((log) => {
            const rating = ratingsMap.get(log.coasterId);
            const seat = log.seat;
            return [
                log.timestamp,
                csvEscape(log.coasterName),
                csvEscape(log.parkName),
                log.rideCount,
                seat?.row ?? '',
                seat?.position ?? '',
                rating != null ? (rating / 10).toFixed(1) : '',
                csvEscape(log.notes ?? ''),
            ].join(',');
        });
        content = [headers.join(','), ...rows].join('\n');
        contentType = 'text/csv';
        extension = 'csv';
    }
    else {
        const exportData = logs.map((log) => {
            const rating = ratingsMap.get(log.coasterId);
            return {
                date: log.timestamp,
                coaster: log.coasterName,
                park: log.parkName,
                rideCount: log.rideCount,
                seat: log.seat,
                rating: rating != null ? rating / 10 : null,
                notes: log.notes,
            };
        });
        content = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        extension = 'json';
    }
    // Upload to Storage
    const bucket = (0, storage_1.getStorage)().bucket();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `exports/${uid}/trackr-ridelog-${timestamp}.${extension}`;
    const file = bucket.file(filename);
    await file.save(content, {
        metadata: { contentType },
    });
    // Generate signed URL (expires in 24 hours)
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000,
    });
    console.log(`[exportRideLog] User ${uid}: ${logs.length} logs exported as ${data.format}`);
    return { downloadUrl: url, count: logs.length };
});
function csvEscape(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=exportRideLog.js.map