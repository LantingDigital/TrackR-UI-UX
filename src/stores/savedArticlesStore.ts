/**
 * Saved Articles Store — Zustand
 *
 * Tracks bookmarked/saved articles. Will sync to Firestore in M2.
 */

import { create } from 'zustand';
import { MOCK_NEWS, NewsItem } from '../data/mockNews';

// ============================================
// Store
// ============================================

interface SavedArticlesState {
  savedIds: Set<string>;
}

interface SavedArticlesActions {
  toggleSave: (id: string) => void;
}

const useStore = create<SavedArticlesState & SavedArticlesActions>((set) => ({
  savedIds: new Set(MOCK_NEWS.filter((item) => item.isSaved).map((item) => item.id)),

  toggleSave: (id) =>
    set((state) => {
      const next = new Set(state.savedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { savedIds: next };
    }),
}));

// ============================================
// Standalone Getters
// ============================================

export function isSaved(id: string): boolean {
  return useStore.getState().savedIds.has(id);
}

export function getSavedArticles(): NewsItem[] {
  return MOCK_NEWS.filter((item) => useStore.getState().savedIds.has(item.id));
}

export function getSavedArticleIds(): Set<string> {
  return useStore.getState().savedIds;
}

export const toggleSave = useStore.getState().toggleSave;

// ============================================
// React Hook
// ============================================

export function useSavedArticlesStore() {
  const state = useStore();

  return {
    isSaved: (id: string) => state.savedIds.has(id),
    getSavedArticles: () =>
      MOCK_NEWS.filter((item) => state.savedIds.has(item.id)),
    getSavedArticleIds: () => state.savedIds,
    toggleSave: state.toggleSave,
  };
}
