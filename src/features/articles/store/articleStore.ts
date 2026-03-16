/**
 * Article Store — Zustand store for article feed state.
 *
 * Fetches from mock data now. In production, fetches from
 * Firestore articles collection with local cache.
 */

import { create } from 'zustand';
import { Article } from '../types';
import { getPublishedArticles } from '../data/mockArticles';

interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchArticles: () => void;
  getArticleById: (id: string) => Article | undefined;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  isLoading: false,
  lastFetchedAt: null,

  fetchArticles: () => {
    set({ isLoading: true });
    // Mock: load from local data. In production, this queries Firestore.
    const articles = getPublishedArticles();
    set({ articles, isLoading: false, lastFetchedAt: Date.now() });
  },

  getArticleById: (id: string) => {
    return get().articles.find(a => a.id === id);
  },
}));
