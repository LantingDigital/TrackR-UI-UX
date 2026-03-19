/**
 * Firestore Document Types — v1 Schema
 *
 * TypeScript interfaces matching the Firestore document structures
 * defined in docs/DATABASE_SCHEMA_V1/collections-m1.md.
 *
 * These types are used by the service layer (src/services/firebase/)
 * and Cloud Functions (functions/src/).
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Timestamp = FirebaseFirestoreTypes.Timestamp;

// ============================================
// Users
// ============================================

/**
 * `users/{userId}` — Central user document.
 * Profile-visible fields sync to Firestore; device-local prefs stay in Zustand.
 */
export interface UserDoc {
  // Identity
  uid: string;
  displayName: string;
  username: string;
  profileImageUrl: string | null;
  authProvider: 'apple' | 'google' | 'email';

  // Onboarding selections
  homeParkName: string;
  riderType: 'thrill-seeker' | 'well-rounded' | 'casual' | 'family';

  // Denormalized stats (written by Cloud Functions, NOT client)
  totalCredits: number;
  totalRides: number;

  // Privacy
  accountVisibility: 'public' | 'private';

  // Notifications
  fcmTokens: string[];
  notificationsEnabled: boolean;

  // Pro status (M3, but field exists from M1)
  proStatus: {
    active: boolean;
    tier: string | null;
    expiresAt: Timestamp | null;
    platform: 'ios' | null;
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}

/**
 * Fields that can be set/updated by the client.
 * Excludes server-only fields (totalCredits, totalRides, proStatus, createdAt).
 */
export type UserDocClientWritable = Pick<
  UserDoc,
  | 'displayName'
  | 'username'
  | 'profileImageUrl'
  | 'homeParkName'
  | 'riderType'
  | 'accountVisibility'
  | 'notificationsEnabled'
>;

// ============================================
// Usernames
// ============================================

/**
 * `usernames/{username}` — Enforces username uniqueness.
 * Document ID IS the username (lowercased).
 */
export interface UsernameDoc {
  uid: string;
  createdAt: Timestamp;
}

// ============================================
// Ride Logs
// ============================================

/**
 * `rideLogs/{userId}/logs/{logId}` — One document per ride logged.
 */
export interface RideLogDoc {
  id: string;
  coasterId: string;
  coasterName: string;
  parkName: string;
  timestamp: string; // ISO 8601, user-editable
  seat: {
    row: string;
    position: 'left' | 'middle' | 'right';
  } | null;
  rideCount: number;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * `rideLogs/{userId}/meta` — Denormalized counters (written by Cloud Functions only).
 */
export interface RideLogMetaDoc {
  creditCount: number;
  totalRideCount: number;
  lastLogAt: Timestamp | null;
}

// ============================================
// Ratings
// ============================================

/**
 * `ratings/{userId}/{coasterId}` — One document per coaster the user has rated.
 */
export interface RatingDoc {
  coasterId: string;
  coasterName: string;
  parkName: string;
  criteriaRatings: Record<string, number>;
  weightedScore: number;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Criteria Config
// ============================================

/**
 * `users/{userId}/criteriaConfig/config` — Custom rating criteria and weights.
 */
export interface CriteriaConfigDoc {
  criteria: Array<{
    id: string;
    name: string;
    icon: string;
    weight: number;
    isLocked: boolean;
  }>;
  hasCompletedSetup: boolean;
  lastModifiedAt: string; // ISO 8601
}

// ============================================
// M2: Community — Posts
// ============================================

/**
 * `posts/{postId}` — Community feed post.
 * Four types, one collection. Visibility controlled by author's account setting.
 */
export interface PostDoc {
  id: string;
  type: 'review' | 'trip-report' | 'ranked-list' | 'bucket-list';
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;

  content: string;
  coasterRef: { coasterId: string; coasterName: string; parkName: string } | null;
  parkRef: { parkId: string; parkName: string } | null;
  items: Array<{
    coasterId: string;
    coasterName: string;
    parkName: string;
    rank?: number;
  }> | null;

  likeCount: number;
  commentCount: number;
  likedBy: string[];

  visibility: 'public' | 'friends-only';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * `posts/{postId}/comments/{commentId}`
 */
export interface CommentDoc {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  likeCount: number;
  likedBy: string[];
  createdAt: Timestamp;
}

// ============================================
// M2: Community — Rankings
// ============================================

/**
 * `rankings/{category}_{timeWindow}` — Pre-computed by scheduled CF.
 */
export interface RankingsDoc {
  category: string;
  timeWindow: 'all-time' | 'this-year' | 'this-month';
  entries: Array<{
    coasterId: string;
    coasterName: string;
    parkName: string;
    averageScore: number;
    totalRatings: number;
    rank: number;
    rankChange: number;
  }>;
  lastComputed: Timestamp;
}

// ============================================
// M2: Community — Friend Requests
// ============================================

/**
 * `friendRequests/{requestId}` — State machine: pending → accepted/declined.
 */
export interface FriendRequestDoc {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl: string | null;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  respondedAt: Timestamp | null;
}

// ============================================
// M2: Community — Friends
// ============================================

/**
 * `users/{userId}/friends/{friendId}` — Bidirectional.
 * When A and B become friends, docs exist at both A/friends/B and B/friends/A.
 */
export interface FriendDocFirestore {
  friendId: string;
  friendName: string;
  friendAvatarUrl: string | null;
  addedAt: Timestamp;
}

// ============================================
// Articles (News Feed)
// ============================================

export type ArticleCategory =
  | 'news'
  | 'news-digest'
  | 'ride-review'
  | 'park-guide'
  | 'industry'
  | 'seasonal'
  | 'opinion'
  | 'culture'
  | 'history'
  | 'guide';

export type ArticleStatus = 'draft' | 'published';

export interface ArticleSource {
  name: string;
  url: string;
}

/**
 * `articles/{articleId}` — News feed articles.
 * Managed by admin (custom claim), read by all authenticated users.
 */
export interface ArticleDoc {
  id: string;
  title: string;
  subtitle: string;
  body: string; // markdown
  bannerImageUrl: string | null;
  category: ArticleCategory;
  tags: string[];
  readTimeMinutes: number;
  sources: ArticleSource[];
  authorId: string;
  authorName: string;
  publishedAt: Timestamp | null;
  status: ArticleStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
