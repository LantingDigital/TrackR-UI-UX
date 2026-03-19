"use strict";
/**
 * setAdminClaim — Callable Cloud Function (bootstrapping only)
 *
 * Sets the `admin: true` custom claim on a Firebase Auth user.
 * This is the ONLY way to grant admin access.
 *
 * Security: Only existing admins can promote other users.
 * For initial bootstrap (no admins exist yet), use the Firebase Admin SDK
 * directly via a one-time script:
 *
 *   const admin = require('firebase-admin');
 *   admin.initializeApp();
 *   await admin.auth().setCustomUserClaims(CALEB_UID, { admin: true });
 *
 * After the first admin is set, this CF can be used for future promotions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
exports.setAdminClaim = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    // Verify caller is already an admin
    const callerClaims = request.auth.token;
    if (callerClaims.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can grant admin access.');
    }
    const targetUid = request.data?.uid;
    if (!targetUid || typeof targetUid !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'uid is required.');
    }
    const auth = (0, auth_1.getAuth)();
    // Verify target user exists
    try {
        await auth.getUser(targetUid);
    }
    catch {
        throw new https_1.HttpsError('not-found', 'User not found.');
    }
    // Set admin claim
    await auth.setCustomUserClaims(targetUid, { admin: true });
    console.log(`[setAdminClaim] Admin ${request.auth.uid} granted admin to ${targetUid}`);
    return { success: true };
});
//# sourceMappingURL=setAdminClaim.js.map