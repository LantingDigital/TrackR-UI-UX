# TrackR V1 MVP Roadmap

> **Created**: December 8, 2024
> **Status**: Active
> **Goal**: Build the home base for roller coaster enthusiasts

---

## Project Vision

TrackR is a premium mobile app for the roller coaster community. It's not just a logger—it's the place enthusiasts open every day for news, games, planning, and tracking.

### V1 MVP Scope

| Category | Features |
|----------|----------|
| **Core Logging** | Credit tracking, RCDB data, customizable rating system, seat/row logging |
| **Wallet/Scan** | Digital wallet for tickets/passes (Apple Wallet-style UX) |
| **Daily Engagement** | Mini-games (3-4 at launch), news feed with pinned parks |
| **Planning Utility** | Curated park guides (15-20 at launch) |
| **Shareability** | Stat cards for social media |
| **Milestones** | Credit count celebrations, "On This Day" memories |

### V1.1 (Post-MVP)
- Trip planner (single day and multi-day)

### Long-Term Backlog
- Spotify Wrapped-style year-end summary
- AI-powered features (ride comparison, forces profile)
- Community/social features
- Trading card game

---

## Navigation Structure

### 5-Tab Layout

```
Home | Discover | Play | Activity | Profile
```

| Tab | Purpose | Contains |
|-----|---------|----------|
| **Home** | Daily dashboard | News feed, pinned parks, "On This Day", action buttons (Log/Search/Scan morphs) |
| **Discover** | Encyclopedia | Browse parks, coasters, rankings, park guides |
| **Play** | Daily engagement | Mini-games (3-4 at launch) |
| **Activity** | Personal tracking | Pending ratings, recent logs (history), credit milestones |
| **Profile** | Settings & stats | Stats dashboard, shareable stat card, wallet management, settings, rating criteria |

### Key Distinction
- **Home** = Feed (passive consumption, what's new)
- **Discover** = Browse (active exploration, what exists)

---

## Core Flows

### Log Flow (from Home)

```
Home → Tap "Log" button
  → Log morph opens (hero animation)
  → Search for coaster
  → Select from results
  → LogConfirmationCard appears
  → User chooses:
      → "Quick Log" → Logged, goes to pending
      → "Rate Now" → RatingModal opens → Complete rating → Logged with rating
  → Success feedback
  → Morph closes back to Home
```

### Search Flow (from Home)

```
Home → Tap search bar OR "Search" button
  → Search morph opens (hero animation)
  → Type query
  → Results appear: Coasters, Parks, Park Guides, News
  → Tap result → Detail view (sheet or push)
  → Back → Return to morph OR close to Home
```

### Wallet/Scan Flow

```
Quick Use (Home):
  Home → Tap "Scan" button
  → Wallet quick-use screen (Apple Pay style)
  → Select pass → Show QR/barcode
  → Close back to Home

Management (Profile):
  Profile → Wallet section
  → View all passes
  → Add new pass (scan or manual entry)
  → Set default pass
  → Delete passes
```

---

## Current State Assessment

### What Exists & Works
| Component | Status | Notes |
|-----------|--------|-------|
| HomeScreen.tsx | ✅ Polished | Hero morph system, action buttons, news feed |
| MorphingActionButton.tsx | ✅ Works | Pill ↔ circle morphing |
| SearchModal.tsx | ✅ Works | Input + section cards with cascade |
| LogModal.tsx | ✅ Works | Search for logging |
| LogConfirmationCard.tsx | ✅ Works | Confirm before logging |
| RatingModal.tsx | ✅ Polished | Custom sliders, collapsing hero |
| NewsCard.tsx | ✅ Works | Feed cards |
| CriteriaSetupScreen.tsx | ✅ Works | Rating criteria customization |

### What Needs Rebuilding
| Component | Status | Action |
|-----------|--------|--------|
| LogScreen.tsx | ⚠️ Replace | Rename to ActivityScreen, rebuild as pending inbox |
| SearchScreen.tsx | ❌ Remove | Functionality absorbed by Home morph |
| DiscoverScreen.tsx | ⚠️ Rebuild | New encyclopedia-style browse experience |
| Wallet components | ❌ Broken | Scrap entirely, rebuild from scratch |
| TabNavigator.tsx | ⚠️ Update | New 5-tab structure |

### What Needs Creating
| Component | Priority | Notes |
|-----------|----------|-------|
| PlayScreen.tsx | High | Mini-games hub |
| ActivityScreen.tsx | High | Pending + history + milestones |
| StatsSection (Profile) | Medium | Stats dashboard with shareable card |
| ParkGuidesSection | Medium | Browse/read park guides |
| WalletQuickUse.tsx | High | Apple Wallet-style quick scan |
| WalletManager.tsx | High | Add/manage passes in Profile |

---

## Architecture: Reusable Systems

### 1. Morph Animation System

Extract the hero morph pattern into reusable hooks/components:

```
src/
  hooks/
    useMorphAnimation.ts    # Shared animation values & handlers
    useSpringPress.ts       # Press-in/press-out spring feedback
  components/
    MorphableModal/
      MorphableModal.tsx    # Container with backdrop + morph logic
      MorphingPill.tsx      # The morphing element itself
```

**useMorphAnimation** provides:
- `morphProgress`, `backdropOpacity`, `contentFade`
- `openMorph()`, `closeMorph()`
- Interpolation helpers for position, size, borderRadius

This allows any screen to have the same polish without duplicating 500+ lines.

### 2. Spring Press Feedback

Currently duplicated everywhere. Extract:

```typescript
// useSpringPress.ts
const { scaleValue, pressHandlers } = useSpringPress({
  pressedScale: 0.97,
  springConfig: RESPONSIVE_SPRING,
});
```

### 3. Card Components

Standardize card patterns:

```
src/
  components/
    cards/
      BaseCard.tsx          # Shadow, border radius, press feedback
      ContentCard.tsx       # For content items (news, guides)
      ActionCard.tsx        # For tappable actions
      StatCard.tsx          # For stats display
```

### 4. Animation Constants

Centralize spring physics:

```typescript
// src/constants/animations.ts
export const SPRINGS = {
  responsive: { damping: 16, stiffness: 180, mass: 0.8 },
  bouncy: { damping: 14, stiffness: 120, mass: 1 },
  morph: { damping: 14, stiffness: 42, mass: 1.2 },
};

export const TIMING = {
  fast: 150,
  normal: 250,
  slow: 400,
};
```

---

## Implementation Phases

### Phase 0: Prep Work
**Goal**: Set up reusable architecture before building features

- [ ] Extract `useMorphAnimation` hook from HomeScreen
- [ ] Extract `useSpringPress` hook
- [ ] Create animation constants file
- [ ] Create BaseCard component
- [ ] Update TabNavigator to 5-tab structure (placeholder screens)
- [ ] Remove SearchScreen.tsx
- [ ] Rename LogScreen → ActivityScreen (placeholder)

**Deliverable**: Clean foundation, new tab structure visible

---

### Phase 1: Complete Log Flow
**Goal**: Seamless logging with rating option from Home

- [ ] Add "Quick Log" vs "Rate Now" prompt to LogConfirmationCard
- [ ] Connect "Rate Now" to RatingModal
- [ ] Handle success states for both paths
- [ ] Ensure pending logs appear in Activity tab
- [ ] Polish animations and transitions
- [ ] Haptic feedback at key moments

**Deliverable**: Full log → rate flow working from Home

---

### Phase 2: Rebuild Wallet
**Goal**: Apple Wallet-style experience that actually works

- [ ] Design wallet data model (tickets, passes, barcodes)
- [ ] Build WalletQuickUse component (from Scan button)
  - [ ] Card stack animation
  - [ ] Swipe to select
  - [ ] QR/barcode display with brightness boost
- [ ] Build WalletManager in Profile
  - [ ] View all passes
  - [ ] Add pass flow (scan barcode or manual entry)
  - [ ] Set default
  - [ ] Delete with confirmation
- [ ] Connect Scan button to WalletQuickUse
- [ ] Polish animations throughout

**Deliverable**: Wallet works end-to-end

---

### Phase 3: Activity Screen
**Goal**: Pending ratings inbox + log history + milestones

- [ ] Design ActivityScreen layout
  - [ ] Pending ratings section (top priority)
  - [ ] Recent logs section (scrollable history)
  - [ ] Credit milestones section
- [ ] Tap pending item → RatingModal
- [ ] Empty states for each section
- [ ] Pull to refresh
- [ ] "On This Day" integration (if time)

**Deliverable**: Activity tab fully functional

---

### Phase 4: Discover Screen
**Goal**: Encyclopedia for parks, coasters, and guides

- [ ] Design Discover layout
  - [ ] Search bar at top
  - [ ] Categories: Parks, Coasters, Park Guides
  - [ ] Featured/trending sections
- [ ] Park browse experience
  - [ ] List/grid view
  - [ ] Filter by region, type
  - [ ] Park detail view
- [ ] Coaster browse experience
  - [ ] Rankings/lists
  - [ ] Coaster detail view
- [ ] Park Guides section
  - [ ] Guide cards
  - [ ] Guide reader view
  - [ ] Comments section (read-only for now)

**Deliverable**: Discover tab browsable

---

### Phase 5: Play Screen
**Goal**: Mini-games hub for daily engagement

- [ ] Design PlayScreen layout
  - [ ] Game cards/tiles
  - [ ] Daily challenge highlight
  - [ ] Streak/progress indicators
- [ ] Integrate existing mini-games (3-4)
  - [ ] Polish to match app design language
  - [ ] Add proper entry/exit animations
  - [ ] Score tracking
- [ ] Game completion rewards (future: trading cards)

**Deliverable**: Play tab with working games

---

### Phase 6: Profile & Stats
**Goal**: Stats dashboard and complete profile experience

- [ ] Stats dashboard design
  - [ ] Credit count (prominent)
  - [ ] Top coasters
  - [ ] Parks visited
  - [ ] Ride history charts
- [ ] Shareable stat card
  - [ ] Beautiful template
  - [ ] Share to social media
- [ ] Connect existing sections
  - [ ] Wallet management
  - [ ] Rating criteria setup
  - [ ] App settings

**Deliverable**: Profile complete with stats

---

### Phase 7: Polish & Launch Prep
**Goal**: Bug fixes, performance, final polish

- [ ] Animation performance audit
- [ ] Fix any remaining bugs
- [ ] Empty states for all screens
- [ ] Loading states / skeletons
- [ ] Error handling
- [ ] Offline mode basics
- [ ] App icon and splash screen
- [ ] Store screenshots and description

**Deliverable**: Ready for TestFlight / beta

---

## File Structure (Target)

```
src/
  components/
    cards/
      BaseCard.tsx
      ContentCard.tsx
      ActionCard.tsx
      StatCard.tsx
    morph/
      MorphableModal.tsx
      MorphingPill.tsx
    wallet/
      WalletQuickUse.tsx
      WalletCard.tsx
      PassDisplay.tsx
      AddPassFlow.tsx
    games/
      GameCard.tsx
      GameContainer.tsx
    guides/
      GuideCard.tsx
      GuideReader.tsx
    NewsCard.tsx
    SearchModal.tsx
    LogModal.tsx
    LogConfirmationCard.tsx
    RatingModal.tsx
    MorphingActionButton.tsx
    ...

  screens/
    HomeScreen.tsx
    DiscoverScreen.tsx
    PlayScreen.tsx
    ActivityScreen.tsx
    ProfileScreen.tsx
    WalletScreen.tsx (under Profile)
    CriteriaSetupScreen.tsx (under Profile)
    StatsScreen.tsx (under Profile)

  hooks/
    useMorphAnimation.ts
    useSpringPress.ts
    useWallet.ts
    useRideLog.ts
    ...

  constants/
    animations.ts
    layout.ts
    ...

  stores/
    rideLogStore.ts
    walletStore.ts
    ...

  navigation/
    TabNavigator.tsx
    ...
```

---

## Success Metrics (V1)

- [ ] Can log a ride in < 10 seconds from Home
- [ ] Can rate a ride with full criteria
- [ ] Can scan a ticket and see it at the gate
- [ ] Can browse and read park guides
- [ ] Can play at least 3 mini-games
- [ ] Can see stats and share a stat card
- [ ] All animations run at 60fps
- [ ] No crashes in normal usage

---

## Notes

- **Animation Library**: Sticking with React Native Animated API (not Reanimated) for now. Migrating mid-project is risky.
- **Data Source**: RCDB integration is critical. Start with static dataset, add sync later.
- **Monetization**: Free tier is generous. Pro tier ($29.99/year) unlocks advanced stats, shareable content, custom criteria weights, offline mode.
- **Park Guides**: User will write first 15-20. Community can comment. Paid users can submit for review.

---

*This plan will be updated as development progresses.*
