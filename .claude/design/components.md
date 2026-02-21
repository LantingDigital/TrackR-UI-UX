# TrackR Component Inventory

All components live in `src/components/`. This document catalogs every component, its purpose, and current status.

---

## Foundation Components

### BaseCard (`cards/BaseCard.tsx`)
Foundation card component used by all card-based UI. Provides consistent shadow, border radius, and spring press feedback via `useSpringPress`.

- Props: children, style, onPress, pressScale
- Uses: `shadows.card`, `radius.card`, `useSpringPress`
- Status: Active

### TabBarIcon (`TabBarIcon.tsx`)
Custom tab bar icon component with badge support.

- Status: Active

---

## Morphing / Animation Components

### MorphingActionButton (`MorphingActionButton.tsx`)
Pill-shaped action button that morphs between expanded (pill with label) and collapsed (circle with icon) states. Used in the Home screen header for Log, Search, and Scan buttons.

- Morphs between pill and circle based on scroll position
- Spring-animated transitions between states
- Status: Active

### MorphingPill (`MorphingPill.tsx`)
Generic element that can morph from its origin position into an expanded full-screen modal overlay. This is the core building block of the "hero morph" pattern used across the app.

- Accepts origin measurements and expands to fill screen
- Handles backdrop blur, content fade-in, bounce arc
- Used by: Log morph, Search morph, Scan morph
- Status: Active

---

## Modal Components

### SearchModal (`SearchModal.tsx`)
Search interface that appears inside a morph overlay. Provides a text input with debounced autocomplete results organized by category (coasters, parks, guides, news).

- Renders inside MorphingPill expansion
- Section cards for focused/unfocused states
- Status: Active

### LogModal (`LogModal.tsx`)
Coaster search interface for the logging flow. User searches for a coaster, then selects one to begin logging.

- Renders inside MorphingPill expansion
- On coaster selection, triggers LogConfirmationCard
- Status: Active

### LogConfirmationCard (`LogConfirmationCard.tsx`)
Confirmation card shown after selecting a coaster to log. Displays coaster name, park name, and hero image. Presents two action paths:

- **Quick Log** (outlined button): Calls `addQuickLog()`, shows success checkmark, auto-closes. Log is stored with `isPendingRating: true`.
- **Rate Now** (filled primary button): Calls `addQuickLog()`, card slides out, RatingModal opens with the new log.
- Status: Active (Phase 1 core)

### RatingModal (`RatingModal.tsx`)
Full rating interface with collapsible hero header and criteria sliders. Each slider has half-point precision (1.0-10.0 range). Displays a weighted score calculated from user's criteria configuration.

- Collapsing header on scroll
- Slider components for each criterion
- Submit calls `completeRating()` on the ride log store
- Status: Active

---

## Feed Components

### NewsCard (`NewsCard.tsx`)
Card for the Home screen news feed. Displays article title, source, image, and timestamp.

- Uses BaseCard for consistent styling
- Press feedback via useSpringPress
- Status: Active

### SearchCarousel (`SearchCarousel.tsx`)
Horizontal carousel component used within search results.

- Status: Active

---

## Search Components

### SearchBar (`SearchBar.tsx`)
Search input bar used in the Home screen header. Has expanded and collapsed visual states that respond to scroll position.

- Expanded: Full width with placeholder text
- Collapsed: Compact width
- Tapping triggers morph into SearchModal
- Status: Active

### ActionPill (`ActionPill.tsx`)
Small pill-shaped button used in the Home screen header row alongside the search bar. Labels include "Log", "Search", "Scan".

- Transitions to circle on scroll collapse
- Status: Active

### SearchOverlay (`SearchOverlay.tsx`)
Overlay container for search results display.

- Status: Active

### SearchResultRow (`SearchResultRow.tsx`)
Individual search result row showing coaster/park name, type icon, and metadata.

- Status: Active

### RotatingPlaceholder (`RotatingPlaceholder.tsx`)
Animated placeholder text that rotates through search suggestions in the search bar.

- Cycles through hint strings with crossfade animation
- Status: Active

### SkeletonLoader (`SkeletonLoader.tsx`)
Shimmer loading placeholder for content that is still fetching.

- Status: Active

---

## Wallet Components (Phase 2 - Currently Broken)

All wallet components in `src/components/wallet/` are from a previous implementation that needs to be rebuilt from scratch in Phase 2. Do NOT use or modify these until the Phase 2 rebuild.

| Component | File | Notes |
|-----------|------|-------|
| WalletCardStack | `wallet/WalletCardStack.tsx` | Card stack animation |
| WalletCard | `wallet/WalletCard.tsx` | Individual pass card |
| ScanModal | `wallet/ScanModal.tsx` | QR/barcode scanner |
| QuickActionsMenu | `wallet/QuickActionsMenu.tsx` | Quick action buttons |
| GateModeOverlay | `wallet/GateModeOverlay.tsx` | Full-screen gate display |
| PassHeroCard | `wallet/PassHeroCard.tsx` | Large pass display |
| PassDetailView | `wallet/PassDetailView.tsx` | Pass detail sheet |
| PassPreviewCard | `wallet/PassPreviewCard.tsx` | Compact pass preview |
| QRCodeDisplay | `wallet/QRCodeDisplay.tsx` | QR/barcode renderer |
| AddTicketFlow | `wallet/AddTicketFlow.tsx` | Add new pass flow |
| EmptyWalletPrompt | `wallet/EmptyWalletPrompt.tsx` | Empty state |
| CameraScanner | `wallet/CameraScanner.tsx` | Camera-based scanner |

---

## Export Index

Components are re-exported from `src/components/index.ts` and `src/components/cards/index.ts` for clean imports.
