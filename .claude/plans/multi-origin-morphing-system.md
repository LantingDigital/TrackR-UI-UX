# Multi-Origin MorphingPill System Plan

## Goal
Extend the TRUE single-element MorphingPill animation to ALL search/log origins, with Home tab acting as a close button.

---

## Current State

### Working
- MorphingPill for Search button (pill state) - TRUE single-element morph
- Opens with parabolic arc, closes back to button position
- Search bar and button always visible

### Origin Tracking Already Exists
```typescript
type SearchOrigin =
  | 'expandedSearchBar'    // Full-width search bar (top)
  | 'searchPill'           // "Search" action pill (row)
  | 'collapsedSearchBar'   // Compact search bar (collapsed header)
  | 'collapsedCircle';     // Circle search button (collapsed)

type LogOrigin = 'logPill' | 'logCircle';
```

---

## Requirements

### 1. Home Tab as Close Button
When Home tab is tapped while a modal is open:
- Close the current modal (search, log, or scan)
- Scroll to top smoothly if not already at top
- Works like an X button

### 2. All Origins Get MorphingPill Treatment

**Search Modal Origins (4 total):**
| Origin | Location | Shape | Size |
|--------|----------|-------|------|
| `expandedSearchBar` | Top of screen | Pill | Full width (SCREEN_WIDTH - 32) x 56 |
| `collapsedSearchBar` | Top collapsed | Pill | Smaller width x 42 |
| `searchPill` | Action row | Pill | ~107px x 36 |
| `collapsedCircle` | Action row collapsed | Circle | 42x42 |

**Log Modal Origins (2 total):**
| Origin | Location | Shape | Size |
|--------|----------|-------|------|
| `logPill` | Action row left | Pill | ~107px x 36 |
| `logCircle` | Action row left collapsed | Circle | 42x42 |

### 3. Return to Origin
Each modal closes back to EXACTLY where it came from - no exceptions.

### 4. Custom Animations Per Origin
Different origins need different animation parameters:
- **Center origins** (search bar, search pill): Mostly vertical arc
- **Left origins** (log): Arc curves right then centers
- **Right origins** (scan): Arc curves left then centers
- **Circles**: Smaller start size, may need different peak height

---

## Architecture

### Option A: Multiple MorphingPill Instances
Create a separate MorphingPill for each origin, positioned at that origin's location.

**Pros:**
- Each pill is self-contained
- Clear separation of concerns
- Easier to customize per-origin

**Cons:**
- 6+ MorphingPill instances
- More JSX complexity
- Need to coordinate visibility (only one should be "active")

### Option B: Single MorphingPill with Dynamic Origin (RECOMMENDED)
One MorphingPill that repositions itself based on which origin triggered it.

**Pros:**
- Single component
- Cleaner architecture
- One source of truth for animation

**Cons:**
- More complex positioning logic
- Need to pass origin info dynamically

### Decision: **Option B** - Single dynamic MorphingPill per modal type
- One MorphingPill for Search modal
- One MorphingPill for Log modal
- Each repositions based on origin

---

## Implementation Plan

### Phase 1: Home Tab Close Functionality

**Files:** `HomeScreen.tsx`

1. Update the reset handler registration:
```typescript
useEffect(() => {
  const resetHandler = () => {
    // Close any open modal
    if (searchVisible) {
      morphingPillRef.current?.close();
    }
    if (logVisible) {
      // Close log modal (need ref)
    }
    if (walletVisible) {
      setWalletVisible(false);
    }
    // Scroll to top
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  tabBarContext?.registerResetHandler('Home', resetHandler);
  return () => tabBarContext?.unregisterResetHandler('Home');
}, [searchVisible, logVisible, walletVisible]);
```

### Phase 2: Origin-Aware MorphingPill Props

**Files:** `MorphingPill.tsx`

Add new props for dynamic origin positioning:
```typescript
interface MorphingPillProps {
  // ... existing props ...

  // Dynamic origin position (screen coordinates)
  originPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
  };

  // Animation customization
  arcDirection?: 'center' | 'left' | 'right';  // Which way to arc
  peakHeight?: number;  // Override default arc height
}
```

### Phase 3: Search MorphingPill - All 4 Origins

**Files:** `HomeScreen.tsx`

1. Calculate origin position based on `searchOrigin`:
```typescript
const searchOriginPosition = useMemo(() => {
  switch (searchOrigin) {
    case 'expandedSearchBar':
      return {
        x: HORIZONTAL_PADDING,
        y: insets.top + 12,
        width: SCREEN_WIDTH - 32,
        height: 56,
        borderRadius: 28,
      };
    case 'searchPill':
      return {
        x: expandedPositions[1].x - pillWidth / 2,
        y: insets.top + expandedY - 18,
        width: pillWidth,
        height: 36,
        borderRadius: 18,
      };
    case 'collapsedSearchBar':
      return {
        x: equalGap,
        y: insets.top + 12,
        width: collapsedSearchWidth,
        height: 42,
        borderRadius: 21,
      };
    case 'collapsedCircle':
      return {
        x: collapsedPositions[1].x - circleSize / 2,
        y: insets.top + collapsedY - circleSize / 2,
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
      };
  }
}, [searchOrigin, /* deps */]);
```

2. Position MorphingPill wrapper at origin:
```typescript
<View
  style={{
    position: 'absolute',
    top: searchOriginPosition.y,
    left: searchOriginPosition.x,
    zIndex: 200,
  }}
>
  <MorphingPill
    ref={morphingPillRef}
    pillWidth={searchOriginPosition.width}
    pillHeight={searchOriginPosition.height}
    pillBorderRadius={searchOriginPosition.borderRadius}
    // ... rest of props
  />
</View>
```

3. Trigger handlers set origin then open:
```typescript
const handleSearchBarPress = () => {
  setSearchOrigin(isCollapsedRef.current ? 'collapsedSearchBar' : 'expandedSearchBar');
  // Small delay to let state update before open
  requestAnimationFrame(() => {
    morphingPillRef.current?.open();
  });
};

const handleSearchButtonPress = () => {
  setSearchOrigin(isCollapsedRef.current ? 'collapsedCircle' : 'searchPill');
  requestAnimationFrame(() => {
    morphingPillRef.current?.open();
  });
};
```

### Phase 4: Log MorphingPill - Both Origins

Same pattern as Search but for Log modal:
1. Create `logMorphingPillRef`
2. Calculate `logOriginPosition` based on `logOrigin`
3. Position Log MorphingPill at origin
4. Update Log button handlers

### Phase 5: Animation Customization Per Origin

**Files:** `MorphingPill.tsx`

Adjust parabolic arc based on origin position:
```typescript
// In useAnimatedStyle:
if (isOpening.value) {
  // Calculate arc direction based on origin position relative to screen center
  const screenCenterX = SCREEN_WIDTH / 2;
  const originCenterX = wrapperScreenX.value + pillWidth / 2;

  // Origins on left arc right, origins on right arc left
  const horizontalBias = (screenCenterX - originCenterX) / screenCenterX;

  // Adjust X interpolation based on bias
  const arcX = jumpT * largePillTargetX + horizontalBias * Math.sin(jumpT * Math.PI) * 30;
  currentX = arcX;
}
```

### Phase 6: Visibility Coordination

When MorphingPill is expanded, hide the corresponding static elements:
- Search bar: Already handled (always visible, MorphingPill covers it)
- Search button: MorphingPill IS the button, so it disappears into modal
- For circles: Need to hide the MorphingActionButton while MorphingPill is open

---

## Files to Modify

1. **`src/screens/HomeScreen.tsx`**
   - Update reset handler for Home tab close
   - Add origin position calculation for search
   - Add origin position calculation for log
   - Update trigger handlers to set origin before open
   - Position MorphingPills at dynamic origins

2. **`src/components/MorphingPill.tsx`**
   - Add `originPosition` prop for dynamic positioning
   - Add `arcDirection` and `peakHeight` props
   - Adjust arc calculation based on origin position
   - Ensure close returns to origin position

3. **`src/components/MorphingActionButton.tsx`** (optional)
   - May need visibility prop to hide when modal is open

---

## Testing Checklist

### Home Tab Close
- [ ] Tapping Home while search modal open → closes modal
- [ ] Tapping Home while log modal open → closes modal
- [ ] Tapping Home while wallet open → closes wallet
- [ ] Tapping Home when already at top → no scroll
- [ ] Tapping Home when scrolled → scrolls to top smoothly

### Search Origins
- [ ] Expanded search bar → opens modal → closes to search bar
- [ ] Search pill button → opens modal → closes to pill
- [ ] Collapsed search bar → opens modal → closes to collapsed bar
- [ ] Collapsed circle → opens modal → closes to circle

### Log Origins
- [ ] Log pill button → opens modal → closes to pill
- [ ] Log circle → opens modal → closes to circle

### Animation Quality
- [ ] Each origin has appropriate arc direction
- [ ] Circles expand smoothly (different size ratio)
- [ ] Left-side origins arc appropriately to center
- [ ] No jarring transitions or jumps

---

## Implementation Order

1. **Home Tab Close** - Quick win, immediately useful
2. **Search Pill** - Already working, just needs origin tracking
3. **Expanded Search Bar** - Similar to pill, larger size
4. **Collapsed Search Bar** - Different position when scrolled
5. **Collapsed Circle** - Smallest origin, needs size handling
6. **Log Pill** - Same pattern as search
7. **Log Circle** - Same as search circle
8. **Animation Polish** - Fine-tune arcs per origin

---

## Estimated Complexity

- Home Tab Close: Low (1 useEffect change)
- Origin-aware positioning: Medium (state management)
- Multiple origin support: Medium (repetitive but careful)
- Animation customization: High (math tuning)

Total: Medium-High complexity, but well-defined steps.
