# Data Stores -- v1 Backend Audit (Cross-Cutting)

## Current Store Inventory

TrackR has 7 data stores. None persist to a remote backend. Data loss ranges from "every restart" to "never (local only)."

| Store | Pattern | Persistence | Resets on restart? |
|-------|---------|-------------|-------------------|
| rideLogStore | Module-level state + subscriptions | None (in-memory) | Yes |
| settingsStore | Module-level state + AsyncStorage | AsyncStorage `@app_settings` | No |
| WalletContext | React Context + expo-secure-store | Encrypted local (SecureStore) | No |
| savedArticlesStore | Module-level state (Set of IDs) | None (in-memory) | Yes |
| communityStore | Module-level state + actions | None (in-memory) | Yes |
| friendsStore | Module-level read-only | None (in-memory, mock) | Yes |
| rankingsStore | Module-level read-only | None (in-memory, mock) | Yes |

### Store Details

**rideLogStore** (`src/stores/rideLogStore.ts`)
- State: `logs: RideLog[]`, `ratings: Record<string, CoasterRating>`, `creditCount`, `totalRideCount`, `criteriaConfig`
- Actions: `addQuickLog`, `upsertCoasterRating`, `deleteLog`, `updateLogTimestamp`, `updateCriteriaConfig`
- Subscribers: HomeScreen, LogbookScreen, LogConfirmSheet, RatingSheet, ActivityScreen, ProfileScreen
- **Critical gap:** This is the heart of the app and has ZERO persistence. Every ride log and rating is lost on restart.

**settingsStore** (`src/stores/settingsStore.ts`)
- State: `hapticsEnabled`, `notificationsEnabled`, `hasCompletedOnboarding`, `riderType`, `homeParkName`, `displayName`, `username`, `profileImageUri`, `unitSystem`, `activityVisibility`
- Loads from AsyncStorage on init, saves on every mutation
- Only store with cross-session persistence today

**WalletContext** (`src/contexts/WalletContext.tsx`)
- State: `tickets: Ticket[]`, `defaultTicketId`, `filterPreferences`
- Backed by `WalletStorage` service using expo-secure-store + expo-file-system
- Images stored locally in `wallet/` directory
- Most mature storage layer (encrypted, file-backed, offline-capable)

**savedArticlesStore** (`src/stores/savedArticlesStore.ts`)
- State: `savedIds: Set<string>` referencing MOCK_NEWS articles
- No persistence. Bookmarked articles lost on restart.

**communityStore** (`src/stores/communityStore.ts`)
- State: Feed items array, like/comment counts
- Actions: `toggleLike`, `addComment`, `createReviewPost`, etc.
- Initializes from `MOCK_FEED_EXTENDED`. All new posts/comments lost on restart.

**friendsStore** / **rankingsStore** — Read-only wrappers around mock data. No actions.

## Migration Plan: Current → Firestore

### Phase 1: M1 (Foundation)

| Store | Migration | Priority |
|-------|-----------|----------|
| rideLogStore.logs | → `rideLogs/{userId}/logs/{logId}` | P0 (core loop) |
| rideLogStore.ratings | → `ratings/{userId}/{coasterId}` | P0 (core loop) |
| rideLogStore.criteriaConfig | → `users/{userId}/criteriaConfig` | P1 |
| rideLogStore.creditCount/totalRideCount | → `rideLogs/{userId}/meta` (Cloud Function computed) | P0 |
| settingsStore (profile fields) | → `users/{userId}` doc | P0 |
| settingsStore (local prefs) | Keep in AsyncStorage (haptics, unit system) | N/A |

### Phase 2: M2 (Core Features)

| Store | Migration | Priority |
|-------|-----------|----------|
| communityStore | → `posts/{postId}` + subcollections | P1 |
| friendsStore | → `users/{userId}/friends` + `friendRequests` | P1 |
| rankingsStore | → `rankings/{category}` (Cloud Function aggregated) | P1 |
| savedArticlesStore | → `users/{userId}/savedArticles` | P2 |
| WalletContext | → `users/{userId}/tickets` (Firestore) + Firebase Storage (images) | P1 |

### Migration Strategy

1. **Dual-write pattern:** On auth, the app writes to both local store AND Firestore. Local store remains the read source until Firestore listeners are stable.
2. **Local-first for anonymous users:** Users who skip auth continue using local stores. When they later sign up, a `migrateLocalData` Cloud Function uploads everything.
3. **Offline support:** Firestore offline persistence handles connectivity gaps. Local stores become a cache layer, not the source of truth.
4. **settingsStore split:** Profile-visible fields (displayName, username, avatar, homePark) go to Firestore. Device-local preferences (haptics, unitSystem) stay in AsyncStorage.

## Unified Firestore Schema (from all audit docs)

### Top-Level Collections

| Collection | Purpose | Source Audit |
|------------|---------|-------------|
| `users/{userId}` | User profile, preferences, metadata | profile, settings, onboarding |
| `rideLogs/{userId}/logs/{logId}` | Individual ride log entries | logging-flow, logbook |
| `rideLogs/{userId}/meta` | Denormalized counters (credits, rides) | logging-flow, logbook |
| `ratings/{userId}/{coasterId}` | Per-coaster weighted ratings | rating-system |
| `posts/{postId}` | Community feed posts | community-feed |
| `posts/{postId}/comments/{commentId}` | Comment threads | community-feed |
| `rankings/{category}` | Aggregated community rankings | community-rankings |
| `friendRequests/{requestId}` | Friend request state | community-friends |
| `usernames/{username}` | Username uniqueness enforcement | settings |

### Subcollections Under `users/{userId}`

| Subcollection | Purpose | Source Audit |
|---------------|---------|-------------|
| `friends/{friendId}` | Bidirectional friend links | community-friends |
| `tickets/{ticketId}` | Wallet passes/tickets | wallet |
| `blockedUsers/{blockedUid}` | Block list | settings |
| `savedArticles/{articleId}` | Bookmarked news articles | home-screen, profile |
| `activity/{activityId}` | Activity timeline (optional) | community-friends |
| `gameStats/{gameId}` | Game scores/streaks (optional) | community-games |
| `challenges/{challengeId}` | Weekly challenge progress (optional) | community-games |
| `criteriaConfig` (single doc) | Rating criteria weights | rating-system |
| `feedPreferences` (single doc) | Thumbs up/down, removed articles | home-screen |

## Open Questions

1. **Offline-first architecture:** Should Firestore offline persistence be the primary cache, or maintain separate AsyncStorage/SecureStore layers?
2. **Anonymous → authenticated migration:** The `migrateLocalData` Cloud Function needs to handle ride logs, ratings, criteria config, wallet tickets, and settings. Estimated complexity: medium-high.
3. **Real-time listeners vs polling:** Which collections need real-time listeners (Firestore `onSnapshot`) vs one-time reads? Candidates for real-time: friend activity, wait times, community feed.
4. **Store refactor:** Should module-level stores (rideLogStore, communityStore) be refactored to Firestore-backed hooks, or keep the subscription pattern and wire Firestore underneath?
