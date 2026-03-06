/**
 * HalfPointSlider — Reusable 1-10 slider with 0.5 step precision
 *
 * Uses react-native-gesture-handler Gesture.Pan() so it properly coexists
 * with other RNGH gestures (sheet dismiss, ScrollView) without touch stealing.
 *
 * Features:
 * - 1.0–10.0 range, 0.5 step snapping
 * - Horizontal-only activation (vertical lets ScrollView handle it)
 * - Spring-animated thumb position
 * - Haptic feedback on each snap point
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '../theme/colors';
import { haptics } from '../services/haptics';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;
const CONTAINER_HEIGHT = 44;
const MIN_VALUE = 1.0;
const MAX_VALUE = 10.0;
const STEP = 0.5;
const DEAD_ZONE = 8;

const SNAP_SPRING = { damping: 15, stiffness: 200, mass: 0.8 };

interface HalfPointSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Called when user starts dragging — parent should disable scroll */
  onSlidingStart?: () => void;
  /** Called when user stops dragging — parent should re-enable scroll */
  onSlidingEnd?: () => void;
  disabled?: boolean;
  /** Track width defaults to 100% of container minus thumb size */
  width?: number;
  /** When true, skip per-tick haptics (only haptic on drag start) */
  quietHaptics?: boolean;
  /** Custom tint for fill and thumb border (defaults to accent.primary) */
  color?: string;
}

export const HalfPointSlider: React.FC<HalfPointSliderProps> = ({
  value,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
  disabled = false,
  width: explicitWidth,
  quietHaptics = false,
  color,
}) => {
  const thumbPosition = useSharedValue(0);
  const trackWidthSV = useSharedValue(0);
  const currentValueSV = useSharedValue(value);
  const startValueSV = useSharedValue(value);
  const lastSnappedSV = useSharedValue(value);
  const isDraggingSV = useSharedValue(false);

  // Keep current value synced with prop
  useEffect(() => {
    currentValueSV.value = value;
    if (!isDraggingSV.value) {
      const tw = trackWidthSV.value;
      if (tw > 0) {
        const pos = ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * tw;
        thumbPosition.value = withSpring(pos, SNAP_SPRING);
      }
    }
  }, [value]);

  // Sync shared track width when explicit width changes
  useEffect(() => {
    if (explicitWidth != null) {
      const tw = Math.max(0, explicitWidth - THUMB_SIZE);
      trackWidthSV.value = tw;
    }
  }, [explicitWidth]);

  const handleLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const tw = Math.max(0, e.nativeEvent.layout.width - THUMB_SIZE);
    trackWidthSV.value = tw;
    // Set initial thumb position without animation
    if (!isDraggingSV.value) {
      const pos = ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * tw;
      thumbPosition.value = pos;
    }
  }, [value]);

  // JS callbacks (called from worklet via runOnJS)
  const emitValueChange = useCallback((v: number) => {
    onValueChange(v);
  }, [onValueChange]);

  const emitSlidingStart = useCallback(() => {
    onSlidingStart?.();
  }, [onSlidingStart]);

  const emitSlidingEnd = useCallback(() => {
    onSlidingEnd?.();
  }, [onSlidingEnd]);

  const emitHapticTick = useCallback(() => {
    haptics.tick();
  }, []);

  const emitHapticTap = useCallback(() => {
    haptics.tap();
  }, []);

  // RNGH Pan gesture — activates on horizontal movement, fails on vertical
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-DEAD_ZONE, DEAD_ZONE])
    .failOffsetY([-DEAD_ZONE, DEAD_ZONE])
    .onStart(() => {
      'worklet';
      startValueSV.value = currentValueSV.value;
      lastSnappedSV.value = currentValueSV.value;
      isDraggingSV.value = true;
      runOnJS(emitHapticTap)();
      runOnJS(emitSlidingStart)();
    })
    .onUpdate((e) => {
      'worklet';
      const tw = trackWidthSV.value;
      if (tw <= 0) return;

      const startPos = ((startValueSV.value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * tw;
      const desiredPos = startPos + e.translationX;
      const clampedPos = Math.min(Math.max(0, desiredPos), tw);

      // Snap to 0.5 steps
      const rawVal = (clampedPos / tw) * (MAX_VALUE - MIN_VALUE) + MIN_VALUE;
      const snapped = Math.round(rawVal / STEP) * STEP;
      const clamped = Math.min(Math.max(MIN_VALUE, snapped), MAX_VALUE);

      // Move thumb to exact position (smooth tracking)
      thumbPosition.value = clampedPos;

      // Emit value change + haptic on each new snap point
      if (clamped !== lastSnappedSV.value) {
        lastSnappedSV.value = clamped;
        currentValueSV.value = clamped;
        runOnJS(emitValueChange)(clamped);
        if (!quietHaptics) runOnJS(emitHapticTick)();
      }
    })
    .onEnd(() => {
      'worklet';
      isDraggingSV.value = false;

      // Snap thumb to final value position
      const tw = trackWidthSV.value;
      if (tw > 0) {
        const finalPos = ((lastSnappedSV.value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * tw;
        thumbPosition.value = withSpring(finalPos, SNAP_SPRING);
      }

      runOnJS(emitSlidingEnd)();
    })
    .onFinalize(() => {
      'worklet';
      // Safety net — if gesture is cancelled/fails, re-enable scroll
      if (isDraggingSV.value) {
        isDraggingSV.value = false;
        runOnJS(emitSlidingEnd)();
      }
    });

  // Animated styles — worklet-safe
  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition.value }],
  }));

  const fillAnimStyle = useAnimatedStyle(() => {
    'worklet';
    const tw = trackWidthSV.value;
    return {
      width: tw > 0
        ? interpolate(thumbPosition.value, [0, tw], [0, tw], Extrapolation.CLAMP)
        : 0,
    };
  });

  return (
    <View
      style={[styles.outerContainer, explicitWidth ? { width: explicitWidth } : undefined]}
      onLayout={explicitWidth ? undefined : handleLayout}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.container}>
          {/* Track */}
          <View style={[styles.track, { marginLeft: THUMB_SIZE / 2, marginRight: THUMB_SIZE / 2 }]}>
            <Animated.View style={[styles.fill, !disabled && color ? { backgroundColor: color } : undefined, disabled && styles.fillDisabled, fillAnimStyle]} />
          </View>

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              !disabled && color ? { borderColor: color } : undefined,
              disabled && styles.thumbDisabled,
              thumbAnimStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'visible',
  },
  container: {
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: colors.border.subtle,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fillDisabled: {
    backgroundColor: colors.text.meta,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    top: (CONTAINER_HEIGHT - THUMB_SIZE) / 2,
  },
  thumbDisabled: {
    borderColor: colors.text.meta,
  },
});
