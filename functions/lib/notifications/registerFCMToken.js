"use strict";
/**
 * registerFCMToken — Callable Cloud Function
 *
 * Adds a device's FCM token to the user's fcmTokens array.
 * Uses arrayUnion to prevent duplicates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFCMToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.registerFCMToken = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const token = request.data?.token;
    if (!token || typeof token !== 'string' || token.length < 10) {
        throw new https_1.HttpsError('invalid-argument', 'Valid FCM token is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    await db.doc(`users/${uid}`).update({
        fcmTokens: firestore_1.FieldValue.arrayUnion(token),
    });
    console.log(`[registerFCMToken] User ${uid}: token registered`);
});
//# sourceMappingURL=registerFCMToken.js.map