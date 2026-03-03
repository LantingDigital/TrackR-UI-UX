// ============================================
// Pace Engine
//
// Tracks how a user is performing against their
// trip plan estimates and generates trade-off
// suggestions (add a stop / skip a stop).
// ============================================

import type {
  TripPlan,
  TripStop,
  PaceSnapshot,
  TradeOffSuggestion,
  SelectablePOI,
} from './types';

// ============================================
// Pace Snapshot
// ============================================

/**
 * Compute a pace snapshot for the current plan state.
 *
 * deltaMin = elapsedMin - expectedMin
 *   positive → behind schedule
 *   negative → ahead of schedule
 */
export function computePaceSnapshot(plan: TripPlan): PaceSnapshot {
  const now = Date.now();
  const startedAt = plan.startedAt ?? now;
  const elapsedMin = (now - startedAt) / 60_000;

  const completedStops = plan.stops.filter(
    (s) => s.state === 'done' || s.state === 'skipped',
  );

  // Expected time = sum of estimates for completed stops
  const expectedMin = completedStops.reduce((sum, s) => {
    if (s.isBreak && s.breakDurationMin != null) {
      return sum + s.estimatedWalkMin + s.breakDurationMin;
    }
    return sum + s.estimatedWalkMin + s.estimatedWaitMin + s.estimatedRideMin;
  }, 0);

  return {
    timestamp: now,
    stopsCompleted: completedStops.length,
    totalStops: plan.stops.length,
    elapsedMin: Math.round(elapsedMin * 10) / 10,
    deltaMin: Math.round((elapsedMin - expectedMin) * 10) / 10,
  };
}

// ============================================
// Trade-Off Suggestions
// ============================================

/**
 * Generate a trade-off suggestion based on pace delta.
 *
 * - Ahead by 10+ min → suggest adding a stop from availablePOIs
 * - Behind by 10+ min → suggest skipping lowest-priority remaining stop
 * - Otherwise → null (on pace)
 */
export function generateSuggestion(
  plan: TripPlan,
  snapshot: PaceSnapshot,
  availablePOIs?: SelectablePOI[],
): TradeOffSuggestion | null {
  const absDelta = Math.abs(snapshot.deltaMin);
  const roundedDelta = Math.round(absDelta);

  // Ahead of schedule — suggest adding
  if (snapshot.deltaMin < -10 && availablePOIs && availablePOIs.length > 0) {
    const existingPoiIds = new Set(plan.stops.map((s) => s.poiId));
    const candidate = availablePOIs.find((p) => !existingPoiIds.has(p.id));
    if (candidate) {
      return {
        type: 'add',
        message: `You're ${roundedDelta} min ahead \u2014 you could add ${candidate.name}.`,
        poiId: candidate.id,
        deltaMin: snapshot.deltaMin,
        dismissed: false,
      };
    }
  }

  // Behind schedule — suggest skipping
  if (snapshot.deltaMin > 10) {
    const pendingStops = plan.stops.filter((s) => s.state === 'pending');
    if (pendingStops.length > 0) {
      // Pick the stop with the longest wait (likely lowest ROI to skip)
      const lowestPriority = pendingStops.reduce((worst, s) =>
        s.estimatedWaitMin < worst.estimatedWaitMin ? s : worst,
      );
      return {
        type: 'skip',
        message: `You're ${roundedDelta} min behind \u2014 consider skipping ${lowestPriority.name} to catch up.`,
        stopId: lowestPriority.id,
        deltaMin: snapshot.deltaMin,
        dismissed: false,
      };
    }
  }

  return null;
}

// ============================================
// Budget Warning
// ============================================

/**
 * Check if adding a stop would exceed the time budget.
 * Returns a warning string or null.
 */
export function getBudgetWarning(
  stops: TripStop[],
  timeBudgetMin: number,
  addingStop?: TripStop,
): string | null {
  if (timeBudgetMin <= 0) return null; // all-day, no budget

  let totalMin = stops.reduce((sum, s) => {
    if (s.isBreak && s.breakDurationMin != null) {
      return sum + s.estimatedWalkMin + s.breakDurationMin;
    }
    return sum + s.estimatedWalkMin + s.estimatedWaitMin + s.estimatedRideMin;
  }, 0);

  if (addingStop) {
    const addMin = addingStop.isBreak && addingStop.breakDurationMin != null
      ? addingStop.estimatedWalkMin + addingStop.breakDurationMin
      : addingStop.estimatedWalkMin + addingStop.estimatedWaitMin + addingStop.estimatedRideMin;
    totalMin += addMin;
  }

  const overMin = Math.round(totalMin - timeBudgetMin);
  if (overMin > 0) {
    const label = addingStop ? addingStop.name : 'this';
    return `Adding ${label} puts you ~${overMin} min over budget.`;
  }

  return null;
}
