/**
 * onRideLogDelete — Firestore onDelete trigger
 *
 * Fired when a ride log is deleted from rideLogs/{userId}/logs/{logId}.
 * Decrements denormalized counters in:
 * - rideLogs/{userId}/meta/meta (creditCount, totalRideCount)
 * - users/{userId} (totalCredits, totalRides)
 *
 * If no other logs exist for the same coasterId, decrements creditCount.
 */

import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const onRideLogDelete = onDocumentDeleted(
  {
    document: 'rideLogs/{userId}/logs/{logId}',
    region: 'us-central1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const { userId } = event.params;
    const logData = snapshot.data();
    const coasterId = logData.coasterId as string;

    const db = getFirestore();
    const metaRef = db.doc(`rideLogs/${userId}/meta/meta`);
    const userRef = db.doc(`users/${userId}`);
    const logsRef = db.collection(`rideLogs/${userId}/logs`);

    await db.runTransaction(async (transaction) => {
      const metaSnap = await transaction.get(metaRef);
      if (!metaSnap.exists) {
        console.warn(
          `[onRideLogDelete] Meta doc missing for user ${userId}. Skipping.`,
        );
        return;
      }

      const currentMeta = metaSnap.data()!;

      // Check if any other logs exist for this coaster (the deleted one is already gone)
      const remainingLogs = await logsRef
        .where('coasterId', '==', coasterId)
        .limit(1)
        .get();

      const lostCredit = remainingLogs.empty;

      const newTotalRideCount = Math.max(
        0,
        (currentMeta.totalRideCount as number) - 1,
      );
      const newCreditCount = Math.max(
        0,
        (currentMeta.creditCount as number) - (lostCredit ? 1 : 0),
      );

      // Update meta doc
      transaction.update(metaRef, {
        totalRideCount: newTotalRideCount,
        creditCount: newCreditCount,
      });

      // Sync to user doc
      transaction.update(userRef, {
        totalRides: newTotalRideCount,
        totalCredits: newCreditCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    console.log(
      `[onRideLogDelete] User ${userId}: totalRides-1, coasterId=${coasterId}`,
    );
  },
);
