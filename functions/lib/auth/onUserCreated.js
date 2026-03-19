"use strict";
/**
 * onUserCreated — Callable function to initialize user profile
 *
 * Called by the client after Firebase Auth signup to create the
 * initial `users/{uid}` Firestore document. Acts as a safety net
 * for the client-side createUserDoc — if the client call fails or
 * races, this CF ensures the doc exists.
 *
 * Converted from beforeUserCreated (blocking function) to onCall
 * because blocking functions require Identity Platform (GCIP) which
 * is not enabled on this project. The client calls this immediately
 * after auth signup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.onUserCreated = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { uid, token } = request.auth;
    const db = (0, firestore_1.getFirestore)();
    const userDocRef = db.collection('users').doc(uid);
    // Check if client already created the doc (race condition guard)
    const existing = await userDocRef.get();
    if (existing.exists) {
        return { created: false, message: 'User doc already exists' };
    }
    // Detect auth provider from the token
    let authProvider = 'email';
    const signInProvider = token.firebase?.sign_in_provider;
    if (signInProvider === 'apple.com')
        authProvider = 'apple';
    else if (signInProvider === 'google.com')
        authProvider = 'google';
    const now = firestore_1.FieldValue.serverTimestamp();
    await userDocRef.set({
        uid,
        displayName: token.name ?? '',
        username: '',
        profileImageUrl: token.picture ?? null,
        authProvider,
        homeParkName: '',
        riderType: 'well-rounded',
        totalCredits: 0,
        totalRides: 0,
        accountVisibility: 'public',
        fcmTokens: [],
        notificationsEnabled: true,
        proStatus: {
            active: false,
            tier: null,
            expiresAt: null,
            platform: null,
        },
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
    });
    return { created: true, message: 'User doc created' };
});
//# sourceMappingURL=onUserCreated.js.map