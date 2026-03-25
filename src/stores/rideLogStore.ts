/**
 * Ride Log Store — Zustand
 *
 * Manages ride logs, ratings, and criteria configuration.
 * All exported function names and hook API match the original module-level store
 * so consumers don't need import changes.
 */

import { create } from 'zustand';
import {
  RideLog,
  RideLogState,
  CoasterRating,
  SeatPosition,
  RatingCriteria,
  DEFAULT_RIDE_LOG_STATE,
  calculateWeightedScore,
  generateLogId,
} from '../types/rideLog';
import { getAuthUser } from './authStore';
import {
  addRideLog as fsAddRideLog,
  updateRideLogTimestamp as fsUpdateTimestamp,
  updateRideLogNotes as fsUpdateNotes,
  deleteRideLog as fsDeleteRideLog,
} from '../services/firebase/rideLogSync';
import {
  upsertRating as fsUpsertRating,
  deleteRating as fsDeleteRating,
} from '../services/firebase/ratingsSync';
import {
  saveCriteriaConfig as fsSaveCriteriaConfig,
} from '../services/firebase/criteriaSync';

// ============================================
// Store Definition
// ============================================

interface RideLogActions {
  addQuickLog: (
    coaster: { id: string; name: string; parkName: string },
    seat?: SeatPosition
  ) => RideLog;
  upsertCoasterRating: (
    coaster: { id: string; name: string; parkName: string },
    criteriaRatings: Record<string, number>,
    notes?: string
  ) => CoasterRating;
  deleteRating: (coasterId: string) => void;
  updateLogTimestamp: (logId: string, timestamp: string) => void;
  updateLogNotes: (logId: string, notes: string) => void;
  deleteLog: (logId: string) => void;
  updateCriteria: (criteria: RatingCriteria[]) => void;
  updateCriteriaConfig: (config: Partial<RideLogState['criteriaConfig']>) => void;
  completeCriteriaSetup: () => void;
  resetStore: () => void;

  // Firestore sync actions (called by sync layer, not UI)
  _setLogs: (logs: RideLog[]) => void;
  _setRatings: (ratings: Record<string, CoasterRating>) => void;
  _setCriteriaConfig: (config: RideLogState['criteriaConfig']) => void;
  _setCounters: (creditCount: number, totalRideCount: number) => void;
}

type RideLogStore = RideLogState & RideLogActions;

const useStore = create<RideLogStore>((set, get) => ({
  ...DEFAULT_RIDE_LOG_STATE,

  addQuickLog: (coaster, seat) => {
    const { logs, creditCount, totalRideCount } = get();
    const isNewCredit = !logs.some((log) => log.coasterId === coaster.id);

    const today = new Date().toDateString();
    const todayCount = logs.filter(
      (log) =>
        log.coasterId === coaster.id &&
        new Date(log.timestamp).toDateString() === today
    ).length;

    const newLog: RideLog = {
      id: generateLogId(),
      coasterId: coaster.id,
      coasterName: coaster.name,
      parkName: coaster.parkName,
      timestamp: new Date().toISOString(),
      seat,
      rideCount: todayCount + 1,
    };

    set({
      logs: [newLog, ...logs],
      creditCount: isNewCredit ? creditCount + 1 : creditCount,
      totalRideCount: totalRideCount + 1,
    });

    return newLog;
  },

  upsertCoasterRating: (coaster, criteriaRatings, notes) => {
    const { ratings, criteriaConfig } = get();
    const weightedScore = calculateWeightedScore(
      criteriaRatings,
      criteriaConfig.criteria
    );

    const existing = ratings[coaster.id];
    const now = new Date().toISOString();

    const rating: CoasterRating = {
      coasterId: coaster.id,
      coasterName: coaster.name,
      parkName: coaster.parkName,
      criteriaRatings,
      weightedScore,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      notes: notes ?? existing?.notes,
    };

    set({ ratings: { ...ratings, [coaster.id]: rating } });
    return rating;
  },

  deleteRating: (coasterId) => {
    const { [coasterId]: _, ...remaining } = get().ratings;
    set({ ratings: remaining });
  },

  updateLogTimestamp: (logId, timestamp) => {
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === logId ? { ...log, timestamp } : log
      ),
    }));
  },

  updateLogNotes: (logId, notes) => {
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === logId ? { ...log, notes } : log
      ),
    }));
  },

  deleteLog: (logId) => {
    const { logs, creditCount, totalRideCount } = get();
    const log = logs.find((l) => l.id === logId);
    if (!log) return;

    const otherLogsForCoaster = logs.filter(
      (l) => l.coasterId === log.coasterId && l.id !== logId
    );
    const isLosingCredit = otherLogsForCoaster.length === 0;

    set({
      logs: logs.filter((l) => l.id !== logId),
      creditCount: isLosingCredit ? creditCount - 1 : creditCount,
      totalRideCount: totalRideCount - 1,
    });
  },

  updateCriteria: (criteria) => {
    set((state) => ({
      criteriaConfig: {
        criteria,
        lastModifiedAt: new Date().toISOString(),
        hasCompletedSetup: true,
      },
    }));
  },

  updateCriteriaConfig: (config) => {
    set((state) => ({
      criteriaConfig: { ...state.criteriaConfig, ...config },
    }));
  },

  completeCriteriaSetup: () => {
    set((state) => ({
      criteriaConfig: { ...state.criteriaConfig, hasCompletedSetup: true },
    }));
  },

  resetStore: () => {
    set({ ...DEFAULT_RIDE_LOG_STATE });
  },

  // Firestore sync actions — called by sync layer, not UI
  _setLogs: (logs) => {
    const creditCount = new Set(logs.map((l) => l.coasterId)).size;
    set({ logs, creditCount, totalRideCount: logs.length });
  },
  _setRatings: (ratings) => set({ ratings }),
  _setCriteriaConfig: (config) => set({ criteriaConfig: config }),
  _setCounters: (creditCount, totalRideCount) =>
    set({ creditCount, totalRideCount }),
}));

// ============================================
// Standalone Getters (for use outside React)
// ============================================

export function getState(): RideLogState {
  return useStore.getState();
}

export function getAllLogs(): RideLog[] {
  return useStore.getState().logs;
}

export function getCreditCount(): number {
  return useStore.getState().creditCount;
}

export function getTotalRideCount(): number {
  return useStore.getState().totalRideCount;
}

export function getCriteria(): RatingCriteria[] {
  return useStore.getState().criteriaConfig.criteria;
}

export function getCriteriaConfig() {
  return useStore.getState().criteriaConfig;
}

export function hasCompletedCriteriaSetup(): boolean {
  return useStore.getState().criteriaConfig.hasCompletedSetup;
}

export function getLogById(id: string): RideLog | undefined {
  return useStore.getState().logs.find((log) => log.id === id);
}

export function getLogsForCoaster(coasterId: string): RideLog[] {
  return useStore.getState().logs.filter((log) => log.coasterId === coasterId);
}

export function getTodayRideCountForCoaster(coasterId: string): number {
  const today = new Date().toDateString();
  return useStore
    .getState()
    .logs.filter(
      (log) =>
        log.coasterId === coasterId &&
        new Date(log.timestamp).toDateString() === today
    ).length;
}

export function getRatingForCoaster(coasterId: string): CoasterRating | undefined {
  return useStore.getState().ratings[coasterId];
}

export function getAllRatings(): CoasterRating[] {
  return Object.values(useStore.getState().ratings);
}

export function getUnratedCoasters(): Array<{
  coasterId: string;
  coasterName: string;
  parkName: string;
}> {
  const { logs, ratings } = useStore.getState();
  const ratedIds = new Set(Object.keys(ratings));
  const seen = new Set<string>();
  const unrated: Array<{ coasterId: string; coasterName: string; parkName: string }> = [];

  for (const log of logs) {
    if (!ratedIds.has(log.coasterId) && !seen.has(log.coasterId)) {
      seen.add(log.coasterId);
      unrated.push({
        coasterId: log.coasterId,
        coasterName: log.coasterName,
        parkName: log.parkName,
      });
    }
  }
  return unrated;
}

export function hasLogForCoaster(coasterId: string): boolean {
  return useStore.getState().logs.some((log) => log.coasterId === coasterId);
}

// Raw store access (for sync layer only — not for UI)
export const _rideLogStoreInternal = useStore;

// ============================================
// Firestore-Aware Action Wrappers
// ============================================
//
// When a user is authenticated, these route writes through Firestore
// (which does optimistic local updates internally). When not authenticated,
// they fall back to in-memory-only store operations.

/**
 * Log a ride. Routes to Firestore when authenticated.
 * Returns the new RideLog synchronously.
 *
 * When not authenticated, uses the local-only store action.
 * When authenticated, uses fsAddRideLog which handles both the
 * optimistic local update (via _setLogs) AND the Firestore write.
 * The local store addQuickLog is skipped to avoid creating a
 * duplicate log with a different ID.
 */
export function addQuickLog(
  coaster: { id: string; name: string; parkName: string },
  seat?: SeatPosition,
): RideLog {
  const user = getAuthUser();
  if (!user) {
    // Anonymous/offline-only: local store only
    return useStore.getState().addQuickLog(coaster, seat);
  }
  // Authenticated: fsAddRideLog handles optimistic update + Firestore write.
  // Build a synchronous return value for the caller, then fire-and-forget.
  const logs = useStore.getState().logs;
  const today = new Date().toDateString();
  const todayCount = logs.filter(
    (l) =>
      l.coasterId === coaster.id &&
      new Date(l.timestamp).toDateString() === today,
  ).length;
  const returnLog: RideLog = {
    id: generateLogId(),
    coasterId: coaster.id,
    coasterName: coaster.name,
    parkName: coaster.parkName,
    timestamp: new Date().toISOString(),
    seat,
    rideCount: todayCount + 1,
  };
  fsAddRideLog(user.uid, coaster, seat).catch((e) =>
    console.warn('[addQuickLog] Firestore write failed (will retry):', e),
  );
  return returnLog;
}

/**
 * Upsert a coaster rating. Routes to Firestore when authenticated.
 * fsUpsertRating calls store.upsertCoasterRating internally (optimistic),
 * so when authenticated we only call the Firestore function.
 */
export function upsertCoasterRating(
  coaster: { id: string; name: string; parkName: string },
  criteriaRatings: Record<string, number>,
  notes?: string,
): CoasterRating {
  const user = getAuthUser();
  // Always do local update first (needed for synchronous return value)
  const rating = useStore.getState().upsertCoasterRating(coaster, criteriaRatings, notes);
  if (user) {
    // fsUpsertRating also calls store.upsertCoasterRating — the second call
    // is a no-op since the data is identical. Then it writes to Firestore.
    fsUpsertRating(user.uid, coaster, criteriaRatings, notes).catch((e) =>
      console.warn('[upsertCoasterRating] Firestore write failed:', e),
    );
  }
  return rating;
}

/**
 * Delete a rating. Routes to Firestore when authenticated.
 * fsDeleteRating calls store.deleteRating internally (optimistic).
 */
export function deleteRating(coasterId: string): void {
  const user = getAuthUser();
  useStore.getState().deleteRating(coasterId);
  if (user) {
    fsDeleteRating(user.uid, coasterId).catch((e) =>
      console.warn('[deleteRating] Firestore write failed:', e),
    );
  }
}

/**
 * Update a log's timestamp. Routes to Firestore when authenticated.
 * fsUpdateTimestamp calls store.updateLogTimestamp internally (optimistic).
 */
export function updateLogTimestamp(logId: string, timestamp: string): void {
  const user = getAuthUser();
  useStore.getState().updateLogTimestamp(logId, timestamp);
  if (user) {
    fsUpdateTimestamp(user.uid, logId, timestamp).catch((e) =>
      console.warn('[updateLogTimestamp] Firestore write failed:', e),
    );
  }
}

/**
 * Update a log's notes. Routes to Firestore when authenticated.
 * fsUpdateNotes calls store.updateLogNotes internally (optimistic).
 */
export function updateLogNotes(logId: string, notes: string): void {
  const user = getAuthUser();
  useStore.getState().updateLogNotes(logId, notes);
  if (user) {
    fsUpdateNotes(user.uid, logId, notes).catch((e) =>
      console.warn('[updateLogNotes] Firestore write failed:', e),
    );
  }
}

/**
 * Delete a ride log. Routes to Firestore when authenticated.
 * fsDeleteRideLog calls store.deleteLog internally (optimistic).
 */
export function deleteLog(logId: string): void {
  const user = getAuthUser();
  useStore.getState().deleteLog(logId);
  if (user) {
    fsDeleteRideLog(user.uid, logId).catch((e) =>
      console.warn('[deleteLog] Firestore write failed:', e),
    );
  }
}

/**
 * Update criteria. Routes to Firestore when authenticated.
 */
export function updateCriteria(criteria: RatingCriteria[]): void {
  const user = getAuthUser();
  useStore.getState().updateCriteria(criteria);
  if (user) {
    fsSaveCriteriaConfig(user.uid, criteria).catch((e) =>
      console.warn('[updateCriteria] Firestore write failed:', e),
    );
  }
}

/**
 * Update criteria config. Routes to Firestore when authenticated.
 */
export function updateCriteriaConfig(
  config: Partial<RideLogState['criteriaConfig']>,
): void {
  const user = getAuthUser();
  useStore.getState().updateCriteriaConfig(config);
  if (user && config.criteria) {
    fsSaveCriteriaConfig(user.uid, config.criteria).catch((e) =>
      console.warn('[updateCriteriaConfig] Firestore write failed:', e),
    );
  }
}

export const completeCriteriaSetup = useStore.getState().completeCriteriaSetup;
export const resetStore = useStore.getState().resetStore;
export const subscribe = useStore.subscribe;

// ============================================
// React Hook
// ============================================

/**
 * Hook to use ride log store in React components.
 * API-compatible with the original module-level store.
 */
export function useRideLogStore() {
  const state = useStore();

  const unratedCoasters = getUnratedCoasters();
  const allRatings = Object.values(state.ratings);

  return {
    logs: state.logs,
    creditCount: state.creditCount,
    totalRideCount: state.totalRideCount,
    ratings: allRatings,
    unratedCoasters,
    criteria: state.criteriaConfig.criteria,
    hasCompletedCriteriaSetup: state.criteriaConfig.hasCompletedSetup,
    // Firestore-aware wrappers (route to Firestore when authenticated)
    addQuickLog,
    updateLogNotes,
    deleteLog,
    upsertCoasterRating,
    getRatingForCoaster,
    deleteRating,
    hasLogForCoaster,
    updateCriteria,
    completeCriteriaSetup,
    resetStore,
    subscribe: useStore.subscribe,
  };
}

// Export types for convenience
export type { RideLog, CoasterRating, SeatPosition, RatingCriteria };
