/**
 * RatingSheet — Full-height bottom sheet for rating a coaster
 *
 * Weighted criteria sliders with live score. Follows CoasterSheet pattern
 * for bottom sheet behavior (blur backdrop, pan gesture dismiss, staggered entrance).
 *
 * Entry points:
 * - "Rate this ride?" nudge after quick log
 * - "Rate" button on CoasterSheet (future)
 * - Pending ratings section in LogModal
 * - Tap coaster in Logbook collection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useTabBar } from '../contexts/TabBarContext';
import { haptics } from '../services/haptics';
import { HalfPointSlider } from './HalfPointSlider';
import {
  CoasterRating,
  RatingCriteria,
  calculateWeightedScore,
} from '../types/rideLog';
import {
  getCriteria,
  upsertCoasterRating,
} from '../stores/rideLogStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

interface RatingSheetProps {
  visible: boolean;
  coasterId: string;
  coasterName: string;
  parkName: string;
  existingRating?: CoasterRating;
  onClose: () => void;
  onComplete: (rating: CoasterRating) => void;
}

export function RatingSheet({
  visible,
  coasterId,
  coasterName,
  parkName,
  existingRating,
  onClose,
  onComplete,
}: RatingSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Get enabled criteria (weight > 0)
  const allCriteria = getCriteria();
  const enabledCriteria = allCriteria.filter(c => c.weight > 0);

  // Rating values — initialize from existing or defaults
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    if (existingRating?.criteriaRatings) {
      return { ...existingRating.criteriaRatings };
    }
    const initial: Record<string, number> = {};
    enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
    return initial;
  });

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const entrance = useSharedValue(0);
  const scoreValue = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  // Calculate live score
  const liveScore = calculateWeightedScore(ratings, allCriteria);
  const displayScore = (liveScore / 10).toFixed(1); // 0-100 → 0.0-10.0

  // Sync score animation
  useEffect(() => {
    scoreValue.value = withSpring(liveScore / 100, SPRINGS.responsive);
  }, [liveScore]);

  // Open / close
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setIsDismissing(false);
      setShowSuccess(false);
      setShowNotes(existingRating?.notes ? true : false);
      setNotes(existingRating?.notes ?? '');

      // Reset ratings when opening
      if (existingRating?.criteriaRatings) {
        setRatings({ ...existingRating.criteriaRatings });
      } else {
        const initial: Record<string, number> = {};
        enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
        setRatings(initial);
      }

      tabBar?.hideTabBar();
      haptics.select();
      entrance.value = 0;
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
      entrance.value = withTiming(1, { duration: 600 });
    } else if (!visible && mounted) {
      tabBar?.showTabBar();
      entrance.value = 0;
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    setIsDismissing(true);
    tabBar?.showTabBar();
    entrance.value = 0;
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, sheetHeight, tabBar]);

  const showTabBarJS = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
  }, [tabBar]);

  const handleSubmit = useCallback(() => {
    haptics.success();

    const rating = upsertCoasterRating(
      { id: coasterId, name: coasterName, parkName },
      ratings,
      notes || undefined,
    );

    setShowSuccess(true);

    // Dismiss after success animation
    setTimeout(() => {
      onComplete(rating);
    }, 800);
  }, [coasterId, coasterName, parkName, ratings, notes, onComplete]);

  const handleCriterionChange = useCallback((criterionId: string, value: number) => {
    setRatings(prev => ({ ...prev, [criterionId]: value }));
  }, []);

  // Pan gesture for dismiss
  const panGesture = Gesture.Pan()
    .enabled(visible)
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, sheetHeight * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (
        translateY.value > sheetHeight * 0.25 ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        runOnJS(showTabBarJS)();
        translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: 250 });
      }
    });

  // Staggered entrance styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.15], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.15], [12, 0], Extrapolation.CLAMP) }],
  }));

  const scoreCardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.10, 0.30], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.10, 0.30], [16, 0], Extrapolation.CLAMP) }],
  }));

  const scoreBarStyle = useAnimatedStyle(() => ({
    width: `${scoreValue.value * 100}%` as any,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
          <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            { top: sheetTop, height: sheetHeight },
            sheetAnimStyle,
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>

          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={dismiss}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </Pressable>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View style={headerStyle}>
              <Text style={styles.coasterName} numberOfLines={2}>
                {coasterName}
              </Text>
              <Text style={styles.parkName} numberOfLines={1}>
                {parkName}
              </Text>
            </Animated.View>

            {/* Live Score Card */}
            <Animated.View style={[styles.scoreCard, scoreCardStyle]}>
              <Text style={styles.scoreLabel}>Your Rating</Text>
              <Text style={styles.scoreValue}>{displayScore}</Text>
              <View style={styles.scoreBarTrack}>
                <Animated.View style={[styles.scoreBarFill, scoreBarStyle]} />
              </View>
            </Animated.View>

            {/* Section Label */}
            <Animated.View style={scoreCardStyle}>
              <Text style={styles.sectionLabel}>RATE EACH ASPECT</Text>
            </Animated.View>

            {/* Criteria Slider Rows */}
            {enabledCriteria.map((criterion, index) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                value={ratings[criterion.id] ?? 5.0}
                onValueChange={(v) => handleCriterionChange(criterion.id, v)}
                onSlidingStart={() => setScrollEnabled(false)}
                onSlidingEnd={() => setScrollEnabled(true)}
                entrance={entrance}
                staggerIndex={index}
              />
            ))}

            {/* Notes Section */}
            <NotesSection
              entrance={entrance}
              staggerIndex={enabledCriteria.length}
              showNotes={showNotes}
              notes={notes}
              onToggle={() => {
                setShowNotes(!showNotes);
                if (!showNotes) haptics.tap();
              }}
              onChangeText={setNotes}
            />

            {/* Submit Button — inside scroll, directly below notes */}
            <View style={{ marginTop: spacing.xl }}>
              {!showSuccess ? (
                <Pressable
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitText}>
                    {existingRating ? 'Update Rating' : 'Save Rating'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.successInline}>
                  <View style={styles.successCheckCircle}>
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.successText}>
                    {existingRating ? 'Rating Updated!' : 'Rating Saved!'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================
// CriterionRow — individual slider row
// Each row owns its own useAnimatedStyle (Rules of Hooks safe)
// ============================================

interface CriterionRowProps {
  criterion: RatingCriteria;
  value: number;
  onValueChange: (value: number) => void;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
  entrance: SharedValue<number>;
  staggerIndex: number;
}

function CriterionRow({
  criterion,
  value,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
  entrance,
  staggerIndex,
}: CriterionRowProps) {
  const start = 0.20 + staggerIndex * 0.08;
  const end = start + 0.20;

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [start, end], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [start, end], [16, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={[styles.criterionCard, animStyle]}>
      {/* Header row */}
      <View style={styles.criterionHeader}>
        <View style={styles.criterionIconWrap}>
          <Ionicons
            name={(criterion.icon as any) ?? 'star-outline'}
            size={16}
            color={colors.accent.primary}
          />
        </View>
        <Text style={styles.criterionName}>{criterion.name}</Text>
        <Text style={styles.criterionWeight}>{criterion.weight}%</Text>
      </View>

      {/* Slider + value */}
      <View style={styles.criterionSliderRow}>
        <View style={styles.criterionSliderWrap}>
          <HalfPointSlider
            value={value}
            onValueChange={onValueChange}
            onSlidingStart={onSlidingStart}
            onSlidingEnd={onSlidingEnd}
          />
        </View>
        <Text style={styles.criterionValue}>{value.toFixed(1)}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================
// NotesSection — separate component for hooks safety
// ============================================

interface NotesSectionProps {
  entrance: SharedValue<number>;
  staggerIndex: number;
  showNotes: boolean;
  notes: string;
  onToggle: () => void;
  onChangeText: (text: string) => void;
}

function NotesSection({
  entrance,
  staggerIndex,
  showNotes,
  notes,
  onToggle,
  onChangeText,
}: NotesSectionProps) {
  const start = 0.20 + staggerIndex * 0.08;
  const end = start + 0.20;

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [start, end], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [start, end], [16, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable style={styles.notesToggle} onPress={onToggle}>
        <Ionicons
          name={showNotes ? 'create' : 'create-outline'}
          size={18}
          color={colors.text.secondary}
        />
        <Text style={styles.notesToggleText}>
          {showNotes ? 'Notes' : 'Add notes'}
        </Text>
      </Pressable>
      {showNotes && (
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={onChangeText}
          placeholder="Your thoughts on this coaster..."
          placeholderTextColor={colors.text.meta}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      )}
    </Animated.View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.modal,
    overflow: 'hidden',
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  coasterName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    paddingRight: 48,
    lineHeight: 30,
  },
  parkName: {
    fontSize: 13,
    color: colors.text.meta,
    marginTop: 2,
  },

  // Score card
  scoreCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.small,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  scoreBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.subtle,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.meta,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // Criterion cards
  criterionCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  criterionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  criterionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  criterionWeight: {
    fontSize: 13,
    color: colors.text.meta,
  },
  criterionSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criterionSliderWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  criterionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent.primary,
    width: 40,
    textAlign: 'right',
  },

  // Notes
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  notesToggleText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 80,
    marginBottom: spacing.md,
  },

  // Submit
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successInline: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.base,
  },
  successText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
