# Community Feed & Posting -- v1 Backend Audit

## Decisions Made (2026-03-11)

- **Per-post visibility:** Each post can be public or friends-only, chosen at post time.
- **Account-level privacy setting:** Public or Private master switch in Settings.
  - **Private accounts:** All posts auto-default to friends-only. No modal, no friction. Silent observers — can browse community feed, like and comment on public posts, but their own posts never appear in the community feed.
  - **Public accounts:** Posting shows a confirmation modal ("visible to everyone") with option to switch to friends-only per-post.
- **Feed has two views** with a toggle: Community (public posts from all users) and Friends (friends' posts only). User picks default view in Settings.
- **Feed algorithm:** Chronological for v1. Algorithmic ranking comes later.
- **Content moderation:** No automated system for v1. Report button on every post. Reports handled via Firebase console. Written moderation policy prepared for Apple review. Admin web dashboard for moderation comes in v1.1.
- **Image attachments:** Not decided for v1 — still an open question.

---

## Screens/Components Covered
- CommunityScreen.tsx (L1-270) -- Main container, tab system, routing
- CommunityTopBar.tsx (L1-174) -- Tab buttons with animated underline
- CommunityFeedTab.tsx (L1-155) -- Feed list with FAB
- FeedPost.tsx (L1-481) -- Interactive feed card (like, comment, expand)
- PostDetailScreen.tsx (L1-613) -- Full post + comment thread + input
- ComposeSheet.tsx (L1-319) -- Bottom sheet: type picker + compose form
- ComposeReview.tsx (L1-133) -- Review compose form
- ComposeTripReport.tsx (L1-183) -- Trip report compose form
- ComposeRankedList.tsx (L1-217) -- Ranked list compose form
- ComposeBucketList.tsx (L1-185) -- Bucket list compose form
- FAB.tsx (L1-64) -- Floating action button
- communityStore.ts -- Module-level feed state + actions
- types/community.ts -- All feed/post/comment type definitions

## Current Data Sources
- Feed items: `MOCK_FEED_EXTENDED` from `data/mockFeedData.ts` (9 hardcoded items)
- Feed state: `communityStore.ts` (in-memory, module-level, resets on app restart)
- Compose actions: `createReviewPost()`, `createTripReportPost()`, `createRankedListPost()`, `createBucketListPost()` -- all push to in-memory array
- Like/comment actions: `toggleLike()`, `addComment()`, `toggleCommentLike()` -- in-memory mutations
- Author data: hardcoded in mock objects, no user lookup
- Coaster/park search in compose: `ItemSearchInput` component (local index)

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Tab buttons (feed/friends/rankings/play) | CommunityTopBar L100-118 | Switches tab, animates underline | Same (client-side) | None |
| 2 | Back button | CommunityScreen L101-118 | Navigates back | Same | None |
| 3 | FAB (compose) | CommunityFeedTab L133, FAB.tsx | Opens ComposeSheet | Same | None |
| 4 | Feed item like button | FeedPost L287 | Toggles like in communityStore | Persist to Firestore, update count | Write: posts/{postId}/likes |
| 5 | Feed item double-tap like | FeedPost L211-224 | Triggers HeartBurst + toggleLike | Same + persist | Write: posts/{postId}/likes |
| 6 | Feed item comment button | FeedPost L297 | Navigates to PostDetailScreen | Same | None (nav only) |
| 7 | Feed "more" text expand | FeedPost L226-229 | Expands truncated text | Same (client-side) | None |
| 8 | Feed author avatar/name tap | FeedPost L272 | Opens ProfileView | Same | Read: users/{authorId} |
| 9 | Feed coaster name tap | FeedPost L300-400 | Opens RideActionSheet | Same | None |
| 10 | PostDetail back button | PostDetailScreen L249-257 | Navigates back | Same | None |
| 11 | PostDetail like button | PostDetailScreen L286 | Toggles like | Persist | Write: posts/{postId}/likes |
| 12 | PostDetail comment like | PostDetailScreen L99-117 | Toggles comment like in store | Persist | Write: posts/{postId}/comments/{cId}/likes |
| 13 | PostDetail comment input | PostDetailScreen L317-326 | TextInput + send button | Persist comment | Write: posts/{postId}/comments |
| 14 | PostDetail send button | PostDetailScreen L327-337 | Calls addComment() in store | Persist to Firestore | Write: posts/{postId}/comments |
| 15 | ComposeSheet type card (Review) | ComposeSheet L202-209 | Shows ComposeReview form | Same | None |
| 16 | ComposeSheet type card (Trip) | ComposeSheet L202-209 | Shows ComposeTripReport form | Same | None |
| 17 | ComposeSheet type card (List) | ComposeSheet L202-209 | Shows ComposeRankedList form | Same | None |
| 18 | ComposeSheet type card (Bucket) | ComposeSheet L202-209 | Shows ComposeBucketList form | Same | None |
| 19 | ComposeSheet back button | ComposeSheet L183 | Returns to type picker step | Same | None |
| 20 | ComposeSheet close button | ComposeSheet L190 | Closes sheet | Same | None |
| 21 | ComposeSheet pan-to-dismiss | ComposeSheet L101-129 | Drag down to close | Same | None |
| 22 | ComposeSheet backdrop tap | ComposeSheet L162 | Closes sheet | Same | None |
| 23 | ComposeReview: coaster search | ComposeReview L53-62 | ItemSearchInput (local index) | Same (local search) | None |
| 24 | ComposeReview: star rating | ComposeReview L68 | StarRatingInput (1-5) | Same | None |
| 25 | ComposeReview: Post button | ComposeReview L81-87 | createReviewPost() to store | Write to Firestore + close | Write: posts/{newId} |
| 26 | ComposeTripReport: park search | ComposeTripReport ~L63 | ItemSearchInput | Same | None |
| 27 | ComposeTripReport: ride count +/- | ComposeTripReport L77-90 | Stepper increment/decrement | Same (local state) | None |
| 28 | ComposeTripReport: Post button | ComposeTripReport ~L170 | createTripReportPost() | Write to Firestore | Write: posts/{newId} |
| 29 | ComposeRankedList: emoji presets | ComposeRankedList L83-92 | 16 emoji buttons set list icon | Same (local state) | None |
| 30 | ComposeRankedList: coaster search | ComposeRankedList ~L95 | ItemSearchInput, adds to list | Same | None |
| 31 | ComposeRankedList: move-up button | ComposeRankedList L107 | Reorders item in list | Same (local state) | None |
| 32 | ComposeRankedList: remove button | ComposeRankedList L112 | Removes item from list | Same (local state) | None |
| 33 | ComposeRankedList: Post button | ComposeRankedList ~L200 | createRankedListPost() | Write to Firestore | Write: posts/{newId} |
| 34 | ComposeBucketList: item search | ComposeBucketList ~L75 | ItemSearchInput (mixed coaster/park) | Same | None |
| 35 | ComposeBucketList: remove button | ComposeBucketList L99 | Removes item | Same (local state) | None |
| 36 | ComposeBucketList: Post button | ComposeBucketList ~L170 | createBucketListPost() | Write to Firestore | Write: posts/{newId} |
| 37 | GamesStrip in feed header | CommunityFeedTab ~L80 | Game navigation buttons | Same (nav only) | None |
| 38 | Route-based postId deep link | CommunityScreen ~L52-70 | Opens PostDetail for postId | Same, fetch post from Firestore | Read: posts/{postId} |

## Firestore Collections Required
- `posts/{postId}` -- { type, authorId, content, coasterRef, parkRef, items[], likes: number, likedBy: [], createdAt, ... }
- `posts/{postId}/comments/{commentId}` -- { authorId, text, likes, likedBy: [], createdAt }
- `users/{userId}` -- { displayName, avatar, creditCount, ... } (for author resolution)

## Cloud Function Requirements
- `getFeed` -- Paginated feed query: friends' posts + popular posts, sorted by recency/engagement
- `createPost` -- Validates post data, writes to Firestore, triggers notifications to followers
- `toggleLike` -- Atomic like/unlike on post or comment (transaction for count consistency)
- `addComment` -- Writes comment subcollection doc, increments post comment count

## Open Questions
- Feed algorithm: chronological, engagement-weighted, or friends-first?
- Should posts be global (all users see all) or scoped to friends + following?
- Content moderation: any review before posts appear in feed?
- Image attachments: trip reports and reviews currently have no photo upload -- is that v1?
- Should compose forms validate minimum content before enabling Post button?
- Deep link format for postId -- what URL scheme for sharing posts externally?
