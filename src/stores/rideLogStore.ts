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

// Standalone action wrappers (for use outside React)
export const addQuickLog = useStore.getState().addQuickLog;
export const upsertCoasterRating = useStore.getState().upsertCoasterRating;
export const deleteRating = useStore.getState().deleteRating;
export const updateLogTimestamp = useStore.getState().updateLogTimestamp;
export const updateLogNotes = useStore.getState().updateLogNotes;
export const deleteLog = useStore.getState().deleteLog;
export const updateCriteria = useStore.getState().updateCriteria;
export const updateCriteriaConfig = useStore.getState().updateCriteriaConfig;
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
    addQuickLog: state.addQuickLog,
    updateLogNotes: state.updateLogNotes,
    deleteLog: state.deleteLog,
    upsertCoasterRating: state.upsertCoasterRating,
    getRatingForCoaster,
    deleteRating: state.deleteRating,
    hasLogForCoaster,
    updateCriteria: state.updateCriteria,
    completeCriteriaSetup: state.completeCriteriaSetup,
    resetStore: state.resetStore,
    subscribe: useStore.subscribe,
  };
}

// Export types for convenience
export type { RideLog, CoasterRating, SeatPosition, RatingCriteria };
