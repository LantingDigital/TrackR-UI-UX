/**
 * proxyWaitTimes — Callable Cloud Function
 *
 * Proxies wait time data from Queue-Times.com API.
 * Caches results in Firestore for 5 minutes to avoid hammering the API.
 *
 * Queue-Times API is public (no auth/key needed):
 * - Parks list: https://queue-times.com/en-US/parks.json
 * - Park data: https://queue-times.com/en-US/parks/{parkId}/queue_times.json
 *
 * Response format: { lands: [{ id, name, rides: [{ id, name, is_open, wait_time, last_updated }] }] }
 *
 * Attribution: Data from Queue-Times.com (required by their terms).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ============================================
// Types
// ============================================

interface QueueTimesRide {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string;
}

interface QueueTimesLand {
  id: number;
  name: string;
  rides: QueueTimesRide[];
}

interface QueueTimesResponse {
  lands: QueueTimesLand[];
}

interface WaitTimeRide {
  id: string;
  name: string;
  waitMinutes: number;
  status: 'open' | 'closed';
  lastUpdated: string;
  land: string;
}

interface ParkWaitTimesDoc {
  parkSlug: string;
  parkId: number;
  rides: WaitTimeRide[];
  lastFetched: Timestamp;
  source: 'queue-times';
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache to reduce Firestore reads between function invocations
// (Cloud Functions can reuse instances)
const memoryCache = new Map<string, { data: ParkWaitTimesDoc; fetchedAt: number }>();

// ============================================
// Queue-Times API
// ============================================

const QUEUE_TIMES_BASE = 'https://queue-times.com/en-US/parks';

async function fetchFromQueueTimes(parkId: number): Promise<QueueTimesResponse> {
  const url = `${QUEUE_TIMES_BASE}/${parkId}/queue_times.json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TrackR-App/1.0 (coaster tracking app)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new HttpsError('not-found', `Park ID ${parkId} not found on Queue-Times.`);
    }
    throw new HttpsError(
      'unavailable',
      `Queue-Times API returned ${response.status}.`,
    );
  }

  return (await response.json()) as QueueTimesResponse;
}

// ============================================
// Transform
// ============================================

function transformResponse(
  parkSlug: string,
  parkId: number,
  data: QueueTimesResponse,
): ParkWaitTimesDoc {
  const rides: WaitTimeRide[] = [];

  for (const land of data.lands) {
    for (const ride of land.rides) {
      rides.push({
        id: String(ride.id),
        name: ride.name,
        waitMinutes: ride.is_open ? ride.wait_time : -1,
        status: ride.is_open ? 'open' : 'closed',
        lastUpdated: ride.last_updated,
        land: land.name,
      });
    }
  }

  // Sort: open rides first (by wait time desc), then closed
  rides.sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;
    if (a.status === 'open' && b.status === 'open') {
      return b.waitMinutes - a.waitMinutes;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    parkSlug,
    parkId,
    rides,
    lastFetched: Timestamp.now(),
    source: 'queue-times',
  };
}

// ============================================
// Cloud Function
// ============================================

export const proxyWaitTimes = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const parkSlug = request.data?.parkSlug as string | undefined;
    const parkId = request.data?.parkId as number | undefined;

    if (!parkSlug || typeof parkSlug !== 'string') {
      throw new HttpsError('invalid-argument', 'parkSlug is required.');
    }
    if (!parkId || typeof parkId !== 'number') {
      throw new HttpsError('invalid-argument', 'parkId is required (Queue-Times numeric ID).');
    }

    const now = Date.now();

    // Check in-memory cache first (fastest, avoids Firestore read)
    const cached = memoryCache.get(parkSlug);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        rides: cached.data.rides,
        lastFetched: cached.data.lastFetched.toDate().toISOString(),
        source: 'queue-times',
        fromCache: true,
      };
    }

    // Check Firestore cache
    const db = getFirestore();
    const cacheRef = db.doc(`parkWaitTimes/${parkSlug}`);
    const cacheSnap = await cacheRef.get();

    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data() as ParkWaitTimesDoc;
      const cachedAt = cacheData.lastFetched.toMillis();

      if (now - cachedAt < CACHE_TTL_MS) {
        // Update memory cache
        memoryCache.set(parkSlug, { data: cacheData, fetchedAt: cachedAt });

        return {
          rides: cacheData.rides,
          lastFetched: cacheData.lastFetched.toDate().toISOString(),
          source: 'queue-times',
          fromCache: true,
        };
      }
    }

    // Cache miss — fetch fresh data from Queue-Times
    console.log(
      `[proxyWaitTimes] Cache miss for ${parkSlug} (parkId=${parkId}), fetching from Queue-Times`,
    );

    const rawData = await fetchFromQueueTimes(parkId);
    const transformed = transformResponse(parkSlug, parkId, rawData);

    // Write to Firestore cache
    await cacheRef.set(transformed);

    // Update memory cache
    memoryCache.set(parkSlug, { data: transformed, fetchedAt: now });

    return {
      rides: transformed.rides,
      lastFetched: transformed.lastFetched.toDate().toISOString(),
      source: 'queue-times',
      fromCache: false,
    };
  },
);
