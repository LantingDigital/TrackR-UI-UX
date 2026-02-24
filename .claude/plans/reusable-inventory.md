# TrackR — Reusable Component Inventory Strategy

> **Created**: February 21, 2026
> **Purpose**: Map every building block by reuse count to determine optimal build order.
> **Principle**: Build the pieces that get reused the most FIRST. Then future phases are assembly, not invention.

---

## Reuse Heat Map

Every major building block, scored by how many features/screens reuse it.

### Tier 1: Universal (Used 10+ times across the app)

| Building Block | Reuse Count | Where It's Used |
|---------------|-------------|-----------------|
| **Card System** (BaseCard + variants) | 15+ | NewsCard, ParkCard, CoasterCard, GuideCard, GameCard, LogCard, StatCard, FoodCard, ShopCard, PostCard, TripReportCard, CollectibleCard, MeetupCard, PhotoSpotCard, AccessibilityCard |
| **useSpringPress** | Every tappable element | Already done. Every card, button, row, chip in the app. |
| **Search Input + Debounce** | 8+ | LogModal, SearchModal, Discover, Food search, Community search, Game search, Friend search, Shop search |
| **List/Feed Component** | 10+ | News feed, search results, pending ratings, ride history, community posts, park list, coaster list, food results, game list, friend list, guide list |
| **Empty State Component** | Every list/screen | Shown when any list has no data. Same pattern everywhere. |
| **Loading Skeleton** | Every data-driven screen | Already done (SkeletonLoader). Used wherever data loads. |
| **Toast/Snackbar** | Every action | Success (logged!), error (failed!), info (offline mode). Every store action needs feedback. |
| **Bottom Sheet** | 10+ | Filter sheet, confirm dialogs, share sheet, detail previews, settings panels, wallet select, poll creation, meetup RSVP, sort options, map POI details |

### Tier 2: High Reuse (Used 5-9 times)

| Building Block | Reuse Count | Where It's Used |
|---------------|-------------|-----------------|
| **Filter/Sort System** (chips + sheet) | 7+ | Discover (parks, coasters), Food search, Community, Games, Shop search, Accessibility, Wait times |
| **Detail View Pattern** (push nav + hero header) | 6+ | Park detail, Coaster detail, Guide reader, Post detail, Game detail, Food location detail |
| **MorphingPill** (hero morph) | 5 | Log, Search, Scan/Wallet, potentially Discover quick-view, Community compose |
| **Section Header** (title + "See All" action) | 8+ | Home sections, Discover categories, Activity sections, Profile sections, Game categories, Community topics |
| **Avatar/User Badge** | 6+ | Community posts, comments, friend list, meetup RSVP, live map pins, leaderboards |
| **Tag/Chip Component** | 7+ | Coaster type tags, dietary filter chips, criteria chips, game category tags, park tags, difficulty tags, accessibility tags |
| **Image Component** (cached, placeholder, error state) | Every card with images | Coaster photos, park images, news thumbnails, food photos, guide images, user avatars, card art |
| **Haptic Pattern System** | Every interaction | Standardized haptic responses: tap, success, error, slider snap, toggle, scroll boundary |
| **Auth-Gated Wrapper** | 6+ | Community posting, friend features, live map, meetup creation, marketplace, card trading |

### Tier 3: Moderate Reuse (Used 3-4 times)

| Building Block | Reuse Count | Where It's Used |
|---------------|-------------|-----------------|
| **Map Component** | 4 | Wait time map, friend live map, photo spots map, AR navigation, car locator |
| **Rich Text Display** | 4 | Park guides, community posts, ride analysis, trip reports |
| **Chart/Graph Component** | 3+ | Stats dashboard, wait time trends, rating distribution, season comparison |
| **Share Sheet** | 4 | Stat cards, trip reports, collectible cards, community posts |
| **Countdown/Timer** | 3 | Game timer, meetup countdown, wait time estimates |
| **Progress Indicator** | 4 | Credit milestones, game streaks, trivia progress, upload progress |
| **Star/Score Display** | 4 | Weighted score, food ratings, guide ratings, compatibility score |
| **Notification Bell + Badge** | 3 | Tab bar badge, community notifications, friend requests |

### Tier 4: Feature-Specific (Used 1-2 times)

| Building Block | Where It's Used |
|---------------|-----------------|
| Rating slider | RatingModal, comparison tool |
| AR camera overlay | Park navigation |
| QR/barcode renderer | Wallet display |
| Card designer/renderer | Collectible cards, stat cards |
| Poll component | Community posts |
| Itinerary timeline | Trip planner |
| Weather widget | Weather planner, My Park dashboard |
| Game container/framework | Each mini-game |

---

## The Toolkit Build Order

Based on reuse analysis, here's the optimal order to maximize inventory before building features.

### Sprint A: Foundation Polish (Current — Phase 1 completion)

**What we're building**: Finishing the core logging loop.

**Inventory it produces**:
- MorphingPill (DONE) — reused for all hero morphs
- useSpringPress (DONE) — reused on every tappable element
- useMorphAnimation (DONE) — reused for all morph overlays
- BaseCard (DONE) — foundation for 15+ card types
- RatingModal pattern — template for all complex full-screen modals
- Store subscription pattern (rideLogStore) — template for all future stores
- SkeletonLoader (DONE) — reused on every loading screen
- RotatingPlaceholder (DONE) — reusable for any animated hint text
- Search input + debounced results pattern — reused in 8+ places
- LogConfirmationCard — template for all confirmation dialogs

**What's left to finish**:
- [ ] Quick Log → success state + animation
- [ ] Rate Now → RatingModal connection
- [ ] Success/completion feedback (toast or animation) — **NEW REUSABLE**
- [ ] Activity screen pending list — **uses List component pattern**
- [ ] Seat/row logging field — **form input pattern**
- [ ] Remaining Reanimated migration (HomeScreen Batch B-D)

### Sprint B: Component Library Buildout

**What we're building**: Pure reusable components with NO feature context. These are building blocks.

**Priority order by reuse count**:

#### B1. Card Variant System
Build on BaseCard to create the card variants used everywhere:

```
cards/
  BaseCard.tsx          ← EXISTS
  ContentCard.tsx       ← NEW: image + title + subtitle + metadata row
  ActionCard.tsx        ← NEW: tappable row with icon, label, chevron
  StatCard.tsx          ← NEW: large number + label + trend indicator
  CompactCard.tsx       ← NEW: small horizontal card for lists
```

**ContentCard** covers: NewsCard, ParkCard, CoasterCard, GuideCard, FoodCard, GameCard, ShopCard, PhotoSpotCard
**ActionCard** covers: Settings rows, navigation items, filter options, quick actions
**StatCard** covers: Credit count, ride count, score display, streak count, milestone display
**CompactCard** covers: Search results, pending rating rows, friend list rows, history items

All use useSpringPress. All have consistent shadow, radius, and press feedback.

#### B2. List Infrastructure
The universal list pattern used on every screen:

```
lists/
  FeedList.tsx          ← NEW: Virtualized FlatList with pull-to-refresh, pagination
  SectionFeed.tsx       ← NEW: SectionList with collapsible section headers
  HorizontalScroll.tsx  ← EXISTS (SearchCarousel), generalize
  EmptyState.tsx        ← NEW: Icon + title + subtitle + optional action button
  ListSkeleton.tsx      ← NEW: N skeleton rows for loading state
```

**FeedList** covers: News feed, community posts, search results, ride history, pending ratings
**SectionFeed** covers: Discover categories, Activity sections, food by category, games by type
**EmptyState** covers: Every screen's "nothing here yet" state (same pattern, different copy/icon)

#### B3. Bottom Sheet
The most-used modal pattern after MorphingPill:

```
overlays/
  BottomSheet.tsx       ← NEW: Draggable sheet with snap points, backdrop, handle
  ConfirmDialog.tsx     ← NEW: Title + message + two buttons (destructive/confirm)
  FilterSheet.tsx       ← NEW: Chip rows + apply/reset in a bottom sheet
  ShareSheet.tsx        ← NEW: Share to Instagram/Twitter/Copy Link + preview
```

Uses react-native-reanimated for gesture-driven drag. Snap points (peek, half, full).

**BottomSheet** covers: Filter selection, sort options, detail previews, settings panels, confirmation flows, wallet selection, poll creation, RSVP, map POI details
**ConfirmDialog** covers: Delete confirmation, log out, discard changes, rate now prompt
**FilterSheet** covers: Discover filters, food dietary filters, accessibility filters, community topic filters
**ShareSheet** covers: Stat card sharing, trip report sharing, card sharing, post sharing

#### B4. Search & Filter System
The universal search pattern:

```
search/
  SearchInput.tsx       ← NEW: Styled input with icon, clear button, cancel. Debounce built in.
  FilterChipRow.tsx     ← NEW: Horizontal scrollable row of selectable chips
  SortSelector.tsx      ← NEW: Dropdown or sheet for sort options
  SearchResults.tsx     ← NEW: Categorized results with section headers
```

**SearchInput** covers: LogModal search, SearchModal search, Discover search, Food search, Community search, Friend search, Shop search, Game search
**FilterChipRow** covers: Coaster type filter, dietary filter, accessibility filter, park region filter, game category filter, post topic filter
**SortSelector** covers: Sort by rating, distance, wait time, popularity, date, alphabetical

#### B5. Feedback System
Micro-interactions that appear everywhere:

```
feedback/
  Toast.tsx             ← NEW: Slide-in notification (success/error/info). Auto-dismiss.
  HapticService.ts      ← NEW: Centralized haptic patterns (tap, success, error, snap, toggle)
  SuccessAnimation.tsx  ← NEW: Checkmark burst animation for completions
  PullToRefresh.tsx     ← NEW: Custom pull-to-refresh indicator with spring physics
```

**Toast** covers: "Ride logged!", "Rating saved!", "Offline mode", "Error — try again", "Friend request sent"
**SuccessAnimation** covers: Quick Log success, rating submit, card earned, milestone hit, meetup created

#### B6. Section Header & Navigation
Structural components for screen layout:

```
layout/
  SectionHeader.tsx     ← NEW: Title + optional "See All" link + optional count badge
  DetailHeader.tsx      ← NEW: Collapsible hero image header for detail views (park, coaster, guide)
  TabHeader.tsx         ← NEW: Screen-level header with title + optional action buttons
  Divider.tsx           ← NEW: Thin line or spacing divider between sections
```

**SectionHeader** covers: Home "Latest News", Discover "Popular Parks", Activity "Pending Ratings", Profile "Your Stats", Play "Daily Challenge"
**DetailHeader** covers: Park detail, coaster detail, guide reader, user profile — all have collapsible hero image + title

#### B7. User & Social Primitives
Building blocks for all social features:

```
social/
  Avatar.tsx            ← NEW: User avatar with size variants (sm/md/lg), fallback initials, online dot
  UserBadge.tsx         ← NEW: Avatar + name + optional subtitle (inline, for posts/comments)
  FollowButton.tsx      ← NEW: Follow/Unfollow/Pending states with spring animation
  ScoreDisplay.tsx      ← NEW: Circular or pill score indicator (weighted score, compatibility %)
```

#### B8. Form Inputs
Styled inputs matching the design system:

```
inputs/
  TextInput.tsx         ← NEW: Styled text input with label, error state, helper text
  Toggle.tsx            ← NEW: Animated toggle switch
  ChipSelector.tsx      ← NEW: Multi-select chip grid (criteria selection, tag selection)
  DatePicker.tsx        ← NEW: Styled date/time selector
  Stepper.tsx           ← NEW: +/- number input (group size, quantity)
```

### Sprint C: Data Layer & Backend Patterns

**What we're building**: Store patterns, API service layer, auth, caching.

```
stores/
  rideLogStore.ts       ← EXISTS — template for all stores
  createStore.ts        ← NEW: Factory function to create stores with subscriptions
  walletStore.ts        ← NEW: Built using createStore pattern
  communityStore.ts     ← NEW: Built using createStore pattern (Phase 4)

services/
  apiClient.ts          ← NEW: Base HTTP client with auth headers, error handling, retry
  rcdbService.ts        ← NEW: RCDB data fetching + caching
  queueTimesService.ts  ← NEW: Wait time API integration
  weatherService.ts     ← NEW: Weather API integration
  cacheLayer.ts         ← NEW: AsyncStorage-backed cache with TTL and offline fallback

contexts/
  AuthContext.tsx        ← NEW: Firebase Auth state, sign in/out, user profile
  ModeContext.tsx        ← NEW: Guest/Enthusiast mode, persisted preference
  OfflineContext.tsx     ← NEW: Network status, queue actions for when back online
```

---

## Build Sequence Summary

```
Sprint A: Finish Phase 1 (log flow polish)
  → Produces: morph system, store pattern, search pattern, rating modal template

Sprint B: Component Library (no feature context)
  B1: Card variants (ContentCard, ActionCard, StatCard, CompactCard)
  B2: List infrastructure (FeedList, SectionFeed, EmptyState)
  B3: Bottom sheet system (BottomSheet, ConfirmDialog, FilterSheet, ShareSheet)
  B4: Search & filter (SearchInput, FilterChipRow, SortSelector)
  B5: Feedback system (Toast, HapticService, SuccessAnimation)
  B6: Layout components (SectionHeader, DetailHeader, TabHeader)
  B7: Social primitives (Avatar, UserBadge, ScoreDisplay)
  B8: Form inputs (TextInput, Toggle, ChipSelector, DatePicker)

Sprint C: Data layer
  C1: Store factory (createStore pattern)
  C2: API service pattern (apiClient, caching, offline)
  C3: Auth + Mode contexts

Sprint D+: Feature Assembly
  → Each remaining phase (2-9) becomes ASSEMBLY using Sprint B/C inventory
  → New feature-specific components are minimal
  → Parallel agents can build screens independently because the toolkit is shared
```

---

## Inventory Scorecard

After Sprints A-C, here's what a parallel agent would have available:

| Category | Components | Count |
|----------|-----------|-------|
| **Cards** | BaseCard, ContentCard, ActionCard, StatCard, CompactCard | 5 |
| **Lists** | FeedList, SectionFeed, HorizontalScroll, EmptyState, ListSkeleton | 5 |
| **Overlays** | MorphingPill, BottomSheet, ConfirmDialog, FilterSheet, ShareSheet | 5 |
| **Search** | SearchInput, FilterChipRow, SortSelector, SearchResults | 4 |
| **Feedback** | Toast, HapticService, SuccessAnimation, PullToRefresh | 4 |
| **Layout** | SectionHeader, DetailHeader, TabHeader, Divider | 4 |
| **Social** | Avatar, UserBadge, FollowButton, ScoreDisplay | 4 |
| **Inputs** | TextInput, Toggle, ChipSelector, DatePicker, Stepper | 5 |
| **Hooks** | useSpringPress, useMorphAnimation, useTabFocus, useDebounce, useStore | 5 |
| **Animations** | MorphingActionButton, RotatingPlaceholder, SkeletonLoader | 3 |
| **Data** | createStore, apiClient, cacheLayer, AuthContext, ModeContext, OfflineContext | 6 |
| **Total** | | **50** |

With 50 reusable building blocks, building a screen like DiscoverScreen becomes:

```tsx
<TabHeader title="Discover" />
<SearchInput onSearch={handleSearch} placeholder="Parks, coasters, food..." />
<FilterChipRow filters={['Parks', 'Coasters', 'Food', 'Guides']} />
<SectionFeed
  sections={[
    { title: 'Popular Parks', data: parks, renderItem: (p) => <ContentCard {...p} /> },
    { title: 'Top Coasters', data: coasters, renderItem: (c) => <ContentCard {...c} /> },
    { title: 'Park Guides', data: guides, renderItem: (g) => <ContentCard {...g} /> },
  ]}
  ListEmptyComponent={<EmptyState icon="compass" title="No results" />}
/>
```

That screen is ~30 lines of actual code because all the building blocks exist.

---

## Phase-to-Inventory Dependency Map

Which Sprint B/C components each phase needs:

| Phase | Cards | Lists | Overlays | Search | Feedback | Layout | Social | Inputs | Data |
|-------|-------|-------|----------|--------|----------|--------|--------|--------|------|
| 2 Wallet | - | - | BottomSheet | - | Toast, Success | - | - | - | Auth, createStore |
| 3 Discovery | Content, Compact | FeedList, Section, Empty | FilterSheet | SearchInput, Chips, Sort | Toast | Section, Detail | - | API, cache, offline |
| 4 Community | Content, Action | FeedList, Empty | BottomSheet | SearchInput | Toast | Section, Tab | Avatar, UserBadge | TextInput |
| 5 Social | Compact | FeedList | BottomSheet, Share | SearchInput | Toast, Success | - | Avatar, Follow, Score | Toggle |
| 6 Games | Content, Stat | FeedList, Section | - | - | Toast, Success | Section, Tab | - | createStore |
| 7 Planning | Content, Stat | SectionFeed | FilterSheet | SearchInput, Chips | Toast | Detail | - | DatePicker |
| 8 AI | Content | - | BottomSheet | - | Toast | Detail | Score | - | API |
| 9 Commerce | Content, Action | FeedList | BottomSheet, Share | SearchInput | Toast, Success | Section | - | createStore, API |

Every phase uses 60-80% existing inventory. Feature-specific code is the minority.
