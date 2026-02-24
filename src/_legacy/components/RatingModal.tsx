/**
 * RatingModal (Reanimated)
 *
 * Full-screen rating sheet with collapsing hero header.
 * Features:
 * - Morphs in from pending card
 * - Blurred hero image that collapses on scroll
 * - Rating sliders with half-point precision (1.0, 1.5, 2.0...10.0)
 * - Fixed submit button at bottom
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';
import { SPRINGS } from '../constants/animations';

import { RideLog, RatingCriteria } from '../types/rideLog';
import { getCriteriaConfig, completeRating, subscribe } from '../stores/rideLogStore';
import { SuccessAnimation } from './feedback/SuccessAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Header dimensions
const HEADER_EXPANDED_HEIGHT = 200;
const HEADER_COLLAPSED_HEIGHT = 100;
const SCROLL_DISTANCE = HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT;

// Slider constants
const SLIDER_THUMB_SIZE = 28;
const SLIDER_TRACK_HEIGHT = 6;

interface RatingModalProps {
  log: RideLog;
  imageUrl: string;
  originRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onClose: () => void;
  onComplete: (log: RideLog, ratings: Record<string, number>) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  log,
  imageUrl,
  originRect,
  onClose,
  onComplete,
}) => {
  const insets = useSafeAreaInsets();

  // Animation shared values
  const morphProgress = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get criteria configuration
  const [criteriaConfig, setCriteriaConfig] = useState(getCriteriaConfig());
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    criteriaConfig.criteria.forEach((c) => {
      initial[c.id] = 5.0;
    });
    return initial;
  });
  const [isSliding, setIsSliding] = useState(false);

  // Subscribe to criteria changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setCriteriaConfig(getCriteriaConfig());
    });
    return unsubscribe;
  }, []);

  // Run enter animation
  useEffect(() => {
    morphProgress.value = withSpring(1, SPRINGS.bouncy);
    backdropOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  // Scroll handler (UI thread)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Handle close with reverse animation
  const handleClose = useCallback(() => {
    haptics.tap();
    morphProgress.value = withSpring(0, SPRINGS.responsive);
    backdropOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [morphProgress, backdropOpacity, onClose]);

  // Handle submit with success animation
  const handleSubmit = useCallback(() => {
    haptics.success();
    setShowSuccess(true);
  }, []);

  // Called by SuccessAnimation when it finishes
  const handleSuccessComplete = useCallback(() => {
    onComplete(log, ratings);
  }, [log, ratings, onComplete]);

  // Update a rating value
  const handleRatingChange = useCallback((criteriaId: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [criteriaId]: value,
    }));
  }, []);

  // Calculate weighted score
  const weightedScore = useMemo(() => {
    let totalWeight = 0;
    let weightedSum = 0;
    criteriaConfig.criteria.forEach((c) => {
      const rating = ratings[c.id] || 5.0;
      weightedSum += rating * c.weight;
      totalWeight += c.weight;
    });
    return totalWeight > 0 ? weightedSum / totalWeight : 5.0;
  }, [criteriaConfig.criteria, ratings]);

  // Animated styles
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(morphProgress.value, [0, 1], [0.9, 1]) },
      { translateY: interpolate(morphProgress.value, [0, 1], [50, 0]) },
    ],
  }));

  const headerAnimStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    ),
  }));

  const heroImageAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.7],
      [1, 0.3],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [-50, 0, SCROLL_DISTANCE],
          [1.2, 1, 0.8],
          Extrapolation.CLAMP
        ),
      },
      {
        translateY: interpolate(
          scrollY.value,
          [0, SCROLL_DISTANCE],
          [0, -30],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, SCROLL_DISTANCE],
          [1, 0.85],
          Extrapolation.CLAMP
        ),
      },
      {
        translateY: interpolate(
          scrollY.value,
          [0, SCROLL_DISTANCE],
          [0, -20],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      morphProgress.value,
      [0.5, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Modal Container */}
      <Animated.View
        style={[
          styles.modalContainer,
          { paddingTop: insets.top },
          modalAnimStyle,
        ]}
      >
        {/* Collapsing Hero Header */}
        <Animated.View style={[styles.heroHeader, headerAnimStyle]}>
          {/* Blurred Background Image with error fallback */}
          {imageError ? (
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.text.meta} />
            </View>
          ) : (
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[styles.heroImage, heroImageAnimStyle]}
              blurRadius={3}
              onError={() => setImageError(true)}
            />
          )}

          {/* Gradient Overlay */}
          <View style={styles.heroOverlay} />

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={handleClose}
          >
            <BlurView intensity={40} tint="dark" style={styles.closeButtonBlur}>
              <Ionicons name="close" size={22} color={colors.text.inverse} />
            </BlurView>
          </Pressable>

          {/* Title Section */}
          <Animated.View style={[styles.heroTitleContainer, titleAnimStyle]}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {log.coasterName}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {log.parkName}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Scrollable Content */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSliding}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
        >
          <Animated.View style={contentAnimStyle}>
            {/* Live Score Display */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Your Rating</Text>
                <Text style={styles.scoreValue}>{weightedScore.toFixed(1)}</Text>
              </View>
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: `${(weightedScore / 10) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* Rating Sliders */}
            <View style={styles.slidersSection}>
              <Text style={styles.sectionTitle}>Rate Each Aspect</Text>

              {criteriaConfig.criteria.map((criterion) => (
                <RatingSliderRow
                  key={criterion.id}
                  criterion={criterion}
                  value={ratings[criterion.id] || 5.0}
                  onChange={(value) => handleRatingChange(criterion.id, value)}
                  onSlidingStart={() => setIsSliding(true)}
                  onSlidingEnd={() => setIsSliding(false)}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.ScrollView>

        {/* Fixed Submit Button */}
        <View
          style={[
            styles.submitContainer,
            { paddingBottom: insets.bottom + spacing.base },
          ]}
        >
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Complete Rating</Text>
          </Pressable>
        </View>

        {/* Success Overlay */}
        <SuccessAnimation
          visible={showSuccess}
          message="Rating Saved!"
          size="large"
          onComplete={handleSuccessComplete}
        />
      </Animated.View>
    </View>
  );
};

// =========================================
// Rating Slider Row Component
// =========================================
interface RatingSliderRowProps {
  criterion: RatingCriteria;
  value: number;
  onChange: (value: number) => void;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
}

const RatingSliderRow: React.FC<RatingSliderRowProps> = ({
  criterion,
  value,
  onChange,
  onSlidingStart,
  onSlidingEnd,
}) => {
  const sliderWidth = SCREEN_WIDTH - spacing.lg * 2 - 60;

  return (
    <View style={styles.sliderRow}>
      {/* Header: Icon + Name + Weight */}
      <View style={styles.sliderHeader}>
        <View style={styles.sliderIconContainer}>
          <Ionicons
            name={(criterion.icon as keyof typeof Ionicons.glyphMap) || 'star-outline'}
            size={18}
            color={colors.accent.primary}
          />
        </View>
        <Text style={styles.sliderName}>{criterion.name}</Text>
        <Text style={styles.sliderWeight}>{criterion.weight}%</Text>
      </View>

      {/* Slider + Value */}
      <View style={styles.sliderContent}>
        <HalfPointSlider
          value={value}
          onChange={onChange}
          width={sliderWidth}
          onSlidingStart={onSlidingStart}
          onSlidingEnd={onSlidingEnd}
        />
        <View style={styles.sliderValueContainer}>
          <Text style={styles.sliderValue}>{value.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
};

// =========================================
// Half-Point Slider Component (Reanimated)
// =========================================
interface HalfPointSliderProps {
  value: number;
  onChange: (value: number) => void;
  width: number;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
}

const MIN_VALUE = 1.0;
const MAX_VALUE = 10.0;
const STEP = 0.5;

const HalfPointSlider: React.FC<HalfPointSliderProps> = ({
  value,
  onChange,
  width,
  onSlidingStart,
  onSlidingEnd,
}) => {
  const trackWidth = width - SLIDER_THUMB_SIZE;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startValue = useRef(value);
  const lastValue = useRef(value);
  const gestureDecided = useRef(false);

  // Shared value for thumb position
  const thumbPosition = useSharedValue(valueToPosition(value));

  function valueToPosition(val: number): number {
    const normalized = (val - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    return normalized * trackWidth;
  }

  function positionToValue(pos: number): number {
    const normalized = pos / trackWidth;
    const rawValue = normalized * (MAX_VALUE - MIN_VALUE) + MIN_VALUE;
    const snapped = Math.round(rawValue / STEP) * STEP;
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, snapped));
  }

  // Update thumb when value changes externally
  useEffect(() => {
    if (!isDragging.current) {
      thumbPosition.value = withSpring(valueToPosition(value), SPRINGS.responsive);
    }
  }, [value]);

  const handleStartDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      startX.current = evt.nativeEvent.pageX;
      startY.current = evt.nativeEvent.pageY;
      startValue.current = value;
      lastValue.current = value;
      gestureDecided.current = false;
      isDragging.current = false;
    },
    [value]
  );

  const handleMoveDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (!gestureDecided.current) {
        const deltaX = Math.abs(evt.nativeEvent.pageX - startX.current);
        const deltaY = Math.abs(evt.nativeEvent.pageY - startY.current);

        if (deltaX < 8 && deltaY < 8) return;

        gestureDecided.current = true;

        if (deltaY >= deltaX) {
          isDragging.current = false;
          return;
        }

        isDragging.current = true;
        haptics.tap();
        onSlidingStart();
      }

      if (!isDragging.current) return;

      const deltaX = evt.nativeEvent.pageX - startX.current;
      const startPosition = valueToPosition(startValue.current);
      const desiredPosition = startPosition + deltaX;
      const clampedPosition = Math.max(0, Math.min(trackWidth, desiredPosition));
      const newValue = positionToValue(clampedPosition);

      if (newValue !== lastValue.current) {
        haptics.tick();
        lastValue.current = newValue;
        onChange(newValue);
      }

      thumbPosition.value = clampedPosition;
    },
    [onChange, thumbPosition, trackWidth, onSlidingStart]
  );

  const handleEndDrag = useCallback(() => {
    const wasDragging = isDragging.current;
    isDragging.current = false;
    gestureDecided.current = false;

    thumbPosition.value = withSpring(valueToPosition(value), {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });

    if (wasDragging) {
      onSlidingEnd();
    }
  }, [thumbPosition, value, onSlidingEnd]);

  // Animated styles for thumb and fill
  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition.value }],
  }));

  const fillAnimStyle = useAnimatedStyle(() => ({
    width: interpolate(
      thumbPosition.value,
      [0, trackWidth],
      [0, trackWidth],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View
      style={[styles.sliderContainer, { width }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleStartDrag}
      onResponderMove={handleMoveDrag}
      onResponderRelease={handleEndDrag}
      onResponderTerminate={handleEndDrag}
      onResponderTerminationRequest={() => !isDragging.current}
    >
      {/* Track Background */}
      <View style={[styles.sliderTrack, { width: trackWidth, marginLeft: SLIDER_THUMB_SIZE / 2 }]}>
        <Animated.View style={[styles.sliderFill, fillAnimStyle]} />
      </View>

      {/* Thumb */}
      <Animated.View
        style={[
          styles.sliderThumb,
          { left: 0 },
          thumbAnimStyle,
        ]}
      />
    </View>
  );
};

// =========================================
// Styles
// =========================================
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Hero Header
  heroHeader: {
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.base,
    zIndex: 10,
  },
  closeButtonBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.heroLarge,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Score Card
  scoreCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.small,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.base,
  },
  scoreLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  scoreValue: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.border.subtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },

  // Sliders Section
  slidersSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },

  // Slider Row
  sliderRow: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sliderName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  sliderWeight: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  sliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderValueContainer: {
    width: 48,
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  sliderValue: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },

  // Slider
  sliderContainer: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  sliderTrack: {
    height: SLIDER_TRACK_HEIGHT,
    backgroundColor: colors.border.subtle,
    borderRadius: SLIDER_TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: SLIDER_TRACK_HEIGHT / 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    top: (36 - SLIDER_THUMB_SIZE) / 2,
  },

  // Submit Button
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.page,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.subtle,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
