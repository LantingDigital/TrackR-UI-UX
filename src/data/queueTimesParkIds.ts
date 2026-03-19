/**
 * Queue-Times.com Park ID Mapping
 *
 * Maps TrackR park slugs to Queue-Times.com numeric park IDs.
 * Used by proxyWaitTimes Cloud Function to fetch live wait times.
 *
 * Queue-Times API is public (no auth needed):
 * - Parks list: https://queue-times.com/en-US/parks.json
 * - Park data: https://queue-times.com/en-US/parks/{parkId}/queue_times.json
 *
 * Parks NOT on Queue-Times (no live wait times available):
 * - Holiday World
 * - Lagoon
 */

/**
 * Lookup table: TrackR parkSlug → Queue-Times numeric parkId.
 * Only includes parks that have a matching Queue-Times entry.
 */
export const QUEUE_TIMES_PARK_IDS: Record<string, number> = {
  // Cedar Fair
  'cedar-point': 50,
  'kings-island': 60,
  'knotts-berry-farm': 61,
  'canadas-wonderland': 58,
  'carowinds': 59,
  'kings-dominion': 62,
  'dorney-park': 69,
  'worlds-of-fun': 63,
  'valleyfair': 68,
  'michigan-adventure': 70,

  // Six Flags
  'six-flags-magic-mountain': 32,
  'six-flags-great-adventure': 37,
  'six-flags-over-texas': 34,
  'six-flags-over-georgia': 35,
  'six-flags-fiesta-texas': 39,
  'six-flags-great-america': 38,
  'six-flags-new-england': 43,

  // Disney
  'magic-kingdom': 6,
  'epcot': 5,
  'hollywood-studios': 7,
  'animal-kingdom': 8,
  'disneyland': 16,
  'disney-california-adventure': 17,

  // Universal
  'universal-studios-florida': 65,
  'islands-of-adventure': 64,
  'epic-universe': 334,
  'universal-studios-hollywood': 66,

  // SeaWorld / Busch Gardens
  'seaworld-orlando': 21,
  'seaworld-san-diego': 20,
  'busch-gardens-tampa': 24,
  'busch-gardens-williamsburg': 23,

  // Other Major Parks
  'hersheypark': 15,
  'dollywood': 55,
  'silver-dollar-city': 10,
  'kennywood': 312,
};

/**
 * Get the Queue-Times park ID for a TrackR park slug.
 * Returns undefined if the park isn't tracked by Queue-Times.
 */
export function getQueueTimesParkId(parkSlug: string): number | undefined {
  return QUEUE_TIMES_PARK_IDS[parkSlug];
}

/**
 * Check if a park has live wait time data available via Queue-Times.
 */
export function hasLiveWaitTimes(parkSlug: string): boolean {
  return parkSlug in QUEUE_TIMES_PARK_IDS;
}
