"use strict";
/**
 * validateUsername Cloud Function
 *
 * Callable function that atomically validates and reserves a username.
 * Uses a Firestore transaction to prevent race conditions.
 *
 * Flow:
 * 1. Normalize (lowercase, trim)
 * 2. Validate format (3-20 chars, alphanumeric + underscores)
 * 3. Check reserved words
 * 4. Transaction: check availability → create username doc → update user doc
 * 5. If user had a previous username, delete the old reservation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUsername = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const RESERVED_USERNAMES = new Set([
    'admin',
    'trackr',
    'support',
    'help',
    'official',
    'moderator',
    'mod',
    'system',
    'staff',
    'team',
    'null',
    'undefined',
    'anonymous',
    'deleted',
]);
/**
 * Validate username format.
 * 3-20 chars, lowercase alphanumeric + underscores, no leading/trailing underscores.
 */
function isValidFormat(username) {
    if (username.length < 3 || username.length > 20)
        return false;
    if (!/^[a-z0-9_]+$/.test(username))
        return false;
    if (username.startsWith('_') || username.endsWith('_'))
        return false;
    return true;
}
exports.validateUsername = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    // Must be authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const rawUsername = request.data?.username;
    if (typeof rawUsername !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Username must be a string.');
    }
    const username = rawUsername.toLowerCase().trim();
    // Format validation
    if (!isValidFormat(username)) {
        return {
            available: false,
            error: 'Username must be 3-20 characters, letters/numbers/underscores only.',
        };
    }
    // Reserved words check
    if (RESERVED_USERNAMES.has(username)) {
        return {
            available: false,
            error: 'This username is reserved.',
        };
    }
    const db = (0, firestore_1.getFirestore)();
    const usernameDocRef = db.collection('usernames').doc(username);
    const userDocRef = db.collection('users').doc(uid);
    try {
        await db.runTransaction(async (transaction) => {
            // Check if username is already taken
            const usernameSnap = await transaction.get(usernameDocRef);
            if (usernameSnap.exists) {
                const existingUid = usernameSnap.data()?.uid;
                if (existingUid === uid) {
                    // User already owns this username — no-op
                    return;
                }
                throw new https_1.HttpsError('already-exists', 'Username is already taken.');
            }
            // Check if user has an existing username to release
            const userSnap = await transaction.get(userDocRef);
            const oldUsername = userSnap.data()?.username;
            if (oldUsername && oldUsername !== username) {
                // Release the old username
                const oldUsernameDocRef = db.collection('usernames').doc(oldUsername);
                transaction.delete(oldUsernameDocRef);
            }
            // Reserve the new username
            transaction.set(usernameDocRef, {
                uid,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
            // Update user doc
            transaction.update(userDocRef, {
                username,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        return { available: true };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            return { available: false, error: error.message };
        }
        throw new https_1.HttpsError('internal', 'Failed to validate username.');
    }
});
//# sourceMappingURL=validateUsername.js.map