# Cloud Functions — Complete Specification

All 39 Cloud Functions organized by milestone. Each includes trigger type, input/output types, core logic, and side effects.

Runtime: Node.js 20 + TypeScript. Deploy via `firebase deploy --only functions`.

---

## M1: Authentication & Core Persistence (17 functions)

### `generateProfileReady`
- **Trigger:** `functions.auth.user().onCreate()`
- **Input:** Firebase Auth user record (uid, email, displayName, photoURL, provider)
- **Logic:**
  1. Create `users/{uid}` doc with defaults from auth record
  2. Set `proStatus.active = false`, empty `fcmTokens`, default preferences
  3. If onboarding data passed via custom claims or callable: set homeParkName, riderType
- **Output:** Created user doc
- **Side effects:** None

### `validateUsername`
- **Trigger:** Callable
- **Input:** `{ username: string }`
- **Logic:**
  1. Normalize: lowercase, trim
  2. Validate format: 3-20 chars, alphanumeric + underscores only
  3. Check reserved words list (admin, trackr, support, etc.)
  4. Transaction: check `usernames/{username}` exists → if not, create it + update `users/{uid}.username`
  5. If user had a previous username, delete old `usernames/{oldUsername}` doc
- **Output:** `{ available: boolean, error?: string }`
- **Side effects:** Creates/deletes username reservation docs

### `deleteUserAccount`
- **Trigger:** Callable (authenticated)
- **Input:** `{ confirmation: 'DELETE' }` (safety check)
- **Logic:**
  1. Delete all subcollections: rideLogs, ratings, friends, tickets, badges, gameStats, challenges
  2. Delete username reservation: `usernames/{username}`
  3. Delete all posts authored by user
  4. Delete Firebase Storage files (avatar, ticket images)
  5. Remove user from all friends' friend lists
  6. Delete pending friend requests (from and to)
  7. Delete `users/{uid}` doc
  8. Delete Firebase Auth account
- **Output:** `{ success: boolean }`
- **Side effects:** Cascading deletes across all collections. Must be idempotent.

### `migrateLocalData`
- **Trigger:** Callable (authenticated, first-time auth)
- **Input:** `{ rideLogs: RideLogDoc[], ratings: RatingDoc[], tickets: TicketDoc[], criteriaConfig: CriteriaConfigDoc, settings: Partial<UserDoc> }`
- **Logic:**
  1. Batch write all ride logs to `rideLogs/{uid}/logs`
  2. Batch write all ratings to `ratings/{uid}/{coasterId}`
  3. Batch write tickets to `users/{uid}/tickets`
  4. Write criteria config
  5. Merge settings into `users/{uid}` (don't overwrite server-set fields)
  6. Recompute meta counters
- **Output:** `{ migrated: { logs: number, ratings: number, tickets: number } }`
- **Side effects:** Triggers `onRideLogCreate` for each log (use batch to avoid N trigger invocations — or suppress triggers during migration)

### `onRideLogCreate`
- **Trigger:** Firestore `onCreate` on `rideLogs/{userId}/logs/{logId}`
- **Logic:**
  1. Increment `rideLogs/{userId}/meta.totalRideCount`
  2. Check if this is the first log for this `coasterId` → if yes, increment `meta.creditCount`
  3. Update `meta.lastLogAt`
  4. Sync denormalized counts to `users/{userId}.totalCredits` and `users/{userId}.totalRides`
  5. Check badge criteria (`awardBadges` internal call)
- **Side effects:** Meta doc update, user doc update, possible badge award

### `onRideLogDelete`
- **Trigger:** Firestore `onDelete` on `rideLogs/{userId}/logs/{logId}`
- **Logic:**
  1. Decrement `rideLogs/{userId}/meta.totalRideCount`
  2. Check if any other logs exist for this `coasterId` → if none, decrement `meta.creditCount`
  3. Sync denormalized counts to `users/{userId}`
- **Side effects:** Meta doc update, user doc update, possible badge revocation

### `onRideLogUpdate`
- **Trigger:** Firestore `onUpdate` on `rideLogs/{userId}/logs/{logId}`
- **Logic:**
  1. If timestamp changed across calendar days: recompute `rideCount` (within-day sequence) for affected days
  2. Update `meta.lastLogAt` if this is now the most recent log
- **Side effects:** Possible rideCount recalculation on sibling logs

### `onRatingWrite`
- **Trigger:** Firestore `onCreate` / `onUpdate` on `ratings/{userId}/{coasterId}`
- **Logic:**
  1. Recalculate global average for this coaster across all users
  2. Update relevant `rankings/{category}` entries (or mark for next scheduled recomputation)
  3. Check badge criteria (rate-fifty, first-rating, etc.)
- **Side effects:** Rankings update, possible badge award

---

## M2: Community & Features (17 functions)

### `createPost`
- **Trigger:** Callable
- **Input:** `{ type, content, visibility, coasterRef?, parkRef?, items? }`
- **Logic:**
  1. Validate content (non-empty, within length limits)
  2. Denormalize author info (name, avatar) from `users/{uid}`
  3. Apply visibility: if user's account is private, force `visibility: 'friends-only'`
  4. Write to `posts/{postId}`
  5. Send notifications to relevant users (friends if friends-only, nobody if public — they discover it in feed)
- **Output:** `{ postId, createdAt }`

### `toggleLike`
- **Trigger:** Callable
- **Input:** `{ postId, commentId?: string }`
- **Logic (transaction):**
  1. Read post (or comment) doc
  2. If uid in `likedBy` → remove, decrement `likeCount`
  3. If uid not in `likedBy` → add, increment `likeCount`
  4. If like (not unlike) and threshold reached: send notification to author
- **Output:** `{ liked: boolean, newCount: number }`

### `addComment`
- **Trigger:** Callable
- **Input:** `{ postId, text }`
- **Logic:**
  1. Validate text (non-empty, within length limits)
  2. Denormalize author info
  3. Write to `posts/{postId}/comments/{commentId}`
  4. Increment `posts/{postId}.commentCount`
  5. Send push notification to post author
- **Output:** `{ commentId, createdAt }`

### `sendFriendRequest`
- **Trigger:** Callable
- **Input:** `{ toUserId: string }`
- **Logic:**
  1. Check not already friends, not already pending, not blocked
  2. Denormalize sender info (name, avatar)
  3. Create `friendRequests/{requestId}` with status 'pending'
  4. Send push notification to recipient
- **Output:** `{ requestId }`

### `acceptFriendRequest`
- **Trigger:** Callable
- **Input:** `{ requestId: string }`
- **Logic (transaction):**
  1. Verify request exists, status is 'pending', toUserId matches caller
  2. Update request status to 'accepted', set `respondedAt`
  3. Create `users/{fromUserId}/friends/{toUserId}` doc
  4. Create `users/{toUserId}/friends/{fromUserId}` doc
  5. Send push notification to requester
- **Output:** `{ success: boolean }`

### `declineFriendRequest`
- **Trigger:** Callable
- **Input:** `{ requestId: string }`
- **Logic:**
  1. Verify request exists, status is 'pending', toUserId matches caller
  2. Update status to 'declined', set `respondedAt`
- **Output:** `{ success: boolean }`

### `removeFriend`
- **Trigger:** Callable
- **Input:** `{ friendId: string }`
- **Logic (transaction):**
  1. Delete `users/{uid}/friends/{friendId}`
  2. Delete `users/{friendId}/friends/{uid}`
- **Output:** `{ success: boolean }`

### `searchUsers`
- **Trigger:** Callable
- **Input:** `{ query: string, limit?: number }`
- **Logic:**
  1. Pre-Algolia: Firestore prefix query on `users` where `username >= query` and `username < query + '\uf8ff'`
  2. Post-Algolia: forward to Algolia index
  3. Filter out blocked users
  4. Return limited profile info (name, avatar, creditCount, homePark)
- **Output:** `{ users: UserSummary[] }`

### `getFeed`
- **Trigger:** Callable
- **Input:** `{ view: 'community' | 'friends', cursor?: string, limit?: number }`
- **Logic:**
  1. Community: query `posts` where `visibility == 'public'`, ordered by `createdAt` desc
  2. Friends: get friend IDs from `users/{uid}/friends`, query `posts` where `authorId in friendIds`
  3. Filter out posts from blocked users
  4. Paginate with cursor
- **Output:** `{ posts: PostDoc[], nextCursor: string | null }`
- **Note:** Firestore `in` queries limited to 30 values. For users with 30+ friends, batch queries or use a fan-out approach.

### `getFriendActivity`
- **Trigger:** Callable
- **Input:** `{ limit?: number, cursor?: string }`
- **Logic:**
  1. Get friend IDs
  2. Query recent ride logs from friends (merge across friend subcollections)
  3. Query recent posts from friends
  4. Merge, sort by timestamp, paginate
- **Output:** `{ activities: ActivityItem[], nextCursor: string | null }`

### `computeRankings`
- **Trigger:** Scheduled (daily at 3am PT)
- **Logic:**
  1. For each of 6 categories × 3 time windows:
  2. Aggregate all `ratings/{userId}/{coasterId}` docs
  3. Compute average weighted score per coaster
  4. Sort, assign ranks, compute rankChange vs previous
  5. Write to `rankings/{category}_{timeWindow}`
- **Output:** 18 updated ranking docs
- **Cost note:** Reads every rating doc. At 10k users × 50 ratings = 500k reads. Optimize with collection group queries + pagination.

### `getRankings`
- **Trigger:** Callable
- **Input:** `{ category, timeWindow, limit? }`
- **Logic:** Direct doc read of `rankings/{category}_{timeWindow}`, slice entries to limit
- **Output:** `{ entries: RankingEntry[], lastComputed }`

### `proxyWaitTimes`
- **Trigger:** Callable
- **Input:** `{ parkSlug: string }`
- **Logic:**
  1. Check `parkWaitTimes/{parkSlug}.lastFetched` — if <5 min ago, return cached
  2. Call Queue-Times API with server-side API key
  3. Map response to our ride format
  4. Write to `parkWaitTimes/{parkSlug}`
  5. Return fresh data
- **Output:** `{ rides: WaitTimeRide[], lastFetched, source }`

### `registerFCMToken`
- **Trigger:** Callable
- **Input:** `{ token: string }`
- **Logic:** Add token to `users/{uid}.fcmTokens` array (if not already present)
- **Output:** Void

### `sendNotification` (internal helper, not callable)
- **Input:** `{ userId: string, title: string, body: string, data?: Record<string, string> }`
- **Logic:**
  1. Read `users/{userId}.fcmTokens`
  2. Check `users/{userId}.notificationsEnabled`
  3. Send FCM message to all registered tokens
  4. Remove any tokens that fail with 'not-registered' error
- **Output:** Void

### `exportRideLog`
- **Trigger:** Callable
- **Input:** `{ format: 'csv' | 'json', dateRange?: { from: string, to: string } }`
- **Logic:**
  1. Query all `rideLogs/{uid}/logs`, optionally filtered by date
  2. Join with ratings data
  3. Format as CSV or JSON
  4. Upload to Firebase Storage with expiring URL (24h)
- **Output:** `{ downloadUrl: string, count: number }`

### `getTrendingCoasters`
- **Trigger:** Callable (or scheduled daily)
- **Logic:** Aggregate ride logs from past 7 days across all users, count by coasterId, return top N
- **Output:** `{ coasters: Array<{ coasterId, coasterName, parkName, count, trend }> }`

---

## M3: Premium (5 functions)

### `verifyPurchase`
- **Trigger:** Callable
- **Input:** `{ receipt: string, productId: string }`
- **Logic:**
  1. Validate receipt with Apple's verifyReceipt endpoint
  2. Check receipt is for this app's bundle ID
  3. Create `purchases/{purchaseId}` doc
  4. Update `users/{uid}.proStatus` (active: true, tier, expiresAt)
  5. Send "Welcome to TrackR Pro!" push notification
  6. If first-ever Pro subscription: queue free NanoBanana card fulfillment
- **Output:** `{ verified: boolean, proStatus: ProStatus }`

### `handleSubscriptionEvent`
- **Trigger:** HTTPS endpoint (Apple Server-to-Server webhook)
- **Input:** Apple notification payload (renewal, cancellation, refund, etc.)
- **Logic:**
  1. Verify notification authenticity (signed JWT from Apple)
  2. Find matching purchase by `originalTransactionId`
  3. Update `purchases/{purchaseId}.status`
  4. Update `users/{uid}.proStatus.active` and `expiresAt`
  5. On cancellation: set `proStatus.active = false` at period end
  6. On refund: immediately set `proStatus.active = false`
- **Output:** HTTP 200 (Apple expects acknowledgment)

### `generatePKPass`
- **Trigger:** Callable
- **Input:** `{ ticketId: string, style: 'clean' | 'nanobanana' | 'park-color' | 'dark' | 'light' }`
- **Logic:**
  1. Read `users/{uid}/tickets/{ticketId}`
  2. Build pass.json (PKPass schema — generic pass type)
  3. Fetch strip/logo images based on style from Storage
  4. Create manifest.json with SHA1 hashes of all files
  5. Sign with Pass Type ID certificate (.p12) + WWDR intermediate cert
  6. ZIP into .pkpass bundle
  7. Upload to Storage, create `appleWalletPasses/{serialNumber}` doc
  8. Return download URL
- **Output:** `{ passUrl: string, serialNumber: string }`
- **Dependencies:** `passkit-generator` npm package, Pass Type ID cert in Cloud Function env

### `appleWalletWebService`
- **Trigger:** HTTPS (Express router)
- **Endpoints:** 5 REST endpoints per Apple's PassKit Web Service spec
- **Logic:** Standard implementation — register/unregister devices, list updated passes, serve latest pass, accept logs
- **Auth:** Token-based (authenticationToken from pass.json)

### `getWeeklyChallenge`
- **Trigger:** Callable
- **Input:** None
- **Logic:**
  1. Read current challenge definition (from admin-managed Firestore doc or hardcoded rotation)
  2. Read `users/{uid}/challenges/{challengeId}` for progress
  3. Return combined definition + progress
- **Output:** `{ challenge: ChallengeDefinition, progress: ChallengeProgressDoc | null }`

### `submitGameScore`
- **Trigger:** Callable
- **Input:** `{ gameId: string, score: number, details?: Record<string, any> }`
- **Logic:**
  1. Update `users/{uid}/gameStats/{gameId}` (highScore, gamesPlayed, streak, append to history)
  2. Check if new high score → update leaderboard
  3. Check badge criteria
  4. Check challenge progress (if active challenge involves games)
- **Output:** `{ newHighScore: boolean, leaderboardRank?: number }`

### `awardBadges` (internal, called by other functions)
- **Input:** `{ userId: string, event: 'ride-logged' | 'rating-created' | 'game-completed' | ... }`
- **Logic:**
  1. Read user's current badge state
  2. Check all badge criteria against current stats
  3. For any newly earned badges: create `users/{uid}/badges/{badgeId}`
  4. Send push notification for each new badge
- **Output:** `{ awarded: string[] }` (badge IDs)
