// ─── Rankings Store ─────────────────────────────────────────
//
// Module-level store for community-aggregated rankings.
// Pattern: communityStore.ts (state + listeners + notify + useReducer hook).

import { useEffect, useReducer } from 'react';
import type { RankingCategory } from '../types/community';
import { MOCK_RANKINGS } from '../data/mockRankingsData';

// ============================================
// Module-Level State
// ============================================

let categories: RankingCategory[] = [...MOCK_RANKINGS];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Getters
// ============================================

export function getCategories(): RankingCategory[] {
  return categories;
}

export function getCategory(categoryId: string): RankingCategory | undefined {
  return categories.find((c) => c.id === categoryId);
}

// ============================================
// React Hook
// ============================================

// Cached snapshot — stable reference as long as data is unchanged.
let cachedRankingsSnapshot: { categories: RankingCategory[] } | null = null;

export function useRankingsStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  if (!cachedRankingsSnapshot || cachedRankingsSnapshot.categories !== categories) {
    cachedRankingsSnapshot = { categories };
  }

  return cachedRankingsSnapshot;
}
