/**
 * TriviaCard - Interactive trivia card with 3D flip animation.
 * Shows a coaster trivia question on the front; tap to flip and reveal the answer.
 * Tapping the back flips it back to the SAME question. A separate "Next Question"
 * button advances content without flipping.
 *
 * Layout: Both faces are always positioned absolutely within a Reanimated container
 * whose height is animated via a shared value. This ensures content below the card
 * slides smoothly when the card changes height (flip between question/answer).
 * No overflow: hidden — shadows render freely.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { onBecomeVisible, offBecomeVisible, hasBeenVisible } from '../../utils/feedAnimations';
import { MOCK_TRIVIA } from '../../data/mockFeed';

// Height animation config — smooth, decisive, no jello
const HEIGHT_TIMING = { duration: 350, easing: Easing.out(Easing.cubic) };

// ── Main Component ──

interface TriviaCardProps {
  sectionId?: string;
}

export const DidYouKnowCard = React.memo<TriviaCardProps>(({ sectionId }) => {
  const indexRef = useRef(Math.floor(Math.random() * MOCK_TRIVIA.length));
  const isFlippedRef = useRef(false);
  const flipProgress = useSharedValue(0);
  const entrance = useSharedValue(sectionId ? (hasBeenVisible(sectionId) ? 1 : 0) : 1);

  const [currentIndex, setCurrentIndex] = useState(indexRef.current);
  const [isFlipped, setIsFlipped] = useState(false);
  const trivia = MOCK_TRIVIA[currentIndex];

  // ── Height measurement + animated container ──
  const frontHeightRef = useRef(0);
  const backHeightRef = useRef(0);
  const animatedHeight = useSharedValue(0);
  // Tracks whether a flip animation is in-flight; layout callbacks defer to the
  // post-flip timeout instead of driving height themselves during a flip.
  const flipInProgressRef = useRef(false);

  const handleFrontLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    frontHeightRef.current = h;
    // Only update container height if front face is active AND no flip is in-flight.
    // During a flip (handleFlip or handleNextQuestion), the post-flip timeout
    // owns the height animation — layout callbacks just record the measurement.
    if (!isFlippedRef.current && !flipInProgressRef.current) {
      if (animatedHeight.value <= 0) {
        // First measurement — set instantly (no animation on mount)
        animatedHeight.value = h;
      } else {
        animatedHeight.value = withTiming(h, HEIGHT_TIMING);
      }
    }
  }, []);

  const handleBackLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    backHeightRef.current = h;
    // Only update if back face is active, past initial mount, and no flip in-flight
    if (isFlippedRef.current && !flipInProgressRef.current && animatedHeight.value > 0) {
      animatedHeight.value = withTiming(h, HEIGHT_TIMING);
    }
  }, []);

  const heightStyle = useAnimatedStyle(() => {
    if (animatedHeight.value <= 0) return {};
    return { height: animatedHeight.value };
  });

  // Viewability-based entrance animation
  useEffect(() => {
    if (!sectionId) return;
    onBecomeVisible(sectionId, () => {
      entrance.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => offBecomeVisible(sectionId);
  }, [sectionId]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [20, 0]) }],
  }));

  // 3D flip: front face
  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = flipProgress.value < 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // 3D flip: back face
  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const opacity = flipProgress.value >= 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Flip the card (front <-> back). Does NOT advance the question.
  const handleFlip = useCallback(() => {
    haptics.select();
    flipInProgressRef.current = true;

    if (!isFlippedRef.current) {
      isFlippedRef.current = true;
      setIsFlipped(true);
      flipProgress.value = withTiming(1, {
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
      });
    } else {
      isFlippedRef.current = false;
      setIsFlipped(false);
      flipProgress.value = withTiming(0, {
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
      });
    }

    // After the flip completes, measure the now-visible face and animate height
    setTimeout(() => {
      flipInProgressRef.current = false;
      const targetHeight = isFlippedRef.current
        ? backHeightRef.current
        : frontHeightRef.current;
      if (targetHeight > 0 && animatedHeight.value > 0) {
        animatedHeight.value = withTiming(targetHeight, HEIGHT_TIMING);
      }
    }, 460); // Just past the 450ms flip duration
  }, []);

  // Advance to next question and auto-flip back to front
  const handleNextQuestion = useCallback(() => {
    haptics.select();
    flipInProgressRef.current = true;

    const nextIndex = (indexRef.current + 1) % MOCK_TRIVIA.length;
    indexRef.current = nextIndex;

    // Flip back to front
    isFlippedRef.current = false;
    setIsFlipped(false);
    setCurrentIndex(nextIndex);

    flipProgress.value = withTiming(0, {
      duration: 450,
      easing: Easing.inOut(Easing.cubic),
    });

    // After the flip completes, measure the new front content and animate height.
    // This fires regardless of whether onLayout triggered (handles same-height questions).
    setTimeout(() => {
      flipInProgressRef.current = false;
      const targetHeight = frontHeightRef.current;
      if (targetHeight > 0 && animatedHeight.value > 0) {
        animatedHeight.value = withTiming(targetHeight, HEIGHT_TIMING);
      }
    }, 460); // Just past the 450ms flip duration
  }, []);

  return (
    <View style={styles.container}>
      <Reanimated.View style={entranceStyle}>
        <Reanimated.View style={[styles.flipContainer, heightStyle]}>
          {/* Front face: Question */}
          <View
            pointerEvents={isFlipped ? 'none' : 'auto'}
            style={styles.absoluteFace}
          >
            <Pressable onPress={handleFlip}>
              <Reanimated.View
                style={[styles.card, frontStyle]}
                onLayout={handleFrontLayout}
              >
                <View style={styles.topRow}>
                  <View style={styles.labelRow}>
                    <View style={styles.triviaIcon}>
                      <Ionicons name="help-circle" size={16} color={colors.accent.primary} />
                    </View>
                    <Text style={styles.label}>Trivia</Text>
                  </View>
                  <View style={styles.iconBadge}>
                    <Ionicons name={trivia.icon as any} size={16} color={colors.accent.primary} />
                  </View>
                </View>
                <Text style={styles.questionText}>{trivia.question}</Text>
                <View style={styles.bottomRow}>
                  <Text style={styles.hint}>Tap to reveal</Text>
                  <Ionicons name="return-down-back-outline" size={14} color={colors.text.meta} />
                </View>
              </Reanimated.View>
            </Pressable>
          </View>

          {/* Back face: Answer */}
          <View
            pointerEvents={!isFlipped ? 'none' : 'auto'}
            style={styles.absoluteFace}
          >
            <Pressable onPress={handleFlip}>
              <Reanimated.View
                style={[styles.card, backStyle]}
                onLayout={handleBackLayout}
              >
                <View>
                  <View style={styles.topRow}>
                    <View style={styles.labelRow}>
                      <View style={styles.answerIcon}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      </View>
                      <Text style={styles.label}>Answer</Text>
                    </View>
                    <View style={styles.iconBadge}>
                      <Ionicons name={trivia.icon as any} size={16} color={colors.accent.primary} />
                    </View>
                  </View>
                  <Text style={styles.answerText}>{trivia.answer}</Text>
                  <Text style={styles.source}>Source: {trivia.source}</Text>
                </View>
                <Pressable
                  onPress={handleNextQuestion}
                  style={styles.nextButton}
                  hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                >
                  <Text style={styles.nextButtonText}>Next Question</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent.primary} />
                </Pressable>
              </Reanimated.View>
            </Pressable>
          </View>
        </Reanimated.View>
      </Reanimated.View>
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  flipContainer: {
    // No overflow hidden — shadows render freely
    // Height is controlled by animatedHeight shared value
  },
  absoluteFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triviaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  answerText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  source: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.meta,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});
