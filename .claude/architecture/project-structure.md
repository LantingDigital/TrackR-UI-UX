# Project Structure

File tree for the TrackR React Native (Expo SDK 54) project.

---

## Root

```
/
├── src/                    # All application source code
├── .claude/                # Claude Code documentation tree
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── CLAUDE.md               # Root context document
└── firebase.json           # Firebase configuration
```

---

## Source Tree

```
src/
├── components/             # Reusable UI components
│   ├── cards/
│   │   ├── BaseCard.tsx           # Foundation card with shadow + press feedback
│   │   └── index.ts               # Re-exports
│   │
│   ├── wallet/                    # Wallet components (BROKEN - Phase 2 rebuild)
│   │   ├── WalletCardStack.tsx
│   │   ├── WalletCard.tsx
│   │   ├── ScanModal.tsx
│   │   ├── QuickActionsMenu.tsx
│   │   ├── GateModeOverlay.tsx
│   │   ├── PassHeroCard.tsx
│   │   ├── PassDetailView.tsx
│   │   ├── PassPreviewCard.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   ├── AddTicketFlow.tsx
│   │   ├── EmptyWalletPrompt.tsx
│   │   ├── CameraScanner.tsx
│   │   └── index.ts
│   │
│   ├── MorphingActionButton.tsx   # Pill <-> circle morphing action button
│   ├── MorphingPill.tsx           # Hero morph container (origin -> full-screen)
│   ├── SearchModal.tsx            # Search interface (inside morph)
│   ├── LogModal.tsx               # Log search interface (inside morph)
│   ├── LogConfirmationCard.tsx    # Quick Log / Rate Now prompt
│   ├── RatingModal.tsx            # Full rating with sliders
│   ├── NewsCard.tsx               # News feed card
│   ├── SearchBar.tsx              # Search input bar (expand/collapse)
│   ├── ActionPill.tsx             # Small pill button (Log, Search, Scan)
│   ├── SearchOverlay.tsx          # Search results overlay
│   ├── SearchResultRow.tsx        # Individual search result
│   ├── SearchCarousel.tsx         # Horizontal search carousel
│   ├── RotatingPlaceholder.tsx    # Animated placeholder text
│   ├── SkeletonLoader.tsx         # Shimmer loading placeholder
│   ├── TabBarIcon.tsx             # Custom tab bar icon
│   └── index.ts                   # Re-exports
│
├── screens/                # Screen components (one per tab + sub-screens)
│   ├── HomeScreen.tsx             # Main dashboard (~3298 lines)
│   ├── DiscoverScreen.tsx         # Browse parks/coasters (needs rebuild)
│   ├── PlayScreen.tsx             # Mini-games hub (placeholder)
│   ├── ActivityScreen.tsx         # Pending ratings + history
│   ├── ProfileScreen.tsx          # Settings + stats
│   ├── WalletScreen.tsx           # Digital wallet (BROKEN)
│   └── CriteriaSetupScreen.tsx    # Rating criteria config
│
├── hooks/                  # Custom React hooks
│   ├── useSpringPress.ts          # Spring press feedback for tappables
│   ├── useMorphAnimation.ts       # Hero morph animation system
│   ├── useWallet.ts               # Wallet state hook (BROKEN)
│   └── index.ts                   # Re-exports
│
├── constants/              # App-wide constants
│   ├── animations.ts              # Spring presets, timing, scales, delays
│   └── index.ts                   # Re-exports
│
├── navigation/             # Navigation configuration
│   ├── TabNavigator.tsx           # 5-tab bottom navigator + custom tab bar
│   ├── RootNavigator.tsx          # Root navigator wrapper
│   └── index.ts                   # Re-exports
│
├── contexts/               # React Contexts
│   ├── TabBarContext.tsx           # Tab bar visibility + screen reset
│   └── WalletContext.tsx          # Wallet state (BROKEN)
│
├── stores/                 # State management
│   ├── rideLogStore.ts            # Ride log state (module-level store)
│   └── index.ts                   # Re-exports
│
├── theme/                  # Design tokens
│   ├── colors.ts                  # Color palette
│   ├── spacing.ts                 # Spacing scale
│   ├── radius.ts                  # Border radius presets
│   ├── typography.ts              # Font sizes, weights, line heights
│   ├── shadows.ts                 # Shadow presets (iOS + Android)
│   ├── animations.ts              # Theme-level animation tokens
│   └── index.ts                   # Re-exports
│
├── types/                  # TypeScript type definitions
│   ├── rideLog.ts                 # RideLog, RatingCriteria, defaults, helpers
│   └── wallet.ts                  # Wallet types (BROKEN)
│
├── data/                   # Static/mock data
│   ├── mockNews.ts                # Sample news articles for feed
│   └── mockSearchData.ts          # Sample coasters, parks for search
│
├── services/               # External service integrations
│   ├── parkDetection.ts           # Park proximity detection
│   └── walletStorage.ts           # Wallet persistence (BROKEN)
│
└── utils/                  # Utility functions
    └── parkAssets.ts              # Park image/asset helpers
```

---

## Key Observations

1. **HomeScreen.tsx is the largest file** (~3298 lines). Contains inline morph overlay logic. Refactoring to extract more into MorphingPill and dedicated hooks is a future improvement.

2. **Wallet system is broken** across multiple directories (components/wallet, screens/WalletScreen, hooks/useWallet, contexts/WalletContext, services/walletStorage, types/wallet). All will be rebuilt in Phase 2.

3. **No stack navigators** currently -- all modals are in-screen overlays. Stack navigation may be added for Discover detail views in Phase 4.

4. **Theme has two animation files**: `src/constants/animations.ts` (primary, detailed) and `src/theme/animations.ts` (theme-level). The constants file is the authoritative source for animation values.
