# TrackR Screen Specifications

All screens live in `src/screens/`. Screens are rendered within the 5-tab bottom navigation structure.

---

## HomeScreen (`HomeScreen.tsx`)

**Purpose**: Daily dashboard and primary action hub. Users open the app here.

**Status**: Functional

**Size**: ~3298 lines (largest file in the codebase -- contains inline morph logic)

**Key Features**:
- Collapsible header with search bar and 3 action buttons (Log, Search, Scan)
- Header collapses on scroll down, expands on scroll up
- Action buttons morph between pill (expanded) and circle (collapsed) states
- Each action button morphs into a full-screen modal via MorphingPill
- News feed below header using FlatList
- All scroll-driven animations use Reanimated shared values on UI thread

**Contains**:
- Header section with SearchBar + ActionPills
- MorphingPill instances for Log, Search, and Scan modals
- LogModal, SearchModal content
- LogConfirmationCard and RatingModal integration
- News feed with NewsCard components
- Tab reset handler registration

**Navigation**: None (all interactions are in-screen overlays via morphs)

**See also**: `design/home-screen.md` for detailed spec.

---

## DiscoverScreen (`DiscoverScreen.tsx`)

**Purpose**: Encyclopedia for browsing parks, coasters, rankings, and park guides.

**Status**: Needs rebuild

**Planned Features**:
- Search bar at top
- Category browsing: Parks, Coasters, Park Guides
- Featured/trending sections
- Park detail views with coaster lists
- Coaster detail views with stats
- Park guide reader

**Current State**: Placeholder or outdated implementation. Full rebuild planned for Phase 4.

---

## PlayScreen (`PlayScreen.tsx`)

**Purpose**: Mini-games hub for daily engagement and fun.

**Status**: Placeholder

**Planned Features**:
- Game card/tile grid
- Daily challenge highlight
- Streak and progress indicators
- 3-4 mini-games at launch
- Score tracking
- Game completion rewards

**Current State**: Placeholder screen with basic layout. Full implementation in Phase 5.

---

## ActivityScreen (`ActivityScreen.tsx`)

**Purpose**: Personal tracking inbox -- pending ratings, recent ride history, and credit milestones.

**Status**: In progress

**Key Features**:
- Pending ratings section (top priority, shows unrated logs)
- Recent logs section (scrollable ride history)
- Credit milestones section
- Tap pending item to open RatingModal
- Badge count on Activity tab reflects pending count

**Data Source**: `rideLogStore` -- `getPendingLogs()` for pending section, `getAllLogs()` for history.

**Current State**: Basic implementation exists. Full polish planned for Phase 3.

---

## ProfileScreen (`ProfileScreen.tsx`)

**Purpose**: Settings hub, stats dashboard, wallet management, and rating criteria configuration.

**Status**: Functional

**Key Features**:
- User stats summary (credit count, ride count)
- Wallet section (links to WalletScreen -- currently broken)
- Rating criteria setup (links to CriteriaSetupScreen)
- App settings
- Future: shareable stat card generation

**Navigation**: Pushes to sub-screens (WalletScreen, CriteriaSetupScreen) via in-screen overlays or future stack navigation.

---

## WalletScreen (`WalletScreen.tsx`)

**Purpose**: Digital wallet for managing theme park tickets and passes.

**Status**: Broken -- full rebuild planned for Phase 2

**Do NOT modify** until Phase 2 begins. The entire wallet system (screen + components + context + hooks) will be rebuilt from scratch.

---

## CriteriaSetupScreen (`CriteriaSetupScreen.tsx`)

**Purpose**: Configure personal rating criteria and weights for the ride rating system.

**Status**: Functional

**Key Features**:
- List of rating criteria with name, weight, and icon
- Drag to reorder (if implemented)
- Weight adjustment with constraints (must sum to 100)
- Lock individual criteria weights
- Add/remove custom criteria (Pro tier: unlimited; Free tier: max 3 custom)
- Save updates via `updateCriteria()` in rideLogStore

**Default Criteria**: Airtime (25%), Intensity (25%), Smoothness (20%), Theming (15%), Pacing (15%)
