# Home Screen -- v1 Backend Audit

## Screens/Components Covered
- HomeScreen.tsx (lines 1-900+) -- Main tab with feed, morphing modals, wallet
- LogModal.tsx (lines 1-903) -- Embedded search/discovery for log flow
- MorphingPill.tsx, MorphingActionButton.tsx -- Morph animation wrappers
- SearchCarousel.tsx, SearchResultRow.tsx -- Discovery section subcomponents
- NewsCard.tsx (lines 1-237) -- Feed news card with bookmark/press
- NewsCardActionSheet.tsx (lines 1-468) -- Long-press actions on news cards
- ArticleSheet.tsx (lines 1-80+) -- Full article reader sheet
- RideActionSheet.tsx (lines 1-343) -- Long-press ride actions sheet

## Current Data Sources
- News feed: `MOCK_NEWS` from `data/mockNews.ts` (hardcoded)
- Feed layout: `FEED_LAYOUT` from `data/mockFeed.ts` (hardcoded sections)
- Trending coasters: `TRENDING_COASTERS` from `data/mockSearchData.ts` (hardcoded)
- Nearby rides: `NEARBY_RIDES` from `data/mockSearchData.ts` (hardcoded)
- Search autocomplete: `searchItems()` from `data/mockSearchData.ts` (local index)
- Ride logs/ratings: `rideLogStore.ts` (in-memory, resets on app restart)
- Saved articles: `savedArticlesStore.ts` (in-memory)
- Wallet/tickets: `useWallet()` hook (in-memory)
- Coaster data: `COASTER_BY_ID`, `COASTER_DETAILS` (static bundled index)

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Search bar (expanded) | HomeScreen ~L400-425 | Opens MorphingPill search modal | Same, searches local index | Read: coasters collection (future search API) |
| 2 | Search bar (collapsed) | HomeScreen ~L400-425 | Opens MorphingPill, narrower origin | Same | Same as #1 |
| 3 | Log action button | HomeScreen ~L313 | Opens Log MorphingPill modal | Same but persist logs | Write: rideLogs/{userId}/logs/{logId} |
| 4 | Search action button | HomeScreen ~L311 | Opens Search MorphingPill | Same | None (client-side search) |
| 5 | Scan action button | HomeScreen ~L315 | Opens Wallet/Scan modal | Same but sync tickets | Read/Write: wallet/{userId}/tickets |
| 6 | News card tap | HomeScreen ~L224 | Opens ArticleSheet | Same, track read status | Write: users/{userId}/readArticles |
| 7 | News card long-press | HomeScreen ~L229 | Opens NewsCardActionSheet | Same | None (local preference) |
| 8 | News card bookmark | NewsCard L83-89 | Toggles in-memory save | Persist to Firestore | Write: users/{userId}/savedArticles |
| 9 | News thumbs-up | NewsCardActionSheet L121-128 | Dismisses sheet | Persist preference, affect feed algorithm | Write: users/{userId}/feedPreferences |
| 10 | News thumbs-down | NewsCardActionSheet L130-137 | Removes card from feed | Persist removal, affect feed | Write: users/{userId}/feedPreferences |
| 11 | Share article | NewsCardActionSheet L109-118 | Native share sheet | Same (no backend) | None |
| 12 | Save/Unsave article | NewsCardActionSheet L101-107 | In-memory toggle | Persist | Write: users/{userId}/savedArticles |
| 13 | Feed scroll collapse/expand | HomeScreen ~L637-768 | Header morphs on scroll | Same (purely client-side) | None |
| 14 | Pending ratings banner | LogModal L471-485 | "Rate All" navigates to RateRides | Same, data from Firestore | Read: rideLogs where rated=false |
| 15 | Pending rating row tap | LogModal L289-300 | Opens LogConfirmSheet for that coaster | Should open RatingSheet | Same as above |
| 16 | "More from [Park]" carousel | LogModal L503-515 | Shows rides for last logged park | Same, from local index | None (static data) |
| 17 | "Your Most Ridden" carousel | LogModal L519-552 | Aggregates from in-memory logs | Same but from Firestore | Read: rideLogs/{userId} |
| 18 | Trending section rows | LogModal L555-588 | Hardcoded TRENDING_COASTERS | Real-time trending from all users | Read: Cloud Function aggregation |
| 19 | Search autocomplete row tap | LogModal L605-637 | Opens LogConfirmSheet | Same but persist log | Write: rideLogs/{userId}/logs/{logId} |
| 20 | Wallet card stack | HomeScreen L33 | In-memory tickets | Sync with Firestore | Read/Write: wallet/{userId}/tickets |
| 21 | Pass long-press (QuickActions) | HomeScreen L883-888 | Opens QuickActionsMenu | Same | None |
| 22 | Gate mode | HomeScreen ~L896 | Shows barcode full-screen | Same | None |
| 23 | Add ticket flow | HomeScreen ~L217 | In-memory add | Persist ticket | Write: wallet/{userId}/tickets |
| 24 | CoasterSheet (from feed) | HomeScreen ~L220-221 | Shows coaster detail sheet | Same | None (static data) |
| 25 | RideActionSheet "View Details" | RideActionSheet L143-164 | Dismisses + opens CoasterSheet | Same | None |
| 26 | RideActionSheet "Log Ride" | RideActionSheet L166-191 | Dismisses + triggers log | Persist | Write: rideLogs/{userId}/logs |
| 27 | RideActionSheet "View Rankings" | RideActionSheet L193-216 | Stub (optional prop) | Navigate to rankings | Read: rankings collection |
| 28 | Dev: Coastle button | HomeScreen (dev only) | Launches Coastle game | Remove for production | N/A |
| 29 | Dev: Loading animation | HomeScreen (dev only) | Plays splash animation | Remove for production | N/A |
| 30 | Dev: Onboarding button | HomeScreen (dev only) | Replays onboarding | Remove for production | N/A |
| 31 | "Add your first ride" CTA | LogModal L443-453 | Focuses search input | Same | None |
| 32 | Friend activity section | HomeScreen L38 (import) | Renders from FEED_LAYOUT mock | Real friend data | Read: friends/{userId}/activity |
| 33 | Feed toast undo | HomeScreen L237-243 | Undoes card removal | Persist undo | Write: users/{userId}/feedPreferences |

## Firestore Collections Required
- `users/{userId}/savedArticles` -- { articleId, savedAt }
- `users/{userId}/feedPreferences` -- { thumbsUp: [], thumbsDown: [], removed: [] }
- `users/{userId}/readArticles` -- { articleId, readAt } (for unread dot)
- `rideLogs/{userId}/logs/{logId}` -- existing schema from rideLogStore
- `wallet/{userId}/tickets/{ticketId}` -- ticket data (barcode, park, type, etc.)

## Cloud Function Requirements
- `getTrendingCoasters` -- Aggregates ride logs across all users, returns top-N for the week
- `getFriendActivity` -- Returns recent logs from user's friends list
- `getNewsFeed` -- Curates news articles (possibly from RSS/API), respects user preferences

## Third-Party API Requirements
- News/article content: RSS feeds or a coaster news API (currently mock data)
- Queue-Times API: for live wait times (v1 M2 scope)

## Open Questions
- Should the news feed be a curated editorial feed (Cloud Function) or user-generated content?
- Should "Trending This Week" be global or regional?
- What is the friend system design? Follow-based? Mutual? This affects friend activity.
- Should saved articles sync across devices or be device-local?
- Dev buttons: confirm they should be removed or gated behind a dev-mode flag.
