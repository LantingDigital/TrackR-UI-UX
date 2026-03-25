/**
 * ThemeParks.wiki API Consumer
 *
 * Free API, no auth required. 300 requests/minute rate limit.
 * Base URL: https://api.themeparks.wiki/v1
 *
 * This is the PRIMARY data source for all park entity data:
 * destinations, parks, attractions, restaurants, shows, hours, wait times.
 */

const BASE_URL = 'https://api.themeparks.wiki/v1';

// ============================================
// Types
// ============================================

export interface ThemeParksLocation {
  latitude: number;
  longitude: number;
}

export interface ThemeParksTag {
  id: string;
  value?: string;
}

export interface ThemeParksParkRef {
  id: string;
  name: string;
}

export interface ThemeParksDestination {
  id: string;
  name: string;
  slug: string;
  parks: ThemeParksParkRef[];
}

export interface ThemeParksEntity {
  id: string;
  name: string;
  slug?: string;
  entityType: 'DESTINATION' | 'PARK' | 'ATTRACTION' | 'SHOW' | 'RESTAURANT' | 'HOTEL';
  location?: ThemeParksLocation;
  parentId?: string;
  timezone?: string;
  destinationId?: string;
  externalId?: string;
  tags?: ThemeParksTag[];
}

export interface ThemeParksQueueData {
  STANDBY?: {
    waitTime: number | null;
  };
  SINGLE_RIDER?: {
    waitTime: number | null;
  };
  RETURN_TIME?: {
    state: string;
    returnStart?: string;
    returnEnd?: string;
  };
  PAID_RETURN_TIME?: {
    state: string;
    returnStart?: string;
    returnEnd?: string;
    price?: { amount: number; currency: string };
  };
}

export interface ThemeParksLiveEntry {
  id: string;
  name: string;
  entityType: string;
  status?: 'OPERATING' | 'CLOSED' | 'DOWN' | 'REFURBISHMENT';
  queue?: ThemeParksQueueData;
  operatingHours?: ThemeParksOperatingHour[];
  showtimes?: ThemeParksShowtime[];
  lastUpdated?: string;
}

export interface ThemeParksOperatingHour {
  type: string;
  startTime: string;
  endTime: string;
}

export interface ThemeParksShowtime {
  type: string;
  startTime: string;
  endTime?: string;
}

export interface ThemeParksScheduleEntry {
  date: string;
  type: 'OPERATING' | 'EXTRA_HOURS' | 'TICKETED_EVENT' | 'INFO';
  openingTime?: string;
  closingTime?: string;
  description?: string;
}

// ============================================
// Rate Limit Tracking
// ============================================

let rateLimitRemaining = 300;
let rateLimitResetAt = 0;

function updateRateLimitFromHeaders(headers: Headers): void {
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  if (remaining !== null) rateLimitRemaining = parseInt(remaining, 10);
  if (reset !== null) rateLimitResetAt = Date.now() + parseInt(reset, 10) * 1000;
}

async function waitForRateLimit(): Promise<void> {
  if (rateLimitRemaining <= 5 && Date.now() < rateLimitResetAt) {
    const waitMs = rateLimitResetAt - Date.now() + 100;
    console.log(`[ThemeParks.wiki] Rate limit near, waiting ${waitMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

// ============================================
// Core Fetch Helper
// ============================================

async function apiFetch<T>(path: string, retries = 2): Promise<T> {
  await waitForRateLimit();

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TrackR-App/1.0 (coaster tracking app)',
      Accept: 'application/json',
    },
  });

  updateRateLimitFromHeaders(response.headers);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitSec = retryAfter ? parseInt(retryAfter, 10) : 60;
    console.log(`[ThemeParks.wiki] 429 Rate limited, waiting ${waitSec}s`);
    await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
    if (retries > 0) return apiFetch<T>(path, retries - 1);
    throw new Error(`ThemeParks.wiki rate limited on ${path} after retries`);
  }

  if (response.status === 404) {
    throw new Error(`ThemeParks.wiki entity not found: ${path}`);
  }

  if (!response.ok) {
    throw new Error(`ThemeParks.wiki API error ${response.status} on ${path}`);
  }

  return (await response.json()) as T;
}

// ============================================
// API Endpoints
// ============================================

/**
 * Get all destinations (96 worldwide).
 * Each destination contains an array of parks with their IDs and names.
 */
export async function getAllDestinations(): Promise<ThemeParksDestination[]> {
  const data = await apiFetch<{ destinations: ThemeParksDestination[] }>('/destinations');
  return data.destinations;
}

/**
 * Get full entity data (name, GPS, timezone, tags, type).
 */
export async function getEntity(entityId: string): Promise<ThemeParksEntity> {
  return apiFetch<ThemeParksEntity>(`/entity/${entityId}`);
}

/**
 * Get all children of an entity.
 * Destination -> parks. Park -> attractions, restaurants, shows.
 */
export async function getEntityChildren(entityId: string): Promise<ThemeParksEntity[]> {
  const data = await apiFetch<{ children: ThemeParksEntity[] }>(`/entity/${entityId}/children`);
  return data.children;
}

/**
 * Get live data: wait times, park hours, show schedules, ride statuses.
 */
export async function getEntityLive(entityId: string): Promise<ThemeParksLiveEntry[]> {
  const data = await apiFetch<{ liveData: ThemeParksLiveEntry[] }>(`/entity/${entityId}/live`);
  return data.liveData;
}

/**
 * Get schedule/calendar data for upcoming days.
 */
export async function getEntitySchedule(entityId: string): Promise<ThemeParksScheduleEntry[]> {
  const data = await apiFetch<{ schedule: ThemeParksScheduleEntry[] }>(
    `/entity/${entityId}/schedule`,
  );
  return data.schedule;
}

/**
 * Get schedule for a specific month.
 */
export async function getEntityScheduleMonth(
  entityId: string,
  year: number,
  month: number,
): Promise<ThemeParksScheduleEntry[]> {
  const data = await apiFetch<{ schedule: ThemeParksScheduleEntry[] }>(
    `/entity/${entityId}/schedule/${year}/${month}`,
  );
  return data.schedule;
}

// ============================================
// Batch Helpers
// ============================================

/**
 * Fetch entity data for multiple IDs with rate-limit-aware batching.
 * Processes in batches of `batchSize` with a delay between batches.
 */
export async function batchGetEntities(
  entityIds: string[],
  batchSize = 20,
  delayMs = 500,
): Promise<Map<string, ThemeParksEntity>> {
  const results = new Map<string, ThemeParksEntity>();

  for (let i = 0; i < entityIds.length; i += batchSize) {
    const batch = entityIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      try {
        const entity = await getEntity(id);
        results.set(id, entity);
      } catch (err) {
        console.warn(`[ThemeParks.wiki] Failed to fetch entity ${id}:`, err);
      }
    });
    await Promise.all(promises);

    // Delay between batches to stay well under rate limit
    if (i + batchSize < entityIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Fetch all children for a park, categorized by entity type.
 */
export async function getParkEntitiesByType(parkId: string): Promise<{
  attractions: ThemeParksEntity[];
  restaurants: ThemeParksEntity[];
  shows: ThemeParksEntity[];
  hotels: ThemeParksEntity[];
  other: ThemeParksEntity[];
}> {
  const children = await getEntityChildren(parkId);

  const attractions: ThemeParksEntity[] = [];
  const restaurants: ThemeParksEntity[] = [];
  const shows: ThemeParksEntity[] = [];
  const hotels: ThemeParksEntity[] = [];
  const other: ThemeParksEntity[] = [];

  for (const child of children) {
    switch (child.entityType) {
      case 'ATTRACTION':
        attractions.push(child);
        break;
      case 'RESTAURANT':
        restaurants.push(child);
        break;
      case 'SHOW':
        shows.push(child);
        break;
      case 'HOTEL':
        hotels.push(child);
        break;
      default:
        other.push(child);
        break;
    }
  }

  return { attractions, restaurants, shows, hotels, other };
}
