/**
 * registerFCMToken — Callable Cloud Function
 *
 * Adds a device's FCM token to the user's fcmTokens array.
 * Uses arrayUnion to prevent duplicates.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const registerFCMToken = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const token = request.data?.token as string | undefined;

    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new HttpsError('invalid-argument', 'Valid FCM token is required.');
    }

    const db = getFirestore();
    await db.doc(`users/${uid}`).update({
      fcmTokens: FieldValue.arrayUnion(token),
    });

    console.log(`[registerFCMToken] User ${uid}: token registered`);
  },
);
