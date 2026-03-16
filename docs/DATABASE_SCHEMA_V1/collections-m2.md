# M2 Collections — Core Features

TypeScript interfaces for every M2 Firestore document.

---

## `posts/{postId}`

Community feed posts. Four types, one collection. Visibility controlled by author's account setting + per-post override.

```typescript
interface PostDoc {
  id: string;
  type: 'review' | 'trip-report' | 'ranked-list' | 'bucket-list';
  authorId: string;
  authorName: string; // denormalized for feed rendering without user doc join
  authorAvatarUrl: string | null; // denormalized

  // Content
  content: string; // main text body
  coasterRef: { coasterId: string; coasterName: string; parkName: string } | null; // for reviews
  parkRef: { parkId: string; parkName: string } | null; // for trip reports
  items: Array<{
    coasterId: string;
    coasterName: string;
    parkName: string;
    rank?: number; // for ranked-list
  }> | null; // for ranked-list and bucket-list types

  // Engagement (denormalized counts for feed rendering)
  likeCount: number;
  commentCount: number;
  likedBy: string[]; // array of userIds — for quick "did I like this?" check

  // Visibility
  visibility: 'public' | 'friends-only';

  // Timestamps
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** CommunityFeedTab, HomeScreen (friend activity section), PostDetailScreen
**Writes:** ComposeSheet → `createPost` CF
**Query patterns:**
- Community feed: `visibility == 'public'`, ordered by `createdAt` desc, paginated
- Friends feed: `authorId in [friendIds]`, ordered by `createdAt` desc, paginated
- User's own posts: `authorId == uid`, ordered by `createdAt` desc
**Note:** `likedBy` array works for v1 scale (<10k likes/post). At scale, move to a `posts/{postId}/likes/{userId}` subcollection.

---

## `posts/{postId}/comments/{commentId}`

```typescript
interface CommentDoc {
  id: string;
  authorId: string;
  authorName: string; // denormalized
  authorAvatarUrl: string | null; // denormalized
  text: string;
  likeCount: number;
  likedBy: string[];
  createdAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** PostDetailScreen
**Writes:** `addComment` CF
**Query:** All comments for a post, ordered by `createdAt` asc

---

## `rankings/{category}`

Pre-computed by scheduled Cloud Function. One doc per category per time window.

```typescript
interface RankingsDoc {
  category: 'overall' | 'airtime' | 'intensity' | 'smoothness' | 'theming' | 'pacing';
  timeWindow: 'all-time' | 'this-year' | 'this-month';
  entries: Array<{
    coasterId: string;
    coasterName: string;
    parkName: string;
    averageScore: number; // 0-100
    totalRatings: number;
    rank: number;
    rankChange: number; // vs previous computation (+2, -1, 0)
  }>;
  lastComputed: FirebaseFirestore.Timestamp;
}
```

**Document ID pattern:** `{category}_{timeWindow}` (e.g., `overall_all-time`, `airtime_this-month`)
**Reads:** CommunityRankingsTab
**Writes:** `computeRankings` scheduled CF only
**Note:** 6 categories x 3 time windows = 18 documents. Small, fast reads.

---

## `friendRequests/{requestId}`

State machine: pending → accepted/declined. On accept, bidirectional friend docs are created.

```typescript
interface FriendRequestDoc {
  id: string;
  fromUserId: string;
  fromUserName: string; // denormalized for notification display
  fromUserAvatarUrl: string | null;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: FirebaseFirestore.Timestamp;
  respondedAt: FirebaseFirestore.Timestamp | null;
}
```

**Reads:** CommunityFriendsTab (incoming requests badge), notification triggers
**Writes:** `sendFriendRequest` CF (create), `acceptFriendRequest` / `declineFriendRequest` CF (update)
**Query:** `toUserId == uid AND status == 'pending'` (incoming requests)

---

## `users/{userId}/friends/{friendId}`

Bidirectional — when A and B become friends, two docs are created: `users/A/friends/B` and `users/B/friends/A`.

```typescript
interface FriendDoc {
  friendId: string; // same as document ID
  friendName: string; // denormalized
  friendAvatarUrl: string | null; // denormalized
  addedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** CommunityFriendsTab (friend list), feed filtering, leaderboard filtering
**Writes:** `acceptFriendRequest` CF (create both), `removeFriend` CF (delete both)
**Query:** All friends for a user (list), check if specific user is a friend (doc get)

---

## `users/{userId}/tickets/{ticketId}`

Wallet passes and tickets. Migrated from WalletContext/SecureStore.

```typescript
interface TicketDoc {
  id: string;
  parkName: string;
  parkChain: 'disney' | 'universal' | 'cedar-fair' | 'six-flags' | 'seaworld' | 'other';
  passType: 'annual' | 'season' | 'day' | 'express' | 'event' | 'membership';
  passholder: string; // name on the pass
  validFrom: string; // ISO 8601
  validUntil: string; // ISO 8601
  qrData: string | null; // barcode payload (encrypted at rest)
  qrFormat: 'QR_CODE' | 'AZTEC' | 'PDF417' | 'CODE_128' | 'IMAGE_ONLY' | null;
  status: 'active' | 'expired' | 'used';
  isFavorite: boolean;
  isDefault: boolean;
  notes: string | null;

  // Images (Firebase Storage URLs)
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  originalPhotoUrl: string | null;

  // Apple Wallet
  appleWalletAdded: boolean;
  appleWalletSerial: string | null;

  // Timestamps
  addedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastUsedAt: FirebaseFirestore.Timestamp | null;
}
```

**Reads:** WalletCardStack, PassDetailView, GateModeOverlay, QuickActionsMenu
**Writes:** AddTicketFlow (create), PassDetailView (edit), `refreshTicketStatuses` scheduled CF
**Query:** All tickets for a user, ordered by `isDefault` desc then `addedAt` desc

---

## `users/{userId}/blockedUsers/{blockedUid}`

```typescript
interface BlockedUserDoc {
  blockedUid: string; // same as document ID
  blockedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** Security rules (filter blocked users from feeds/search), BlockedUsersScreen
**Writes:** BlockedUsersScreen (add/remove)

---

## `users/{userId}/savedArticles/{articleId}`

```typescript
interface SavedArticleDoc {
  articleId: string; // same as document ID
  savedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** SavedArticlesScreen, HomeScreen (bookmark icon state)
**Writes:** HomeScreen (toggle save), SavedArticlesScreen (unsave)

---

## `users/{userId}/feedPreferences` (single document)

Path: `users/{userId}/feedPreferences/prefs`

```typescript
interface FeedPreferencesDoc {
  thumbsUp: string[]; // article IDs the user liked
  thumbsDown: string[]; // article IDs the user disliked
  removed: string[]; // article IDs the user dismissed
  defaultFeedView: 'community' | 'friends';
}
```

**Reads:** HomeScreen (news feed curation), CommunityFeedTab (default toggle)
**Writes:** HomeScreen (thumbs up/down/remove), SettingsScreen (default view)

---

## `parkWaitTimes/{parkSlug}`

Server-side cache of Queue-Times API responses. Refreshed every 5-10 minutes by Cloud Function or on-demand.

```typescript
interface ParkWaitTimesDoc {
  parkSlug: string; // same as document ID
  rides: Array<{
    id: string; // Queue-Times ride ID
    name: string;
    waitMinutes: number; // -1 for closed
    status: 'open' | 'closed' | 'temporarily-closed' | 'weather-delay';
    lastUpdated: FirebaseFirestore.Timestamp;
  }>;
  lastFetched: FirebaseFirestore.Timestamp;
  source: 'queue-times' | 'mock';
}
```

**Reads:** ParkDetailScreen (wait times tab)
**Writes:** `proxyWaitTimes` CF only (client never writes)
**TTL:** 5-minute cache. Client checks `lastFetched` — if stale, calls `proxyWaitTimes` CF.
