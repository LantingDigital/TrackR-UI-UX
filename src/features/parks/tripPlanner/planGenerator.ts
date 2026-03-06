// ============================================
// Plan Generator v4
//
// Converts selected POIs into an ordered TripStop[]
// with estimated walk/wait/ride times.
//
// CRITICAL: This generator NEVER removes stops.
// It returns ALL stops + a BudgetEstimate that is
// purely informational. The user decides what to cut.
// ============================================

import { COASTER_BY_ID } from '../../../data/coasterIndex';
import { getWalkTimeMin, getSequenceWalkTimes } from './walkTimeEngine';
import type { UnifiedParkMapData } from '../types';
import type {
  TripStop,
  SelectablePOI,
  POICategory,
  BudgetEstimate,
  TripPlannerState,
} from './types';

// ============================================
// Constants
// ============================================

const DEFAULT_RIDE_MIN = 3;
const HISTORICAL_MIN_ENTRIES = 3;

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

function getRideDurationMin(coasterId?: string): number {
  if (!coasterId) return DEFAULT_RIDE_MIN;
  const entry = COASTER_BY_ID[coasterId];
  if (entry?.duration) return Math.ceil(entry.duration / 60);
  return DEFAULT_RIDE_MIN;
}

function getNonRideDurationMin(category: POICategory): number {
  return CATEGORY_DURATION[category] ?? 10;
}

// ============================================
// Plan Result
// ============================================

export interface PlanResult {
  stops: TripStop[];
  estimate: BudgetEstimate;
}

// ============================================
// Core Generator — NEVER TRIMS
// ============================================

export function generatePlanFromPOIs(
  pois: SelectablePOI[],
  mapData: UnifiedParkMapData | null,
  timeBudgetMin: number,
  globalWaitLog: TripPlannerState['globalWaitLog'],
): PlanResult {
  if (pois.length === 0) return { stops: [], estimate: { totalMin: 0, budgetMin: timeBudgetMin, overByMin: 0, isOverBudget: false } };

  // Separate rides from non-rides
  const rides = pois.filter((p) => p.category === 'ride');
  const nonRides = pois.filter((p) => p.category !== 'ride');

  // Enrich rides with popularity rank
  const enrichedRides = rides.map((r) => {
    const idx = r.coasterId ? COASTER_BY_ID[r.coasterId] : undefined;
    return { poi: r, popularityRank: idx?.popularityRank ?? 9999 };
  });

  enrichedRides.sort((a, b) => a.popularityRank - b.popularityRank);

  // Assign wait times by tier, with historical override
  const ridesWithEstimates = enrichedRides.map((e, i) => {
    let tierMin: number;
    if (i < 3) tierMin = 45;
    else if (i < 8) tierMin = 25;
    else tierMin = 10;

    const waitMin = getEstimatedWaitMin(e.poi.id, tierMin, globalWaitLog);
    const rideMin = getRideDurationMin(e.poi.coasterId);
    return { poi: e.poi, waitMin, rideMin };
  });

  // Interleave popular ↔ less-popular
  const midpoint = Math.ceil(ridesWithEstimates.length / 2);
  const popular = ridesWithEstimates.slice(0, midpoint);
  const lessPop = ridesWithEstimates.slice(midpoint);
  const interleaved: typeof ridesWithEstimates = [];
  const maxLen = Math.max(popular.length, lessPop.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < popular.length) interleaved.push(popular[i]);
    if (i < lessPop.length) interleaved.push(lessPop[i]);
  }

  // Scatter non-rides between rides
  const orderedPOIs: Array<{ poi: SelectablePOI; waitMin: number; rideMin: number }> = [];

  if (nonRides.length === 0) {
    for (const r of interleaved) {
      orderedPOIs.push({ poi: r.poi, waitMin: r.waitMin, rideMin: r.rideMin });
    }
  } else {
    const interval = Math.max(1, Math.floor(interleaved.length / (nonRides.length + 1)));
    let nonRideIdx = 0;
    for (let i = 0; i < interleaved.length; i++) {
      orderedPOIs.push({ poi: interleaved[i].poi, waitMin: interleaved[i].waitMin, rideMin: interleaved[i].rideMin });
      if ((i + 1) % interval === 0 && nonRideIdx < nonRides.length) {
        const nr = nonRides[nonRideIdx++];
        orderedPOIs.push({ poi: nr, waitMin: 0, rideMin: getNonRideDurationMin(nr.category) });
      }
    }
    while (nonRideIdx < nonRides.length) {
      const nr = nonRides[nonRideIdx++];
      orderedPOIs.push({ poi: nr, waitMin: 0, rideMin: getNonRideDurationMin(nr.category) });
    }
  }

  // Compute walk times
  const poiIds = orderedPOIs.map((o) => o.poi.id);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  // Build ALL TripStops — NO TRIMMING
  const stops: TripStop[] = orderedPOIs.map((item, i) => ({
    id: generateId(),
    poiId: item.poi.id,
    name: item.poi.name,
    category: item.poi.category,
    order: i,
    state: 'pending' as const,
    estimatedWalkMin: walkTimes[i] ?? 0,
    estimatedWaitMin: item.waitMin,
    estimatedRideMin: item.rideMin,
    thrillLevel: item.poi.thrillLevel,
    area: item.poi.area,
  }));

  // Compute budget estimate (informational only)
  const totalMin = estimateTotalMin(stops);
  const overByMin = timeBudgetMin > 0 ? Math.max(0, Math.round(totalMin - timeBudgetMin)) : 0;

  return {
    stops,
    estimate: {
      totalMin: Math.round(totalMin),
      budgetMin: timeBudgetMin,
      overByMin,
      isOverBudget: timeBudgetMin > 0 && totalMin > timeBudgetMin,
    },
  };
}

// ============================================
// Reorder
// ============================================

export function reorderStops(
  stops: TripStop[],
  newOrder: string[],
  mapData: UnifiedParkMapData | null,
): TripStop[] {
  const stopMap = new Map(stops.map((s) => [s.id, s]));
  const reordered = newOrder
    .map((id) => stopMap.get(id))
    .filter((s): s is TripStop => s != null);

  const poiIds = reordered.map((s) => s.poiId);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  return reordered.map((s, i) => ({
    ...s,
    order: i,
    estimatedWalkMin: walkTimes[i] ?? 0,
  }));
}

// ============================================
// Nearest Neighbor Route Optimization
// ============================================

/**
 * Reorder stops using greedy nearest-neighbor by walk time.
 * Starts from first stop and greedily picks the closest
 * unvisited stop. Recalculates walk times for the new order.
 */
export function nearestNeighborReorder(
  stops: TripStop[],
  mapData: UnifiedParkMapData | null,
): TripStop[] {
  if (!mapData || stops.length <= 2) return stops;

  const remaining = [...stops];
  const ordered: TripStop[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const lastPoiId = ordered[ordered.length - 1].poiId;
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const walkTime = getWalkTimeMin(lastPoiId, remaining[i].poiId, mapData);
      if (walkTime < nearestDist) {
        nearestDist = walkTime;
        nearestIdx = i;
      }
    }

    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  // Recalculate walk times for new order
  const poiIds = ordered.map((s) => s.poiId);
  const walkTimes = getSequenceWalkTimes(poiIds, mapData);

  return ordered.map((s, i) => ({
    ...s,
    order: i,
    estimatedWalkMin: walkTimes[i] ?? 0,
  }));
}

// ============================================
// Insert Stop
// ============================================

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

export function createBreakStop(durationMin: number = 10): TripStop {
  return {
    id: generateId(),
    poiId: `break-${generateId().slice(0, 8)}`,
    name: 'Break',
    category: 'break',
    order: 0,
    state: 'pending',
    estimatedWalkMin: 0,
    estimatedWaitMin: 0,
    estimatedRideMin: 0,
    isBreak: true,
    breakDurationMin: durationMin,
  };
}
