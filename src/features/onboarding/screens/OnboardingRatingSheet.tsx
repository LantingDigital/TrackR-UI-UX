/**
 * OnboardingRatingSheet
 *
 * A stripped copy of RatingSheet (src/components/RatingSheet.tsx)
 * for use in the onboarding demo. Identical layout, animations, and styles.
 *
 * Stripped:
 *  - useTabBar() replaced with no-ops (onboarding has no tab bar)
 *  - rideLogStore imports (getCriteria, upsertCoasterRating) — uses DEFAULT_CRITERIA directly
 *  - Keyboard tracking (no text input in demo)
 *  - Notes section (not relevant for demo)
 *  - existingRating prop (always fresh in demo)
 *
 * Kept:
 *  - Full rating UI: all category sliders/inputs, weighted score display
 *  - Score calculation (calculateWeightedScore)
 *  - All animations (entrance, category reveals, score calculation)
 *  - Visual design exactly as-is
 *  - Dismiss gesture (GestureDetector pan)
 *  - BlurView backdrop
 *  - Celebration animation (checkmark pop + "Rated!" text + confetti)
 *  - HalfPointSlider for each criterion
 *  - Criterion-specific colors
 *  - Stagger entrance
 *  - Compact bar on scroll
 *  - Haptics (harmless in demo)
 *
 * Added:
 *  - setRating(category, value) via imperative ref (for demo automation)
 *  - submitRating() via imperative ref (for demo automation)
 *  - onRateComplete callback (fires after celebration finishes)
 */

import React, { useState, useEffect, useCallback, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { HalfPointSlider } from '../../../components/HalfPointSlider';
import ConfettiBurst from '../../../components/feedback/ConfettiBurst';
import {
  RatingCriteria,
  DEFAULT_CRITERIA,
  calculateWeightedScore,
} from '../../../types/rideLog';
import { CARD_ART } from '../../../data/cardArt';
import { COASTER_BY_ID } from '../../../data/coasterIndex';
import {
  getRarityFromRank,
  RARITY_GRADIENTS,
} from '../../../data/cardArt';
import { LinearGradient } from 'expo-linear-gradient';

// ============================================
// Constants
// ============================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

/** When scrollY passes this, compact bar appears */
const COMPACT_FADE_START = 100;
const COMPACT_FADE_END = 160;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const CRITERION_COLORS: Record<string, string> = {
  airtime:    '#CF6769',
  intensity:  '#D4A98A',
  smoothness: '#8FBFB8',
  theming:    '#B8A3C4',
  pacing:     '#92ACC0',
  inversions: '#D6C48A',
  launch:     '#9DC0A0',
};

// ============================================
// Stagger entrance (matches RatingSheet)
// ============================================

function useStaggerEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ============================================
// Props & Ref
// ============================================

export interface OnboardingRatingSheetRef {
  /** Programmatically set a rating value for a criterion (for demo automation) */
  setRating: (category: string, value: number) => void;
  /** Programmatically trigger submit (for demo automation) */
  submitRating: () => void;
}

interface OnboardingRatingSheetProps {
  coasterName: string;
  parkName: string;
  /** Optional coaster ID for card art lookup */
  coasterId?: string;
  visible: boolean;
  onClose: () => void;
  /** Fires after celebration finishes ("Rated!" sequence complete) */
  onRateComplete: () => void;
}

// ============================================
// OnboardingRatingSheet
// ============================================

export const OnboardingRatingSheet = forwardRef<OnboardingRatingSheetRef, OnboardingRatingSheetProps>(
  function OnboardingRatingSheet({
    coasterName,
    parkName,
    coasterId,
    visible,
    onClose,
    onRateComplete,
  }, ref) {
    const insets = useSafeAreaInsets();
    const [mounted, setMounted] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const scrollRef = useRef<Animated.ScrollView>(null);

    // Use DEFAULT_CRITERIA directly (no store dependency)
    const allCriteria = DEFAULT_CRITERIA;
    const enabledCriteria = allCriteria.filter(c => c.weight > 0);

    // Art & rarity
    const localArt = coasterId ? CARD_ART[coasterId] : undefined;
    const coasterData = coasterId ? COASTER_BY_ID[coasterId] : undefined;
    const popularityRank = coasterData?.popularityRank ?? 9999;
    const rarity = getRarityFromRank(popularityRank);
    const [gradStart, gradEnd] = RARITY_GRADIENTS[rarity];
    const materialIcon = coasterData?.material === 'wood' ? 'leaf-outline' : 'train-outline';

    // Ratings — only updated on drag-end for zero-rerender sliders
    const [ratings, setRatings] = useState<Record<string, number>>(() => {
      const initial: Record<string, number> = {};
      enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
      return initial;
    });

    // Animation values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const scrollY = useSharedValue(0);

    const sheetTop = insets.top + 16;
    const sheetHeight = SCREEN_HEIGHT - sheetTop;

    // Live score
    const liveScore = calculateWeightedScore(ratings, allCriteria);
    const displayScore = (liveScore / 10).toFixed(1);
    const scoreProgress = useSharedValue(0);

    // Celebration shared values (full-screen overlay inside sheet)
    const contentFadeOut = useSharedValue(1);
    const celebSlideY = useSharedValue(30);
    const celebCheckScale = useSharedValue(0);
    const celebCheckOpacity = useSharedValue(0);
    const celebTextOpacity = useSharedValue(0);
    const celebConfettiProgress = useSharedValue(0);
    const celebTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
      scoreProgress.value = withSpring(liveScore / 100, SPRINGS.responsive);
    }, [liveScore]);

    // ── Open / Close ──
    useEffect(() => {
      if (visible) {
        setMounted(true);
        setIsDismissing(false);
        setShowSuccess(false);
        scrollY.value = 0;

        // Reset celebration values
        contentFadeOut.value = 1;
        celebSlideY.value = 30;
        celebCheckScale.value = 0;
        celebCheckOpacity.value = 0;
        celebTextOpacity.value = 0;
        celebConfettiProgress.value = 0;
        celebTimersRef.current.forEach(t => clearTimeout(t));
        celebTimersRef.current = [];

        // Reset ratings to default
        const initial: Record<string, number> = {};
        enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
        setRatings(initial);

        haptics.select();
        translateY.value = withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: 300 });
      } else if (!visible && mounted) {
        backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
        const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    const dismiss = useCallback(() => {
      setIsDismissing(true);
      translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onClose)();
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }, [onClose, sheetHeight]);

    const handleSubmit = useCallback(() => {
      haptics.success();
      setShowSuccess(true);

      // T+0: Fade out scroll content
      contentFadeOut.value = withTiming(0, { duration: 200 });

      // T+300ms: Celebration slides up + check pops + confetti fires
      celebTimersRef.current.push(setTimeout(() => {
        celebSlideY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        celebCheckScale.value = withSequence(
          withTiming(1.05, { duration: 250, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
        );
        celebCheckOpacity.value = withTiming(1, { duration: 250 });
        celebTextOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
        celebConfettiProgress.value = withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        });
      }, 300));

      // T+2500ms: Checkmark fades out (extended celebration time)
      celebTimersRef.current.push(setTimeout(() => {
        celebCheckOpacity.value = withTiming(0, { duration: 250 });
        celebCheckScale.value = withTiming(0.9, {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        });
        celebTextOpacity.value = withTiming(0, { duration: 200 });
      }, 2500));

      // T+3000ms: Fire onRateComplete (3000ms total celebration)
      celebTimersRef.current.push(setTimeout(() => {
        onRateComplete();
      }, 3000));
    }, [onRateComplete]);

    const handleCriterionDragEnd = useCallback((criterionId: string, value: number) => {
      setRatings(prev => ({ ...prev, [criterionId]: value }));
    }, []);

    // ── Expose ref methods for demo automation ──
    useImperativeHandle(ref, () => ({
      setRating: (category: string, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
      },
      submitRating: () => {
        handleSubmit();
      },
    }));

    // ── Pan gesture for dismiss ──
    const panGesture = Gesture.Pan()
      .enabled(visible)
      .activeOffsetY([-12, 12])
      .failOffsetX([-12, 12])
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

    // ── Scroll handler ──
    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
      },
    });

    // ── Compact bar fade-in (fixed overlay) ──
    const compactBarStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        scrollY.value,
        [COMPACT_FADE_START, COMPACT_FADE_END],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      pointerEvents: scrollY.value > COMPACT_FADE_START ? 'auto' as const : 'none' as const,
    }));

    const sheetAnimStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropAnimStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    // Score bar fill
    const scoreBarStyle = useAnimatedStyle(() => ({
      width: `${Math.min(scoreProgress.value * 100, 100)}%`,
    }));

    // Celebration animated styles
    const contentOpacityStyle = useAnimatedStyle(() => ({
      opacity: contentFadeOut.value,
    }));
    const celebSlideStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: celebSlideY.value }],
    }));
    const celebCheckStyle = useAnimatedStyle(() => ({
      opacity: celebCheckOpacity.value,
      transform: [{ scale: celebCheckScale.value }],
    }));
    const celebTextStyle = useAnimatedStyle(() => ({
      opacity: celebTextOpacity.value,
    }));

    if (!mounted) return null;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
        {/* Backdrop — covers full screen including notch area */}
        <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
            <BlurView intensity={40} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
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

            {/* ── Close button (hidden during celebration) ── */}
            {!showSuccess && (
              <Pressable
                onPress={() => { haptics.tap(); dismiss(); }}
                style={styles.closeBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            )}

            {/* ── Compact bar (fixed overlay, fades in on scroll) ── */}
            <Animated.View style={[styles.compactBar, compactBarStyle]}>
              <Text style={styles.compactName} numberOfLines={1}>
                {coasterName}
              </Text>
            </Animated.View>

            {/* ── Scrollable content (hero scrolls naturally) ── */}
            <Animated.ScrollView
              ref={scrollRef}
              style={[styles.scrollView, contentOpacityStyle]}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + spacing.xxxl },
              ]}
              showsVerticalScrollIndicator={false}
              scrollEnabled={scrollEnabled}
              keyboardShouldPersistTaps="handled"
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              {/* ── Hero (scrolls with content) ── */}
              <View style={styles.heroSection}>
                {/* Blurred art / gradient background */}
                {localArt ? (
                  <Image
                    source={localArt}
                    style={styles.heroBgImage}
                    resizeMode="cover"
                    blurRadius={20}
                  />
                ) : (
                  <LinearGradient
                    colors={[gradStart, gradEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={styles.heroDarkOverlay} />

                {/* Content row */}
                <View style={styles.heroContent}>
                  {/* Portrait card */}
                  <View style={styles.portraitCard}>
                    {localArt ? (
                      <Image
                        source={localArt}
                        style={styles.portraitImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={[gradStart, gradEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.portraitPlaceholder}
                      >
                        <Ionicons name={materialIcon as any} size={24} color="rgba(255,255,255,0.5)" />
                      </LinearGradient>
                    )}
                  </View>

                  {/* Name + park */}
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroName} numberOfLines={2}>
                      {coasterName}
                    </Text>
                    <Text style={styles.heroPark} numberOfLines={1}>
                      {parkName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Score Card */}
              <ScoreCard
                displayScore={displayScore}
                scoreBarStyle={scoreBarStyle}
              />

              {/* Section Label */}
              <SectionLabel index={2} />

              {/* Criteria rows in unified card */}
              <CriteriaCard
                enabledCriteria={enabledCriteria}
                ratings={ratings}
                onDragEnd={handleCriterionDragEnd}
                onSlidingStart={() => setScrollEnabled(false)}
                onSlidingEnd={() => setScrollEnabled(true)}
              />

              {/* Submit */}
              <SubmitSection
                index={enabledCriteria.length + 5}
                showSuccess={showSuccess}
                onSubmit={handleSubmit}
              />
            </Animated.ScrollView>

            {/* ── Full-screen celebration overlay (inside sheet) ── */}
            {showSuccess && (
              <View style={styles.celebOverlay} pointerEvents="none">
                <Animated.View style={[styles.celebCenter, celebSlideStyle]}>
                  <ConfettiBurst progress={celebConfettiProgress} />
                  <Animated.View style={[styles.celebCheckCircle, celebCheckStyle]}>
                    <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                  </Animated.View>
                  <Animated.View style={celebTextStyle}>
                    <Text style={styles.celebRatedText}>Rated!</Text>
                  </Animated.View>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

// ============================================
// ScoreCard
// ============================================

interface ScoreCardProps {
  displayScore: string;
  scoreBarStyle: any;
}

function ScoreCard({ displayScore, scoreBarStyle }: ScoreCardProps) {
  const stagger = useStaggerEntrance(0);

  return (
    <Animated.View style={[styles.scoreCard, stagger]}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>Your Rating</Text>
        <Text style={styles.scoreValue}>{displayScore}</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <Animated.View style={[styles.scoreBarFill, scoreBarStyle]} />
      </View>
    </Animated.View>
  );
}

// ============================================
// SectionLabel
// ============================================

function SectionLabel({ index }: { index: number }) {
  const stagger = useStaggerEntrance(index);
  return (
    <Animated.View style={stagger}>
      <Text style={styles.sectionLabel}>RATE EACH ASPECT</Text>
    </Animated.View>
  );
}

// ============================================
// CriteriaCard
// ============================================

interface CriteriaCardProps {
  enabledCriteria: RatingCriteria[];
  ratings: Record<string, number>;
  onDragEnd: (criterionId: string, value: number) => void;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
}

function CriteriaCard({
  enabledCriteria,
  ratings,
  onDragEnd,
  onSlidingStart,
  onSlidingEnd,
}: CriteriaCardProps) {
  const stagger = useStaggerEntrance(3);

  return (
    <Animated.View style={[styles.sectionCard, stagger]}>
      {enabledCriteria.map((criterion, index) => (
        <CriterionRow
          key={criterion.id}
          criterion={criterion}
          value={ratings[criterion.id] ?? 5.0}
          onDragEnd={onDragEnd}
          onSlidingStart={onSlidingStart}
          onSlidingEnd={onSlidingEnd}
          isLast={index === enabledCriteria.length - 1}
          staggerIndex={3 + index}
        />
      ))}
    </Animated.View>
  );
}

// ============================================
// CriterionRow -- zero-rerender slider row
// ============================================

interface CriterionRowProps {
  criterion: RatingCriteria;
  value: number;
  onDragEnd: (criterionId: string, value: number) => void;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
  isLast: boolean;
  staggerIndex: number;
}

const CriterionRow = memo(function CriterionRow({
  criterion,
  value,
  onDragEnd,
  onSlidingStart,
  onSlidingEnd,
  isLast,
  staggerIndex,
}: CriterionRowProps) {
  const color = CRITERION_COLORS[criterion.id] ?? colors.accent.primary;
  const stagger = useStaggerEntrance(staggerIndex);

  // Local shared value for zero-rerender display during drag
  const valueSV = useSharedValue(value);
  const latestValueRef = useRef(value);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      valueSV.value = value;
      latestValueRef.current = value;
    }
  }, [value]);

  const animatedValueProps = useAnimatedProps(() => ({
    text: valueSV.value.toFixed(1),
  } as any));

  const handleValueChange = useCallback((v: number) => {
    valueSV.value = v;
    latestValueRef.current = v;
  }, []);

  const handleSlidingStart = useCallback(() => {
    isDragging.current = true;
    onSlidingStart();
  }, [onSlidingStart]);

  const handleSlidingEnd = useCallback(() => {
    isDragging.current = false;
    onDragEnd(criterion.id, latestValueRef.current);
    onSlidingEnd();
  }, [criterion.id, onDragEnd, onSlidingEnd]);

  return (
    <Animated.View style={[styles.criterionRow, !isLast && styles.criterionBorder, stagger]}>
      <View style={styles.criterionHeader}>
        <View style={[styles.criterionIcon, { backgroundColor: color + '33' }]}>
          <Ionicons
            name={(criterion.icon as any) ?? 'star-outline'}
            size={14}
            color={color}
          />
        </View>
        <Text style={styles.criterionName}>{criterion.name}</Text>
        <Text style={[styles.criterionWeight, { color }]}>{criterion.weight}%</Text>
      </View>

      <View style={styles.criterionSliderRow}>
        <View style={styles.criterionSliderWrap}>
          <HalfPointSlider
            value={value}
            onValueChange={handleValueChange}
            onSlidingStart={handleSlidingStart}
            onSlidingEnd={handleSlidingEnd}
            quietHaptics
            color={color}
          />
        </View>
        <AnimatedTextInput
          editable={false}
          style={[styles.criterionValue, { color }]}
          animatedProps={animatedValueProps}
          defaultValue={value.toFixed(1)}
        />
      </View>
    </Animated.View>
  );
}, (prev, next) =>
  prev.value === next.value &&
  prev.criterion.id === next.criterion.id &&
  prev.criterion.weight === next.criterion.weight &&
  prev.isLast === next.isLast
);

// ============================================
// SubmitSection
// ============================================

interface SubmitSectionProps {
  index: number;
  showSuccess: boolean;
  onSubmit: () => void;
}

function SubmitSection({ index, showSuccess, onSubmit }: SubmitSectionProps) {
  const stagger = useStaggerEntrance(index);
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97 });

  return (
    <Animated.View style={[{ marginTop: spacing.xl }, stagger]}>
      <Pressable {...pressHandlers} onPress={onSubmit} disabled={showSuccess}>
        <Animated.View style={[styles.submitButton, animatedStyle, showSuccess && { opacity: 0.5 }]}>
          <Text style={styles.submitText}>Save Rating</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================
// Styles (matches RatingSheet exactly)
// ============================================

const CARD_W = 88;
const CARD_H = 117; // ~3:4 aspect

const styles = StyleSheet.create({
  // ── Sheet ──
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.modal,
    overflow: 'hidden',
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    zIndex: 20,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },

  // ── Close button ──
  closeBtn: {
    position: 'absolute',
    top: 28,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Compact bar (fixed overlay, covers from sheet top) ──
  compactBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 40,
    backgroundColor: colors.background.page,
    zIndex: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  compactName: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // ── Hero section (inside scroll, scrolls naturally) ──
  heroSection: {
    marginHorizontal: -spacing.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  portraitCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  portraitPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  heroName: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroPark: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ── Score Card ──
  scoreCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.section,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scoreBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border.subtle,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  // ── Criteria section card ──
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.section,
  },

  // ── Criterion row (compact) ──
  criterionRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  criterionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  criterionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  criterionName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  criterionWeight: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
  },
  criterionSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28 + spacing.sm,
  },
  criterionSliderWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  criterionValue: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    width: 36,
    textAlign: 'right',
    padding: 0,
  },

  // ── Submit ──
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  submitText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },

  // ── Celebration overlay (inside sheet) ──
  celebOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    zIndex: 50,
    backgroundColor: colors.background.page,
  },
  celebCenter: {
    alignItems: 'center',
  },
  celebCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  celebRatedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: spacing.sm,
  },
});
