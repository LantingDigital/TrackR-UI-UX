# Press Feedback System (useSpringPress)

Spring-animated press feedback for all tappable elements in TrackR.

**Implementation**: `src/hooks/useSpringPress.ts`

---

## Overview

Every tappable element in the app should have spring press feedback -- a subtle scale-down on press-in and spring-back on release. This provides tactile responsiveness and premium feel.

---

## Core Hook: useSpringPress

```typescript
import { useSpringPress } from '../hooks/useSpringPress';

const { scaleValue, opacityValue, pressHandlers, animatedStyle } = useSpringPress({
  scale: 0.97,      // optional, default: PRESS_SCALES.normal (0.97)
  opacity: 0.9,     // optional, default: 1 (no opacity change)
  useNativeDriver: true,  // optional, default: true
  disabled: false,   // optional, default: false
  onPressIn: () => {},  // optional callback
  onPressOut: () => {}, // optional callback
});
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `scaleValue` | `Animated.Value` | Raw animated scale value for custom use |
| `opacityValue` | `Animated.Value` | Raw animated opacity value for custom use |
| `pressHandlers` | `{ onPressIn, onPressOut }` | Spread onto `Pressable` component |
| `animatedStyle` | `{ transform, opacity }` | Pre-built style to apply to `Animated.View` |
| `isPressed` | `boolean` | Whether currently in pressed state |

### Basic Usage

```tsx
function MyButton() {
  const { pressHandlers, animatedStyle } = useSpringPress();

  return (
    <Pressable onPress={handleTap} {...pressHandlers}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text>Tap Me</Text>
      </Animated.View>
    </Pressable>
  );
}
```

---

## Preset Hooks

Three convenience presets are exported for common use cases:

### useSubtlePress
Scale: 0.98. For cards and larger tappable areas where strong feedback would be distracting.

```typescript
const { pressHandlers, animatedStyle } = useSubtlePress();
```

### useStrongPress
Scale: 0.95. For primary CTAs and important buttons where pronounced feedback is desired.

```typescript
const { pressHandlers, animatedStyle } = useStrongPress();
```

### useCardPress
Scale: 0.98, Opacity: 0.9. For card components -- combines subtle scale with a slight dim.

```typescript
const { pressHandlers, animatedStyle } = useCardPress();
```

---

## Animation Mechanics

### Press In
- Scale animates from 1.0 to target scale using `SPRINGS.responsive` (or `SPRINGS.responsiveLayout` when `useNativeDriver: false`)
- Opacity (if configured) animates using timing at `TIMING.instant` (100ms)
- Both run in `Animated.parallel`

### Press Out
- Scale springs back from target to 1.0 using same spring config
- Opacity (if configured) timing back to 1.0
- Both run in `Animated.parallel`

### Spring Config Used
```typescript
// With useNativeDriver: true
SPRINGS.responsive: { damping: 16, stiffness: 180, mass: 0.8 }

// With useNativeDriver: false
SPRINGS.responsiveLayout: { damping: 16, stiffness: 180, mass: 0.8 }
```

---

## Migration Note

This hook currently uses the legacy `react-native` Animated API. When migrating to Reanimated:
- Replace `Animated.Value` with `useSharedValue`
- Replace `Animated.spring/timing` with `withSpring/withTiming`
- Replace `animatedStyle` with `useAnimatedStyle`
- Remove `useNativeDriver` parameter (Reanimated always runs on UI thread)
- The external API (pressHandlers, preset hooks) should remain the same
