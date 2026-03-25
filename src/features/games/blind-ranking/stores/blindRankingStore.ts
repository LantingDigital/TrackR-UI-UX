// ─── Blind Ranking Store ───────────────────────────────────
//
// Personal preference ranking — no right/wrong answers.
// Categories: Coasters (community-ranked), Parks (by coaster count),
// Snacks (editorial preset), Dream Road Trips (editorial preset).

import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BlindRankingGameState, BlindRankingStats, BlindRankingCategory, BlindRankingItem } from '../types/blindRanking';
import { COASTER_INDEX } from '../../../../data/coasterIndex';
import { submitBlindRankingResult } from '../../../../services/firebase/gameStatsSync';

const STATS_KEY = '@trackr:blind_ranking_stats';
const SETTINGS_KEY = '@trackr:blind_ranking_settings';
const ITEMS_PER_GAME = 10;

// ============================================
// Settings
// ============================================

export interface BlindRankingSettings {
  showCommunityComparison: boolean;
}

let settings: BlindRankingSettings = {
  showCommunityComparison: true,
};

// ============================================
// Categories
// ============================================

export const BLIND_RANKING_CATEGORIES: BlindRankingCategory[] = [
  {
    id: 'coasters',
    title: 'Top Coasters',
    description: 'Rank your favorite rides',
    icon: 'flash-outline',
    color: '#CF6769',
  },
  {
    id: 'parks',
    title: 'Theme Parks',
    description: 'Rank the best parks',
    icon: 'location-outline',
    color: '#8FBFB8',
  },
  {
    id: 'snacks',
    title: 'Park Snacks',
    description: 'Rank classic park food',
    icon: 'fast-food-outline',
    color: '#D4A98A',
  },
  {
    id: 'road-trips',
    title: 'Dream Road Trips',
    description: 'Rank the ultimate coaster trips',
    icon: 'car-outline',
    color: '#B8A3C4',
  },
];

// ============================================
// Editorial Preset Data
// ============================================

const SNACKS_POOL: BlindRankingItem[] = [
  { id: 'snack-funnel-cake', name: 'Funnel Cake', subtitle: 'Classic powdered sugar goodness', communityRank: 1 },
  { id: 'snack-turkey-leg', name: 'Turkey Leg', subtitle: 'The iconic smoked leg', communityRank: 2 },
  { id: 'snack-churros', name: 'Churros', subtitle: 'Cinnamon sugar perfection', communityRank: 3 },
  { id: 'snack-dippin-dots', name: "Dippin' Dots", subtitle: 'Ice cream of the future', communityRank: 4 },
  { id: 'snack-corn-dog', name: 'Corn Dog', subtitle: 'Deep-fried on a stick', communityRank: 5 },
  { id: 'snack-soft-pretzel', name: 'Soft Pretzel', subtitle: 'Warm, salty, buttery', communityRank: 6 },
  { id: 'snack-cotton-candy', name: 'Cotton Candy', subtitle: 'Spun sugar clouds', communityRank: 7 },
  { id: 'snack-pizza', name: 'Theme Park Pizza', subtitle: 'Questionable but comforting', communityRank: 8 },
  { id: 'snack-ice-cream', name: 'Waffle Cone Ice Cream', subtitle: 'The hot-day essential', communityRank: 9 },
  { id: 'snack-popcorn', name: 'Popcorn', subtitle: 'Buttery bucket of joy', communityRank: 10 },
  { id: 'snack-loaded-fries', name: 'Loaded Fries', subtitle: 'Cheese, bacon, everything', communityRank: 11 },
  { id: 'snack-lemonade', name: 'Fresh Lemonade', subtitle: 'The perfect refresher', communityRank: 12 },
  { id: 'snack-nachos', name: 'Nachos', subtitle: 'Chips and liquid cheese', communityRank: 13 },
  { id: 'snack-caramel-apple', name: 'Caramel Apple', subtitle: 'Sweet and sticky classic', communityRank: 14 },
  { id: 'snack-fried-oreos', name: 'Fried Oreos', subtitle: 'Deep-fried decadence', communityRank: 15 },
];

const ROAD_TRIPS_POOL: BlindRankingItem[] = [
  { id: 'trip-orlando', name: 'Orlando, FL', subtitle: 'Disney, Universal, SeaWorld, BGT nearby', communityRank: 1 },
  { id: 'trip-ohio', name: 'Ohio Triangle', subtitle: 'Cedar Point, Kings Island, Kennywood', communityRank: 2 },
  { id: 'trip-socal', name: 'Southern California', subtitle: 'Disneyland, Knott\'s, Magic Mountain', communityRank: 3 },
  { id: 'trip-japan', name: 'Japan Circuit', subtitle: 'Fuji-Q, USJ, Nagashima, Tokyo Disney', communityRank: 4 },
  { id: 'trip-uk', name: 'UK Tour', subtitle: 'Alton Towers, Thorpe Park, Blackpool', communityRank: 5 },
  { id: 'trip-northeast', name: 'Northeast US', subtitle: 'Hersheypark, Great Adventure, Dorney', communityRank: 6 },
  { id: 'trip-germany', name: 'Germany Run', subtitle: 'Europa-Park, Phantasialand, Movie Park', communityRank: 7 },
  { id: 'trip-texas', name: 'Texas Two-Step', subtitle: 'Six Flags Over Texas, Fiesta Texas', communityRank: 8 },
  { id: 'trip-scandinavia', name: 'Scandinavia', subtitle: 'Liseberg, Tivoli, Gröna Lund', communityRank: 9 },
  { id: 'trip-midwest', name: 'Midwest Loop', subtitle: 'Holiday World, Silver Dollar City, Worlds of Fun', communityRank: 10 },
  { id: 'trip-southeast', name: 'Southeast US', subtitle: 'Dollywood, Carowinds, BGW', communityRank: 11 },
  { id: 'trip-spain', name: 'Spain Adventure', subtitle: 'PortAventura, Parque Warner', communityRank: 12 },
  { id: 'trip-china', name: 'China Expedition', subtitle: 'Happy Valley, Chimelong, Fantawild', communityRank: 13 },
  { id: 'trip-australia', name: 'Australia', subtitle: 'Dreamworld, Movie World, Luna Park', communityRank: 14 },
];

// ============================================
// Module-Level State
// ============================================

let gameState: BlindRankingGameState = {
  status: 'category_select',
  category: null,
  items: [],
  currentItemIndex: 0,
  slots: Array(ITEMS_PER_GAME).fill(null),
  revealedItem: null,
};

let stats: BlindRankingStats = {
  gamesPlayed: 0,
  categoryPlays: {},
};

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

// ============================================
// Helpers
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateItems(categoryId: string): BlindRankingItem[] {
  switch (categoryId) {
    case 'coasters': {
      // Top popular coasters — communityRank = popularityRank position
      const top = [...COASTER_INDEX]
        .filter((c) => c.popularityRank <= 200)
        .sort((a, b) => a.popularityRank - b.popularityRank)
        .slice(0, 30);
      // Pick 10 spread out so there's variety
      const step = Math.floor(top.length / ITEMS_PER_GAME);
      const picks: BlindRankingItem[] = [];
      for (let i = 0; i < ITEMS_PER_GAME && i * step < top.length; i++) {
        const c = top[i * step];
        picks.push({ id: c.id, name: c.name, subtitle: c.park, communityRank: i + 1 });
      }
      return picks;
    }

    case 'parks': {
      // Parks ranked by total coaster count
      const parkCounts = new Map<string, number>();
      for (const c of COASTER_INDEX) {
        parkCounts.set(c.park, (parkCounts.get(c.park) ?? 0) + 1);
      }
      const sorted = [...parkCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25);
      const step = Math.floor(sorted.length / ITEMS_PER_GAME);
      const picks: BlindRankingItem[] = [];
      for (let i = 0; i < ITEMS_PER_GAME && i * step < sorted.length; i++) {
        const [park, count] = sorted[i * step];
        picks.push({
          id: `park-${park.replace(/\s/g, '-').toLowerCase()}`,
          name: park,
          subtitle: `${count} coasters`,
          communityRank: i + 1,
        });
      }
      return picks;
    }

    case 'snacks': {
      return shuffleArray(SNACKS_POOL).slice(0, ITEMS_PER_GAME).map((s, i) => ({ ...s }));
    }

    case 'road-trips': {
      return shuffleArray(ROAD_TRIPS_POOL).slice(0, ITEMS_PER_GAME).map((s, i) => ({ ...s }));
    }

    default:
      return [];
  }
}

// ============================================
// Stats Persistence
// ============================================

async function loadStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (raw) { stats = JSON.parse(raw); notify(); }
  } catch {}
}
async function saveStats() {
  try { await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}
loadStats();

async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) { settings = { ...settings, ...JSON.parse(raw) }; notify(); }
  } catch {}
}
async function saveSettings() {
  try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}
loadSettings();

export function setShowCommunityComparison(value: boolean): void {
  settings = { ...settings, showCommunityComparison: value };
  notify();
  saveSettings();
}

// ============================================
// Actions
// ============================================

export function selectCategory(category: BlindRankingCategory): void {
  const items = generateItems(category.id);
  const shuffled = shuffleArray(items);

  gameState = {
    status: 'playing',
    category,
    items: shuffled,
    currentItemIndex: 0,
    slots: Array(ITEMS_PER_GAME).fill(null),
    revealedItem: shuffled[0],
  };
  notify();
}

export function placeInSlot(slotIndex: number): void {
  if (gameState.status !== 'playing' || !gameState.revealedItem) return;
  if (gameState.slots[slotIndex] !== null) return; // slot taken

  const item = gameState.revealedItem;
  const newSlots = [...gameState.slots];
  newSlots[slotIndex] = item;

  const nextIdx = gameState.currentItemIndex + 1;

  if (nextIdx >= gameState.items.length) {
    // Game over — save stats
    stats.gamesPlayed += 1;
    stats.categoryPlays[gameState.category!.id] = (stats.categoryPlays[gameState.category!.id] ?? 0) + 1;
    saveStats();
    submitBlindRankingResult({
      accuracy: 100, // Blind ranking is subjective — no "wrong" answers
      category: gameState.category?.id ?? 'unknown',
      gamesPlayed: stats.gamesPlayed,
    }).catch(() => {});

    gameState = {
      ...gameState,
      slots: newSlots,
      revealedItem: null,
      currentItemIndex: nextIdx,
      status: 'results',
    };
  } else {
    gameState = {
      ...gameState,
      slots: newSlots,
      currentItemIndex: nextIdx,
      revealedItem: gameState.items[nextIdx],
    };
  }
  notify();
}

export function resetGame(): void {
  gameState = {
    status: 'category_select',
    category: null,
    items: [],
    currentItemIndex: 0,
    slots: Array(ITEMS_PER_GAME).fill(null),
    revealedItem: null,
  };
  notify();
}

// ============================================
// React Hook
// ============================================

export function useBlindRankingStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    listeners.add(forceUpdate);
    return () => { listeners.delete(forceUpdate); };
  }, []);
  return { game: gameState, stats, settings, categories: BLIND_RANKING_CATEGORIES };
}
