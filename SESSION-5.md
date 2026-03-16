# Session 5 — 2026-03-16

## What Was Done

### 1. V1 Implementation Planning (full Q&A session)
Every v1 feature planned to executable steps. All decisions locked in `docs/V1-IMPLEMENTATION-PLAN.md` (12 sections, new file).

**Merch Store:**
- Native in-app (not Shopify/Next.js). Lives inside Collection tab.
- Featured + browse UX (hero, "New Arrivals", "Popular", "By Park", "Build Your Pack")
- QPMN as POD provider — only one with REST API + gold foil + single-card POD. Printful doesn't offer trading cards.
- Hybrid checkout: quick buy for singles, cart for packs/multi-card
- Anyone can buy any card (logged or not, ridden or not)
- Gold foil: FREE if GPS-verified in-app, upcharge if not
- Standard TCG 2.5"x3.5" (77px crop needed on current art)
- Card back: stats + TrackR branding
- Park collections: full sets only (no partial)
- US + international shipping
- Mystery packs: weighted random
- Pricing: TBD after QPMN cost calculator
- Pro users: 10% off all orders + 1 free card on first sub (in-app claim, deferable)

**TrackR Pro:**
- PWYW $1-$12 slider (Rocket Money model — each price = discrete IAP product, low Apple rejection risk)
- Main cards: $1.99/$2.99 (default)/$3.99. Annual: same x10.
- Bottom sheet nudge for paywall (not blocking)
- All tiers unlock same features. Tiers are identity only (badge/checkmark).
- Tier names: TBD

**Apple Wallet:**
- All wallet items eligible for PKPass
- User picks from 5 styles (clean, nanobanana, park-color, dark, light) with previews
- ~1km geo-fence for auto-surface on lock screen
- Auto-update via APNs push when ticket changes

**Gold Border Verification:**
- ~200m ride-level GPS (not park-level). Uses existing POI lat/lng data.
- Photo fallback: camera capture only (no photo library), manual review by Caleb
- Physical merch: gold foil upcharge if unverified, free if verified

**Other Decisions:**
- Activity screen: SCRAPPED (remove from codebase)
- HealthKit step counting: v1 scope (include it)
- News feed: article pipeline already documented (docs/article-content-workflow.md)
- Wait times: Queue-Times API signup still needed
- Implementation: 3 parallel tracks (Backend, Merch Store, Content+Polish)

### 2. POD Provider Research (background agent)
Compared 5 providers: QPMN, MPC, DriveThruCards, Printify, Printful.
QPMN is the clear winner. Details in V1-IMPLEMENTATION-PLAN.md Section 1.

### 3. Game Performance Fix (background agent)
Files changed: `TriviaScreen.tsx`, `SpeedSorterScreen.tsx`, `BlindRankingScreen.tsx`

- React.memo on all child components (AnswerButton, DraggableCard, SlotRow, CategoryCard, ComparisonRow, RevealCard, ScoreDisplay, ResultsView, Timer)
- Shadows moved off animated views → static wrapper holds shadow, animated inner view handles transforms only
- Downgraded shadows.card → shadows.small during gameplay
- SpeedSorter timer rewritten: `setInterval` + `useState` (10 JS re-renders/sec) → `useFrameCallback` + `TextInput.setNativeProps` (zero JS re-renders)
- `coasterMap` memoized with `useMemo`
- Zero TS errors. No visual or animation changes.

### 4. CommunityFriends UI Gaps (background agent)
Built the 6 missing UI elements (flagged as "biggest UI gap in the app" by v1 audit).

**New files:**
- `src/features/community/components/FriendActionButton.tsx` — context-aware button: Add Friend / Request Sent / Accept+Decline / Friends badge with overflow menu
- `src/features/community/components/RemoveFriendSheet.tsx` — confirmation modal with blur backdrop
- `src/features/community/components/FriendRequestsSection.tsx` — between Stories and Activity, animated accept/decline row transitions
- `src/features/community/components/UserSearchSection.tsx` — search bar at top, filters all users, status buttons per result

**Modified files:**
- `CommunityFriendsTab.tsx` — added search section, friend requests section, pull-to-refresh (RefreshControl), infinite scroll (onEndReached)
- `ProfileView.tsx` — integrated FriendActionButton + RemoveFriendSheet
- `friendsStore.ts` — expanded from read-only to full mutations: sendRequest, acceptRequest, declineRequest, removeFriend, searchUsers, loadMoreActivity
- `mockFriendsData.ts` — added 3 mock friend requests + 8 discoverable users
- `community.ts` types — added FriendshipStatus, FriendRequest, DiscoverableUser

Zero new TS errors.

### 5. Merch Store Session Prompt
Delivered clipboard-ready prompt to Caleb for a separate Claude Code session to build the merch store frontend (7 screens, mock data, full design specs). Caleb copied it.

---

## Docs Created/Updated
- `docs/V1-IMPLEMENTATION-PLAN.md` — **NEW** (master plan, 12 sections, every v1 decision)
- `context/projects/trackr-card-tiers.md` — **UPDATED** (physical merch gold model + GPS verification details)
- EA memory: `trackr-v1-planning-2026-03-16.md` + MEMORY.md session log

---

## Where We Left Off

**Needs on-device testing:**
- Game performance (Trivia, SpeedSorter, BlindRanking) — should feel noticeably smoother
- CommunityFriends (search, requests, add/remove friend, pull-to-refresh, infinite scroll)

**In progress (separate sessions):**
- Merch store frontend build (prompt delivered, 7 screens)

**Next up:**
- Backend Sprint 2b: Google/Apple Sign-In, Firestore service, user doc creation, username validation CF
- Remaining onboarding screens (6-10)
- Frontend punch list items

**Open items (need resolution before build):**
- QPMN API signup + pricing (run cost calculator)
- Queue-Times API signup
- Pass Type ID certificate (Apple Developer portal)
- Card back graphic design (stats + TrackR branding)
- 77px card art crop test with QPMN sample batch
- Coaster-themed PWYW tier names
- TrackR article voice file for content humanization
- Algolia account setup

---
*— Session 5, 2026-03-16*
