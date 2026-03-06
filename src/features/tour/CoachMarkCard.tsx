// ============================================
// Guided Tour v2 — Coach Mark Card
//
// Pure presentation component. Animation (opacity,
// translateY) is controlled by TourOverlay via the
// two-card cross-fade system. Accepts animated
// props instead of managing its own step transitions.
// ============================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import type { ArrowDirection, TargetMeasurement } from './types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_MARGIN = 32;
const CARD_WIDTH = SCREEN_W - CARD_MARGIN * 2;
const ARROW_SIZE = 10;
const GAP_FROM_TARGET = 16;

interface CoachMarkCardProps {
  title: string;
  body: string;
  instruction?: string;
  stepIndex: number;
  totalSteps: number;
  targetRect: TargetMeasurement | null;
  isInteract: boolean;
  showSkipFallback: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
  // Animation control from overlay
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
}

export function CoachMarkCard({
  title,
  body,
  instruction,
  stepIndex,
  totalSteps,
  targetRect,
  isInteract,
  showSkipFallback,
  isLastStep,
  onNext,
  onSkip,
  opacity,
  translateY,
}: CoachMarkCardProps) {
  // ---- Compute position + arrow direction ----
  let cardTop: number;
  let arrowDirection: ArrowDirection = 'none';

  if (targetRect) {
    const targetCenterY = targetRect.y + targetRect.height / 2;
    const inTopHalf = targetCenterY < SCREEN_H / 2;

    if (inTopHalf) {
      cardTop = targetRect.y + targetRect.height + GAP_FROM_TARGET + ARROW_SIZE;
      arrowDirection = 'up';
    } else {
      cardTop = targetRect.y - GAP_FROM_TARGET - ARROW_SIZE - 180;
      arrowDirection = 'down';
    }

    cardTop = Math.max(60, Math.min(cardTop, SCREEN_H - 240));
  } else {
    cardTop = SCREEN_H / 2 - 100;
  }

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // ---- Arrow horizontal position ----
  let arrowLeft = CARD_WIDTH / 2 - ARROW_SIZE;
  if (targetRect) {
    const targetCenterX = targetRect.x + targetRect.width / 2;
    arrowLeft = Math.max(20, Math.min(targetCenterX - CARD_MARGIN - ARROW_SIZE, CARD_WIDTH - 40));
  }

  // For interact steps, show instruction or skip fallback; no Next button
  const showNextButton = !isInteract || showSkipFallback || isLastStep;

  return (
    <Animated.View
      style={[styles.card, { top: cardTop, left: CARD_MARGIN }, animStyle]}
      pointerEvents="box-none"
    >
      {arrowDirection === 'up' && (
        <View style={[styles.arrowUp, { left: arrowLeft }]} />
      )}
      {arrowDirection === 'down' && (
        <View style={[styles.arrowDown, { left: arrowLeft }]} />
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {instruction && (
        <Text style={styles.instruction}>{instruction}</Text>
      )}

      {/* Footer: dots + buttons */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i === stepIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {!isLastStep && (
            <Pressable
              onPress={onSkip}
              hitSlop={12}
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.5 }]}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}

          {showNextButton && (
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.nextBtn,
                pressed && styles.nextBtnPressed,
              ]}
            >
              <Text style={styles.nextText}>
                {isLastStep ? 'Done' : showSkipFallback ? 'Skip Step' : 'Next'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.card,
    zIndex: 10001,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.label * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  instruction: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
    width: 18,
    borderRadius: 3,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  skipBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  nextBtn: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.button,
  },
  nextBtnPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  nextText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  arrowUp: {
    position: 'absolute',
    top: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.background.card,
  },
  arrowDown: {
    position: 'absolute',
    bottom: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.background.card,
  },
});
