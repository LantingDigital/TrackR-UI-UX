/**
 * Ride Log Store - Module-Level State Management
 *
 * This store persists ride logs in module-level variables that survive
 * component re-mounts but reset on app restart. For production, this
 * should be upgraded to AsyncStorage or a database.
 *
 * Pattern: Simple functional store with getters and setters
 */

import {
  RideLog,
  RideLogState,
  CoasterRating,
  SeatPosition,
  RatingCriteria,
  DEFAULT_RIDE_LOG_STATE,
  DEFAULT_CRITERIA,
  calculateWeightedScore,
  generateLogId,
} from '../types/rideLog';

// ============================================
// Module-Level State (persists across re-mounts)
// ============================================

let state: RideLogState = { ...DEFAULT_RIDE_LOG_STATE };
let listeners: Set<() => void> = new Set();

// ============================================
// Subscription System
// ============================================

/**
 * Subscribe to state changes
 * @param listener - Callback when state changes
 * @returns Unsubscribe function
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all listeners of state change
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

// ============================================
// State Getters
// ============================================

/**
 * Get current ride log state
 */
export function getState(): RideLogState {
  return state;
}

/**
 * Get all ride logs
 */
export function getAllLogs(): RideLog[] {
  return state.logs;
}

/**
 * Get total credit count (unique coasters)
 */
export function getCreditCount(): number {
  return state.creditCount;
}

/**
 * Get total ride count (including re-rides)
 */
export function getTotalRideCount(): number {
  return state.totalRideCount;
}

/**
 * Get user's criteria configuration
 */
export function getCriteria(): RatingCriteria[] {
  return state.criteriaConfig.criteria;
}

/**
 * Get full criteria config object
 */
export function getCriteriaConfig(): typeof state.criteriaConfig {
  return state.criteriaConfig;
}

/**
 * Check if user has completed criteria setup
 */
export function hasCompletedCriteriaSetup(): boolean {
  return state.criteriaConfig.hasCompletedSetup;
}

/**
 * Get a specific log by ID
 */
export function getLogById(id: string): RideLog | undefined {
  return state.logs.find((log) => log.id === id);
}

/**
 * Get logs for a specific coaster
 */
export function getLogsForCoaster(coasterId: string): RideLog[] {
  return state.logs.filter((log) => log.coasterId === coasterId);
}

/**
 * Get today's ride count for a coaster (for re-ride numbering)
 */
export function getTodayRideCountForCoaster(coasterId: string): number {
  const today = new Date().toDateString();
  return state.logs.filter(
    (log) =>
      log.coasterId === coasterId &&
      new Date(log.timestamp).toDateString() === today
  ).length;
}

// ============================================
// State Setters / Actions
// ============================================

/**
 * Add a quick log (pending rating)
 * @param coaster - Coaster data
 * @param seat - Optional seat position
 * @returns The created log
 */
export function addQuickLog(
  coaster: { id: string; name: string; parkName: string },
  seat?: SeatPosition
): RideLog {
  const isNewCredit = !state.logs.some((log) => log.coasterId === coaster.id);
  const todayCount = getTodayRideCountForCoaster(coaster.id);

  const newLog: RideLog = {
    id: generateLogId(),
    coasterId: coaster.id,
    coasterName: coaster.name,
    parkName: coaster.parkName,
    timestamp: new Date().toISOString(),
    seat,
    rideCount: todayCount + 1,
  };

  state = {
    ...state,
    logs: [newLog, ...state.logs],
    creditCount: isNewCredit ? state.creditCount + 1 : state.creditCount,
    totalRideCount: state.totalRideCount + 1,
  };

  notifyListeners();
  return newLog;
}

// ============================================
// Rating Getters (per-coaster ratings)
// ============================================

/**
 * Get rating for a specific coaster
 */
export function getRatingForCoaster(coasterId: string): CoasterRating | undefined {
  return state.ratings[coasterId];
}

/**
 * Get all coaster ratings as array
 */
export function getAllRatings(): CoasterRating[] {
  return Object.values(state.ratings);
}

/**
 * Get coasters that have logs but no rating
 */
export function getUnratedCoasters(): Array<{ coasterId: string; coasterName: string; parkName: string }> {
  const ratedIds = new Set(Object.keys(state.ratings));
  const seen = new Set<string>();
  const unrated: Array<{ coasterId: string; coasterName: string; parkName: string }> = [];

  for (const log of state.logs) {
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

/**
 * Check if a coaster has been logged at least once
 */
export function hasLogForCoaster(coasterId: string): boolean {
  return state.logs.some((log) => log.coasterId === coasterId);
}

// ============================================
// Rating Actions
// ============================================

/**
 * Create or update a coaster rating
 */
export function upsertCoasterRating(
  coaster: { id: string; name: string; parkName: string },
  criteriaRatings: Record<string, number>,
  notes?: string,
): CoasterRating {
  const weightedScore = calculateWeightedScore(
    criteriaRatings,
    state.criteriaConfig.criteria,
  );

  const existing = state.ratings[coaster.id];
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

  state = {
    ...state,
    ratings: { ...state.ratings, [coaster.id]: rating },
  };

  notifyListeners();
  return rating;
}

/**
 * Delete a coaster rating
 */
export function deleteRating(coasterId: string): void {
  const { [coasterId]: _, ...remaining } = state.ratings;
  state = { ...state, ratings: remaining };
  notifyListeners();
}

/**
 * Update a log's timestamp (for date editing)
 */
export function updateLogTimestamp(logId: string, timestamp: string): void {
  const logIndex = state.logs.findIndex((log) => log.id === logId);
  if (logIndex === -1) return;

  const updatedLogs = [...state.logs];
  updatedLogs[logIndex] = {
    ...updatedLogs[logIndex],
    timestamp,
  };

  state = {
    ...state,
    logs: updatedLogs,
  };

  notifyListeners();
}

/**
 * Update notes for a log
 */
export function updateLogNotes(logId: string, notes: string): void {
  const logIndex = state.logs.findIndex((log) => log.id === logId);
  if (logIndex === -1) return;

  const updatedLogs = [...state.logs];
  updatedLogs[logIndex] = {
    ...updatedLogs[logIndex],
    notes,
  };

  state = {
    ...state,
    logs: updatedLogs,
  };

  notifyListeners();
}

/**
 * Delete a log
 */
export function deleteLog(logId: string): void {
  const log = state.logs.find((l) => l.id === logId);
  if (!log) return;

  // Check if this was the only log for this coaster (affects credit count)
  const otherLogsForCoaster = state.logs.filter(
    (l) => l.coasterId === log.coasterId && l.id !== logId
  );
  const isLosingCredit = otherLogsForCoaster.length === 0;

  state = {
    ...state,
    logs: state.logs.filter((l) => l.id !== logId),
    creditCount: isLosingCredit ? state.creditCount - 1 : state.creditCount,
    totalRideCount: state.totalRideCount - 1,
  };

  notifyListeners();
}

/**
 * Update user's criteria configuration
 */
export function updateCriteria(criteria: RatingCriteria[]): void {
  state = {
    ...state,
    criteriaConfig: {
      criteria,
      lastModifiedAt: new Date().toISOString(),
      hasCompletedSetup: true,
    },
  };

  notifyListeners();
}

/**
 * Update full criteria config
 */
export function updateCriteriaConfig(config: Partial<typeof state.criteriaConfig>): void {
  state = {
    ...state,
    criteriaConfig: {
      ...state.criteriaConfig,
      ...config,
    },
  };

  notifyListeners();
}

/**
 * Mark criteria setup as complete (without changing criteria)
 */
export function completeCriteriaSetup(): void {
  state = {
    ...state,
    criteriaConfig: {
      ...state.criteriaConfig,
      hasCompletedSetup: true,
    },
  };

  notifyListeners();
}

/**
 * Reset store to default state (for testing/dev)
 */
export function resetStore(): void {
  state = { ...DEFAULT_RIDE_LOG_STATE };
  notifyListeners();
}

// ============================================
// React Hook for consuming store
// ============================================

/**
 * Custom hook to use ride log store in React components
 * Re-renders component when store changes
 *
 * Usage:
 * ```tsx
 * const { logs, pendingCount, addQuickLog } = useRideLogStore();
 * ```
 */
export function useRideLogStore() {
  // This is a placeholder - actual implementation would use
  // useSyncExternalStore or useState + useEffect
  // For now, components can import functions directly
  return {
    // Log state
    logs: getAllLogs(),
    creditCount: getCreditCount(),
    totalRideCount: getTotalRideCount(),

    // Rating state
    ratings: getAllRatings(),
    unratedCoasters: getUnratedCoasters(),

    // Criteria state
    criteria: getCriteria(),
    hasCompletedCriteriaSetup: hasCompletedCriteriaSetup(),

    // Log actions
    addQuickLog,
    updateLogNotes,
    deleteLog,

    // Rating actions
    upsertCoasterRating,
    getRatingForCoaster,
    deleteRating,
    hasLogForCoaster,

    // Criteria actions
    updateCriteria,
    completeCriteriaSetup,
    resetStore,

    // Subscription
    subscribe,
  };
}

// Export types for convenience
export type { RideLog, CoasterRating, SeatPosition, RatingCriteria };
