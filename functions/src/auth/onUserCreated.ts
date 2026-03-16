/**
 * onUserCreated — Firebase Auth onCreate trigger
 *
 * Creates the initial `users/{uid}` Firestore document when a new
 * Firebase Auth account is created. This is the server-side equivalent
 * of createUserDoc in the client service — acts as a safety net in case
 * the client-side creation fails or races.
 *
 * Maps to `generateProfileReady` in the Cloud Functions spec.
 */

import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const onUserCreated = beforeUserCreated(
  { region: 'us-central1' },
  async (event) => {
    const user = event.data;
    if (!user) return;

    const db = getFirestore();
    const userDocRef = db.collection('users').doc(user.uid);

    // Check if client already created the doc (race condition guard)
    const existing = await userDocRef.get();
    if (existing.exists) return;

    // Detect auth provider
    let authProvider: 'apple' | 'google' | 'email' = 'email';
    if (user.providerData && user.providerData.length > 0) {
      const providerId = user.providerData[0].providerId;
      if (providerId === 'apple.com') authProvider = 'apple';
      else if (providerId === 'google.com') authProvider = 'google';
    }

    const now = FieldValue.serverTimestamp();

    await userDocRef.set({
      uid: user.uid,
      displayName: user.displayName ?? '',
      username: '',
      profileImageUrl: user.photoURL ?? null,
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
  },
);
