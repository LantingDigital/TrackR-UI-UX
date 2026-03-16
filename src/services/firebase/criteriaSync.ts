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
// Exports
// ============================================

export { startCriteriaSync, saveCriteriaConfig, ensureCriteriaConfig };
