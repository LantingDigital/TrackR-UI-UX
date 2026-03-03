/**
 * HalfPointSlider — Reusable 1-10 slider with 0.5 step precision
 *
 * Ported from legacy RatingModal. Uses touch responder (not GestureHandler)
 * so it coexists with ScrollView without conflicts.
 *
 * Features:
 * - 1.0–10.0 range, 0.5 step snapping
 * - 8px dead zone for gesture detection (horizontal = slide, vertical = scroll)
 * - Spring-animated thumb position
 * - Haptic feedback on each snap point
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { haptics } from '../services/haptics';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;
const CONTAINER_HEIGHT = 36;
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
}

export const HalfPointSlider: React.FC<HalfPointSliderProps> = ({
  value,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
  disabled = false,
  width: explicitWidth,
}) => {
  const containerWidthRef = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startValue = useRef(value);
  const lastValue = useRef(value);
  const gestureDecided = useRef(false);

  const thumbPosition = useSharedValue(0);
  // Shared value for track width — readable by worklets
  const trackWidthSV = useSharedValue(0);

  const getTrackWidth = () => {
    const w = explicitWidth ?? containerWidthRef.current;
    return Math.max(0, w - THUMB_SIZE);
  };

  const valueToPosition = (val: number): number => {
    const tw = getTrackWidth();
    if (tw <= 0) return 0;
    const normalized = (val - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    return normalized * tw;
  };

  const positionToValue = (pos: number): number => {
    const tw = getTrackWidth();
    if (tw <= 0) return MIN_VALUE;
    const normalized = pos / tw;
    const rawValue = normalized * (MAX_VALUE - MIN_VALUE) + MIN_VALUE;
    const snapped = Math.round(rawValue / STEP) * STEP;
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, snapped));
  };

  // Sync thumb when value changes externally
  useEffect(() => {
    if (!isDragging.current) {
      thumbPosition.value = withSpring(valueToPosition(value), SNAP_SPRING);
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
    containerWidthRef.current = e.nativeEvent.layout.width;
    const tw = Math.max(0, e.nativeEvent.layout.width - THUMB_SIZE);
    trackWidthSV.value = tw;
    // Set initial thumb position without animation
    if (!isDragging.current) {
      thumbPosition.value = valueToPosition(value);
    }
  }, [value]);

  const handleStartDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (disabled) return;
      startX.current = evt.nativeEvent.pageX;
      startY.current = evt.nativeEvent.pageY;
      startValue.current = value;
      lastValue.current = value;
      gestureDecided.current = false;
      isDragging.current = false;
    },
    [value, disabled],
  );

  const handleMoveDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (disabled) return;

      if (!gestureDecided.current) {
        const deltaX = Math.abs(evt.nativeEvent.pageX - startX.current);
        const deltaY = Math.abs(evt.nativeEvent.pageY - startY.current);

        // Wait for movement past dead zone before deciding gesture direction
        if (deltaX < DEAD_ZONE && deltaY < DEAD_ZONE) return;

        gestureDecided.current = true;

        // Vertical gesture → let parent scroll handle it
        if (deltaY >= deltaX) {
          isDragging.current = false;
          return;
        }

        // Horizontal gesture → we're sliding
        isDragging.current = true;
        haptics.tap();
        onSlidingStart?.();
      }

      if (!isDragging.current) return;

      const tw = getTrackWidth();
      const deltaX = evt.nativeEvent.pageX - startX.current;
      const startPosition = valueToPosition(startValue.current);
      const desiredPosition = startPosition + deltaX;
      const clampedPosition = Math.max(0, Math.min(tw, desiredPosition));
      const newValue = positionToValue(clampedPosition);

      if (newValue !== lastValue.current) {
        haptics.tick();
        lastValue.current = newValue;
        onValueChange(newValue);
      }

      thumbPosition.value = clampedPosition;
    },
    [onValueChange, onSlidingStart, disabled],
  );

  const handleEndDrag = useCallback(() => {
    const wasDragging = isDragging.current;
    isDragging.current = false;
    gestureDecided.current = false;

    // Snap thumb to final value position
    thumbPosition.value = withSpring(valueToPosition(value), SNAP_SPRING);

    if (wasDragging) {
      onSlidingEnd?.();
    }
  }, [value, onSlidingEnd]);

  // Animated styles — use shared values only (worklet-safe)
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
      style={[styles.container, explicitWidth ? { width: explicitWidth } : undefined]}
      onLayout={explicitWidth ? undefined : handleLayout}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={handleStartDrag}
      onResponderMove={handleMoveDrag}
      onResponderRelease={handleEndDrag}
      onResponderTerminate={handleEndDrag}
      onResponderTerminationRequest={() => !isDragging.current}
    >
      {/* Track */}
      <View style={[styles.track, { marginLeft: THUMB_SIZE / 2, marginRight: THUMB_SIZE / 2 }]}>
        <Animated.View style={[styles.fill, disabled && styles.fillDisabled, fillAnimStyle]} />
      </View>

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          disabled && styles.thumbDisabled,
          thumbAnimStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
