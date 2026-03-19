/**
 * Sync Controller — Master Orchestrator
 *
 * Manages all Firestore real-time sync lifecycle based on auth state.
 * - On sign-in: starts all sync listeners
 * - On sign-out: stops all listeners and resets stores
 *
 * Usage:
 *   Import this module in the app entry point (App.tsx or similar).
 *   Call `initSync()` once on app startup. It subscribes to auth state
 *   and automatically manages sync lifecycle.
 */

import { onAuthStateChanged } from './auth';
import { getOrCreateUserDoc } from './firestore';
import { ensureCriteriaConfig } from './criteriaSync';
import { startRideLogSync } from './rideLogSync';
import { startRatingsSync } from './ratingsSync';
import { startCriteriaSync } from './criteriaSync';
import { startUserProfileSync } from './userProfileSync';
import { startFriendsSync } from './friendsSync';
import { startFeedSync } from './feedSync';
import { startRankingsSync } from './rankingsSync';
import { _rideLogStoreInternal } from '../../stores/rideLogStore';
import { _friendsStoreInternal } from '../../features/community/stores/friendsStore';
import { _communityStoreInternal } from '../../features/community/stores/communityStore';
import { _rankingsStoreInternal } from '../../features/community/stores/rankingsStore';
import { AuthUser } from '../../types/auth';

// ============================================
// State
// ============================================

/** All active unsubscribe functions */
let activeUnsubscribes: Array<() => void> = [];

/** The auth state listener unsubscribe */
let authUnsub: (() => void) | null = null;

/** Currently syncing user ID */
let currentUid: string | null = null;

// ============================================
// Sync Lifecycle
// ============================================

/**
 * Start all Firestore sync listeners for the given user.
 * Pass the full AuthUser so getOrCreateUserDoc gets real profile data
 * (email, displayName, photoURL, provider) on first sign-up.
 */
async function startAllSync(authUser: AuthUser): Promise<void> {
  const uid = authUser.uid;

  // Don't double-subscribe
  if (currentUid === uid) return;

  // Stop any existing sync first
  stopAllSync();
  currentUid = uid;

  // Ensure user document and criteria config exist in Firestore
  // (safety net — the client-side createUserDoc + onUserCreated CF
  // should have already created these, but this handles edge cases)
  try {
    await getOrCreateUserDoc(authUser);
    await ensureCriteriaConfig(uid);
  } catch (error) {
    console.error('[SyncController] Failed to ensure docs:', error);
  }

  // Start all listeners
  activeUnsubscribes = [
    startRideLogSync(uid),
    startRatingsSync(uid),
    startCriteriaSync(uid),
    startUserProfileSync(uid),
    startFriendsSync(uid),
    startFeedSync(uid),
    startRankingsSync(),
  ];

  console.log('[SyncController] Sync started for', uid);
}

/**
 * Stop all Firestore sync listeners and reset local stores.
 */
function stopAllSync(): void {
  for (const unsub of activeUnsubscribes) {
    try {
      unsub();
    } catch (error) {
      console.error('[SyncController] Unsubscribe error:', error);
    }
  }
  activeUnsubscribes = [];
  currentUid = null;

  // Reset stores to defaults
  _rideLogStoreInternal.getState().resetStore();
  _friendsStoreInternal.getState()._resetStore();
  _communityStoreInternal.getState()._resetStore();
  _rankingsStoreInternal.getState()._resetStore();

  console.log('[SyncController] Sync stopped, stores reset');
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the sync system. Call once on app startup.
 * Subscribes to auth state changes and automatically manages sync.
 */
function initSync(): () => void {
  if (authUnsub) {
    // Already initialized
    return authUnsub;
  }

  authUnsub = onAuthStateChanged((user) => {
    if (user) {
      startAllSync(user);
    } else {
      stopAllSync();
    }
  });

  return authUnsub;
}

/**
 * Get the currently syncing user ID, or null if not syncing.
 */
function getSyncUid(): string | null {
  return currentUid;
}

/**
 * Check if sync is currently active.
 */
function isSyncActive(): boolean {
  return currentUid !== null && activeUnsubscribes.length > 0;
}

// ============================================
// Exports
// ============================================

export {
  initSync,
  startAllSync,
  stopAllSync,
  getSyncUid,
  isSyncActive,
};
