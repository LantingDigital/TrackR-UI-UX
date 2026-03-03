// ============================================
// Plan Generator v2
//
// Converts selected POIs into an ordered TripStop[]
// with estimated walk/wait/ride times, interleaved
// to spread out long waits.
// ============================================

import { COASTER_BY_ID } from '../../../data/coasterIndex';
import { getSequenceWalkTimes } from './walkTimeEngine';
import type { UnifiedParkMapData } from '../types';
import type {
  TripStop,
  SelectablePOI,
  POICategory,
  TripPlannerState,
} from './types';

// ============================================
// Constants
// ============================================

const DEFAULT_RIDE_MIN = 3;
const HISTORICAL_MIN_ENTRIES = 3; // need at least this many wait log entries to use avg

/** Default durations (minutes) for non-ride POI categories */
const CATEGORY_DURATION: Record<string, number> = {
  food: 20,
  shop: 10,
  theater: 15,
  attraction: 10,
  service: 5,
  break: 10,
};

// ============================================
// UUID Helper
// ============================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// Wait Time Estimation
// ============================================

/**
 * Get estimated wait time for a ride POI.
 * Uses historical data from globalWaitLog if >= 3 entries exist,
 * otherwise falls back to popularity-tier defaults.
 */
function getEstimatedWaitMin(
  poiId: string,
  popularityTierMin: number,
  globalWaitLog: TripPlannerState['globalWaitLog'],
): number {
  const entries = globalWaitLog.filter((e) => e.poiId === poiId);
  if (entries.length >= HISTORICAL_MIN_ENTRIES) {
    const avg = entries.reduce((sum, e) => sum + e.actualMin, 0) / entries.length;
    return Math.round(avg);
  }
  return popularityTierMin;
}

/**
 * Get ride duration in minutes from coaster index, or default.
 */
function getRideDurationMin(coasterId?: string): number {
  if (!coasterId) return DEFAULT_RIDE_MIN;
  const entry = COASTER_BY_ID[coasterId];
  if (entry?.duration) return Math.ceil(entry.duration / 60);
  return DEFAULT_RIDE_MIN;
}

/**
 * Get duration for a non-ride stop.
 */
function getNonRideDurationMin(category: POICategory): number {
  return CATEGORY_DURATION[category] ?? 10;
}

// ============================================
// Core Generator
// ============================================

/**
 * Generate an ordered TripStop[] from selected POIs.
 *
 * Strategy:
 * 1. Rank rides by popularity (cross-ref COASTER_BY_ID)
 * 2. Assign wait times by tier (top 3 → 45m, next 5 → 25m, rest → 10m)
 * 3. Override with historical averages when enough data exists
 * 4. Interleave popular ↔ less-popular rides to spread long waits
 * 5. Non-ride POIs are appended at natural intervals between rides
 * 6. Compute walk times between ordered stops
 * 7. Trim to time budget if set
 */
export function generatePlanFromPOIs(
  pois: SelectablePOI[],
  mapData: UnifiedParkMapData | null,
  timeBudgetMin: number,
  globalWaitLog: TripPlannerState['globalWaitLog'],
): TripStop[] {
  if (pois.length === 0) return [];

  // Separate rides from non-rides
  const rides = pois.filter((p) => p.category === 'ride');
  const nonRides = pois.filter((p) => p.category !== 'ride');

  // Enrich rides with popularity rank
  const enrichedRides = rides.map((r) => {
    const idx = r.coasterId ? COASTER_BY_ID[r.coasterId] : undefined;
    return {
      poi: r,
      popularityRank: idx?.popularityRank ?? 9999,
    };
  });

  // Sort by popularity (lower rank = more popular)
  enrichedRides.sort((a, b) => a.popularityRank - b.popularityRank);

  // Assign wait times by tier, with historical override
  const ridesWithEstimates = enrichedRides.map((e, i) => {
    let tierMin: number;
    if (i < 3) tierMin = 45;
    else if (i < 8) tierMin = 25;
    else tierMin = 10;

    const waitMin = getEstimatedWaitMin(e.poi.id, tierMin, globalWaitLog);
    const rideMin = getRideDurationMin(e.poi.coasterId);

    return { poi: e.poi, waitMin, rideMin, popularityRank: e.popularityRank };
  });

  // Interleave: alternate popular ↔ less-popular
  const midpoint = Math.ceil(ridesWithEstimates.length / 2);
  const popular = ridesWithEstimates.slice(0, midpoint);
  const lessPop = ridesWithEstimates.slice(midpoint);
  const interleaved: typeof ridesWithEstimates = [];
  const maxLen = Math.max(popular.length, lessPop.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < popular.length) interleaved.push(popular[i]);
    if (i < lessPop.length) interleaved.push(lessPop[i]);
  }

  // Scatter non-rides between rides at regular intervals
  const orderedPOIs: Array<{
    poi: SelectablePOI;
    waitMin: number;
    rideMin: number;
  }> = [];

  if (nonRides.length === 0) {
    // No non-rides — just use interleaved rides
    for (const r of interleaved) {
      orderedPOIs.push({ poi: r.poi, waitMin: r.waitMin, rideMin: r.rideMin });
    }
  } else {
    // Insert a non-ride every N rides
    const interval = Math.max(1, Math.floor(interleaved.length / (nonRides.length + 1)));
    let nonRideIdx = 0;
    for (let i = 0; i < interleaved.length; i++) {
      orderedPOIs.push({
        poi: interleaved[i].poi,
        waitMin: interleaved[i].waitMin,
        rideMin: interleaved[i].rideMin,
      });
      if ((i + 1) % interval === 0 && nonRideIdx < nonRides.length) {
        const nr = nonRides[nonRideIdx++];
        orderedPOIs.push({
          poi: nr,
          waitMin: 0,
          rideMin: getNonRideDurationMin(nr.category),
        });
      }
    }
    // Append remaining non-rides
    while (nonRideIdx < nonRides.length) {
      const nr = nonRides[nonRideIdx++];
      orderedPOIs.push({
        poi: nr,
        waitMin: 0,
        rideMin: getNonRideDurationMin(nr.category),
      });
    }
  }

  // Compute walk times for the ordered sequence
  const poiIds = orderedPOIs.map((o) => o.poi.id);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  // Build TripStops, trimming to budget
  const stops: TripStop[] = [];
  let accumulatedMin = 0;

  for (let i = 0; i < orderedPOIs.length; i++) {
    const item = orderedPOIs[i];
    const walkMin = walkTimes[i] ?? 0;
    const stopTime = walkMin + item.waitMin + item.rideMin;

    if (timeBudgetMin > 0 && accumulatedMin + stopTime > timeBudgetMin) {
      continue; // skip stops that bust the budget
    }

    accumulatedMin += stopTime;

    stops.push({
      id: generateId(),
      poiId: item.poi.id,
      name: item.poi.name,
      category: item.poi.category,
      order: stops.length,
      state: 'pending',
      estimatedWalkMin: walkMin,
      estimatedWaitMin: item.waitMin,
      estimatedRideMin: item.rideMin,
      thrillLevel: item.poi.thrillLevel,
      area: item.poi.area,
    });
  }

  return stops;
}

// ============================================
// Reorder
// ============================================

/**
 * Reorder stops to match a new sequence of stop IDs.
 * Recalculates walk times for the new order.
 */
export function reorderStops(
  stops: TripStop[],
  newOrder: string[],
  mapData: UnifiedParkMapData | null,
): TripStop[] {
  const stopMap = new Map(stops.map((s) => [s.id, s]));
  const reordered = newOrder
    .map((id) => stopMap.get(id))
    .filter((s): s is TripStop => s != null);

  // Recalculate walk times
  const poiIds = reordered.map((s) => s.poiId);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  return reordered.map((s, i) => ({
    ...s,
    order: i,
    estimatedWalkMin: walkTimes[i] ?? 0,
  }));
}

// ============================================
// Insert Stop
// ============================================

/**
 * Insert a new stop after the given stop ID.
 * Recalculates walk times for the affected range.
 */
export function insertStopAfter(
  stops: TripStop[],
  afterStopId: string,
  newStop: TripStop,
  mapData: UnifiedParkMapData | null,
): TripStop[] {
  const idx = stops.findIndex((s) => s.id === afterStopId);
  if (idx === -1) return [...stops, newStop];

  const updated = [...stops];
  updated.splice(idx + 1, 0, newStop);

  // Re-number and recalculate walk times
  const poiIds = updated.map((s) => s.poiId);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  return updated.map((s, i) => ({
    ...s,
    order: i,
    estimatedWalkMin: walkTimes[i] ?? 0,
  }));
}

// ============================================
// Estimate Total
// ============================================

/**
 * Calculate total estimated time for a set of stops (minutes).
 * For break stops, uses breakDurationMin instead of wait+ride.
 */
export function estimateTotalMin(stops: TripStop[]): number {
  return stops.reduce((sum, s) => {
    if (s.isBreak && s.breakDurationMin != null) {
      return sum + s.estimatedWalkMin + s.breakDurationMin;
    }
    return sum + s.estimatedWalkMin + s.estimatedWaitMin + s.estimatedRideMin;
  }, 0);
}

// ============================================
// Format Duration
// ============================================

/**
 * Format minutes as human-readable duration (e.g. "2h 30m").
 */
export function formatDuration(min: number): string {
  const rounded = Math.round(min);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ============================================
// Break Stop Factory
// ============================================

/**
 * Create a break stop (rest, snack, regroup, etc.).
 */
export function createBreakStop(durationMin: number = 10): TripStop {
  return {
    id: generateId(),
    poiId: `break-${generateId().slice(0, 8)}`,
    name: 'Break',
    category: 'break',
    order: 0, // caller should set or insertStopAfter will reorder
    state: 'pending',
    estimatedWalkMin: 0,
    estimatedWaitMin: 0,
    estimatedRideMin: 0,
    isBreak: true,
    breakDurationMin: durationMin,
  };
}
