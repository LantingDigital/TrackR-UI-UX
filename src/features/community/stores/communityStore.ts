// ─── Community Store ────────────────────────────────────────
//
// Module-level store for community feed state.
// Pattern: coastleStore.ts (state + listeners + notify + useReducer hook).

import { useCallback, useEffect, useReducer } from 'react';
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
import { MOCK_FEED_EXTENDED } from '../data/mockFeedData';

// ============================================
// Module-Level State
// ============================================

let feedItems: FeedItem[] = [...MOCK_FEED_EXTENDED];
let initialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Actions
// ============================================

export function toggleLike(itemId: string): void {
  const item = feedItems.find((f) => f.id === itemId);
  if (!item) return;
  item.isLiked = !item.isLiked;
  item.likeCount += item.isLiked ? 1 : -1;
  notify();
}

export function addComment(itemId: string, text: string): void {
  const item = feedItems.find((f) => f.id === itemId);
  if (!item) return;
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
  item.comments.push(comment);
  item.commentCount += 1;
  notify();
}

export function toggleCommentLike(itemId: string, commentId: string): void {
  const item = feedItems.find((f) => f.id === itemId);
  if (!item) return;
  const comment = item.comments.find((c) => c.id === commentId);
  if (!comment) return;
  comment.isLiked = !comment.isLiked;
  comment.likeCount += comment.isLiked ? 1 : -1;
  notify();
}

export function createReviewPost(data: ComposeReviewData): void {
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
  feedItems = [newItem, ...feedItems];
  notify();
}

export function createTripReportPost(data: ComposeTripReportData): void {
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
  feedItems = [newItem, ...feedItems];
  notify();
}

export function createRankedListPost(data: ComposeRankedListData): void {
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
  feedItems = [newItem, ...feedItems];
  notify();
}

export function createBucketListPost(data: ComposeBucketListData): void {
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
  feedItems = [newItem, ...feedItems];
  notify();
}

// ============================================
// Getters
// ============================================

export function getFeed(): FeedItem[] {
  return feedItems;
}

export function getFeedItem(itemId: string): FeedItem | undefined {
  return feedItems.find((f) => f.id === itemId);
}

// ============================================
// React Hook
// ============================================

export function useCommunityStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  return {
    feed: feedItems,
    toggleLike,
    addComment,
    toggleCommentLike,
    createReviewPost,
    createTripReportPost,
    createRankedListPost,
    createBucketListPost,
  };
}
