/**
 * useSpringPress Hook
 *
 * Provides spring-animated press feedback for tappable elements.
 * Returns animated values and handlers for consistent press interactions.
 *
 * Usage:
 *   const { scaleValue, pressHandlers, animatedStyle } = useSpringPress();
 *   <Pressable {...pressHandlers}>
 *     <Animated.View style={animatedStyle}>
 *       ...
 *     </Animated.View>
 *   </Pressable>
 *
 * With options:
 *   const { scaleValue, opacityValue, pressHandlers } = useSpringPress({
 *     scale: 0.95,
 *     opacity: 0.8,
 *     useNativeDriver: false,
 *     onPressIn: () => console.log('pressed'),
 *   });
 */

import { useRef, useCallback, useMemo } from 'react';
import { Animated, GestureResponderEvent, ViewStyle } from 'react-native';
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
   * Whether to use native driver for animations.
   * Set to false if parent component uses non-native properties.
   * @default true
   */
  useNativeDriver?: boolean;

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
   * Animated scale value (for custom use).
   */
  scaleValue: Animated.Value;

  /**
   * Animated opacity value (for custom use).
   */
  opacityValue: Animated.Value;

  /**
   * Press handlers to spread onto Pressable.
   */
  pressHandlers: {
    onPressIn: (event: GestureResponderEvent) => void;
    onPressOut: (event: GestureResponderEvent) => void;
  };

  /**
   * Pre-built animated style with transform and opacity.
   * Use this for simple cases.
   */
  animatedStyle: Animated.WithAnimatedObject<ViewStyle>;

  /**
   * Whether currently pressed (for conditional styling).
   */
  isPressed: boolean;
}

// ===========================================
// Hook Implementation
// ===========================================

export function useSpringPress(options: UseSpringPressOptions = {}): UseSpringPressReturn {
  const {
    scale = PRESS_SCALES.normal,
    opacity = 1,
    useNativeDriver = true,
    disabled = false,
    onPressIn,
    onPressOut,
  } = options;

  // Animated values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const isPressedRef = useRef(false);

  // Spring config based on native driver requirement
  const springConfig = useNativeDriver ? SPRINGS.responsive : SPRINGS.responsiveLayout;

  // Handle press in
  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;

      isPressedRef.current = true;

      const animations: Animated.CompositeAnimation[] = [
        Animated.spring(scaleValue, {
          toValue: scale,
          ...springConfig,
          useNativeDriver,
        }),
      ];

      // Only animate opacity if different from 1
      if (opacity !== 1) {
        animations.push(
          Animated.timing(opacityValue, {
            toValue: opacity,
            duration: TIMING.instant,
            useNativeDriver,
          })
        );
      }

      Animated.parallel(animations).start();

      onPressIn?.(event);
    },
    [disabled, scale, opacity, useNativeDriver, scaleValue, opacityValue, springConfig, onPressIn]
  );

  // Handle press out
  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;

      isPressedRef.current = false;

      const animations: Animated.CompositeAnimation[] = [
        Animated.spring(scaleValue, {
          toValue: 1,
          ...springConfig,
          useNativeDriver,
        }),
      ];

      // Only animate opacity if it was changed
      if (opacity !== 1) {
        animations.push(
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: TIMING.instant,
            useNativeDriver,
          })
        );
      }

      Animated.parallel(animations).start();

      onPressOut?.(event);
    },
    [disabled, opacity, useNativeDriver, scaleValue, opacityValue, springConfig, onPressOut]
  );

  // Pre-built press handlers object
  const pressHandlers = useMemo(
    () => ({
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
    }),
    [handlePressIn, handlePressOut]
  );

  // Pre-built animated style
  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale: scaleValue }],
      opacity: opacityValue,
    }),
    [scaleValue, opacityValue]
  );

  return {
    scaleValue,
    opacityValue,
    pressHandlers,
    animatedStyle,
    isPressed: isPressedRef.current,
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
