/**
 * useSpringPress Hook (Reanimated)
 *
 * Provides spring-animated press feedback for tappable elements.
 * Runs entirely on the UI thread via react-native-reanimated.
 *
 * Usage:
 *   const { pressHandlers, animatedStyle } = useSpringPress();
 *   <Pressable {...pressHandlers}>
 *     <Animated.View style={animatedStyle}>
 *       ...
 *     </Animated.View>
 *   </Pressable>
 *
 * With options:
 *   const { pressHandlers, animatedStyle } = useSpringPress({
 *     scale: 0.95,
 *     opacity: 0.8,
 *   });
 */

import { useCallback, useMemo } from 'react';
import { GestureResponderEvent } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { SPRINGS, TIMING, PRESS_SCALES } from '../constants/animations';

// ===========================================
// Types
// ===========================================

export interface UseSpringPressOptions {
  /**
   * Scale value when pressed (0-1).
   * @default PRESS_SCALES.normal (0.97)
   */
  scale?: number;

  /**
   * Opacity value when pressed (0-1).
   * Set to 1 to disable opacity change.
   * @default 1 (no opacity change)
   */
  opacity?: number;

  /**
   * Whether the element is disabled.
   * When true, press handlers are no-ops.
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional callback for press in.
   */
  onPressIn?: (event: GestureResponderEvent) => void;

  /**
   * Additional callback for press out.
   */
  onPressOut?: (event: GestureResponderEvent) => void;
}

export interface UseSpringPressReturn {
  /**
   * Animated scale shared value (for custom use).
   */
  scaleValue: SharedValue<number>;

  /**
   * Animated opacity shared value (for custom use).
   */
  opacityValue: SharedValue<number>;

  /**
   * Press handlers to spread onto Pressable.
   */
  pressHandlers: {
    onPressIn: (event: GestureResponderEvent) => void;
    onPressOut: (event: GestureResponderEvent) => void;
  };

  /**
   * Pre-built animated style with transform and opacity.
   * Apply to a Reanimated Animated.View.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

// ===========================================
// Hook Implementation
// ===========================================

export function useSpringPress(options: UseSpringPressOptions = {}): UseSpringPressReturn {
  const {
    scale = PRESS_SCALES.normal,
    opacity = 1,
    disabled = false,
    onPressIn,
    onPressOut,
  } = options;

  // Shared values (UI thread)
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  // Handle press in
  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;

      scaleValue.value = withSpring(scale, SPRINGS.responsive);
      if (opacity !== 1) {
        opacityValue.value = withTiming(opacity, { duration: TIMING.instant });
      }

      onPressIn?.(event);
    },
    [disabled, scale, opacity, scaleValue, opacityValue, onPressIn]
  );

  // Handle press out
  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;

      scaleValue.value = withSpring(1, SPRINGS.responsive);
      if (opacity !== 1) {
        opacityValue.value = withTiming(1, { duration: TIMING.instant });
      }

      onPressOut?.(event);
    },
    [disabled, opacity, scaleValue, opacityValue, onPressOut]
  );

  // Pre-built press handlers object
  const pressHandlers = useMemo(
    () => ({
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
    }),
    [handlePressIn, handlePressOut]
  );

  // Pre-built animated style (runs on UI thread)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  return {
    scaleValue,
    opacityValue,
    pressHandlers,
    animatedStyle,
  };
}

// ===========================================
// Preset Variations
// ===========================================

/**
 * Preset for subtle press feedback (cards, larger elements).
 */
export function useSubtlePress(options: Omit<UseSpringPressOptions, 'scale'> = {}) {
  return useSpringPress({ ...options, scale: PRESS_SCALES.subtle });
}

/**
 * Preset for strong press feedback (buttons, CTAs).
 */
export function useStrongPress(options: Omit<UseSpringPressOptions, 'scale'> = {}) {
  return useSpringPress({ ...options, scale: PRESS_SCALES.strong });
}

/**
 * Preset for card press (with opacity dim).
 */
export function useCardPress(options: Omit<UseSpringPressOptions, 'scale' | 'opacity'> = {}) {
  return useSpringPress({ ...options, scale: PRESS_SCALES.card, opacity: 0.9 });
}

// ===========================================
// Default Export
// ===========================================

export default useSpringPress;
