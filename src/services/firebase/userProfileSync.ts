/**
 * User Profile Sync — Firestore ↔ Zustand Settings Store
 *
 * Real-time sync for the user profile document (users/{userId}).
 * Maps Firestore UserDoc fields → settingsStore profile fields.
 */

import firestore from '@react-native-firebase/firestore';
import { _settingsStoreInternal } from '../../stores/settingsStore';
import { UserDoc } from '../../types/firestore';
import type { PrivacyLevel } from '../../stores/settingsStore';

// ============================================
// Listener
// ============================================

/**
 * Start real-time sync for the user profile document.
 * Maps Firestore fields to settings store fields.
 */
function startUserProfileSync(uid: string): () => void {
  const unsub = firestore()
    .collection('users')
    .doc(uid)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as UserDoc;

        // Map Firestore UserDoc → settingsStore profile fields
        const visibilityMap: Record<string, PrivacyLevel> = {
          public: 'everyone',
          private: 'private',
        };

        _settingsStoreInternal.getState()._setProfileFromFirestore({
          displayName: data.displayName || 'Coaster Rider',
          username: data.username ? `@${data.username}` : '@coasterrider',
          profileImageUri: data.profileImageUrl,
          homeParkName: data.homeParkName || null,
          activityVisibility: visibilityMap[data.accountVisibility] ?? 'everyone',
          notificationsEnabled: data.notificationsEnabled,
        });
      },
      (error) => {
        console.error('[UserProfileSync] Snapshot error:', error);
      },
    );

  return unsub;
}

// ============================================
// Write Operations
// ============================================

/**
 * Update profile fields in Firestore.
 * The onSnapshot listener will push the update to the settings store.
 */
async function updateProfile(
  uid: string,
  updates: {
    displayName?: string;
    homeParkName?: string;
    riderType?: 'thrill-seeker' | 'well-rounded' | 'casual' | 'family';
    accountVisibility?: 'public' | 'private';
    notificationsEnabled?: boolean;
  },
): Promise<void> {
  await firestore()
    .collection('users')
    .doc(uid)
    .update({
      ...updates,
      updatedAt: firestore.Timestamp.now(),
    });
}

/**
 * Update the user's profile image URL.
 */
async function updateProfileImage(
  uid: string,
  imageUrl: string | null,
): Promise<void> {
  // Optimistic update
  _settingsStoreInternal.getState()._setProfileFromFirestore({
    profileImageUri: imageUrl,
  });

  await firestore()
    .collection('users')
    .doc(uid)
    .update({
      profileImageUrl: imageUrl,
      updatedAt: firestore.Timestamp.now(),
    });
}

// ============================================
// Exports
// ============================================

export { startUserProfileSync, updateProfile, updateProfileImage };
