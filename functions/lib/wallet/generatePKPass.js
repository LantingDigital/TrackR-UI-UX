"use strict";
/**
 * generatePKPass — Cloud Function (onCall v2)
 *
 * Generates a signed Apple Wallet PKPass file from a user's ticket.
 *
 * Flow:
 * 1. Authenticate the caller
 * 2. Read ticket document from Firestore
 * 3. Build the PKPass with the selected style
 * 4. Upload .pkpass to Cloud Storage
 * 5. Return a signed download URL (valid 1 hour)
 *
 * Client usage:
 *   const result = await functions().httpsCallable('generatePKPass')({
 *     ticketId: 'ticket-123',
 *     style: 'clean',
 *   });
 *   // result.data.downloadUrl → signed URL to .pkpass file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePKPass = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const passBuilder_1 = require("./passBuilder");
// ============================================
// Validation
// ============================================
const VALID_STYLES = ['clean', 'nanobanana', 'park-color', 'dark', 'light'];
function validateRequest(data) {
    if (!data || typeof data !== 'object') {
        throw new https_1.HttpsError('invalid-argument', 'Request body is required.');
    }
    const { ticketId, style } = data;
    if (!ticketId || typeof ticketId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'ticketId is required and must be a string.');
    }
    if (!style || typeof style !== 'string' || !VALID_STYLES.includes(style)) {
        throw new https_1.HttpsError('invalid-argument', `style must be one of: ${VALID_STYLES.join(', ')}`);
    }
    return { ticketId, style: style };
}
async function getTicket(uid, ticketId) {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db
        .collection('users')
        .doc(uid)
        .collection('tickets')
        .doc(ticketId)
        .get();
    if (!snap.exists) {
        throw new https_1.HttpsError('not-found', `Ticket ${ticketId} not found.`);
    }
    const data = snap.data();
    return {
        id: snap.id,
        parkName: data.parkName ?? 'Theme Park',
        parkChain: data.parkChain ?? 'other',
        passType: data.passType ?? 'unknown',
        passholder: data.passholder ?? '',
        validFrom: data.validFrom ?? '',
        validUntil: data.validUntil ?? '',
        qrData: data.qrData ?? null,
        qrFormat: data.qrFormat ?? null,
        heroImageUrl: data.heroImageUrl ?? null,
    };
}
// ============================================
// Storage Upload
// ============================================
/**
 * Upload the .pkpass buffer to Cloud Storage and return a signed download URL.
 */
async function uploadAndGetUrl(uid, ticketId, style, passBuffer) {
    const bucket = (0, storage_1.getStorage)().bucket();
    const filename = `apple-wallet-passes/${uid}/${ticketId}-${style}.pkpass`;
    const file = bucket.file(filename);
    await file.save(passBuffer, {
        contentType: 'application/vnd.apple.pkpass',
        metadata: {
            cacheControl: 'private, max-age=3600',
        },
    });
    // Generate signed URL valid for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expiresAt,
    });
    return {
        downloadUrl: signedUrl,
        expiresAt: expiresAt.toISOString(),
    };
}
// ============================================
// Cloud Function
// ============================================
exports.generatePKPass = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
}, async (request) => {
    // Auth check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'You must be signed in to generate a pass.');
    }
    const uid = request.auth.uid;
    const { ticketId, style } = validateRequest(request.data);
    // Read ticket from Firestore
    const ticket = await getTicket(uid, ticketId);
    // Build the PKPass
    let passBuffer;
    try {
        passBuffer = await (0, passBuilder_1.buildPKPass)({
            ticket,
            style,
            userId: uid,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check if it's a certificate configuration error
        if (message.includes('certificates not found')) {
            throw new https_1.HttpsError('failed-precondition', 'Apple Wallet certificates are not configured. ' +
                'Please upload Pass Type ID certificates to Cloud Storage.');
        }
        throw new https_1.HttpsError('internal', `Failed to generate pass: ${message}`);
    }
    // Upload to Cloud Storage and get signed URL
    const { downloadUrl, expiresAt } = await uploadAndGetUrl(uid, ticketId, style, passBuffer);
    return { downloadUrl, expiresAt };
});
//# sourceMappingURL=generatePKPass.js.map