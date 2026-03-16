/**
 * HealthKit Service — Apple HealthKit integration for TrackR.
 *
 * Reads step count, walking/running distance, and flights climbed.
 * iOS only (v1). No health data is written.
 *
 * Uses @kingstinct/react-native-healthkit (Nitro-based, TypeScript-first).
 */
import { Platform } from 'react-native';
import {
  requestAuthorization,
  queryStatisticsForQuantity,
  isHealthDataAvailable,
  getRequestStatusForAuthorization,
  AuthorizationRequestStatus,
} from '@kingstinct/react-native-healthkit';
import type { QueryStatisticsResponse } from '@kingstinct/react-native-healthkit';

// ── Types ───────────────────────────────────────────────────

const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount' as const;
const DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning' as const;
const FLIGHTS = 'HKQuantityTypeIdentifierFlightsClimbed' as const;

const READ_TYPES = [STEP_COUNT, DISTANCE, FLIGHTS] as const;

export interface DailyHealthData {
  steps: number;
  distanceMiles: number;
  flightsClimbed: number;
  lastUpdated: Date;
}

// ── Helpers ─────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Check if HealthKit is available (iOS only, not iPad simulator in some cases).
 */
export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
}

/**
 * Request read-only HealthKit authorization for steps, distance, flights.
 * Returns true if the user saw the dialog (or had already granted).
 * HealthKit does NOT tell you if the user denied — it just returns 0 data.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;
  try {
    return await requestAuthorization({ toRead: [...READ_TYPES] });
  } catch {
    return false;
  }
}

/**
 * Check if we've already requested authorization (not necessarily granted).
 * Returns true if user has seen the HealthKit permission dialog before.
 */
export async function hasRequestedAuthorization(): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;
  try {
    const status = await getRequestStatusForAuthorization({ toRead: [...READ_TYPES] });
    return status === AuthorizationRequestStatus.unnecessary;
  } catch {
    return false;
  }
}

/**
 * Query today's cumulative health stats from HealthKit.
 * Returns null if HealthKit is unavailable or permissions weren't granted.
 */
export async function getTodayHealthData(): Promise<DailyHealthData | null> {
  if (!isHealthKitAvailable()) return null;

  const todayStart = startOfToday();
  const now = new Date();
  const filter = { date: { startDate: todayStart, endDate: now } };

  try {
    const [stepsResult, distanceResult, flightsResult] = await Promise.all([
      queryStatisticsForQuantity(STEP_COUNT, ['cumulativeSum'], { filter, unit: 'count' }),
      queryStatisticsForQuantity(DISTANCE, ['cumulativeSum'], { filter, unit: 'm' }),
      queryStatisticsForQuantity(FLIGHTS, ['cumulativeSum'], { filter, unit: 'count' }),
    ]);

    return {
      steps: Math.round(extractSum(stepsResult)),
      distanceMiles: Math.round(metersToMiles(extractSum(distanceResult)) * 100) / 100,
      flightsClimbed: Math.round(extractSum(flightsResult)),
      lastUpdated: now,
    };
  } catch {
    return null;
  }
}

function extractSum(result: QueryStatisticsResponse): number {
  return result.sumQuantity?.quantity ?? 0;
}
