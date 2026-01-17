import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

// Pill dimensions (expanded state)
const PILL_HEIGHT = 36;
const CONTAINER_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const PILL_WIDTH = (CONTAINER_WIDTH - (GAP * 2)) / 3;

// Circle dimensions (collapsed state)
const CIRCLE_SIZE = 42;

// Curve intensity for each button (higher = more horizontal travel)
const CURVE_INTENSITIES = [3, 1.5, 1]; // Log, Search, Scan

interface MorphingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  buttonIndex: number; // 0, 1, or 2 (left to right)
  animProgress: Animated.Value; // 0 = collapsed (circle), 1 = expanded (pill)
  onPress?: () => void;
  // Positions are calculated based on layout
  collapsedX: number; // X position when collapsed (circle)
  expandedX: number;  // X position when expanded (pill)
  collapsedY: number; // Y position when collapsed
  expandedY: number;  // Y position when expanded
  // PERF OPTIMIZATION: Pre-staggered progress from parent (avoids per-button listener overhead)
  // If provided, uses this instead of creating internal listener + setTimeout + spring
  staggeredProgress?: Animated.Value;
}

export const MorphingActionButton: React.FC<MorphingActionButtonProps> = ({
  icon,
  label,
  buttonIndex,
  animProgress,
  onPress,
  collapsedX,
  expandedX,
  collapsedY,
  expandedY,
  staggeredProgress: externalStaggeredProgress, // PERF: Use parent-managed staggered progress if available
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Stagger delay: 50ms between each button (only used if no external staggeredProgress)
  const staggerDelay = buttonIndex * 50;

  // Create a delayed/offset animation progress for this button
  // This creates the cascade effect
  // IMPORTANT: Initialize with current animProgress value to prevent "cold start" flicker
  // NOTE: Only used as fallback when externalStaggeredProgress is not provided
  const internalDelayedProgress = useRef(new Animated.Value(1)).current;
  const isInitialized = useRef(false);

  // PERF OPTIMIZATION: Use external staggered progress if provided (managed by parent)
  // This eliminates 3 separate listeners + 3 setTimeouts per scroll event
  const delayedProgress = externalStaggeredProgress ?? internalDelayedProgress;

  useEffect(() => {
    // If using external staggered progress, skip internal listener setup entirely
    if (externalStaggeredProgress) {
      return;
    }

    // FALLBACK: Internal listener logic (only runs if no external staggeredProgress)
    // CRITICAL: Immediately sync with current animProgress value on mount
    // This prevents the "unwarmed" state that causes flicker before any scroll
    if (!isInitialized.current) {
      // Access the current value of animProgress (internal API)
      const currentValue = (animProgress as any).__getValue?.() ??
                          (animProgress as any)._value ?? 1;
      internalDelayedProgress.setValue(currentValue);
      isInitialized.current = true;
    }

    // Listen to animProgress changes and apply staggered delay
    const listenerId = animProgress.addListener(({ value }) => {
      // Apply stagger by delaying the animation slightly
      setTimeout(() => {
        Animated.spring(internalDelayedProgress, {
          toValue: value,
          damping: 16,      // Higher = less bounce, more controlled
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: false,
        }).start();
      }, staggerDelay);
    });

    return () => {
      animProgress.removeListener(listenerId);
    };
  }, [animProgress, staggerDelay, internalDelayedProgress, externalStaggeredProgress]);

  const handlePressIn = () => {
    Animated.parallel([
      // Must use useNativeDriver: false because we mix with non-native properties
      Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 0.7, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  // Width morphs from circle to pill
  const width = delayedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_SIZE, PILL_WIDTH],
  });

  // Height morphs from circle to pill
  const height = delayedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_SIZE, PILL_HEIGHT],
  });

  // Border radius morphs from full circle to pill
  const borderRadius = delayedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_SIZE / 2, PILL_HEIGHT / 2],
  });

  // Label fades during morph (fades in during last 40% of expand)
  const labelOpacity = delayedProgress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  // Curved path interpolation for position
  // X uses ease-out (fast horizontal movement at start)
  // Y uses sqrt curve (fast vertical at start, then slows)
  const curveIntensity = CURVE_INTENSITIES[buttonIndex] || 1;

  // For the curved path, we need to calculate intermediate positions
  // Progress 0 = collapsed position, Progress 1 = expanded position
  // The curve should swoop right-then-up when collapsing (reverse when expanding)

  // X position with ease-out curve
  const translateX = delayedProgress.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [
      collapsedX,
      collapsedX + (expandedX - collapsedX) * 0.1 * curveIntensity, // Swoop right
      expandedX - (expandedX - collapsedX) * 0.1,
      expandedX,
    ],
  });

  // Y position with sqrt-like curve (fast start)
  const translateY = delayedProgress.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: [
      collapsedY,
      collapsedY + (expandedY - collapsedY) * 0.7, // Fast vertical movement
      expandedY - (expandedY - collapsedY) * 0.1,
      expandedY,
    ],
  });

  // Scale overshoot at destination (landing pop) - subtle 4% hint
  const landingScale = delayedProgress.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [1.04, 1, 1, 1.02], // Subtle pop at both ends
    extrapolate: 'clamp',
  });

  // PERF OPTIMIZATION: Memoize Animated.multiply to avoid recreating on every render
  // Without memoization, a new AnimatedMultiplication is created each render cycle
  const combinedScale = useMemo(
    () => Animated.multiply(scaleAnim, landingScale),
    [scaleAnim, landingScale]
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX },
            { translateY },
            { scale: combinedScale },
          ],
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Ionicons
          name={icon}
          size={16}
          color="#000000"
        />
        <Animated.View style={{
          opacity: labelOpacity,
          maxWidth: delayedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100], // Collapse to 0 width when circle
          }),
          marginLeft: delayedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6],
          }),
          overflow: 'hidden',
        }}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
  pressable: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});
