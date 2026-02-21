# Animated API Migration Log

Tracking the migration from React Native's legacy `Animated` API to `react-native-reanimated`.

---

## Status: Near Complete (HomeScreen morph values + TabBarContext remaining)

---

## Migration Pattern

| Legacy (react-native Animated) | Reanimated Equivalent |
|--------------------------------|----------------------|
| `new Animated.Value(0)` | `useSharedValue(0)` |
| `Animated.spring(value, { toValue, ...config })` | `value.value = withSpring(toValue, config)` |
| `Animated.timing(value, { toValue, duration })` | `value.value = withTiming(toValue, { duration })` |
| `Animated.parallel([a, b])` | Assign multiple `.value` in same frame |
| `Animated.sequence([a, b])` | `withSequence(withTiming(...), withSpring(...))` |
| `Animated.delay(ms, animation)` | `withDelay(ms, withSpring(...))` |
| `value.interpolate({ inputRange, outputRange })` | `interpolate(value.value, inputRange, outputRange)` inside `useAnimatedStyle` |
| `Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }])` | `useAnimatedScrollHandler` |
| `<Animated.View style={{ transform: [{ scale }] }}>` | `<Animated.View style={animatedStyle}>` with `useAnimatedStyle` |
| `useNativeDriver: true/false` | Not needed (always UI thread) |

### Key Gotcha: runOnJS

Any call to a JS-thread function from inside a worklet or animated reaction **must** be wrapped with `runOnJS`:

```typescript
import { runOnJS } from 'react-native-reanimated';

// Inside useAnimatedReaction, useAnimatedScrollHandler, etc:
runOnJS(setState)(newValue);
runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
```

---

## File Migration Checklist

### Constants
- [x] `src/constants/animations.ts` — Removed `useNativeDriver`, cleaned up duplicates

### Hooks
- [x] `src/hooks/useSpringPress.ts` — Full Reanimated: useSharedValue, withSpring, useAnimatedStyle
- [x] `src/hooks/useMorphAnimation.ts` — Full Reanimated (currently unused by any component)

### Screens
- [ ] `src/screens/HomeScreen.tsx` — **Partially migrated**: scroll/buttons/fog + search morph values (Batch A) use Reanimated. Log morph + buttonModal + dropdown still legacy.
- [x] `src/screens/ActivityScreen.tsx` — PendingCard uses useSpringPress
- [x] `src/screens/ProfileScreen.tsx` — NavigationButton uses useSpringPress
- [x] `src/screens/WalletScreen.tsx` — TicketRow uses useSpringPress
- [x] `src/screens/CriteriaSetupScreen.tsx` — TemplateChip uses useSpringPress; WeightSlider keeps RNAnimated for PanResponder

### Components
- [x] `src/components/NewsCard.tsx` — Uses useSpringPress
- [x] `src/components/SearchBar.tsx` — Uses useSpringPress
- [x] `src/components/ActionPill.tsx` — Uses useSpringPress
- [x] `src/components/SearchResultRow.tsx` — Uses useSpringPress
- [x] `src/components/RotatingPlaceholder.tsx` — useSharedValue + withTiming + withRepeat
- [x] `src/components/SkeletonLoader.tsx` — useSharedValue + withRepeat + withTiming
- [x] `src/components/SearchCarousel.tsx` — Uses useSpringPress
- [x] `src/components/SearchOverlay.tsx` — useSharedValue + withTiming for fade
- [x] `src/components/SearchModal.tsx` — Internal cascade: useSharedValue + withDelay; external morphProgress kept as RNAnimated.Value for HomeScreen compat
- [x] `src/components/LogModal.tsx` — Same pattern as SearchModal
- [x] `src/components/LogConfirmationCard.tsx` — Full Reanimated: 9 shared values, spring/timing animations
- [x] `src/components/RatingModal.tsx` — Full Reanimated: shared values, animated scroll handler, animated styles
- [x] `src/components/cards/BaseCard.tsx` — Uses useSpringPress
- [ ] `src/components/MorphingActionButton.tsx` — Uses Reanimated shared values (accepts SharedValue prop)
- [ ] `src/components/MorphingPill.tsx` — Core morph component, uses Reanimated internally
- [ ] `src/components/wallet/` — Rebuild in Phase 2

### Contexts
- [ ] `src/contexts/TabBarContext.tsx` — Uses legacy Animated.Value for tab bar show/hide

---

## HomeScreen Batch E — Dead Code Removal (COMPLETE)

~500 lines removed. All items below are done:
- [x] `staggeredButtonProgress` + `triggerButtonStagger` — removed (never consumed in JSX)
- [x] `searchBarWidth/Height/Scale`, `headerHeight`, `pillsRowOpacity` — removed (replaced by Reanimated)
- [x] `homeSearchBarOpacity` + `combinedMorphProgress` — removed (never used in JSX)
- [x] `reanimatedTestStyle` → replaced with `fogGradientAnimatedStyle` (Reanimated useAnimatedStyle)
- [x] Old disabled morphing pill JSX (`{false && ...}` block) — removed (~95 lines)
- [x] `animProgress` + `animProgressKey` + `animProgressRef` — removed entirely
- [x] Fog gradient → `<Reanimated.View>` with `useAnimatedStyle` using `reanimatedProgress`
- [x] `handleScroll` cleaned — only Reanimated drives scroll/buttons now
- [x] `handleSearchClose`/`handleLogClose` → use `reanimatedProgress.value` + button progress resets
- [x] `triggerSearchOpen` — removed (~150 lines, MorphingPill handles internally)
- [x] `circleStage1Progress`, `searchPillBounceProgress`, `closePhaseProgress` — removed
- [x] `intermediatePillPosition` useMemo — removed
- [x] Morph pill interpolation variables (~200 lines of Animated.add/multiply) — removed
- [x] Dead post-sectionCards variables (pillPlaceholderOpacity, icon opacities, shadow values) — removed

## HomeScreen Batch A — Search Morph Values (COMPLETE)

Migrated 6 values to Reanimated shared values:
- [x] `pillMorphProgress` → `useSharedValue(0)` — drives SearchModal section cascade
- [x] `backdropOpacity` → `useSharedValue(0)` — blur backdrop fade
- [x] `searchContentFade` → `useSharedValue(0)` — fog gradient + content opacity
- [x] `searchFocusProgress` → `useSharedValue(0)` — focus mode interpolations
- [x] `actionButtonsOpacity` → `useSharedValue(1)` — button container opacity
- [x] `actionButtonsScale` → `useSharedValue(1)` — button container scale
- [x] SearchModal `morphProgress` prop updated to `SharedValue<number>`
- [x] SearchModal section animations converted to `useAnimatedStyle`
- [x] `Animated.multiply()` → multiplication inside `useAnimatedStyle`
- [x] `Animated.sequence/parallel` in handleSearchClose → `withTiming` callbacks + `withDelay`
- [x] All consuming `<Animated.View>` → `<Reanimated.View>` with animated styles

### Remaining HomeScreen Legacy (Batch B-D):
- `logMorphProgress` + ~15 log pill interpolations (Batch B)
- `logBackdropOpacity`, `logContentFade`, `logBounceProgress`, `logClosePhaseProgress`, `logArcOffset` (Batch B)
- `logFocusProgress` (Batch B)
- `scanBackdropOpacity`, `scanContentFade` (Batch C)
- `buttonModalAnimations` — 12 legacy Animated.Values (Batch D)
- `dropdownItemAnimations` — 8 legacy values (Batch D)

---

## Notes

- SearchModal accepts `SharedValue<number>` for `morphProgress` (migrated in Batch A)
- LogModal still accepts `RNAnimated.Value` for `morphProgress` (will update in Batch B)
- Do NOT attempt to migrate all remaining log morph values at once — they have ~15 interconnected interpolations for pill positioning
