/**
 * Rankings Store — Zustand
 *
 * Read-only store for community-aggregated rankings.
 * Firestore sync layer pushes data via _setCategories internal action.
 */

import { create } from 'zustand';
import type { RankingCategory } from '../types/community';

// ============================================
// Store
// ============================================

interface RankingsState {
  categories: RankingCategory[];

  // Firestore sync actions (called by sync layer, not UI)
  _setCategories: (categories: RankingCategory[]) => void;
  _resetStore: () => void;
}

const useStore = create<RankingsState>((set) => ({
  categories: [],

  // ── Firestore sync actions ──────────────────

  _setCategories: (categories) => set({ categories }),
  _resetStore: () => set({ categories: [] }),
}));

// ============================================
// Internal Access (for sync layer)
// ============================================

export const _rankingsStoreInternal = useStore;

// ============================================
// Standalone Getters
// ============================================

export function getCategories(): RankingCategory[] {
  return useStore.getState().categories;
}

export function getCategory(categoryId: string): RankingCategory | undefined {
  return useStore.getState().categories.find((c) => c.id === categoryId);
}

// ============================================
// React Hook
// ============================================

export function useRankingsStore() {
  const state = useStore();
  return {
    categories: state.categories,
  };
}
