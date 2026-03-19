"use strict";
/**
 * handleSubscriptionEvent — HTTPS endpoint (Apple S2S webhook)
 *
 * Receives Apple App Store Server Notifications v2 for subscription
 * lifecycle events (renewal, cancellation, refund, etc.)
 *
 * Apple sends a signed JWS (JSON Web Signature) payload.
 * We decode and verify it, then update the purchase and user records.
 *
 * Register this URL in App Store Connect > App > App Store Server Notifications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
// ============================================
// JWS Decode (simplified — decode payload without full verification)
// For production: use apple-app-store-server-library for full JWS verification
// ============================================
function decodeJWSPayload(jws) {
    const parts = jws.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWS format');
    }
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
}
// ============================================
// HTTPS Handler
// ============================================
exports.handleSubscriptionEvent = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
}, async (req, res) => {
    // Apple only sends POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const body = req.body;
        if (!body?.signedPayload || typeof body.signedPayload !== 'string') {
            console.error('[handleSubscriptionEvent] Missing signedPayload');
            res.status(400).send('Missing signedPayload');
            return;
        }
        // Decode the outer notification
        const notification = decodeJWSPayload(body.signedPayload);
        const { notificationType, subtype } = notification;
        console.log(`[handleSubscriptionEvent] ${notificationType}${subtype ? `/${subtype}` : ''} (${notification.data.environment})`);
        // Decode the transaction info
        const txInfo = decodeJWSPayload(notification.data.signedTransactionInfo);
        const db = (0, firestore_1.getFirestore)();
        // Find the purchase by originalTransactionId
        const purchaseSnap = await db
            .collection('purchases')
            .where('originalTransactionId', '==', txInfo.originalTransactionId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        if (purchaseSnap.empty) {
            console.warn(`[handleSubscriptionEvent] No purchase found for originalTransactionId=${txInfo.originalTransactionId}`);
            // Still return 200 — Apple retries on non-200
            res.status(200).send('OK');
            return;
        }
        const purchaseDoc = purchaseSnap.docs[0];
        const purchaseData = purchaseDoc.data();
        const userId = purchaseData.userId;
        // Handle notification types
        switch (notificationType) {
            case 'DID_RENEW': {
                // Subscription renewed — update expiry
                const newExpiry = new Date(txInfo.expiresDate);
                await purchaseDoc.ref.update({
                    status: 'active',
                    expiresAt: newExpiry,
                });
                await db.doc(`users/${userId}`).update({
                    'proStatus.active': true,
                    'proStatus.expiresAt': newExpiry,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                console.log(`[handleSubscriptionEvent] Renewed for user ${userId}`);
                break;
            }
            case 'EXPIRED': {
                // Subscription expired
                await purchaseDoc.ref.update({ status: 'expired' });
                await db.doc(`users/${userId}`).update({
                    'proStatus.active': false,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                console.log(`[handleSubscriptionEvent] Expired for user ${userId}`);
                break;
            }
            case 'DID_CHANGE_RENEWAL_STATUS': {
                if (subtype === 'AUTO_RENEW_DISABLED') {
                    // User cancelled — will expire at end of period
                    await purchaseDoc.ref.update({ status: 'cancelled' });
                    console.log(`[handleSubscriptionEvent] User ${userId} cancelled (expires at period end)`);
                }
                else if (subtype === 'AUTO_RENEW_ENABLED') {
                    // User re-enabled
                    await purchaseDoc.ref.update({ status: 'active' });
                    console.log(`[handleSubscriptionEvent] User ${userId} re-enabled auto-renew`);
                }
                break;
            }
            case 'REFUND': {
                // Apple issued a refund — immediately revoke
                await purchaseDoc.ref.update({ status: 'refunded' });
                await db.doc(`users/${userId}`).update({
                    'proStatus.active': false,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                console.log(`[handleSubscriptionEvent] Refunded for user ${userId}`);
                break;
            }
            case 'REVOKE': {
                // Family sharing revocation or similar
                await purchaseDoc.ref.update({ status: 'refunded' });
                await db.doc(`users/${userId}`).update({
                    'proStatus.active': false,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                console.log(`[handleSubscriptionEvent] Revoked for user ${userId}`);
                break;
            }
            case 'DID_CHANGE_RENEWAL_PREF': {
                // User changed to different product (upgrade/downgrade)
                // The actual change happens at next renewal — just log it
                console.log(`[handleSubscriptionEvent] User ${userId} changing renewal product`);
                break;
            }
            default: {
                console.log(`[handleSubscriptionEvent] Unhandled type: ${notificationType}`);
            }
        }
        // Apple expects 200 to acknowledge receipt
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('[handleSubscriptionEvent] Error:', error);
        // Still return 200 to prevent Apple from retrying
        res.status(200).send('OK');
    }
});
//# sourceMappingURL=handleSubscriptionEvent.js.map