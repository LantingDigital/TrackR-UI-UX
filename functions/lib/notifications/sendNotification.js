"use strict";
/**
 * sendNotification — Internal helper (NOT a callable)
 *
 * Sends an FCM push notification to a specific user.
 * Reads the user's fcmTokens and notificationsEnabled flag.
 * Automatically cleans up invalid tokens.
 *
 * Usage from other Cloud Functions:
 *   import { sendNotificationToUser } from '../notifications/sendNotification';
 *   await sendNotificationToUser(userId, 'Title', 'Body', { screen: 'profile' });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = sendNotificationToUser;
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
async function sendNotificationToUser(userId, title, body, data) {
    const db = (0, firestore_1.getFirestore)();
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists)
        return;
    const userData = userDoc.data();
    const tokens = userData.fcmTokens;
    const enabled = userData.notificationsEnabled;
    if (!enabled || !tokens || tokens.length === 0)
        return;
    const messaging = (0, messaging_1.getMessaging)();
    const invalidTokens = [];
    // Send to all registered tokens
    const results = await Promise.allSettled(tokens.map(async (token) => {
        try {
            await messaging.send({
                token,
                notification: { title, body },
                data: data ?? {},
                apns: {
                    payload: {
                        aps: {
                            badge: 1,
                            sound: 'default',
                        },
                    },
                },
            });
        }
        catch (error) {
            // Check if token is invalid/expired
            if (error !== null &&
                typeof error === 'object' &&
                'code' in error) {
                const code = error.code;
                if (code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(token);
                }
            }
            throw error;
        }
    }));
    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
        await db.doc(`users/${userId}`).update({
            fcmTokens: firestore_1.FieldValue.arrayRemove(...invalidTokens),
        });
        console.log(`[sendNotification] Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
    }
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`[sendNotification] User ${userId}: ${sent}/${tokens.length} tokens notified`);
}
//# sourceMappingURL=sendNotification.js.map