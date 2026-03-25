/**
 * Import Service — Client-side orchestration for ride data import
 *
 * Manages the full import pipeline:
 * 1. File upload → processImportFile CF → parsed rides
 * 2. Coaster matching → matchCoasterNames CF → matched rides
 * 3. Duplicate detection → compare against existing logs
 * 4. Batch write → Firestore (matching core-data-agent's write patterns)
 *
 * Uses the same RideLogDoc schema and write path as rideLogSync.ts.
 */

import firestore from '@react-native-firebase/firestore';
import { generateLogId } from '../../types/rideLog';
import { _rideLogStoreInternal } from '../../stores/rideLogStore';
import type { RideLogDoc } from '../../types/firestore';
import type {
  ImportedRide,
  CoasterMatchResult,
} from './functions';

// ============================================
// Types
// ============================================

/** A ride ready for import after matching and user confirmation. */
export interface ResolvedImportRide {
  /** Original parsed ride from CF */
  parsedRide: ImportedRide;
  /** Matched coaster from the database */
  matchedCoaster: {
    coasterId: string;
    coasterName: string;
    parkName: string;
  };
  /** Final timestamp (ISO 8601) — from parsed date or user-provided */
  timestamp: string;
  /** Seat info parsed from raw seat string */
  seat: { row: string; position: 'left' | 'middle' | 'right' } | null;
  /** Notes from the import file */
  notes: string | null;
  /** Whether this ride is a potential duplicate */
  isDuplicate: boolean;
  /** Whether the user wants to import this ride */
  selected: boolean;
}

export interface ImportProgress {
  total: number;
  completed: number;
  status: 'idle' | 'importing' | 'complete' | 'error';
  error?: string;
}

// ============================================
// Duplicate Detection
// ============================================

/**
 * Check which resolved rides are potential duplicates of existing logs.
 * A duplicate = same coasterId + same calendar date.
 */
export function detectDuplicates(
  rides: ResolvedImportRide[],
  existingLogs: Array<{ coasterId: string; timestamp: string }>,
): ResolvedImportRide[] {
  const existingSet = new Set<string>();
  for (const log of existingLogs) {
    const date = new Date(log.timestamp).toDateString();
    existingSet.add(`${log.coasterId}::${date}`);
  }

  return rides.map((ride) => {
    const date = new Date(ride.timestamp).toDateString();
    const key = `${ride.matchedCoaster.coasterId}::${date}`;
    const isDuplicate = existingSet.has(key);
    return {
      ...ride,
      isDuplicate,
      selected: !isDuplicate, // Duplicates default to unchecked
    };
  });
}

// ============================================
// Seat Parsing
// ============================================

/**
 * Attempt to parse a raw seat string into the RideLogDoc seat format.
 * Handles: "Front left", "Back right", "Row 3 Middle", "front", etc.
 */
export function parseSeatString(
  raw: string | null,
): { row: string; position: 'left' | 'middle' | 'right' } | null {
  if (!raw) return null;

  const lower = raw.toLowerCase().trim();
  if (!lower) return null;

  let row = 'middle';
  let position: 'left' | 'middle' | 'right' = 'middle';

  // Detect row
  if (lower.includes('front')) row = 'front';
  else if (lower.includes('back')) row = 'back';
  else if (lower.includes('middle') || lower.includes('mid')) row = 'middle';
  else {
    // Check for a number (row number)
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) row = numMatch[1];
  }

  // Detect position
  if (lower.includes('left')) position = 'left';
  else if (lower.includes('right')) position = 'right';
  else position = 'middle';

  return { row, position };
}

// ============================================
// Batch Import Writer
// ============================================

const BATCH_SIZE = 50;

/**
 * Write confirmed import rides to Firestore in batches of 50.
 * Matches core-data-agent's write patterns exactly.
 *
 * Calls onProgress after each batch completes.
 * Returns the total number of rides successfully written.
 */
export async function writeImportBatch(
  uid: string,
  rides: ResolvedImportRide[],
  onProgress: (progress: ImportProgress) => void,
): Promise<number> {
  const selected = rides.filter((r) => r.selected);
  const total = selected.length;

  if (total === 0) return 0;

  onProgress({ total, completed: 0, status: 'importing' });

  let completed = 0;

  for (let i = 0; i < selected.length; i += BATCH_SIZE) {
    const chunk = selected.slice(i, i + BATCH_SIZE);
    const batch = firestore().batch();

    for (const ride of chunk) {
      const logId = generateLogId();
      const now = firestore.Timestamp.now();

      const logDoc: RideLogDoc = {
        id: logId,
        coasterId: ride.matchedCoaster.coasterId,
        coasterName: ride.matchedCoaster.coasterName,
        parkName: ride.matchedCoaster.parkName,
        timestamp: ride.timestamp,
        seat: ride.seat,
        rideCount: ride.parsedRide.rawRideCount,
        notes: ride.notes,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = firestore()
        .collection('rideLogs')
        .doc(uid)
        .collection('logs')
        .doc(logId);

      batch.set(docRef, logDoc);
    }

    try {
      await batch.commit();
      completed += chunk.length;
      onProgress({ total, completed, status: 'importing' });
    } catch (error) {
      console.error(
        `[importService] Batch write failed at ${completed}/${total}:`,
        error,
      );
      onProgress({
        total,
        completed,
        status: 'error',
        error: `Import failed at ride ${completed + 1}. ${completed} rides were imported successfully.`,
      });
      return completed;
    }
  }

  onProgress({ total, completed, status: 'complete' });

  console.log(
    `[importService] User ${uid}: ${completed} rides imported successfully`,
  );

  return completed;
}

// ============================================
// Resolve Import Rides
// ============================================

/**
 * Convert parsed rides + match results into ResolvedImportRides.
 * Only includes rides where a coaster match was confirmed.
 */
export function resolveImportRides(
  parsedRides: ImportedRide[],
  matchResults: CoasterMatchResult[],
  /** Map of rawCoasterName → confirmed match (after user review) */
  confirmedMatches: Map<
    string,
    { coasterId: string; coasterName: string; parkName: string }
  >,
): ResolvedImportRide[] {
  const resolved: ResolvedImportRide[] = [];

  for (const ride of parsedRides) {
    const match = confirmedMatches.get(ride.rawCoasterName);
    if (!match) continue; // User skipped this coaster

    resolved.push({
      parsedRide: ride,
      matchedCoaster: match,
      timestamp: ride.parsedDate ?? new Date().toISOString(),
      seat: parseSeatString(ride.rawSeat),
      notes: ride.rawNotes,
      isDuplicate: false, // Will be set by detectDuplicates
      selected: true,
    });
  }

  return resolved;
}
