// ─── Community Type Definitions ─────────────────────────────
//
// Central types for the entire community feature:
// feed posts, comments, friends, rankings, compose forms.

// ─── Author ─────────────────────────────────────────────────

export interface Author {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  creditCount: number;
  reviewCount: number;
}

// ─── Comments ───────────────────────────────────────────────

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  timestamp: number; // epoch ms
  likeCount: number;
  isLiked: boolean;
}

// ─── Feed Items ─────────────────────────────────────────────

export interface FeedItemBase {
  id: string;
  type: 'review' | 'trip_report' | 'top_list' | 'bucket_list';
  authorId: string;
  authorName: string;
  authorInitials: string;
  daysAgo: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: Comment[];
}

export interface ReviewFeedItem extends FeedItemBase {
  type: 'review';
  coasterId: string;
  coasterName: string;
  parkName: string;
  rating: number; // 1-5 stars
  reviewText: string;
}

export interface TripReportFeedItem extends FeedItemBase {
  type: 'trip_report';
  title: string;
  parkId: string;
  parkName: string;
  rideCount: number;
  excerpt: string;
  fullText: string;
}

export interface TopListFeedItem extends FeedItemBase {
  type: 'top_list';
  title: string;
  emoji: string;
  items: { coasterId: string; name: string }[];
  category: string;
}

export interface BucketListFeedItem extends FeedItemBase {
  type: 'bucket_list';
  title: string;
  items: BucketListEntry[];
}

export interface BucketListEntry {
  id: string;
  name: string;
  itemType: 'coaster' | 'park';
  refId: string;
  completed: boolean;
}

export type FeedItem =
  | ReviewFeedItem
  | TripReportFeedItem
  | TopListFeedItem
  | BucketListFeedItem;

// ─── Friends ────────────────────────────────────────────────

export interface Friend {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  creditCount: number;
  topCoaster: string;
  mutualFriends: number;
  recentRide?: {
    coasterName: string;
    parkName: string;
    daysAgo: number;
  };
}

export interface FriendActivity {
  id: string;
  friendId: string;
  friendName: string;
  friendInitials: string;
  type: 'ride' | 'review' | 'milestone';
  text: string;
  timestamp: number; // epoch ms
  daysAgo: number;
}

// ─── Community Rankings ─────────────────────────────────────

export interface CommunityRankingEntry {
  coasterId: string;
  coasterName: string;
  parkName: string;
  averageScore: number; // 1.0 - 10.0
  totalRatings: number;
}

export interface RankingCategory {
  id: string;
  title: string;
  criterion: string; // 'overall' | 'airtime' | 'intensity' | etc.
  icon: string; // Ionicons name
  color: string; // criterion color
  entries: CommunityRankingEntry[];
}

// ─── Compose / Post Creation ────────────────────────────────

export type PostType = 'review' | 'trip_report' | 'ranked_list' | 'bucket_list';

export interface ComposeReviewData {
  coasterId: string;
  coasterName: string;
  parkName: string;
  rating: number;
  reviewText: string;
}

export interface ComposeTripReportData {
  title: string;
  parkId: string;
  parkName: string;
  rideCount: number;
  bodyText: string;
}

export interface ComposeRankedListData {
  title: string;
  emoji: string;
  items: { coasterId: string; name: string }[];
}

export interface ComposeBucketListData {
  title: string;
  items: {
    name: string;
    itemType: 'coaster' | 'park';
    refId: string;
  }[];
}

// ─── Games (shared) ─────────────────────────────────────────

export interface GameItem {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  subtitle?: string;
}
