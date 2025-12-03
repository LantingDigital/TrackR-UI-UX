# TrackR - Claude Code Context Document

> **Last Updated**: December 2, 2024
> **Current Focus**: Hero Morph Search Animation Bug Fixes
> **Status**: Active debugging - animations have residual issues

---

## Project Overview

**TrackR** is a React Native (Expo) mobile app for roller coaster enthusiasts. The app allows users to track ride credits, discover parks, read news, and log experiences.

### Tech Stack
- **Framework**: React Native with Expo SDK 52
- **Animation**: React Native Animated API (NOT Reanimated)
- **Navigation**: React Navigation
- **Icons**: @expo/vector-icons (Ionicons)
- **Blur Effects**: expo-blur (BlurView)

### Key Design Principles
- Light mode, minimal aesthetic (inspired by Apple apps, Airbnb)
- Premium feel with polished micro-animations
- Floating card design with shadows on blur backgrounds

---

## Current Feature: Hero Morph Search Modal

### What It Is
When the user taps the search bar on the home screen, it performs a "hero morph" animation:
1. The search bar pill EXPANDS into a full-screen search card
2. A frosted blur backdrop fades in behind it
3. Section cards (Recent Searches, Nearby Rides, etc.) cascade in with a staggered "projector screen" effect
4. On close, the reverse animation plays

### The Vision
- The pill-shaped search bar IS the morphing element (same DOM element transforms)
- Smooth, 60fps animations with subtle spring physics
- Action buttons (Log, Search, Scan) hide on open, morph back on close
- Content fades separately from the pill morph for better visual separation

---

## Architecture: Animation System

### Animated Values (HomeScreen.tsx)

| Value | Purpose | Range |
|-------|---------|-------|
| `animProgress` | Header collapse/expand on scroll | 0 (collapsed) → 1 (expanded) |
| `pillMorphProgress` | Search pill → full card morph | 0 (pill) → 1 (full card) |
| `backdropOpacity` | Blur backdrop fade | 0 (hidden) → 1 (visible) |
| `searchContentFade` | Content inside modal fades separately | 0 → 1 |
| `actionButtonsOpacity` | Sticky header + action buttons visibility | 0 → 1 |
| `actionButtonsScale` | Action buttons scale for morph effect | 0.5 → 1 |

### Animation Flow

**OPEN (handleSearchPress):**
```
1. setSearchVisible(true) - React state, renders modal elements
2. searchContentFade.setValue(0) - Reset content to hidden
3. actionButtonsOpacity.setValue(0) - Immediately hide sticky header
4. actionButtonsScale.setValue(0.5) - Prepare for scale-up on close
5. Parallel animations start:
   - pillMorphProgress: 0 → 1 (spring, 350ms)
   - backdropOpacity: 0 → 1 (timing, 300ms)
   - searchContentFade: 0 → 1 (timing, 200ms, delay 200ms)
```

**CLOSE (handleSearchClose):**
```
1. Keyboard.dismiss()
2. SEQUENCE:
   a. searchContentFade: 1 → 0 (150ms) - Content fades first
   b. PARALLEL:
      - pillMorphProgress: 1 → 0 (spring)
      - backdropOpacity: 1 → 0 (250ms)
      - SEQUENCE:
        - delay(150ms)
        - PARALLEL:
          - actionButtonsOpacity: 0 → 1 (250ms)
          - actionButtonsScale: 0.5 → 1 (250ms)
3. .start() callback: setSearchVisible(false)
```

---

## Bug Fix History

### Bug 1: Sticky Header Opacity Jump (FIXED - Previous Session)
**Problem**: When closing modal, action buttons and search bar "popped in" instantly.

**Root Cause**: Line 395 used `opacity: searchVisible ? 0 : 1` (React boolean state), which only changed when `setSearchVisible(false)` was called at the END of animations.

**Fix**: Changed to `opacity: actionButtonsOpacity` (animated value that transitions during close).

**File**: `HomeScreen.tsx` line 395

---

### Bug 2: Opening Glitch + Shadow Jump (FIXED - This Session)
**Problem**:
1. Brief jitter when tapping search bar to open
2. Search bar shadow appeared instantly on close (no animation)

**Root Cause**: Line 397 had a SECOND redundant opacity: `opacity: searchVisible ? 0 : 1` on the inner View. This caused:
- Timing mismatch on open (React state vs animated value)
- Shadow jump on close (boolean opacity stayed 0, then jumped to 1)

**Fix**: Removed the redundant opacity from line 397. Parent's `actionButtonsOpacity` now controls the entire sticky header.

**File**: `HomeScreen.tsx` line 397
**Change**: `{ paddingHorizontal: 0, opacity: searchVisible ? 0 : 1 }` → `{ paddingHorizontal: 0 }`

---

## Current State (As of December 2, 2024)

### What Works
- Search modal opens and closes
- Blur backdrop fades in/out
- Pill morphs into larger card
- Section cards have staggered cascade animation
- Action buttons animate back on close (fade + scale)

### Known Remaining Issues (User Just Reported)
The user mentioned "more issues" but hasn't specified them yet. Based on the animation system, potential issues could be:
- Timing still feels off
- Visual glitches during transitions
- Elements not perfectly synchronized
- Performance issues (frame drops)

**STATUS: Waiting for user to describe the specific issues**

---

## Key Files

### `/src/screens/HomeScreen.tsx`
**Purpose**: Main home screen with header, search bar, action buttons, and news feed.

**Key Sections**:
- Lines 37-48: Animated value declarations
- Lines 106-137: `handleSearchPress` - opens modal
- Lines 139-183: `handleSearchClose` - closes modal with sequenced animation
- Lines 393-510: Sticky header render (search bar + action buttons)
- Lines 517-600: Hero morph search modal elements (blur + morphing pill)

**Animation Interpolations** (around lines 250-350):
- `morphingPillTop`, `morphingPillLeft`, `morphingPillWidth`, `morphingPillHeight`
- `morphingPillBorderRadius`
- `searchBarWidth`, `searchBarHeight`, `searchBarScale`

### `/src/components/SearchModal.tsx`
**Purpose**: Content for the expanded search experience.

**Key Features**:
- `sectionAnimations` useMemo - creates stable interpolations for staggered cascade
- Renders: Recent Searches, Nearby Rides carousel, Nearby Parks carousel, Trending
- Receives `morphProgress` and `contentOpacity` from HomeScreen for animation sync

### `/src/components/SearchCarousel.tsx`
**Purpose**: Horizontal scrolling carousel for rides/parks.

**Card Dimensions**: 120x120 (square cards)

### `/src/components/MorphingActionButton.tsx`
**Purpose**: Action buttons (Log, Search, Scan) that morph between pill and circle states.

**Animation**: Uses delayed progress with staggered timing (50ms between each button).

---

## Animation Parameters

### Spring Physics (used for morphs)
```javascript
{
  damping: 20,      // Controls oscillation (higher = less bounce)
  stiffness: 200,   // Controls speed (higher = faster)
  mass: 0.9,        // Controls inertia (lower = snappier)
}
```

### Timing Durations
| Animation | Duration | Notes |
|-----------|----------|-------|
| Backdrop fade in | 300ms | Simultaneous with pill morph |
| Backdrop fade out | 250ms | During close |
| Content fade in | 200ms | Delayed 200ms after open starts |
| Content fade out | 150ms | First step of close sequence |
| Button opacity return | 250ms | Delayed 150ms into close |
| Button scale return | 250ms | Parallel with opacity |

### Stagger Cascade (Section Cards)
Each section card animates with progressive delay:
- Section 1: starts at 50% of morphProgress
- Section 2: starts at 58% (+0.08)
- Section 3: starts at 66% (+0.08)
- Section 4: starts at 74% (+0.08)

Animation duration per section: 35% of progress range

---

## Component Hierarchy

```
HomeScreen
├── FlatList (news feed, paddingTop for header space)
├── Animated.View (stickyHeader, position: absolute)
│   ├── View (header row)
│   │   └── Pressable → Animated.View (search bar pill)
│   └── Animated.View (morphingButtonsContainer)
│       ├── MorphingActionButton (Log)
│       ├── MorphingActionButton (Search)
│       └── MorphingActionButton (Scan)
├── {searchVisible && BlurView} (backdrop, zIndex: 50)
├── {searchVisible && Animated.View} (morphing pill, zIndex: 100)
│   └── SearchModal (inputOnly mode)
└── {searchVisible && Animated.ScrollView} (section cards, zIndex: 100)
    └── SearchModal (sectionsOnly mode)
```

---

## Development Setup

### Running the App
```bash
cd /Users/Lanting-Digital-LLC/Documents/Projects/mobile-apps/UI-UX-test/TrackR
npx expo start --ios --clear
```

**Note**: Project uses Expo SDK 52. If using physical device with Expo Go, ensure Expo Go version matches (SDK 52 requires older Expo Go, or use iOS Simulator).

### Testing Animations
1. Run in iOS Simulator for accurate testing
2. Tap search bar to test open animation
3. Tap X or outside modal to test close animation
4. Observe: timing, smoothness, synchronization of elements

---

## Design Decisions & Rationale

### Why Animated API instead of Reanimated?
The project was started with React Native's built-in Animated API. While Reanimated would offer better performance for complex animations, migrating mid-feature would introduce risk. Current approach works but requires careful use of `useNativeDriver: false` for layout animations.

### Why Split Render (inputOnly/sectionsOnly)?
The morphing pill and section cards need to animate independently:
- Pill morph affects position/size
- Section cards have staggered cascade
- Separating them allows precise control over each animation layer

### Why actionButtonsOpacity for Sticky Header?
Using an animated value instead of boolean state allows smooth transitions. The sticky header fades in/out during modal animations rather than jumping.

---

## Troubleshooting Common Issues

### "Elements jump/pop instead of animating"
**Cause**: Likely using React state (boolean) instead of Animated.Value for opacity/visibility.
**Fix**: Replace `condition ? 0 : 1` with an interpolated Animated.Value.

### "Timing feels off / elements not synchronized"
**Cause**: Mismatched animation durations or delays.
**Fix**: Audit all `duration`, `delay`, and spring parameters to ensure they're coordinated.

### "Native Animated module warnings"
**Cause**: Some style properties (maxWidth, marginLeft) can't use native driver.
**Fix**: These are warnings, not errors. Use `useNativeDriver: false` for affected animations.

### "Flicker at animation start/end"
**Cause**: State changes triggering re-renders during animation.
**Fix**: Ensure `setSearchVisible` is called in `.start()` callback AFTER animations complete.

---

## Next Steps (Pending User Feedback)

The user reported additional issues. Once specified, the debugging process is:

1. **Identify**: What exactly is the visual problem?
2. **Reproduce**: At what point in the animation does it occur?
3. **Isolate**: Which animated value or component is responsible?
4. **Trace**: Follow the animation flow to find timing/value issues
5. **Fix**: Adjust interpolations, durations, or sequencing
6. **Verify**: Test the fix in iOS Simulator

---

## Contact / Handoff Notes

If another developer or AI picks this up:

1. **Read this file first** - it has the full context
2. **Check the plan file** at `/.claude/plans/peaceful-imagining-clarke.md` for even more detail
3. **The animation system is complex** - changes have cascading effects
4. **User feedback is key** - they know exactly what "feels wrong"
5. **Test in Simulator** - Expo Go version mismatches cause issues on physical devices

---

*This document should be updated after each significant change or debugging session.*
