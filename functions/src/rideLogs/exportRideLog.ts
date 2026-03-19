/**
 * exportRideLog — Callable Cloud Function
 *
 * Exports a user's ride log data as CSV or JSON.
 * Uploads to Firebase Storage with a 24-hour expiring signed URL.
 *
 * Optionally filtered by date range.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

interface ExportInput {
  format: 'csv' | 'json';
  dateRange?: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
}

export const exportRideLog = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const data = request.data as ExportInput;

    if (!data.format || !['csv', 'json'].includes(data.format)) {
      throw new HttpsError(
        'invalid-argument',
        'format must be "csv" or "json".',
      );
    }

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection(
      `rideLogs/${uid}/logs`,
    );

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
    const ratingsMap = new Map<string, number>();
    ratingsSnap.forEach((doc) => {
      const d = doc.data();
      ratingsMap.set(doc.id, d.weightedScore as number);
    });

    let content: string;
    let contentType: string;
    let extension: string;

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
        const rating = ratingsMap.get(log.coasterId as string);
        const seat = log.seat as { row: string; position: string } | null;
        return [
          log.timestamp,
          csvEscape(log.coasterName as string),
          csvEscape(log.parkName as string),
          log.rideCount,
          seat?.row ?? '',
          seat?.position ?? '',
          rating != null ? (rating / 10).toFixed(1) : '',
          csvEscape((log.notes as string) ?? ''),
        ].join(',');
      });
      content = [headers.join(','), ...rows].join('\n');
      contentType = 'text/csv';
      extension = 'csv';
    } else {
      const exportData = logs.map((log) => {
        const rating = ratingsMap.get(log.coasterId as string);
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
    const bucket = getStorage().bucket();
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

    console.log(
      `[exportRideLog] User ${uid}: ${logs.length} logs exported as ${data.format}`,
    );

    return { downloadUrl: url, count: logs.length };
  },
);

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
