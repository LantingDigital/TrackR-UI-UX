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

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const db = getFirestore();
  const userDoc = await db.doc(`users/${userId}`).get();

  if (!userDoc.exists) return;

  const userData = userDoc.data()!;
  const tokens = userData.fcmTokens as string[];
  const enabled = userData.notificationsEnabled as boolean;

  if (!enabled || !tokens || tokens.length === 0) return;

  const messaging = getMessaging();
  const invalidTokens: string[] = [];

  // Send to all registered tokens
  const results = await Promise.allSettled(
    tokens.map(async (token) => {
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
      } catch (error) {
        // Check if token is invalid/expired
        if (
          error !== null &&
          typeof error === 'object' &&
          'code' in error
        ) {
          const code = (error as { code: string }).code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(token);
          }
        }
        throw error;
      }
    }),
  );

  // Clean up invalid tokens
  if (invalidTokens.length > 0) {
    await db.doc(`users/${userId}`).update({
      fcmTokens: FieldValue.arrayRemove(...invalidTokens),
    });
    console.log(
      `[sendNotification] Removed ${invalidTokens.length} invalid tokens for user ${userId}`,
    );
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  console.log(
    `[sendNotification] User ${userId}: ${sent}/${tokens.length} tokens notified`,
  );
}
