# TrackR v1 Backend Audit — Master Index

Completed 2026-03-11. 20 audit docs covering every screen, every interactive element, every backend requirement.

## Audit Docs

### Core Loop (5 docs, 113 interactive elements)
| Doc | Screens | Elements | Key Backend Needs |
|-----|---------|----------|-------------------|
| [home-screen.md](home-screen.md) | HomeScreen, LogModal, NewsCard, ArticleSheet, RideActionSheet | 33 | Feed curation, ride log persistence, saved articles, friend activity |
| [logging-flow.md](logging-flow.md) | LogConfirmSheet, LogModal, LogbookLogSheet | 22 | Ride log writes, re-ride counts, meta counters |
| [rating-system.md](rating-system.md) | RatingSheet, CriteriaWeightEditor, RateRidesScreen | 24 | Rating persistence, criteria config, global aggregation |
| [logbook.md](logbook.md) | LogbookScreen, TimelineActionSheet | 24 | Ride log CRUD, meta counters, rating joins |
| [activity.md](activity.md) | ActivityScreen | 10 | **100% mock — needs full rewrite to real data** |

### Social + Parks (5 docs, 99 interactive elements)
| Doc | Screens | Elements | Key Backend Needs |
|-----|---------|----------|-------------------|
| [community-feed.md](community-feed.md) | CommunityFeedTab, FeedPost, PostDetail, ComposeSheet (4 variants) | 38 | Posts collection, comments, likes, feed algorithm |
| [community-rankings.md](community-rankings.md) | CommunityRankingsTab | 11 | Aggregated rankings (Cloud Function), time filtering |
| [community-friends.md](community-friends.md) | CommunityFriendsTab, ProfileView | 11 | Friend requests, user search, activity feed, **6 critical UI gaps** |
| [community-games.md](community-games.md) | CommunityPlayTab, Coastle, Trivia, SpeedSorter, BlindRanking, Battle | 30 | Optional: game stats persistence, leaderboards, weekly challenges |
| [parks-and-wait-times.md](parks-and-wait-times.md) | ParksScreen, ParkDetail, WaitTimesCard, Weather, RideList, FoodList, Guides | 28 | Queue-Times API, weather API, HealthKit steps |

### User Layer (5 docs, 67 interactive elements)
| Doc | Screens | Elements | Key Backend Needs |
|-----|---------|----------|-------------------|
| [profile.md](profile.md) | ProfileScreen, PerksScreen, SavedArticlesScreen | 17 | User doc, stats computation, badge system, avatar upload |
| [settings.md](settings.md) | SettingsScreen, Email, Password, BlockedUsers, Export, Credits, Privacy, Terms | 33 | Auth flows, username validation, account deletion, FCM token, export |
| [onboarding.md](onboarding.md) | OnboardingScreen (5 steps), AuthScreen | 15 | Firebase Auth (Apple, Google, email), user doc creation, local-to-cloud migration |
| [wallet.md](wallet.md) | WalletCardStack, AddTicketFlow, PassDetail, ScanModal, GateMode, Camera, QuickActions | 35 | Ticket sync to Firestore, image upload to Storage |
| [apple-wallet.md](apple-wallet.md) | New feature (no existing screens) | N/A | PKPass generation, Pass Type ID cert, web service endpoints |

### Cross-Cutting (5 docs)
| Doc | Covers |
|-----|--------|
| [data-stores.md](data-stores.md) | 7 local stores, persistence gaps, Firestore migration plan |
| [auth-requirements.md](auth-requirements.md) | Auth providers, sign-up/in/out flows, password/email change, account deletion, anonymous migration |
| [pro-and-merch.md](pro-and-merch.md) | TrackR Pro PWYW, IAP setup, merch store (Shopify + Printful) |
| [notifications.md](notifications.md) | FCM push notifications, 10 notification types, token management |
| [INDEX.md](INDEX.md) | This file |

---

## Firestore Collections Summary

Every collection identified across all audit docs, deduplicated and organized.

### Core Collections

| Collection | Purpose | Source Docs | Milestone |
|------------|---------|-------------|-----------|
| `users/{userId}` | Profile, preferences, settings, FCM tokens, pro status | profile, settings, onboarding, auth, notifications | M1 |
| `usernames/{username}` | Username uniqueness enforcement | settings | M1 |
| `rideLogs/{userId}/logs/{logId}` | Individual ride log entries | logging-flow, logbook, home-screen | M1 |
| `rideLogs/{userId}/meta` | Denormalized counters (credits, total rides) | logging-flow, logbook | M1 |
| `ratings/{userId}/{coasterId}` | Per-coaster weighted ratings | rating-system, logbook | M1 |

### Community Collections

| Collection | Purpose | Source Docs | Milestone |
|------------|---------|-------------|-----------|
| `posts/{postId}` | Community feed posts (review, trip report, ranked list, bucket list) | community-feed | M2 |
| `posts/{postId}/comments/{commentId}` | Comment threads on posts | community-feed | M2 |
| `rankings/{category}` | Aggregated community rankings (6 categories) | community-rankings | M2 |
| `friendRequests/{requestId}` | Friend request state machine | community-friends | M2 |

### User Subcollections

| Subcollection | Purpose | Source Docs | Milestone |
|---------------|---------|-------------|-----------|
| `users/{userId}/friends/{friendId}` | Bidirectional friend links | community-friends | M2 |
| `users/{userId}/tickets/{ticketId}` | Wallet passes/tickets | wallet | M2 |
| `users/{userId}/blockedUsers/{blockedUid}` | Block list | settings | M2 |
| `users/{userId}/savedArticles/{articleId}` | Bookmarked news | home-screen, profile | M2 |
| `users/{userId}/criteriaConfig` | Rating criteria weights (single doc) | rating-system | M1 |
| `users/{userId}/feedPreferences` | Thumbs up/down, removed (single doc) | home-screen | M2 |
| `users/{userId}/activity/{activityId}` | Activity timeline (optional) | community-friends | M2 |
| `users/{userId}/gameStats/{gameId}` | Game scores/streaks (optional) | community-games | M3 |
| `users/{userId}/challenges/{challengeId}` | Weekly challenge progress (optional) | community-games | M3 |
| `users/{userId}/badges/{badgeId}` | Achievement badges | profile | M3 |
| `users/{userId}/rides` | Ride history for profile display | profile | M1 |
| `users/{userId}/rankings` | Personal ranking list | profile | M2 |

### Infrastructure Collections

| Collection | Purpose | Source Docs | Milestone |
|------------|---------|-------------|-----------|
| `purchases/{purchaseId}` | IAP receipt records | pro-and-merch | M3 |
| `appleWalletRegistrations/{regId}` | Device registration for pass updates | apple-wallet | M3 |
| `appleWalletPasses/{serialNumber}` | Pass metadata for web service | apple-wallet | M3 |
| `parkWaitTimes/{parkSlug}` | Cached wait time responses (if proxied) | parks-and-wait-times | M2 |
| `notifications/{userId}/items/{notifId}` | In-app notification items (optional) | notifications | Post-v1 |

**Total: 8 top-level collections + 12 user subcollections + 5 infrastructure collections = 25 collections**

---

## Cloud Functions Summary

| Function | Type | Trigger | Milestone | Source Doc |
|----------|------|---------|-----------|------------|
| `generateProfileReady` | Auth | onCreate | M1 | onboarding, auth |
| `validateUsername` | Callable | User request | M1 | settings |
| `onRideLogCreate` | Firestore | logs write | M1 | logging-flow |
| `onRideLogDelete` | Firestore | logs delete | M1 | logbook |
| `onRideLogUpdate` | Firestore | logs update | M1 | logbook |
| `onRatingWrite` | Firestore | rating write | M1 | rating-system |
| `migrateLocalData` | Callable | User request | M1 | auth, onboarding |
| `deleteUserAccount` | Callable | User request | M1 | settings, auth |
| `computeRankings` | Scheduled | Daily/hourly | M2 | community-rankings |
| `getRankings` | Callable | User request | M2 | community-rankings |
| `getFeed` | Callable | User request | M2 | community-feed |
| `createPost` | Callable | User request | M2 | community-feed |
| `toggleLike` | Callable | User request | M2 | community-feed |
| `addComment` | Callable | User request | M2 | community-feed |
| `sendFriendRequest` | Callable | User request | M2 | community-friends |
| `acceptFriendRequest` | Callable | User request | M2 | community-friends |
| `declineFriendRequest` | Callable | User request | M2 | community-friends |
| `removeFriend` | Callable | User request | M2 | community-friends |
| `getFriendActivity` | Callable | User request | M2 | community-friends |
| `searchUsers` | Callable | User request | M2 | community-friends |
| `proxyWaitTimes` | Callable/HTTPS | User request | M2 | parks-and-wait-times |
| `computeUserStats` | Firestore | rides/games write | M2 | profile |
| `awardBadges` | Firestore | rides/games write | M3 | profile |
| `exportRideLog` | Callable | User request | M2 | settings |
| `registerFCMToken` | Callable | App launch | M2 | notifications, settings |
| `sendNotification` | Internal | Various triggers | M2 | notifications |
| `verifyPurchase` | Callable | User request | M3 | pro-and-merch |
| `handleSubscriptionEvent` | HTTPS (webhook) | Apple server | M3 | pro-and-merch |
| `generatePKPass` | Callable | User request | M3 | apple-wallet |
| `appleWalletWebService` | HTTPS | Apple Wallet | M3 | apple-wallet |
| `updatePassOnChange` | Firestore | ticket update | M3 | apple-wallet |
| `syncTicketImages` | Callable | User request | M2 | wallet |
| `refreshTicketStatuses` | Scheduled | Daily | M2 | wallet |
| `migrateLocalWallet` | Callable | User request | M2 | wallet |
| `getTrendingCoasters` | Callable/Scheduled | Various | M2 | home-screen |
| `getFriendActivityFeed` | Callable | User request | M2 | home-screen |
| `getNewsFeed` | Callable/Scheduled | Various | M2 | home-screen |
| `getWeeklyChallenge` | Callable | User request | M3 | community-games |
| `submitGameScore` | Callable | User request | M3 | community-games |

**Total: 39 Cloud Functions (17 M1-M2 critical, 12 M2 community, 10 M3 premium)**

---

## Third-Party API/Service Summary

| Service | Purpose | Milestone | Cost |
|---------|---------|-----------|------|
| Firebase Auth | User authentication | M1 | Free tier |
| Firebase Firestore | Data persistence | M1 | Free tier (50k reads/day) |
| Firebase Storage | Images (avatars, tickets, pass art) | M1 | Free tier (5GB) |
| Firebase Cloud Functions | Server-side logic | M1 | Free tier (2M invocations/mo) |
| Firebase Cloud Messaging (FCM) | Push notifications | M2 | Free |
| Queue-Times API | Live wait times | M2 | Unknown (need to research pricing) |
| Weather API (OpenWeatherMap or WeatherKit) | Park weather | M2 | Free tier / included with Apple Dev |
| Apple HealthKit | Step counting | M2 | Free (expo-health or react-native-health) |
| Apple Developer Program | App Store + PassKit | M0 | $99/year |
| Apple PassKit / APNs | Wallet pass signing + updates | M3 | Included with Apple Dev |
| Shopify | Merch storefront | M3 | $5-39/month |
| Printful | Card printing + fulfillment | M3 | Per-order (no monthly) |
| App Store Connect (IAP) | Pro subscriptions | M3 | 15-30% Apple commission |
| expo-apple-authentication | Apple Sign-In | M1 | Free (Expo SDK) |
| @react-native-google-signin | Google Sign-In | M1 | Free |
| react-native-iap | In-app purchases | M3 | Free (library) |
| react-native-wallet-manager | Apple Wallet integration | M3 | Free (library) |

---

## Critical Findings

1. **ActivityScreen is 100% mock.** The "Rate Now" button does nothing. Consider merging with LogbookScreen's Pending tab.
2. **CommunityFriends has 6 missing UI elements** (add/remove friend, follow, search, requests, pull-to-refresh). Biggest UI gap in the app.
3. **Rankings time filter is UI-only.** Changing the filter changes no data.
4. **rideLogStore has ZERO persistence.** This is the app's core value prop and all data is lost on restart.
5. **All auth buttons are stubs.** AuthScreen calls `onComplete()` immediately without any actual authentication.
6. **No email sign-up screen exists.** AuthScreen has the button but no form screen to navigate to.
7. **Terms/Privacy links in AuthScreen are not wired** to the existing TermsScreen/PrivacyPolicyScreen.
8. **ProfileView has hardcoded profiles** per userId (L52-98). Must fetch from Firestore.

## Open Questions Summary (Caleb's Input Needed)

Consolidated from all docs. Grouped by decision type.

### Architecture
- Q1: Offline-first with Firestore persistence, or online-required with local cache?
- Q2: `@react-native-firebase` (native SDK) or `firebase` JS SDK? Native = more reliable, JS = simpler setup.
- Q3: Store refactor — keep module-level subscription pattern with Firestore underneath, or migrate to hooks?

### Social Model
- Q4: Friend model — mutual (both accept) or follow-based (one-way)?
- Q5: Privacy — can non-friends see profiles, activity, ride history?
- Q6: Content moderation for community posts — any review before posts appear?
- Q7: User search — Firestore prefix match only, or third-party (Algolia)?

### Feature Scope
- Q8: ActivityScreen — keep as standalone or merge into LogbookScreen Pending tab?
- Q9: News feed — curated editorial, RSS/API, or user-generated?
- Q10: HealthKit step counting — v1 scope or nice-to-have?
- Q11: Game stats persistence — v1 scope or nice-to-have?
- Q12: Weekly challenge — static or server-driven?
- Q13: Coastle daily puzzle — server-side word (same for all users) or client-generated?

### Monetization
- Q14: PWYW price tiers — what specific amounts? Apple requires discrete IAP products.
- Q15: Pro feature list — which features are gated?
- Q16: Merch store — Shopify Lite ($5/mo) or Basic ($39/mo)?
- Q17: Card dimensions — standard poker (2.5"x3.5") or custom?

### Apple Wallet
- Q18: Pass updates — auto-update on ticket status change, or one-time generation only?
- Q19: Pass branding — NanoBanana art, park logos, or generic TrackR branding?
- Q20: IMAGE_ONLY passes (no barcode) — eligible for Apple Wallet?
