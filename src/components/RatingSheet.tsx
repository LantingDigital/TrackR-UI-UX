/**
 * RatingSheet — Premium bottom sheet for rating a coaster
 *
 * Hero section scrolls naturally (no height interpolation = no jitter).
 * Compact bar fades in as fixed overlay when hero scrolls off.
 * Criterion-specific colors on sliders/icons/values.
 * Zero-rerender slider values via AnimatedTextInput.
 *
 * Entry points:
 * - "Rate this ride?" nudge after quick log
 * - "Rate" button on CoasterSheet (future)
 * - Pending ratings section in LogModal
 * - Tap coaster in Logbook collection
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedKeyboard,
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { useTabBar } from '../contexts/TabBarContext';
import { haptics } from '../services/haptics';
import { FadeInImage } from './FadeInImage';
import { HalfPointSlider } from './HalfPointSlider';
import ConfettiBurst from './feedback/ConfettiBurst';
import {
  CoasterRating,
  RatingCriteria,
  calculateWeightedScore,
} from '../types/rideLog';
import {
  getCriteria,
  upsertCoasterRating,
} from '../stores/rideLogStore';
import {
  CARD_ART,
  CARD_ART_FOCAL,
  getRarityFromRank,
  RARITY_GRADIENTS,
} from '../data/cardArt';
import { COASTER_BY_ID } from '../data/coasterIndex';

// ============================================
// Constants
// ============================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

/** Portrait card in hero */
const CARD_W = 88;
const CARD_H = 117; // ~3:4 aspect

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

const MATERIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Steel: 'construct-outline',
  Wood: 'leaf-outline',
  Hybrid: 'git-merge-outline',
};

// ============================================
// Stagger entrance (matches CriteriaWeightEditorScreen)
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
// Props
// ============================================

interface RatingSheetProps {
  visible: boolean;
  coasterId: string;
  coasterName: string;
  parkName: string;
  existingRating?: CoasterRating;
  onClose: () => void;
  onComplete: (rating: CoasterRating) => void;
  /** Fires immediately when dismiss animation BEGINS (not when it finishes) */
  onDismissStart?: () => void;
}

// ============================================
// RatingSheet
// ============================================

export function RatingSheet({
  visible,
  coasterId,
  coasterName,
  parkName,
  existingRating,
  onDismissStart,
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
  const scrollRef = useRef<Animated.ScrollView>(null);

  // Criteria
  const allCriteria = getCriteria();
  const enabledCriteria = allCriteria.filter(c => c.weight > 0);

  // Ratings — only updated on drag-end for zero-rerender sliders
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    if (existingRating?.criteriaRatings) {
      return { ...existingRating.criteriaRatings };
    }
    const initial: Record<string, number> = {};
    enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
    return initial;
  });

  // Art & rarity
  const localArt = CARD_ART[coasterId];
  const coasterData = COASTER_BY_ID[coasterId];
  const popularityRank = coasterData?.popularityRank ?? 9999;
  const rarity = getRarityFromRank(popularityRank);
  const [gradStart, gradEnd] = RARITY_GRADIENTS[rarity];
  const materialIcon = MATERIAL_ICONS[coasterData?.material ?? ''] ?? 'train-outline';

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
      setShowNotes(existingRating?.notes ? true : false);
      setNotes(existingRating?.notes ?? '');
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

      if (existingRating?.criteriaRatings) {
        setRatings({ ...existingRating.criteriaRatings });
      } else {
        const initial: Record<string, number> = {};
        enabledCriteria.forEach(c => { initial[c.id] = 5.0; });
        setRatings(initial);
      }

      tabBar?.hideTabBar();
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
    Keyboard.dismiss();
    setIsDismissing(true);
    tabBar?.showTabBar();
    onDismissStart?.();
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
    Keyboard.dismiss();
    haptics.success();
    const rating = upsertCoasterRating(
      { id: coasterId, name: coasterName, parkName },
      ratings,
      notes || undefined,
    );
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

    // T+1600ms: Checkmark fades out
    celebTimersRef.current.push(setTimeout(() => {
      celebCheckOpacity.value = withTiming(0, { duration: 250 });
      celebCheckScale.value = withTiming(0.9, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      celebTextOpacity.value = withTiming(0, { duration: 200 });
    }, 1600));

    // T+1900ms: Slide sheet down + restore tab bar + fire onComplete
    celebTimersRef.current.push(setTimeout(() => {
      onDismissStart?.();
      backdropOpacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(sheetHeight, { duration: 300, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(showTabBarJS)();
          runOnJS(onComplete)(rating);
        }
      });
    }, 1900));
  }, [coasterId, coasterName, parkName, ratings, notes, onComplete]);

  // Scroll to end when keyboard opens so notes input is fully visible above keyboard
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardWillShow', () => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });
    return () => sub.remove();
  }, []);

  const handleCriterionDragEnd = useCallback((criterionId: string, value: number) => {
    setRatings(prev => ({ ...prev, [criterionId]: value }));
  }, []);

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

  // Score bar fill — simple left-to-right width
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

          {/* ── Scrollable content (hero scrolls naturally = no jitter) ── */}
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
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            {/* ── Hero (scrolls with content) ── */}
            <View style={styles.heroSection}>
              {/* Blurred art / gradient background */}
              {localArt ? (
                <FadeInImage
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
                    <FadeInImage
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
                      <Ionicons name={materialIcon} size={24} color="rgba(255,255,255,0.5)" />
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

            {/* Notes */}
            <NotesSection
              index={enabledCriteria.length + 4}
              showNotes={showNotes}
              notes={notes}
              onToggle={() => {
                setShowNotes(!showNotes);
                if (!showNotes) haptics.tap();
              }}
              onChangeText={setNotes}
            />

            {/* Submit */}
            <SubmitSection
              index={enabledCriteria.length + 5}
              showSuccess={showSuccess}
              isUpdate={!!existingRating}
              onSubmit={handleSubmit}
            />

          </Animated.ScrollView>

          {/* ── Full-screen celebration overlay ── */}
          {/* TODO: Restyle to match onboarding — blurred coaster bg + white radial gradient + phased close */}
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
}

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
// CriterionRow — zero-rerender slider row
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
// NotesSection
// ============================================

interface NotesSectionProps {
  index: number;
  showNotes: boolean;
  notes: string;
  onToggle: () => void;
  onChangeText: (text: string) => void;
}

function NotesSection({ index, showNotes, notes, onToggle, onChangeText }: NotesSectionProps) {
  const stagger = useStaggerEntrance(index);
  const { pressHandlers, animatedStyle } = useSpringPress();
  const notesHeight = useSharedValue(showNotes ? 1 : 0);

  useEffect(() => {
    notesHeight.value = withTiming(showNotes ? 1 : 0, { duration: 250 });
  }, [showNotes]);

  const notesContainerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(notesHeight.value, [0, 1], [0, 120], Extrapolation.CLAMP),
    opacity: notesHeight.value,
    marginTop: interpolate(notesHeight.value, [0, 1], [0, spacing.sm], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.notesCard, stagger]}>
      <Pressable {...pressHandlers} onPress={onToggle}>
        <Animated.View style={[styles.notesToggle, animatedStyle]}>
          <Ionicons
            name={showNotes ? 'create' : 'create-outline'}
            size={18}
            color={colors.text.secondary}
          />
          <Text style={styles.notesToggleText}>
            {showNotes ? 'Notes' : 'Add notes'}
          </Text>
          <Ionicons
            name={showNotes ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.text.meta}
          />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.notesInputWrap, notesContainerStyle]}>
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
    </Animated.View>
  );
}

// ============================================
// SubmitSection
// ============================================

interface SubmitSectionProps {
  index: number;
  showSuccess: boolean;
  isUpdate: boolean;
  onSubmit: () => void;
}

function SubmitSection({ index, showSuccess, isUpdate, onSubmit }: SubmitSectionProps) {
  const stagger = useStaggerEntrance(index);
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97 });

  return (
    <Animated.View style={[{ marginTop: spacing.xl }, stagger]}>
      <Pressable {...pressHandlers} onPress={onSubmit} disabled={showSuccess}>
        <Animated.View style={[styles.submitButton, animatedStyle, showSuccess && { opacity: 0.5 }]}>
          <Text style={styles.submitText}>
            {isUpdate ? 'Update Rating' : 'Save Rating'}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================
// Styles
// ============================================

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

  // ── Close button — positioned within hero section, below the drag handle ──
  closeBtn: {
    position: 'absolute',
    top: 28, // below dragHandleArea (17px) + padding into hero
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
    height: 56, // drag handle area (17) + toolbar content (39)
    paddingTop: 20, // push text below drag handle
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl + 40, // avoid close button
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
    marginHorizontal: -spacing.lg, // full bleed
    marginTop: -spacing.lg, // pull up behind drag handle — no gap
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
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── Notes ──
  notesCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginTop: spacing.lg,
    ...shadows.section,
    overflow: 'hidden',
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  notesToggleText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  notesInputWrap: {
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  notesInput: {
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    padding: spacing.base,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    minHeight: 80,
    marginBottom: spacing.base,
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
    zIndex: 50,
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
