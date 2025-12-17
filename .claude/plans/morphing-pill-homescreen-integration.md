# MorphingPill HomeScreen Integration Plan

## Goal
Integrate MorphingPill's parabolic animation physics into HomeScreen while preserving the EXACT original modal experience (backdrop, header label, section cards, focus mode).

---

## Architecture Decision

**MorphingPill becomes a search-bar-only component:**
- Handles pill → search bar transformation with parabolic arc
- NO built-in backdrop (HomeScreen manages its own complex backdrop)
- Exposes `morphProgress` shared value for coordination
- Exposes `open()` and `close()` methods via ref

**HomeScreen coordinates external elements:**
- Uses MorphingPill's exposed `morphProgress` to animate:
  - Blur backdrop opacity
  - "S E A R C H" header label
  - Section cards opacity/position
  - Icon crossfade (globe → search)
- Keeps all existing JSX structure for modal content

---

## MorphingPill API Changes

### New Props
```typescript
interface MorphingPillProps {
  // Existing props...
  pillContent: React.ReactNode;
  pillWidth?: number;
  pillHeight?: number;

  // NEW: Modal content is now the expanded pill content (search bar innards)
  expandedContent: React.ReactNode | ((close: () => void) => React.ReactNode);
  expandedWidth?: number;  // Final width (default: SCREEN_WIDTH - 32)
  expandedHeight?: number; // Final height (default: 56 for search bar)

  // NEW: Disable built-in backdrop
  showBackdrop?: boolean; // Default: true, set false for HomeScreen

  // NEW: External progress coordination
  externalProgress?: SharedValue<number>; // If provided, drives this instead of internal

  // NEW: Callbacks for state changes
  onOpen?: () => void;
  onClose?: () => void;
  onAnimationComplete?: (isOpen: boolean) => void;
}

// Ref methods
interface MorphingPillRef {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}
```

### Key Changes
1. Rename `modalContent` → `expandedContent` (clarity: it's not a full modal)
2. Add `expandedWidth` and `expandedHeight` props (search bar is 56px, not full modal)
3. Add `showBackdrop` prop (default true, HomeScreen sets false)
4. Add `externalProgress` prop (HomeScreen provides its own shared value)
5. Expose ref with `open()` and `close()` methods

---

## HomeScreen Integration

### Step 1: Create Reanimated shared values
```typescript
// Replace RN Animated values with Reanimated shared values
const searchMorphProgress = useSharedValue(0);
const searchBackdropOpacity = useSharedValue(0);
```

### Step 2: Create animated styles for external elements
```typescript
// Backdrop style
const backdropAnimatedStyle = useAnimatedStyle(() => ({
  opacity: searchMorphProgress.value,
}));

// Header label style
const headerLabelAnimatedStyle = useAnimatedStyle(() => ({
  opacity: interpolate(searchMorphProgress.value, [0.5, 0.8], [0, 1]),
}));

// Section cards style
const sectionCardsAnimatedStyle = useAnimatedStyle(() => ({
  opacity: interpolate(searchMorphProgress.value, [0.6, 0.9], [0, 1]),
  transform: [
    { translateY: interpolate(searchMorphProgress.value, [0.5, 0.9], [30, 0]) },
  ],
}));
```

### Step 3: Replace MorphingActionButton with MorphingPill
```tsx
// Create ref
const searchPillRef = useRef<MorphingPillRef>(null);

// In JSX - position where Search button was
<MorphingPill
  ref={searchPillRef}
  pillWidth={pillWidth}
  pillHeight={36}
  pillContent={
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="search-outline" size={16} color="#000" />
      <Text style={{ marginLeft: 6 }}>Search</Text>
    </View>
  }
  expandedWidth={SCREEN_WIDTH - 32}
  expandedHeight={56}
  expandedContent={(close) => (
    // The search bar innards: icon + input + X button
    <SearchBarContent onClose={close} />
  )}
  showBackdrop={false} // HomeScreen manages backdrop
  externalProgress={searchMorphProgress}
  onOpen={() => setSearchVisible(true)}
  onClose={() => setSearchVisible(false)}
/>
```

### Step 4: Update external elements to use Reanimated
```tsx
{/* Blur Backdrop - now uses Reanimated */}
{searchVisible && (
  <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}>
    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
  </Animated.View>
)}

{/* "S E A R C H" Header Label - uses Reanimated */}
{searchVisible && (
  <Animated.Text style={[styles.searchHeader, headerLabelAnimatedStyle]}>
    SEARCH
  </Animated.Text>
)}

{/* Section Cards - uses Reanimated */}
{searchVisible && (
  <Animated.View style={sectionCardsAnimatedStyle}>
    <SearchModal sectionsOnly={true} ... />
  </Animated.View>
)}
```

---

## Animation Timing (Speed Adjustment)

Based on user feedback, make animation quicker:
```typescript
// Current: 1300ms open, 1040ms close
// New: 800ms open, 640ms close (roughly 60% faster)
const MORPH_DURATION = 800;
const CLOSE_DURATION = 640;
```

---

## MorphingPill Internal Changes

### 1. Make backdrop conditional
```typescript
// Only render backdrop if showBackdrop is true
{showBackdrop && (
  <Animated.View style={backdropStyle}>
    <BlurView ... />
  </Animated.View>
)}
```

### 2. Support external progress
```typescript
// Use external progress if provided, otherwise internal
const morphProgress = externalProgress ?? useSharedValue(0);
```

### 3. Add ref methods
```typescript
useImperativeHandle(ref, () => ({
  open: handleOpen,
  close: handleClose,
  isOpen: isExpanded,
}));
```

### 4. Adjust animation to expand to search bar size (not full modal)
```typescript
// Phase 2 now expands to expandedWidth/Height instead of full modal
const finalWidth = expandedWidth ?? SCREEN_WIDTH - 32;
const finalHeight = expandedHeight ?? 56;
```

---

## Files to Modify

1. **`/src/components/MorphingPill.tsx`**
   - Add new props (showBackdrop, externalProgress, expandedWidth/Height)
   - Make backdrop conditional
   - Support external shared value
   - Add ref with open/close methods
   - Rename modalContent → expandedContent
   - Adjust Phase 2 to use expandedWidth/Height

2. **`/src/screens/HomeScreen.tsx`**
   - Add Reanimated imports
   - Create shared value for search morph progress
   - Create useAnimatedStyle hooks for backdrop, header, sections
   - Replace Search MorphingActionButton with MorphingPill
   - Update backdrop/header/sections JSX to use Reanimated
   - Keep all existing modal content structure

3. **No changes needed:**
   - SearchModal - content stays same
   - Other buttons (Log, Scan) - keep current implementation

---

## Implementation Order

1. Update MorphingPill with new API (props, ref, conditional backdrop)
2. Add Reanimated shared values and animated styles to HomeScreen
3. Replace Search button with MorphingPill
4. Wire up external elements to shared progress value
5. Remove old search morphing pill JSX (the cover-up element)
6. Test and tune timing

---

## Testing Checklist

- [ ] Search pill morphs with parabolic arc (same as before)
- [ ] Blur backdrop fades in correctly
- [ ] "S E A R C H" header appears at right time
- [ ] Section cards slide up and fade in
- [ ] Icon crossfade (globe → search) works
- [ ] Search input is functional
- [ ] X button unfocuses then closes
- [ ] Focus mode dropdown works
- [ ] Close animation is direct (not reverse arc)
- [ ] Header collapse/expand still works
- [ ] Log and Scan buttons unaffected
