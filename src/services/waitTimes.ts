// ============================================
// Wait Times Service
//
// Tries live Queue-Times data via Cloud Function first
// (for authenticated users at supported parks), then
// falls back to mock data generators.
// ============================================

import {
  RideWaitTimeData,
  RideStatus,
  ParkWaitTimesResponse,
} from '../features/parks/types';
import { PARK_RIDE_DEFINITIONS } from '../features/parks/data/parkRideDefinitions';
import { COASTER_DATABASE } from '../features/coastle/data/coastleDatabase';
import { getQueueTimesParkId } from '../data/queueTimesParkIds';
import { callProxyWaitTimes } from './firebase/functions';
import { getIsAuthenticated } from '../stores/authStore';

// ============================================
// Public API
// ============================================

/**
 * Fetch wait times for a given park.
 *
 * Priority:
 * 1. Live data from Queue-Times via proxyWaitTimes CF (if authenticated + park mapped)
 * 2. Mock data from explicit ride definitions
 * 3. Mock data auto-generated from coaster database
 */
export async function fetchWaitTimes(
  parkSlug: string,
): Promise<ParkWaitTimesResponse | null> {
  // Try live data first for supported parks
  const queueTimesParkId = getQueueTimesParkId(parkSlug);
  if (queueTimesParkId !== undefined && getIsAuthenticated()) {
    try {
      const live = await callProxyWaitTimes({ parkSlug, parkId: queueTimesParkId });
      const parkName = slugToParkName(parkSlug);
      return {
        parkSlug,
        parkName,
        lastUpdated: new Date(live.lastFetched).getTime(),
        rides: live.rides.map((r) => ({
          id: r.id,
          name: r.name,
          parkSlug,
          waitMinutes: r.waitMinutes,
          status: r.status === 'open' ? 'open' : 'closed',
          lastUpdated: new Date(r.lastUpdated).getTime(),
          historicalAvgMinutes: 0, // Queue-Times doesn't provide historical averages
        })),
      };
    } catch {
      // Live fetch failed — fall through to mock data
    }
  }

  // Fallback: mock data
  const definition = PARK_RIDE_DEFINITIONS[parkSlug];
  if (definition) {
    return buildFromDefinition(parkSlug, definition);
  }

  return buildFromCoasterDatabase(parkSlug);
}

function buildFromDefinition(
  parkSlug: string,
  definition: (typeof PARK_RIDE_DEFINITIONS)[string],
): ParkWaitTimesResponse {
  const now = Date.now();
  const rides: RideWaitTimeData[] = definition.rides.map((ride) => {
    const status = generateStatus(ride.closureProbability ?? 0.05);
    const waitMinutes =
      status === 'open'
        ? generateWait(ride.peakWait, ride.minWait)
        : 0;

    return {
      id: ride.id,
      name: ride.name,
      parkSlug,
      waitMinutes,
      status,
      lastUpdated: now,
      historicalAvgMinutes: ride.historicalAvg,
    };
  });

  return {
    parkSlug,
    parkName: definition.parkName,
    lastUpdated: now,
    rides,
  };
}

/**
 * Auto-generate mock wait times from the coaster database.
 * Uses coaster stats (height, speed) to infer popularity
 * and generate realistic wait ranges.
 */
function buildFromCoasterDatabase(
  parkSlug: string,
): ParkWaitTimesResponse | null {
  // Convert slug back to park name for matching
  const parkName = slugToParkName(parkSlug);
  const coasters = COASTER_DATABASE.filter((c) => c.park === parkName);
  if (coasters.length === 0) return null;

  const now = Date.now();
  const rides: RideWaitTimeData[] = coasters.map((coaster) => {
    // Estimate popularity from stats: taller + faster = longer waits
    const popularityScore = Math.min(
      1,
      (coaster.heightFt / 400) * 0.5 + (coaster.speedMph / 120) * 0.5,
    );
    const peakWait = Math.round(15 + popularityScore * 105); // 15-120 min
    const minWait = Math.round(5 + popularityScore * 15); // 5-20 min
    const historicalAvg = Math.round((peakWait + minWait) / 2);

    const status = generateStatus(0.05);
    const waitMinutes =
      status === 'open' ? generateWait(peakWait, minWait) : 0;

    return {
      id: coaster.id,
      name: coaster.name,
      parkSlug,
      waitMinutes,
      status,
      lastUpdated: now,
      historicalAvgMinutes: historicalAvg,
    };
  });

  return {
    parkSlug,
    parkName,
    lastUpdated: now,
    rides,
  };
}

/** Convert a slug back to the park name used in the coaster database. */
function slugToParkName(slug: string): string {
  // Check explicit definitions first
  const def = PARK_RIDE_DEFINITIONS[slug];
  if (def) return def.parkName;

  // Build a lookup from all coaster database park names
  if (!_parkNameCache) {
    _parkNameCache = new Map<string, string>();
    const seen = new Set<string>();
    for (const c of COASTER_DATABASE) {
      if (seen.has(c.park)) continue;
      seen.add(c.park);
      const s = c.park
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      _parkNameCache.set(s, c.park);
    }
  }

  return _parkNameCache.get(slug) ?? slug;
}

let _parkNameCache: Map<string, string> | null = null;

/**
 * Supported park slugs — returns the list of parks
 * that have ride definitions for wait time generation.
 */
export function getSupportedParkSlugs(): string[] {
  return Object.keys(PARK_RIDE_DEFINITIONS);
}

// ============================================
// Mock Data Generation Helpers
// ============================================

/**
 * Seeded pseudo-random using the current hour so values
 * stay stable within an hour but change periodically.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateWait(peakWait: number, minWait: number): number {
  const hour = new Date().getHours();
  // Crowd curve: low in morning, peak 12-3, taper evening
  const crowdMultiplier = getCrowdMultiplier(hour);
  const seed = hour * 137 + peakWait * 31 + minWait * 17;
  const jitter = seededRandom(seed) * 0.3 + 0.85; // 0.85-1.15
  const raw = minWait + (peakWait - minWait) * crowdMultiplier * jitter;
  return Math.round(Math.max(minWait, Math.min(peakWait, raw)) / 5) * 5;
}

function getCrowdMultiplier(hour: number): number {
  // Park hours roughly 10am-10pm, peaks 12-3pm
  if (hour < 10) return 0.2;
  if (hour < 11) return 0.4;
  if (hour < 12) return 0.7;
  if (hour < 15) return 1.0;
  if (hour < 17) return 0.85;
  if (hour < 19) return 0.6;
  if (hour < 21) return 0.4;
  return 0.2;
}

function generateStatus(closureProbability: number): RideStatus {
  const hour = new Date().getHours();
  const seed = hour * 97 + closureProbability * 1000;
  const roll = seededRandom(seed);

  if (roll < closureProbability * 0.6) return 'closed';
  if (roll < closureProbability * 0.8) return 'temporarily-closed';
  if (roll < closureProbability) return 'weather-delay';
  return 'open';
}
