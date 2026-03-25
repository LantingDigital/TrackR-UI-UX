"use strict";
/**
 * ThemeParks.wiki API Consumer
 *
 * Free API, no auth required. 300 requests/minute rate limit.
 * Base URL: https://api.themeparks.wiki/v1
 *
 * This is the PRIMARY data source for all park entity data:
 * destinations, parks, attractions, restaurants, shows, hours, wait times.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDestinations = getAllDestinations;
exports.getEntity = getEntity;
exports.getEntityChildren = getEntityChildren;
exports.getEntityLive = getEntityLive;
exports.getEntitySchedule = getEntitySchedule;
exports.getEntityScheduleMonth = getEntityScheduleMonth;
exports.batchGetEntities = batchGetEntities;
exports.getParkEntitiesByType = getParkEntitiesByType;
const BASE_URL = 'https://api.themeparks.wiki/v1';
// ============================================
// Rate Limit Tracking
// ============================================
let rateLimitRemaining = 300;
let rateLimitResetAt = 0;
function updateRateLimitFromHeaders(headers) {
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    if (remaining !== null)
        rateLimitRemaining = parseInt(remaining, 10);
    if (reset !== null)
        rateLimitResetAt = Date.now() + parseInt(reset, 10) * 1000;
}
async function waitForRateLimit() {
    if (rateLimitRemaining <= 5 && Date.now() < rateLimitResetAt) {
        const waitMs = rateLimitResetAt - Date.now() + 100;
        console.log(`[ThemeParks.wiki] Rate limit near, waiting ${waitMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
}
// ============================================
// Core Fetch Helper
// ============================================
async function apiFetch(path, retries = 2) {
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
        if (retries > 0)
            return apiFetch(path, retries - 1);
        throw new Error(`ThemeParks.wiki rate limited on ${path} after retries`);
    }
    if (response.status === 404) {
        throw new Error(`ThemeParks.wiki entity not found: ${path}`);
    }
    if (!response.ok) {
        throw new Error(`ThemeParks.wiki API error ${response.status} on ${path}`);
    }
    return (await response.json());
}
// ============================================
// API Endpoints
// ============================================
/**
 * Get all destinations (96 worldwide).
 * Each destination contains an array of parks with their IDs and names.
 */
async function getAllDestinations() {
    const data = await apiFetch('/destinations');
    return data.destinations;
}
/**
 * Get full entity data (name, GPS, timezone, tags, type).
 */
async function getEntity(entityId) {
    return apiFetch(`/entity/${entityId}`);
}
/**
 * Get all children of an entity.
 * Destination -> parks. Park -> attractions, restaurants, shows.
 */
async function getEntityChildren(entityId) {
    const data = await apiFetch(`/entity/${entityId}/children`);
    return data.children;
}
/**
 * Get live data: wait times, park hours, show schedules, ride statuses.
 */
async function getEntityLive(entityId) {
    const data = await apiFetch(`/entity/${entityId}/live`);
    return data.liveData;
}
/**
 * Get schedule/calendar data for upcoming days.
 */
async function getEntitySchedule(entityId) {
    const data = await apiFetch(`/entity/${entityId}/schedule`);
    return data.schedule;
}
/**
 * Get schedule for a specific month.
 */
async function getEntityScheduleMonth(entityId, year, month) {
    const data = await apiFetch(`/entity/${entityId}/schedule/${year}/${month}`);
    return data.schedule;
}
// ============================================
// Batch Helpers
// ============================================
/**
 * Fetch entity data for multiple IDs with rate-limit-aware batching.
 * Processes in batches of `batchSize` with a delay between batches.
 */
async function batchGetEntities(entityIds, batchSize = 20, delayMs = 500) {
    const results = new Map();
    for (let i = 0; i < entityIds.length; i += batchSize) {
        const batch = entityIds.slice(i, i + batchSize);
        const promises = batch.map(async (id) => {
            try {
                const entity = await getEntity(id);
                results.set(id, entity);
            }
            catch (err) {
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
async function getParkEntitiesByType(parkId) {
    const children = await getEntityChildren(parkId);
    const attractions = [];
    const restaurants = [];
    const shows = [];
    const hotels = [];
    const other = [];
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
//# sourceMappingURL=themeparksWiki.js.map