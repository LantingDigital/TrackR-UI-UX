# TrackR Animation System

All animation conventions, spring presets, timing values, and rules for the project.

---

## Core Rule

**ALL animations MUST use `react-native-reanimated`.** Never use the legacy `react-native` Animated API for new code. The project is actively migrating from the old API to Reanimated (see `animation/migration-log.md`).

### Import Convention

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
```

### Key Differences from Legacy Animated

| Legacy Animated | Reanimated |
|-----------------|------------|
| `new Animated.Value(0)` | `useSharedValue(0)` |
| `Animated.spring(value, config).start()` | `value.value = withSpring(target, config)` |
| `Animated.timing(value, config).start()` | `value.value = withTiming(target, config)` |
| `value.interpolate({...})` | `interpolate(value.value, [...], [...])` inside `useAnimatedStyle` |
| `Animated.parallel([...])` | Assign multiple `.value` in same frame |
| `Animated.sequence([...])` | `withSequence(withTiming(...), withSpring(...))` |
| `Animated.delay(ms, anim)` | `withDelay(ms, withSpring(...))` |
| `useNativeDriver: true/false` | Always runs on UI thread (no flag needed) |

---

## Spring Presets

Defined in `src/constants/animations.ts`. These are the physics parameters for spring animations.

| Preset | Damping | Stiffness | Mass | Use For |
|--------|---------|-----------|------|---------|
| **responsive** | 16 | 180 | 0.8 | Button presses, small UI movements, quick transitions |
| **bouncy** | 14 | 120 | 1.0 | Success states, celebrations, attention-grabbing elements |
| **morph** | 14 | 42 | 1.2 | Hero morphs, modal expansions, large-scale transitions |
| **gentle** | 20 | 80 | 1.5 | Background animations, ambient motion |
| **stiff** | 20 | 200 | 0.9 | Toggles, switches, definitive state changes |

### Reanimated Spring Config Usage

```typescript
// Old pattern (still in some files during migration)
Animated.spring(value, { toValue: 1, ...SPRINGS.responsive }).start();

// New pattern (Reanimated)
value.value = withSpring(1, {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
});
```

Note: The `useNativeDriver` and `responsiveLayout`/`bouncyLayout` variants in `animations.ts` are legacy artifacts from the old Animated API. With Reanimated, all animations run on the UI thread by default -- no native driver flag is needed.

---

## Timing Durations

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 100ms | Instant feedback, opacity snaps |
| `fast` | 150ms | Fast transitions, content fade-out during close |
| `normal` | 250ms | Standard transitions, content fade-in |
| `slow` | 400ms | Slow transitions, backdrop fades |
| `contentFade` | 250ms | Content appearance during morph (used with delay) |
| `backdrop` | 300ms | Backdrop blur fade in/out |
| `morphExpand` | 500ms | Full morph expansion timing |
| `stagger` | 50ms | Stagger delay between cascaded items |

---

## Press Scales

Used for spring press feedback on tappable elements (see `animation/press-feedback.md`).

| Preset | Scale | Usage |
|--------|-------|-------|
| `subtle` | 0.98 | Cards, larger tappable areas |
| `normal` | 0.97 | Standard buttons |
| `strong` | 0.95 | CTAs, important buttons |
| `card` | 0.98 | Card components (same as subtle) |

---

## Animation Delays

| Token | Value | Usage |
|-------|-------|-------|
| `morphContent` | 400ms | Content appears after morph starts expanding |
| `cascade` | 50ms | Staggered cascade between list items |
| `buttonMorphBack` | 150ms | Button morphs back during close sequence |

---

## Shadow Animation Values

| Token | Opacity | Usage |
|-------|---------|-------|
| `card` | 0.16 | Default card shadow |
| `modal` | 0.35 | Elevated/modal shadow |
| `pressed` | 0.12 | Pressed state (slightly reduced) |

---

## Hooks

### useSpringPress
Press feedback hook. See `animation/press-feedback.md` for full documentation.

### useMorphAnimation
Hero morph hook. See `animation/morph-system.md` for full documentation.

---

## Thread Safety Rules

Reanimated worklets run on the UI thread. You MUST use `runOnJS` to call any JS-thread function from within a worklet or animated callback:

```typescript
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Inside a worklet or useAnimatedReaction
runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
runOnJS(setState)(newValue);
runOnJS(navigation.navigate)('ScreenName');
```

Functions that require `runOnJS`:
- React state setters (`setState`, `dispatch`)
- Navigation calls (`navigation.navigate`, `navigation.goBack`)
- Haptics (`Haptics.impactAsync`, `Haptics.selectionAsync`)
- Console logging in production
- Any function not marked with `'worklet'`

---

## Performance Target

All animations must run at **60fps on physical devices**. Guidelines:
- Use Reanimated shared values for scroll-driven animations
- Avoid JS-thread layout calculations during animation
- Minimize re-renders during animations (avoid updating React state on every frame)
- Use `useAnimatedStyle` for style computations, not inline interpolations
- Test on a physical iPhone (simulator performance is not representative)
