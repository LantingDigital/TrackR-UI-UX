import { COASTER_INDEX, CoasterIndexEntry } from './coasterIndex';
import { PARK_INDEX, ParkIndexEntry } from './parkIndex';
import {
  TRENDING_COASTERS as TRENDING_RAW,
  POPULAR_RIDES as POPULAR_RIDES_RAW,
  POPULAR_PARKS as POPULAR_PARKS_RAW,
} from './trendingData';

// ── Interface (unchanged — used by SearchCarousel, SearchResultRow, etc.) ──

export interface SearchableItem {
  id: string;
  name: string;
  image: string;
  type: 'ride' | 'park' | 'news';
  subtitle?: string;
}

// ── Mappers ──

function coasterToSearchable(c: CoasterIndexEntry): SearchableItem {
  return {
    id: c.id,
    name: c.name,
    image: c.imageUrl || '',
    type: 'ride',
    subtitle: c.park,
  };
}

function parkToSearchable(p: ParkIndexEntry): SearchableItem {
  return {
    id: p.id,
    name: p.name,
    image: p.imageUrl || '',
    type: 'park',
    subtitle: [p.city, p.region, p.country].filter(Boolean).join(', '),
  };
}

// ── Popular Rides (replaces NEARBY_RIDES) ──

export const NEARBY_RIDES: SearchableItem[] = POPULAR_RIDES_RAW.map(r => ({
  id: r.id,
  name: r.name,
  image: r.imageUrl || '',
  type: 'ride' as const,
  subtitle: r.park,
}));

// ── Popular Parks (replaces NEARBY_PARKS) ──

export const NEARBY_PARKS: SearchableItem[] = POPULAR_PARKS_RAW.map(p => ({
  id: p.id,
  name: p.name,
  image: p.imageUrl || '',
  type: 'park' as const,
  subtitle: [p.city, p.country].filter(Boolean).join(', '),
}));

// ── Recent Searches (user-driven, kept as defaults) ──

export const RECENT_SEARCHES: string[] = [
  'Steel Vengeance',
  'Cedar Point',
  'RMC Coasters',
  'Millennium Force',
  'Six Flags Magic Mountain',
];

// ── Trending Searches (derived from real popularity data) ──

export const TRENDING_SEARCHES: string[] = TRENDING_RAW.slice(0, 5).map(c => c.name);

// ── Full search index (lazy-built on first search) ──

let _allItems: SearchableItem[] | null = null;

function getAllSearchableItems(): SearchableItem[] {
  if (_allItems) return _allItems;
  const rides = COASTER_INDEX.map(coasterToSearchable);
  const parks = PARK_INDEX.map(parkToSearchable);
  _allItems = [...rides, ...parks];
  return _allItems;
}

// Exported for backward compat (LogModal uses it for image lookups)
export const ALL_SEARCHABLE_ITEMS: SearchableItem[] = getAllSearchableItems();

// ── Search function (optimized for 4,000+ items) ──

export const searchItems = (query: string): SearchableItem[] => {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const allItems = getAllSearchableItems();

  // Two-pass: prefix matches first, then substring matches
  const prefixMatches: SearchableItem[] = [];
  const substringMatches: SearchableItem[] = [];

  for (const item of allItems) {
    const nameLower = item.name.toLowerCase();
    if (nameLower.startsWith(q)) {
      prefixMatches.push(item);
    } else if (
      nameLower.includes(q) ||
      item.subtitle?.toLowerCase().includes(q)
    ) {
      substringMatches.push(item);
    }
    // Early exit — no need to search all 4k+ items for UI display
    if (prefixMatches.length + substringMatches.length >= 20) break;
  }

  return [...prefixMatches, ...substringMatches].slice(0, 20);
};

// ── Trending Coasters (for Log Modal) ──

export interface TrendingCoaster {
  rank: number;
  name: string;
  park: string;
  logCount: string;
  image: string;
}

export const TRENDING_COASTERS: TrendingCoaster[] = TRENDING_RAW.slice(0, 5).map(c => ({
  rank: c.rank,
  name: c.name,
  park: c.park,
  logCount: `${Math.round(c.score * 10)}`,  // Derive from popularity score
  image: c.imageUrl || '',
}));

// ── Rides grouped by park (dynamically built from index) ──

const _ridesByPark: Record<string, SearchableItem[]> = {};

// Pre-build for top parks (lazy — built on first access)
function buildRidesByPark(): Record<string, SearchableItem[]> {
  if (Object.keys(_ridesByPark).length > 0) return _ridesByPark;
  for (const c of COASTER_INDEX) {
    if (!c.park) continue;
    if (!_ridesByPark[c.park]) _ridesByPark[c.park] = [];
    _ridesByPark[c.park].push(coasterToSearchable(c));
  }
  return _ridesByPark;
}

export const RIDES_BY_PARK = buildRidesByPark();

// Get rides for a specific park (for "More from [Last Park]" feature)
export const getRidesForPark = (parkName: string): SearchableItem[] => {
  const byPark = buildRidesByPark();
  return byPark[parkName] || NEARBY_RIDES;
};

// Get icon name based on item type
export const getTypeIcon = (type: 'ride' | 'park' | 'news'): string => {
  switch (type) {
    case 'ride':
      return 'train-outline';
    case 'park':
      return 'map-outline';
    case 'news':
      return 'newspaper-outline';
    default:
      return 'search-outline';
  }
};
