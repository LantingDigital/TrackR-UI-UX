# TrackR - Claude Code Context Document

> **Last Updated**: December 8, 2024
> **Current Phase**: Phase 0 Complete → Ready for Phase 1
> **Status**: Building V1 MVP

---

## Project Vision

**TrackR** is a premium React Native (Expo) mobile app for roller coaster enthusiasts. It's not just a logging app—it's the **home base** for the coaster community: a place they open daily for news, games, planning, and tracking.

### Design Philosophy
- Light mode, minimal aesthetic (inspired by Apple apps, Airbnb)
- Premium feel with polished micro-animations at 60fps
- Floating card design with shadows on blur backgrounds
- Every interaction should feel delightful
- Spring physics on all morphs and transitions

### Target Audience
- Roller coaster enthusiasts ("thoosies")
- Park-goers who want to track their ride history
- Users who appreciate premium, polished app experiences

---

## V1 MVP Scope

| Category | Features | Status |
|----------|----------|--------|
| **Core Logging** | Credit tracking, RCDB data, customizable rating system, seat/row logging | In Progress |
| **Wallet/Scan** | Digital wallet for tickets/passes (Apple Wallet-style) | Phase 2 |
| **Daily Engagement** | Mini-games (3-4), news feed with pinned parks | Phase 5 |
| **Planning Utility** | Curated park guides (15-20 at launch) | Phase 4 |
| **Shareability** | Stat cards for social media | Phase 6 |
| **Milestones** | Credit count celebrations, "On This Day" memories | Phase 3 |

**V1.1 (Post-MVP)**: Trip planner (single day and multi-day)

**See full roadmap**: `.claude/plans/v1-mvp-roadmap.md`
**Testing instructions**: `.claude/testing/`

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Core framework |
| Expo SDK 52 | Development platform |
| React Native Animated | Animation library (NOT Reanimated) |
| React Navigation | Navigation (Bottom Tabs + Stack) |
| @expo/vector-icons | Icons (Ionicons) |
| expo-blur | BlurView for frosted glass effects |
| expo-haptics | Haptic feedback |

---

## Navigation Structure

### 5-Tab Layout (Implemented in Phase 0)

```
Home | Discover | Play | Activity | Profile
  🏠      🧭       🎮       ⏱        👤
```

| Tab | Purpose | Current State |
|-----|---------|---------------|
| **Home** | News feed, action buttons (Log/Search/Scan morphs), "On This Day" | ✅ Fully functional |
| **Discover** | Browse parks, coasters, rankings, park guides | 🔄 Needs rebuild |
| **Play** | Mini-games hub | 📝 Placeholder ready |
| **Activity** | Pending ratings, recent logs, credit milestones | 📝 Placeholder ready |
| **Profile** | Stats dashboard, wallet management, settings, criteria | ✅ Functional |

---

## Core User Flows

### Log Flow (from Home)
```
Home → Tap "Log" button
  → Log morph opens (hero animation)
  → Search for coaster
  → Select from results
  → LogConfirmationCard appears
  → User chooses: "Quick Log" or "Rate Now"  ← Phase 1 work
  → Success feedback
  → Morph closes back to Home
```

### Wallet Flow (Phase 2)
```
Quick Use (Home):
  Home → Tap "Scan" button → Wallet quick-use → Show QR/barcode

Management (Profile):
  Profile → Wallet section → Add/manage/delete passes
```

### Search Flow (from Home)
```
Home → Tap search bar → Morph opens
  → Type query → Results: Coasters, Parks, Guides, News
  → Tap result → Detail view
  → Back → Close morph
```

---

## Project Structure

```
src/
├── components/
│   ├── cards/
│   │   ├── BaseCard.tsx          # ✅ NEW - Foundation card component
│   │   └── index.ts
│   ├── wallet/                   # ❌ Broken - Rebuild in Phase 2
│   ├── MorphingActionButton.tsx  # ✅ Pill ↔ circle morphing
│   ├── SearchModal.tsx           # ✅ Search in morph
│   ├── LogModal.tsx              # ✅ Log search
│   ├── LogConfirmationCard.tsx   # ✅ Confirm before logging
│   ├── RatingModal.tsx           # ✅ Full rating with sliders
│   ├── NewsCard.tsx              # ✅ News feed cards
│   └── index.ts
│
├── screens/
│   ├── HomeScreen.tsx            # ✅ Hero morphs, news feed
│   ├── DiscoverScreen.tsx        # 🔄 Needs rebuild
│   ├── PlayScreen.tsx            # ✅ NEW - Placeholder
│   ├── ActivityScreen.tsx        # ✅ NEW - Pending + history
│   ├── ProfileScreen.tsx         # ✅ Settings hub
│   ├── WalletScreen.tsx          # ❌ Broken - Rebuild in Phase 2
│   └── CriteriaSetupScreen.tsx   # ✅ Rating criteria
│
├── hooks/
│   ├── useSpringPress.ts         # ✅ NEW - Press feedback hook
│   ├── useMorphAnimation.ts      # ✅ NEW - Hero morph hook
│   └── index.ts
│
├── constants/
│   ├── animations.ts             # ✅ NEW - Springs, timing, scales
│   └── index.ts
│
├── navigation/
│   └── TabNavigator.tsx          # ✅ UPDATED - 5-tab structure
│
├── contexts/
│   └── TabBarContext.tsx         # ✅ Tab bar visibility control
│
├── stores/
│   └── rideLogStore.ts           # ✅ Ride log state management
│
├── theme/
│   ├── colors.ts                 # ✅ Color palette
│   ├── spacing.ts                # ✅ Spacing scale
│   └── radius.ts                 # ✅ Border radius presets
│
└── data/
    ├── mockNews.ts               # ✅ Sample news data
    └── mockSearchData.ts         # ✅ Sample coaster/park data
```

---

## Animation System

### The "Hero Morph" Pattern
The signature interaction: elements morph from their origin position into full-screen modals with spring physics.

### Animation Constants (`src/constants/animations.ts`)

```typescript
// Spring Presets
SPRINGS.responsive      // Snappy feedback (buttons, cards)
SPRINGS.responsiveLayout // Same but useNativeDriver: false
SPRINGS.bouncy          // Playful with overshoot
SPRINGS.morph           // Smooth modal expansion

// Timing
TIMING.instant          // 100ms
TIMING.fast             // 150ms
TIMING.normal           // 250ms
TIMING.slow             // 400ms
TIMING.morphExpand      // 500ms

// Press Scales
PRESS_SCALES.subtle     // 0.98 (cards)
PRESS_SCALES.normal     // 0.97 (buttons)
PRESS_SCALES.strong     // 0.95 (CTAs)
```

### Reusable Hooks

**useSpringPress** - Press feedback for tappable elements:
```typescript
const { scaleValue, pressHandlers, animatedStyle } = useSpringPress({
  scale: 0.97,
  opacity: 0.9,
});
```

**useMorphAnimation** - Hero morph for modals:
```typescript
const morph = useMorphAnimation({
  originPosition: { top, left, width, height, borderRadius },
  finalPosition: { top, left, width, height, borderRadius },
});
morph.open();
morph.close();
```

---

## Development Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Prep Work | ✅ Complete | Hooks, constants, tab structure |
| 1 | Log Flow | 🔜 Next | Quick Log vs Rate Now prompt |
| 2 | Wallet | Pending | Rebuild from scratch |
| 3 | Activity | Pending | Full pending/history/milestones |
| 4 | Discover | Pending | Parks, coasters, guides |
| 5 | Play | Pending | Mini-games integration |
| 6 | Profile & Stats | Pending | Stats dashboard, shareable cards |
| 7 | Polish | Pending | Bug fixes, performance, launch prep |

---

## Commands

```bash
# Start development (iOS Simulator)
npx expo start --ios --clear

# Start for physical device
npx expo start

# Type check
npx tsc --noEmit
```

---

## Testing

Testing instructions are in `.claude/testing/`:
- `README.md` - Overview and quality standards
- `phase-0-testing.md` - Current phase testing checklist

---

## Key Design Decisions

### Why React Native Animated (not Reanimated)?
Project started with Animated API. Migrating mid-project risks breaking the polished animations. Current approach works well.

### Why 5 tabs instead of 4?
- Visual balance (5 looks better than 4)
- Elevates mini-games to first-class feature
- Differentiates from other coaster apps
- Signals "this app is fun, not just utility"

### Why Log from Home instead of dedicated Log tab?
- The morph animation IS the experience
- Logging should be quick, not a destination
- Activity tab handles the "inbox" of pending ratings

---

## Monetization Model

### Free Tier
- Unlimited logging
- Credit count
- Basic stats
- 3 custom rating criteria
- Mini-games

### Pro Tier ($29.99/year)
- Unlimited custom rating criteria + weights
- Advanced stats dashboard
- Shareable content generation
- Seat/row logging history
- "On This Day" memories
- Offline mode
- Priority RCDB sync

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Accent Primary | `#CF6769` | Buttons, highlights, active states |
| Background Page | `#F7F7F7` | Screen backgrounds |
| Background Card | `#FFFFFF` | Card surfaces |
| Text Primary | `#000000` | Headings, important text |
| Text Secondary | `#666666` | Body text |
| Text Meta | `#999999` | Timestamps, labels |
| Border Subtle | `#E5E5E5` | Dividers, outlines |
| Shadow | `rgba(50,50,50,0.16)` | Card shadows |

---

## Known Issues

1. **Wallet/Scan button**: Currently broken - intentional, rebuilding in Phase 2
2. **HomeScreen ref warning**: TypeScript ref type mismatch - cosmetic only
3. **Discover screen**: Needs full rebuild to match new direction

---

## Next Steps (Phase 1)

1. Add "Quick Log" vs "Rate Now" choice to LogConfirmationCard
2. Connect "Rate Now" to RatingModal from Home screen
3. Handle success states for both paths
4. Ensure logs appear correctly in Activity tab
5. Polish animations and add haptic feedback

---

*For detailed roadmap, see `.claude/plans/v1-mvp-roadmap.md`*
*For testing instructions, see `.claude/testing/`*
