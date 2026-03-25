/**
 * Criteria Config Sync — Firestore ↔ Zustand
 *
 * Real-time sync for rating criteria configuration.
 * Path: users/{userId}/criteriaConfig/config
 */

import firestore from '@react-native-firebase/firestore';
import { _rideLogStoreInternal } from '../../stores/rideLogStore';
import { CriteriaConfigDoc } from '../../types/firestore';
import {
  RatingCriteria,
  UserCriteriaConfig,
  DEFAULT_CRITERIA_CONFIG,
} from '../../types/rideLog';

// ============================================
// Doc Ref
// ============================================

const criteriaDocRef = (uid: string) =>
  firestore()
    .collection('users')
    .doc(uid)
    .collection('criteriaConfig')
    .doc('config');

// ============================================
// Conversion
// ============================================

function fromFirestore(doc: CriteriaConfigDoc): UserCriteriaConfig {
  return {
    criteria: doc.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      weight: c.weight,
      icon: c.icon,
      isLocked: c.isLocked,
    })),
    hasCompletedSetup: doc.hasCompletedSetup,
    lastModifiedAt: doc.lastModifiedAt,
  };
}

function toFirestore(config: UserCriteriaConfig): CriteriaConfigDoc {
  return {
    criteria: config.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon ?? '',
      weight: c.weight,
      isLocked: c.isLocked ?? false,
    })),
    hasCompletedSetup: config.hasCompletedSetup,
    lastModifiedAt: config.lastModifiedAt,
  };
}

// ============================================
// Listener
// ============================================

function startCriteriaSync(uid: string): () => void {
  const unsub = criteriaDocRef(uid).onSnapshot(
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CriteriaConfigDoc;
        _rideLogStoreInternal.getState()._setCriteriaConfig(fromFirestore(data));
      }
    },
    (error) => {
      console.error('[CriteriaSync] Snapshot error:', error);
    },
  );

  return unsub;
}

// ============================================
// Write Operations
// ============================================

/**
 * Save criteria configuration to Firestore.
 */
async function saveCriteriaConfig(
  uid: string,
  criteria: RatingCriteria[],
): Promise<void> {
  const config: UserCriteriaConfig = {
    criteria,
    lastModifiedAt: new Date().toISOString(),
    hasCompletedSetup: true,
  };

  // Optimistic update
  _rideLogStoreInternal.getState()._setCriteriaConfig(config);

  await criteriaDocRef(uid).set(toFirestore(config));
}

/**
 * Initialize criteria config in Firestore if it doesn't exist.
 * Called on first auth to ensure the doc is there.
 */
async function ensureCriteriaConfig(uid: string): Promise<void> {
  const doc = await criteriaDocRef(uid).get();
  if (!doc.exists()) {
    await criteriaDocRef(uid).set(toFirestore(DEFAULT_CRITERIA_CONFIG));
  }
}

// ============================================
// Weight Revert System
// ============================================

/**
 * Doc ref for the previous weight snapshot (one-step undo).
 * Path: users/{userId}/criteriaConfig/previousConfig
 */
const previousConfigRef = (uid: string) =>
  firestore()
    .collection('users')
    .doc(uid)
    .collection('criteriaConfig')
    .doc('previousConfig');

/**
 * Save the current criteria config as the "previous" snapshot
 * before applying new weights. Enables one-step revert.
 */
async function savePreviousWeightConfig(uid: string): Promise<void> {
  const currentConfig = _rideLogStoreInternal.getState().criteriaConfig;
  await previousConfigRef(uid).set(toFirestore(currentConfig));
}

/**
 * Revert to the previously saved weight config (one-step undo).
 * Returns true if revert succeeded, false if no previous config exists.
 */
async function revertWeightConfig(uid: string): Promise<boolean> {
  const snap = await previousConfigRef(uid).get();
  if (!snap.exists()) return false;

  const previousData = snap.data() as CriteriaConfigDoc;
  const previousConfig = fromFirestore(previousData);

  // Optimistic update
  _rideLogStoreInternal.getState()._setCriteriaConfig(previousConfig);

  // Write the reverted config as the active config
  await criteriaDocRef(uid).set(toFirestore(previousConfig));

  // Clear the previous snapshot (consumed)
  await previousConfigRef(uid).delete();

  return true;
}

/**
 * Check if a previous weight config exists (for showing revert button).
 */
async function hasPreviousWeightConfig(uid: string): Promise<boolean> {
  const snap = await previousConfigRef(uid).get();
  return snap.exists();
}

// ============================================
// Exports
// ============================================

export {
  startCriteriaSync,
  saveCriteriaConfig,
  ensureCriteriaConfig,
  savePreviousWeightConfig,
  revertWeightConfig,
  hasPreviousWeightConfig,
};
