import { ParklePark } from '../types/parkle';
import { PARK_INDEX, ParkIndexEntry } from '../../../data/parkIndex';

// ============================================
// Parkle Park Database — derived from PARK_INDEX
// ============================================

function toPark(entry: ParkIndexEntry): ParklePark {
  return {
    id: entry.id,
    name: entry.name,
    country: entry.country,
    region: entry.region,
    city: entry.city,
    coasterCount: entry.coasterCount,
    owner: entry.owner,
  };
}

// Full database: all parks with at least 1 coaster
export const PARK_DATABASE: ParklePark[] = PARK_INDEX
  .filter((p) => p.coasterCount > 0)
  .map(toPark);

// Daily answer pool: well-known parks (5+ coasters) for deterministic daily selection
export const DAILY_ANSWER_POOL: string[] = PARK_DATABASE
  .filter((p) => p.coasterCount >= 5)
  .map((p) => p.id);

// Search function for the autocomplete bar
export function searchParks(query: string, excludeIds: string[]): ParklePark[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const excludeSet = new Set(excludeIds);
  const results: ParklePark[] = [];

  for (const park of PARK_DATABASE) {
    if (excludeSet.has(park.id)) continue;
    if (park.name.toLowerCase().includes(q)) {
      results.push(park);
      if (results.length >= 8) break;
    }
  }

  return results;
}
