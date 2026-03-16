/**
 * Ratings Sync — Firestore ↔ Zustand
 *
 * Real-time sync for per-coaster ratings.
 * - onSnapshot listener pushes Firestore data → rideLogStore.ratings
 * - Write functions update Zustand optimistically, then write to Firestore
 */

import firestore from '@react-native-firebase/firestore';
import { _rideLogStoreInternal } from '../../stores/rideLogStore';
import { RatingDoc } from '../../types/firestore';
import { CoasterRating, calculateWeightedScore } from '../../types/rideLog';

// ============================================
// Collection Ref
// ============================================

const ratingsRef = (uid: string) =>
  firestore().collection('ratings').doc(uid);

// ============================================
// Conversion Helpers
// ============================================

function fromFirestore(coasterId: string, doc: RatingDoc): CoasterRating {
  return {
    coasterId,
    coasterName: doc.coasterName,
    parkName: doc.parkName,
    criteriaRatings: doc.criteriaRatings,
    weightedScore: doc.weightedScore,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  };
}

// ============================================
// Listener
// ============================================

/**
 * Start real-time sync for ratings.
 * The ratings collection is structured as `ratings/{userId}/{coasterId}`.
 * We listen to all docs under `ratings/{userId}`.
 */
function startRatingsSync(uid: string): () => void {
  // Firestore doesn't support listening to a "document as a collection parent"
  // directly. The ratings path is ratings/{userId}/{coasterId}, which means
  // {coasterId} docs are a subcollection-like pattern using the userId as parent.
  // Actually in the schema it's a flat sub-path, so we query the subcollection.
  const unsub = ratingsRef(uid).collection('ratings').onSnapshot(
    (snapshot) => {
      const ratings: Record<string, CoasterRating> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as RatingDoc;
        ratings[doc.id] = fromFirestore(doc.id, data);
      });
      _rideLogStoreInternal.getState()._setRatings(ratings);
    },
    (error) => {
      console.error('[RatingsSync] Snapshot error:', error);
    },
  );

  return unsub;
}

// ============================================
// Write Operations
// ============================================

/**
 * Create or update a rating for a coaster.
 */
async function upsertRating(
  uid: string,
  coaster: { id: string; name: string; parkName: string },
  criteriaRatings: Record<string, number>,
  notes?: string,
): Promise<void> {
  const criteria = _rideLogStoreInternal.getState().criteriaConfig.criteria;
  const weightedScore = calculateWeightedScore(criteriaRatings, criteria);
  const now = firestore.Timestamp.now();

  // Check if existing rating
  const existing = _rideLogStoreInternal.getState().ratings[coaster.id];

  // Optimistic update
  _rideLogStoreInternal.getState().upsertCoasterRating(
    coaster,
    criteriaRatings,
    notes,
  );

  const docData: RatingDoc = {
    coasterId: coaster.id,
    coasterName: coaster.name,
    parkName: coaster.parkName,
    criteriaRatings,
    weightedScore,
    notes: notes ?? null,
    createdAt: existing ? now : now, // Will be overwritten by merge if existing
    updatedAt: now,
  };

  // Use set with merge to handle both create and update
  await ratingsRef(uid)
    .collection('ratings')
    .doc(coaster.id)
    .set(docData, { merge: true });
}

/**
 * Delete a rating.
 */
async function deleteRating(
  uid: string,
  coasterId: string,
): Promise<void> {
  // Optimistic delete
  _rideLogStoreInternal.getState().deleteRating(coasterId);

  await ratingsRef(uid).collection('ratings').doc(coasterId).delete();
}

// ============================================
// Exports
// ============================================

export { startRatingsSync, upsertRating, deleteRating };
