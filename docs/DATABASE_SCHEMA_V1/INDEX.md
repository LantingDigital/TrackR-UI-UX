# TrackR v1 — Database Schema

Definitive implementation guide for the Firestore backend. Built from 20 audit docs + Q&A decisions (2026-03-11/12).

## Architecture Decisions (Locked)

- **Offline-first** — Firestore persistence enabled, app works without internet
- **@react-native-firebase (native SDK)** — more reliable auth, better offline support
- **Zustand** — replaces module-level stores, migrated in M1 before Firestore wiring
- **Algolia** — universal search (coasters, users, wallet), wired before TestFlight
- **Mutual friends** — request → accept → friends. No follow system.
- **PWYW Pro** — $2/$3/$4 displayed ($1.99/$2.99/$3.99 actual Apple IAP tiers)
- Full decision log: `memory/trackr-v1-decisions.md`

---

## Collection Map

### M1: Foundation (Due March 30)

| Path | Type | Purpose |
|------|------|---------|
| `users/{userId}` | Document | Profile, preferences, FCM tokens, pro status |
| `usernames/{username}` | Document | Username uniqueness (stores owning uid) |
| `rideLogs/{userId}/logs/{logId}` | Subcollection | Individual ride log entries |
| `rideLogs/{userId}/meta` | Single doc | Denormalized counters (credits, total rides) |
| `ratings/{userId}/{coasterId}` | Subcollection | Per-coaster weighted ratings |
| `users/{userId}/criteriaConfig` | Single doc | Custom rating criteria weights |

### M2: Core Features (Due April 13)

| Path | Type | Purpose |
|------|------|---------|
| `posts/{postId}` | Document | Community feed posts (4 types) |
| `posts/{postId}/comments/{commentId}` | Subcollection | Comment threads |
| `rankings/{category}` | Document | Aggregated rankings (6 categories) |
| `friendRequests/{requestId}` | Document | Friend request state machine |
| `users/{userId}/friends/{friendId}` | Subcollection | Bidirectional friend links |
| `users/{userId}/tickets/{ticketId}` | Subcollection | Wallet passes/tickets |
| `users/{userId}/blockedUsers/{blockedUid}` | Subcollection | Block list |
| `users/{userId}/savedArticles/{articleId}` | Subcollection | Bookmarked articles |
| `users/{userId}/feedPreferences` | Single doc | Thumbs up/down, removed articles |
| `parkWaitTimes/{parkSlug}` | Document | Cached Queue-Times API responses |

### M3: Premium (Due April 27)

| Path | Type | Purpose |
|------|------|---------|
| `purchases/{purchaseId}` | Document | IAP receipt records |
| `appleWalletPasses/{serialNumber}` | Document | Pass metadata for web service |
| `appleWalletRegistrations/{regId}` | Document | Device-to-pass registration |
| `users/{userId}/gameStats/{gameId}` | Subcollection | Game scores/streaks |
| `users/{userId}/challenges/{challengeId}` | Subcollection | Weekly challenge progress |
| `users/{userId}/badges/{badgeId}` | Subcollection | Achievement badges |

**Total: 8 top-level collections + 10 subcollections + 4 single docs = 22 paths**

---

## Files in This Directory

| File | Contents |
|------|----------|
| [collections-m1.md](collections-m1.md) | M1 TypeScript interfaces + field documentation |
| [collections-m2.md](collections-m2.md) | M2 TypeScript interfaces + field documentation |
| [collections-m3.md](collections-m3.md) | M3 TypeScript interfaces + field documentation |
| [cloud-functions.md](cloud-functions.md) | All 39 Cloud Functions — triggers, I/O, logic |
| [security-rules.md](security-rules.md) | Complete Firestore security rules |
| [indexes.md](indexes.md) | Composite indexes + query patterns |

---

## Implementation Order

### Sprint 1: Zustand + Firebase Setup (M1 week 1)
1. Install Zustand, migrate all 7 stores (same API surface, new backing)
2. Create Firebase production project, install `@react-native-firebase/*`
3. Enable Auth providers (Apple, Google, Email)
4. Verify all screens work with Zustand stores

### Sprint 2: Auth + User Docs (M1 week 1-2)
1. Wire onboarding auth flow (Apple, Google, Email sign-up)
2. Deploy `generateProfileReady` + `validateUsername` Cloud Functions
3. Wire sign-in detection (`onAuthStateChanged` → skip onboarding)
4. Wire sign-out, password reset, account deletion
5. Implement `migrateLocalData` for anonymous → authenticated

### Sprint 3: Core Persistence (M1 week 2-3)
1. Wire ride logs → `rideLogs/{userId}/logs`
2. Deploy `onRideLogCreate` / `onRideLogDelete` / `onRideLogUpdate` triggers
3. Wire ratings → `ratings/{userId}/{coasterId}`
4. Deploy `onRatingWrite` trigger
5. Wire profile/settings → `users/{userId}`
6. Wire criteria config → single doc subcollection

### Sprint 4: Community + Social (M2 week 3-4)
1. Wire posts → `posts/{postId}` with visibility model
2. Deploy `createPost`, `toggleLike`, `addComment`
3. Wire friend system → `friendRequests` + `users/{uid}/friends`
4. Deploy friend request Cloud Functions
5. Wire feed (community + friends toggle)

### Sprint 5: Wallet + Parks + Notifications (M2 week 4-5)
1. Migrate wallet → `users/{uid}/tickets` + Firebase Storage
2. Wire Queue-Times API via `proxyWaitTimes`
3. Set up FCM + `expo-notifications`
4. Deploy notification triggers

### Sprint 6: Premium (M3 week 5-7)
1. Apple Wallet PKPass generation
2. Pro IAP with `react-native-iap`
3. Game stats persistence + leaderboards
4. Server-driven weekly challenges

### Pre-TestFlight
1. Wire Algolia for universal search
2. Deploy `exportRideLog`
3. Final security rules audit

---

## Package Dependencies

| Package | Purpose | Milestone |
|---------|---------|-----------|
| `zustand` | State management | M1 |
| `@react-native-firebase/app` | Firebase core | M1 |
| `@react-native-firebase/auth` | Authentication | M1 |
| `@react-native-firebase/firestore` | Database | M1 |
| `@react-native-firebase/storage` | File storage | M1 |
| `@react-native-firebase/functions` | Cloud Functions client | M1 |
| `@react-native-firebase/messaging` | Push notifications | M2 |
| `expo-apple-authentication` | Apple Sign-In | M1 |
| `@react-native-google-signin/google-signin` | Google Sign-In | M1 |
| `expo-notifications` | Push notification client | M2 |
| `algoliasearch` | Search client | Pre-TestFlight |
| `react-native-iap` | In-app purchases | M3 |
| `passkit-generator` | PKPass generation (CF-side) | M3 |
| `stripe` + `@stripe/stripe-react-native` | Merch checkout | M3/v1.1 |
