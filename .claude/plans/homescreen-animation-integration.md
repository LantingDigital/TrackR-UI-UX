# HomeScreen Animation Integration Plan

## Goal
Replace the current keyframe-based animation with TRUE parabolic motion + large pill intermediate phase, while keeping all modal content and layout exactly as-is.

---

## Current State Analysis

### The Problem
The current animation uses React Native Animated with **keyframe interpolation**:
```typescript
inputRange: [0, 0.35, 0.7, 0.85, 1],
outputRange: [originTop, peak, final, overshoot, final],
```

This creates **straight line segments** between keyframes, NOT a curved parabola. The motion feels mechanical and unnatural.

### Current Architecture
- **Library**: React Native Animated
- **Progress values**: `pillMorphProgress`, `searchPillBounceProgress`, `closePhaseProgress`
- **Modal content**: SearchModal, LogModal components render inside the morphing pill
- **Origins**: 4 search origins (expandedSearchBar, searchPill, collapsedSearchBar, collapsedCircle) + 2 log origins (logPill, logCircle)

### What Works (Keep)
- Modal content layout (SearchModal, LogModal, section cards)
- Backdrop blur effect
- Content fade timing
- Icon crossfade (globe → search)
- Focus mode animations (search bar slides up)
- Header collapse/expand on scroll

### What Needs Changing
- Motion trajectory: Keyframes → True parabola
- Size animation: Direct → Two-phase (pill → large pill → modal)
- Animation library: RN Animated → Reanimated (for `useAnimatedStyle` with math)

---

## New Animation Physics

### Phase 1: Parabolic Arc + Grow to Large Pill (0% → 50%)

**Position (TRUE parabola):**
```typescript
const jumpT = t / 0.5; // Normalize to 0-1 within phase 1

// Calculate dynamic peak height based on origin Y
// Lower origins jump higher to reach the same destination
const maxPeak = 80; // Maximum peak for lowest origin (log pill)
const originY = origin.top;
const destinationY = pillFinalTop;
const verticalDistance = Math.abs(destinationY - originY);
const peakHeight = Math.min(maxPeak, verticalDistance * 0.5 + 30);

// X: Linear move toward center
currentX = origin.left + jumpT * (largePillLeft - origin.left);

// Y: TRUE parabolic arc
// Formula: -4h*t*(1-t) creates perfect parabola peaking at t=0.5
const arcOffset = -4 * peakHeight * jumpT * (1 - jumpT);
const linearY = origin.top + jumpT * (largePillY - origin.top);
currentY = linearY + arcOffset;
```

**Size (grow to large pill):**
```typescript
// Large pill = search bar size (full width, 56px height)
const LARGE_PILL_WIDTH = SCREEN_WIDTH - 32;
const LARGE_PILL_HEIGHT = 56;
const LARGE_PILL_RADIUS = 28;

currentWidth = origin.width + jumpT * (LARGE_PILL_WIDTH - origin.width);
currentHeight = origin.height + jumpT * (LARGE_PILL_HEIGHT - origin.height);
currentRadius = currentHeight / 2; // Keep pill shape
```

### Phase 2: Expand to Modal (50% → 100%)

**Position:**
```typescript
const expandT = (t - 0.5) / 0.5; // Normalize to 0-1 within phase 2

currentX = largePillLeft + expandT * (modalLeft - largePillLeft);
currentY = largePillY + expandT * (modalTop - largePillY);
```

**Size:**
```typescript
currentWidth = LARGE_PILL_WIDTH + expandT * (modalWidth - LARGE_PILL_WIDTH);
currentHeight = LARGE_PILL_HEIGHT + expandT * (modalHeight - LARGE_PILL_HEIGHT);
currentRadius = LARGE_PILL_RADIUS + expandT * (modalRadius - LARGE_PILL_RADIUS);
```

### Close Animation (Different from Open)

**Direct collapse with bounce:**
```typescript
const closeT = 1 - t;

// Position: Direct path back
const posProgress = interpolate(closeT, [0, 0.8, 1], [0, 1, 1]);
currentX = modal.left + posProgress * (origin.left - modal.left);
currentY = modal.top + posProgress * (origin.top - modal.top);

// Size: Shrink with squish at end
const sizeProgress = interpolate(closeT, [0, 0.8, 0.92, 1], [1, 1, 0.92, 1]);
currentWidth = origin.width * (modal.width / origin.width) * (1 - closeT * (1 - sizeProgress));
```

---

## Implementation Strategy

### Option: Hybrid Approach (Recommended)

Keep React Native Animated for:
- Header scroll behavior (`animProgress`)
- Per-button crossfade (`buttonModalAnimations`)
- Action buttons opacity/scale

Use Reanimated for:
- Morphing pill animation (new `useAnimatedStyle`)
- True parabolic math

### Why Hybrid?
1. Minimal risk - header scroll logic is complex and working
2. Reanimated worklets allow math functions (`-4 * h * t * (1-t)`)
3. Can keep existing modal content rendering
4. Incremental - can migrate more later if needed

---

## Implementation Steps

### Step 1: Add Reanimated Dependencies
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
```

Note: Import as `ReAnimated` to avoid conflict with RN Animated.

### Step 2: Create New Shared Values
```typescript
// Replace pillMorphProgress (RN Animated) with:
const morphProgress = useSharedValue(0);
const isOpening = useSharedValue(true);

// Keep for now, migrate later if needed:
// - animProgress (header collapse)
// - buttonModalAnimations (button crossfade)
```

### Step 3: Create Parabolic Morph Style
```typescript
const morphingPillStyle = useAnimatedStyle(() => {
  const t = morphProgress.value;

  if (isOpening.value) {
    // Two-phase opening animation
    if (t <= 0.5) {
      // Phase 1: Parabolic arc + grow to large pill
      const jumpT = t / 0.5;
      const arcOffset = -4 * peakHeight * jumpT * (1 - jumpT);
      // ... calculate position and size
    } else {
      // Phase 2: Expand to modal
      const expandT = (t - 0.5) / 0.5;
      // ... calculate position and size
    }
  } else {
    // Closing animation: direct collapse with bounce
    // ... calculate position and size
  }

  return {
    position: 'absolute',
    left: currentX,
    top: currentY,
    width: currentWidth,
    height: currentHeight,
    borderRadius: currentRadius,
    // ... shadows
  };
});
```

### Step 4: Update Open/Close Handlers
```typescript
const handleSearchOpen = (origin: SearchOrigin) => {
  // Calculate origin position
  // Set shared values
  isOpening.value = true;
  morphProgress.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
};

const handleSearchClose = () => {
  isOpening.value = false;
  morphProgress.value = withTiming(0, { duration: 1040, easing: Easing.out(Easing.cubic) });
};
```

### Step 5: Update JSX
```typescript
// Replace the morphing pill Animated.View with Reanimated version
<ReAnimated.View style={morphingPillStyle}>
  {/* Keep existing content */}
  <SearchModal ... />
</ReAnimated.View>
```

### Step 6: Repeat for Log Modal
Apply same changes to log modal interpolations.

---

## Key Constants

```typescript
// Timing
const MORPH_DURATION = 1300; // ms for open
const CLOSE_DURATION = 1040; // ms for close (80% of open)

// Large pill (search bar size)
const LARGE_PILL_WIDTH = SCREEN_WIDTH - 32;
const LARGE_PILL_HEIGHT = 56;
const LARGE_PILL_RADIUS = 28;

// Phase breakpoints
const PHASE_1_END = 0.5; // Arc phase ends

// Dynamic peak height calculation
const calculatePeakHeight = (originY: number, destinationY: number) => {
  const maxPeak = 80;
  const verticalDistance = Math.abs(destinationY - originY);
  return Math.min(maxPeak, verticalDistance * 0.5 + 30);
};
```

---

## Files to Modify

1. **`/src/screens/HomeScreen.tsx`**
   - Add Reanimated imports
   - Replace morphing pill interpolations with `useAnimatedStyle`
   - Update open/close handlers to use `withTiming`

2. **No changes needed:**
   - `/src/components/SearchModal.tsx` - content stays same
   - `/src/components/LogModal.tsx` - content stays same
   - `/src/components/MorphingActionButton.tsx` - keep as-is

---

## Testing Checklist

1. [ ] Search bar tap → modal opens with parabolic arc
2. [ ] Search pill tap → modal opens with higher arc (further to travel)
3. [ ] Search circle tap → modal opens with arc from collapsed position
4. [ ] Log pill tap → modal opens with arc
5. [ ] Log circle tap → modal opens with arc
6. [ ] Close animation → direct collapse with bounce
7. [ ] Header scroll → still collapses/expands correctly
8. [ ] Focus mode → search bar slides up correctly
9. [ ] Content fade → still fades in/out at right times
10. [ ] Icon crossfade → still works

---

## Risk Mitigation

1. **If Reanimated conflicts with RN Animated:**
   - Import Reanimated with alias: `import * as ReAnimated from 'react-native-reanimated'`
   - Use `ReAnimated.View`, `ReAnimated.Text` for morphing elements
   - Keep `Animated.View` (RN) for header/buttons

2. **If performance issues:**
   - Ensure all calculations are in worklets (no `runOnJS` in style)
   - Use `useDerivedValue` for dependent calculations

3. **If timing feels off:**
   - Adjust `MORPH_DURATION` (currently 1300ms)
   - Adjust `PHASE_1_END` (currently 0.5)
   - Adjust peak height calculation

---

## Summary

**What changes:**
- Motion trajectory: Keyframes → TRUE parabola (`-4h*t*(1-t)`)
- Size animation: Direct → Two-phase (pill → large pill → modal)
- Library: Add Reanimated for morphing pill

**What stays the same:**
- Modal content (SearchModal, LogModal)
- Modal layout and positioning
- Header collapse/expand
- Button crossfade effects
- Backdrop blur
- Content fade timing
