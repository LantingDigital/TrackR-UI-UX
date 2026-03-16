/**
 * Ride Log Sync — Firestore ↔ Zustand
 *
 * Real-time sync for ride logs and meta counters.
 * - onSnapshot listener pushes Firestore data → rideLogStore
 * - Write functions update Zustand optimistically, then write to Firestore
 * - Firestore persistence handles offline queue automatically
 */

import firestore from '@react-native-firebase/firestore';
import { _rideLogStoreInternal } from '../../stores/rideLogStore';
import { RideLogDoc, RideLogMetaDoc } from '../../types/firestore';
import { RideLog, SeatPosition, generateLogId } from '../../types/rideLog';

// ============================================
// Collection Refs
// ============================================

const logsRef = (uid: string) =>
  firestore().collection('rideLogs').doc(uid).collection('logs');

const metaRef = (uid: string) =>
  firestore().collection('rideLogs').doc(uid).collection('meta').doc('meta');

// ============================================
// Conversion Helpers
// ============================================

/**
 * Convert a Firestore RideLogDoc to a local RideLog.
 */
function fromFirestore(doc: RideLogDoc): RideLog {
  return {
    id: doc.id,
    coasterId: doc.coasterId,
    coasterName: doc.coasterName,
    parkName: doc.parkName,
    timestamp: doc.timestamp,
    seat: doc.seat
      ? { row: Number(doc.seat.row) || 0, col: 0 }
      : undefined,
    notes: doc.notes ?? undefined,
    rideCount: doc.rideCount,
  };
}

/**
 * Convert a local RideLog to a Firestore-writable object.
 */
function toFirestore(
  log: RideLog,
): Omit<RideLogDoc, 'createdAt' | 'updatedAt'> {
  return {
    id: log.id,
    coasterId: log.coasterId,
    coasterName: log.coasterName,
    parkName: log.parkName,
    timestamp: log.timestamp,
    seat: log.seat
      ? { row: String(log.seat.row), position: 'middle' }
      : null,
    rideCount: log.rideCount,
    notes: log.notes ?? null,
  };
}

// ============================================
// Listener
// ============================================

/**
 * Start real-time sync for ride logs.
 * Returns an unsubscribe function.
 */
function startRideLogSync(uid: string): () => void {
  const store = _rideLogStoreInternal.getState();

  // Listen to all logs ordered by timestamp desc
  const unsubLogs = logsRef(uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      (snapshot) => {
        const logs: RideLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as RideLogDoc;
          logs.push(fromFirestore(data));
        });
        _rideLogStoreInternal.getState()._setLogs(logs);
      },
      (error) => {
        console.error('[RideLogSync] Snapshot error:', error);
      },
    );

  // Listen to meta doc for server-computed counters
  const unsubMeta = metaRef(uid).onSnapshot(
    (snapshot) => {
      if (snapshot.exists()) {
        const meta = snapshot.data() as RideLogMetaDoc;
        _rideLogStoreInternal
          .getState()
          ._setCounters(meta.creditCount, meta.totalRideCount);
      }
    },
    (error) => {
      console.error('[RideLogSync] Meta snapshot error:', error);
    },
  );

  return () => {
    unsubLogs();
    unsubMeta();
  };
}

// ============================================
// Write Operations
// ============================================

/**
 * Add a ride log to Firestore.
 * The store update is handled by the onSnapshot listener.
 */
async function addRideLog(
  uid: string,
  coaster: { id: string; name: string; parkName: string },
  seat?: SeatPosition,
): Promise<string> {
  const logId = generateLogId();
  const now = firestore.Timestamp.now();

  const today = new Date().toDateString();
  const currentLogs = _rideLogStoreInternal.getState().logs;
  const todayCount = currentLogs.filter(
    (l) =>
      l.coasterId === coaster.id &&
      new Date(l.timestamp).toDateString() === today,
  ).length;

  const logDoc: RideLogDoc = {
    id: logId,
    coasterId: coaster.id,
    coasterName: coaster.name,
    parkName: coaster.parkName,
    timestamp: new Date().toISOString(),
    seat: seat ? { row: String(seat.row), position: 'middle' } : null,
    rideCount: todayCount + 1,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  // Optimistic: add to store immediately
  const optimisticLog: RideLog = fromFirestore(logDoc);
  const logs = [optimisticLog, ...currentLogs];
  _rideLogStoreInternal.getState()._setLogs(logs);

  // Write to Firestore (onSnapshot will confirm)
  await logsRef(uid).doc(logId).set(logDoc);

  return logId;
}

/**
 * Update a ride log's timestamp.
 */
async function updateRideLogTimestamp(
  uid: string,
  logId: string,
  timestamp: string,
): Promise<void> {
  // Optimistic update
  _rideLogStoreInternal.getState().updateLogTimestamp(logId, timestamp);

  await logsRef(uid).doc(logId).update({
    timestamp,
    updatedAt: firestore.Timestamp.now(),
  });
}

/**
 * Update a ride log's notes.
 */
async function updateRideLogNotes(
  uid: string,
  logId: string,
  notes: string,
): Promise<void> {
  _rideLogStoreInternal.getState().updateLogNotes(logId, notes);

  await logsRef(uid).doc(logId).update({
    notes,
    updatedAt: firestore.Timestamp.now(),
  });
}

/**
 * Delete a ride log.
 */
async function deleteRideLog(uid: string, logId: string): Promise<void> {
  // Optimistic delete
  _rideLogStoreInternal.getState().deleteLog(logId);

  await logsRef(uid).doc(logId).delete();
}

// ============================================
// Exports
// ============================================

export {
  startRideLogSync,
  addRideLog,
  updateRideLogTimestamp,
  updateRideLogNotes,
  deleteRideLog,
};
