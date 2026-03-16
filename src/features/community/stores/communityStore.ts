/**
 * Community Store — Zustand
 *
 * Manages community feed state.
 * Firestore sync layer pushes data via _set* internal actions.
 * UI actions call Firestore write functions which do optimistic updates.
 */

import { create } from 'zustand';
import type {
  FeedItem,
  Comment,
  ReviewFeedItem,
  TripReportFeedItem,
  TopListFeedItem,
  BucketListFeedItem,
  ComposeReviewData,
  ComposeTripReportData,
  ComposeRankedListData,
  ComposeBucketListData,
} from '../types/community';

// ============================================
// Store
// ============================================

interface CommunityState {
  feedItems: FeedItem[];
}

interface CommunityActions {
  toggleLike: (itemId: string) => void;
  addComment: (itemId: string, text: string) => void;
  toggleCommentLike: (itemId: string, commentId: string) => void;
  createReviewPost: (data: ComposeReviewData) => void;
  createTripReportPost: (data: ComposeTripReportData) => void;
  createRankedListPost: (data: ComposeRankedListData) => void;
  createBucketListPost: (data: ComposeBucketListData) => void;

  // Firestore sync actions (called by sync layer, not UI)
  _setFeedItems: (items: FeedItem[]) => void;
  _resetStore: () => void;
}

const useStore = create<CommunityState & CommunityActions>((set, get) => ({
  feedItems: [],

  toggleLike: (itemId) =>
    set((state) => ({
      feedItems: state.feedItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isLiked: !item.isLiked,
              likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
            }
          : item
      ),
    })),

  addComment: (itemId, text) =>
    set((state) => ({
      feedItems: state.feedItems.map((item) => {
        if (item.id !== itemId) return item;
        const comment: Comment = {
          id: `c-${Date.now()}`,
          authorId: 'u-me',
          authorName: 'You',
          authorInitials: 'ME',
          text,
          timestamp: Date.now(),
          likeCount: 0,
          isLiked: false,
        };
        return {
          ...item,
          comments: [...item.comments, comment],
          commentCount: item.commentCount + 1,
        };
      }),
    })),

  toggleCommentLike: (itemId, commentId) =>
    set((state) => ({
      feedItems: state.feedItems.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          comments: item.comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  isLiked: !c.isLiked,
                  likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
                }
              : c
          ),
        };
      }),
    })),

  createReviewPost: (data) => {
    const newItem: ReviewFeedItem = {
      id: `f-${Date.now()}`,
      type: 'review',
      authorId: 'u-me',
      authorName: 'You',
      authorInitials: 'ME',
      daysAgo: 0,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      comments: [],
      coasterId: data.coasterId,
      coasterName: data.coasterName,
      parkName: data.parkName,
      rating: data.rating,
      reviewText: data.reviewText,
    };
    set((state) => ({ feedItems: [newItem, ...state.feedItems] }));
  },

  createTripReportPost: (data) => {
    const newItem: TripReportFeedItem = {
      id: `f-${Date.now()}`,
      type: 'trip_report',
      authorId: 'u-me',
      authorName: 'You',
      authorInitials: 'ME',
      daysAgo: 0,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      comments: [],
      title: data.title,
      parkId: data.parkId,
      parkName: data.parkName,
      rideCount: data.rideCount,
      excerpt: data.bodyText.slice(0, 200),
      fullText: data.bodyText,
    };
    set((state) => ({ feedItems: [newItem, ...state.feedItems] }));
  },

  createRankedListPost: (data) => {
    const newItem: TopListFeedItem = {
      id: `f-${Date.now()}`,
      type: 'top_list',
      authorId: 'u-me',
      authorName: 'You',
      authorInitials: 'ME',
      daysAgo: 0,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      comments: [],
      title: data.title,
      emoji: data.emoji,
      items: data.items,
      category: 'Custom',
    };
    set((state) => ({ feedItems: [newItem, ...state.feedItems] }));
  },

  createBucketListPost: (data) => {
    const newItem: BucketListFeedItem = {
      id: `f-${Date.now()}`,
      type: 'bucket_list',
      authorId: 'u-me',
      authorName: 'You',
      authorInitials: 'ME',
      daysAgo: 0,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      comments: [],
      title: data.title,
      items: data.items.map((item, i) => ({
        id: `bl-${Date.now()}-${i}`,
        name: item.name,
        itemType: item.itemType,
        refId: item.refId,
        completed: false,
      })),
    };
    set((state) => ({ feedItems: [newItem, ...state.feedItems] }));
  },

  // ── Firestore sync actions ──────────────────

  _setFeedItems: (items) => set({ feedItems: items }),
  _resetStore: () => set({ feedItems: [] }),
}));

// ============================================
// Internal Access (for sync layer)
// ============================================

export const _communityStoreInternal = useStore;

// ============================================
// Standalone Getters
// ============================================

export function getFeed(): FeedItem[] {
  return useStore.getState().feedItems;
}

export function getFeedItem(itemId: string): FeedItem | undefined {
  return useStore.getState().feedItems.find((f) => f.id === itemId);
}

export const toggleLike = useStore.getState().toggleLike;
export const addComment = useStore.getState().addComment;
export const toggleCommentLike = useStore.getState().toggleCommentLike;
export const createReviewPost = useStore.getState().createReviewPost;
export const createTripReportPost = useStore.getState().createTripReportPost;
export const createRankedListPost = useStore.getState().createRankedListPost;
export const createBucketListPost = useStore.getState().createBucketListPost;

// ============================================
// React Hook
// ============================================

export function useCommunityStore() {
  const state = useStore();

  return {
    feed: state.feedItems,
    toggleLike: state.toggleLike,
    addComment: state.addComment,
    toggleCommentLike: state.toggleCommentLike,
    createReviewPost: state.createReviewPost,
    createTripReportPost: state.createTripReportPost,
    createRankedListPost: state.createRankedListPost,
    createBucketListPost: state.createBucketListPost,
  };
}
