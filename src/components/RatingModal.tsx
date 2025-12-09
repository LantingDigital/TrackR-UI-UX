/**
 * RatingModal
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
  Animated,
  Pressable,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { RideLog, RatingCriteria } from '../types/rideLog';
import { getCriteriaConfig, completeRating, subscribe } from '../stores/rideLogStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation constants
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: false,
};

const BOUNCE_SPRING = {
  damping: 14,
  stiffness: 120,
  mass: 1,
  useNativeDriver: false,
};

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
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const morphProgress = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  // Get criteria configuration
  const [criteriaConfig, setCriteriaConfig] = useState(getCriteriaConfig());
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    // Initialize all ratings to 5.0
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
    Animated.parallel([
      Animated.spring(morphProgress, {
        toValue: 1,
        ...BOUNCE_SPRING,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [morphProgress, backdropOpacity]);

  // Handle close with reverse animation
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.spring(morphProgress, {
        toValue: 0,
        ...RESPONSIVE_SPRING,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [morphProgress, backdropOpacity, onClose]);

  // Handle submit with success animation
  const handleSubmit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show success overlay
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(1);

    // Animate success checkmark
    Animated.sequence([
      Animated.spring(successScale, {
        toValue: 1,
        damping: 12,
        stiffness: 150,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete(log, ratings);
    });
  }, [log, ratings, onComplete, successScale, successOpacity]);

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

  // Header interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-50, 0, SCROLL_DISTANCE],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.7],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  // Morph interpolations
  const modalScale = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const modalTranslateY = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const contentOpacity = morphProgress.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Modal Container */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            paddingTop: insets.top,
            transform: [
              { scale: modalScale },
              { translateY: modalTranslateY },
            ],
          },
        ]}
      >
        {/* Collapsing Hero Header */}
        <Animated.View
          style={[
            styles.heroHeader,
            { height: headerHeight },
          ]}
        >
          {/* Blurred Background Image */}
          <Animated.Image
            source={{ uri: imageUrl }}
            style={[
              styles.heroImage,
              {
                opacity: imageOpacity,
                transform: [
                  { scale: imageScale },
                  { translateY: imageTranslateY },
                ],
              },
            ]}
            blurRadius={3}
          />

          {/* Gradient Overlay */}
          <View style={styles.heroOverlay} />

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={handleClose}
          >
            <BlurView intensity={40} tint="dark" style={styles.closeButtonBlur}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </BlurView>
          </Pressable>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.heroTitleContainer,
              {
                transform: [
                  { scale: titleScale },
                  { translateY: titleTranslateY },
                ],
              },
            ]}
          >
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
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSliding}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <Animated.View style={{ opacity: contentOpacity }}>
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
        {showSuccess && (
          <Animated.View
            style={[
              styles.successOverlay,
              { opacity: successOpacity },
            ]}
          >
            <Animated.View
              style={[
                styles.successCircle,
                { transform: [{ scale: successScale }] },
              ]}
            >
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.successText}>Rating Saved!</Text>
          </Animated.View>
        )}
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
  const sliderWidth = SCREEN_WIDTH - spacing.lg * 2 - 60; // Account for padding and value display

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
// Half-Point Slider Component
// =========================================
interface HalfPointSliderProps {
  value: number;
  onChange: (value: number) => void;
  width: number;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
}

// Value range: 1.0 to 10.0 with 0.5 increments = 19 snap points
const MIN_VALUE = 1.0;
const MAX_VALUE = 10.0;
const STEP = 0.5;
const TOTAL_STEPS = (MAX_VALUE - MIN_VALUE) / STEP; // 18 steps

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

  // Animated value for thumb position
  const thumbPositionPx = useRef(new Animated.Value(valueToPosition(value))).current;

  // Convert value to position
  function valueToPosition(val: number): number {
    const normalized = (val - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    return normalized * trackWidth;
  }

  // Convert position to value (with half-point snapping)
  function positionToValue(pos: number): number {
    const normalized = pos / trackWidth;
    const rawValue = normalized * (MAX_VALUE - MIN_VALUE) + MIN_VALUE;
    // Snap to nearest half-point
    const snapped = Math.round(rawValue / STEP) * STEP;
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, snapped));
  }

  // Update thumb when value changes externally
  useEffect(() => {
    if (!isDragging.current) {
      Animated.spring(thumbPositionPx, {
        toValue: valueToPosition(value),
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: false,
      }).start();
    }
  }, [value, thumbPositionPx]);

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
      // Gesture direction detection
      if (!gestureDecided.current) {
        const deltaX = Math.abs(evt.nativeEvent.pageX - startX.current);
        const deltaY = Math.abs(evt.nativeEvent.pageY - startY.current);

        if (deltaX < 8 && deltaY < 8) return;

        gestureDecided.current = true;

        if (deltaY >= deltaX) {
          // Vertical gesture - let scroll handle it
          isDragging.current = false;
          return;
        }

        // Horizontal - start dragging
        isDragging.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSlidingStart();
      }

      if (!isDragging.current) return;

      const deltaX = evt.nativeEvent.pageX - startX.current;
      const startPosition = valueToPosition(startValue.current);
      const desiredPosition = startPosition + deltaX;
      const clampedPosition = Math.max(0, Math.min(trackWidth, desiredPosition));
      const newValue = positionToValue(clampedPosition);

      // Haptic feedback on value change
      if (newValue !== lastValue.current) {
        Haptics.selectionAsync();
        lastValue.current = newValue;
        onChange(newValue);
      }

      thumbPositionPx.setValue(clampedPosition);
    },
    [onChange, thumbPositionPx, trackWidth, onSlidingStart]
  );

  const handleEndDrag = useCallback(() => {
    const wasDragging = isDragging.current;
    isDragging.current = false;
    gestureDecided.current = false;

    // Snap to final value position
    Animated.spring(thumbPositionPx, {
      toValue: valueToPosition(value),
      damping: 15,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: false,
    }).start();

    if (wasDragging) {
      onSlidingEnd();
    }
  }, [thumbPositionPx, value, onSlidingEnd]);

  // Fill width interpolation
  const fillWidth = thumbPositionPx.interpolate({
    inputRange: [0, trackWidth],
    outputRange: [0, trackWidth],
    extrapolate: 'clamp',
  });

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
        {/* Fill */}
        <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
      </View>

      {/* Thumb */}
      <Animated.View
        style={[
          styles.sliderThumb,
          {
            left: 0,
            transform: [{ translateX: thumbPositionPx }],
          },
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
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
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.base,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '600',
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
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sliderName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sliderWeight: {
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
