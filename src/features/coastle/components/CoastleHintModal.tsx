import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
// RNGH ScrollView bypasses the native Pressable responder in MorphingPill's expandedContent
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { HintReveal } from '../types/coastle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - 96; // matches HINT_CARD_WIDTH in CoastleHintButton

// ============================================
// HintPage — one hint's full content, explicitly sized to fill the scroll view
// ============================================

interface HintPageProps {
  hint: HintReveal;
  index: number;
  total: number;
  width: number;
}

const HintPage: React.FC<HintPageProps> = ({ hint, index, total, width }) => {
  const isFirstLetter = hint.hintType === 'first_letter';
  const label = isFirstLetter
    ? 'The first letter of this coaster is'
    : 'The park name starts with';

  return (
    <View style={[styles.page, { width }]}>
      {/* Counter travels with this page — same position as its sibling pages */}
      <Text style={styles.pageCounter}>Hint {index + 1}/{total}</Text>
      {/* Content centered in the remaining space */}
      <View style={styles.pageContentArea}>
        <Text style={styles.hintLabel}>{label}</Text>
        {isFirstLetter ? (
          <Text style={styles.hintLetter}>{hint.value}</Text>
        ) : (
          <Text style={[styles.hintPattern, { width: width - spacing.xl * 2 }]}>
            <Text style={styles.hintPatternFirst}>{hint.value[0]}</Text>
            <Text style={styles.hintPatternRest}>{hint.value.slice(1)}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

// ============================================
// CoastleHintContent — paginated hint display inside MorphingPill card
// ============================================

interface CoastleHintContentProps {
  hints: HintReveal[];
  close: () => void;
}

export const CoastleHintContent: React.FC<CoastleHintContentProps> = ({
  hints,
  close,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);

  // After the RNGH ScrollView lays out, jump to the newest hint instantly
  const handleScrollLayout = useCallback(() => {
    if (hints.length > 1 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      scrollRef.current?.scrollTo({ x: (hints.length - 1) * PAGE_WIDTH, animated: false });
    }
  }, [hints.length]);

  return (
    <View style={styles.content}>
      {/* RNGH ScrollView fills the full content area; each page carries its own counter */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={handleScrollLayout}
          style={styles.scrollView}
          bounces={false}
        >
          {hints.map((hint, i) => (
            <HintPage
              key={hint.afterGuess}
              hint={hint}
              index={i}
              total={hints.length}
              width={PAGE_WIDTH}
            />
          ))}
        </ScrollView>
      </View>

      {/* Footer — locked at bottom, same position on every page */}
      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => { haptics.tap(); close(); }}
        >
          <Text style={styles.buttonText}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ============================================
// CoastleHintPreContent — shown when hints haven't unlocked yet
// ============================================

interface CoastleHintPreContentProps {
  close: () => void;
}

export const CoastleHintPreContent: React.FC<CoastleHintPreContentProps> = ({ close }) => (
  <View style={styles.preContent}>
    <Ionicons name="bulb-outline" size={28} color={colors.text.meta} />
    <Text style={styles.preHintText}>Hints unlock at guesses 3 & 6</Text>
    <Pressable style={styles.button} onPress={() => { haptics.tap(); close(); }}>
      <Text style={styles.buttonText}>Got it</Text>
    </Pressable>
  </View>
);

// ============================================
// CoastleHintTooltip — lightweight standalone overlay with auto-dismiss
// ============================================

interface CoastleHintTooltipProps {
  visible: boolean;
  onClose: () => void;
}

export const CoastleHintTooltip: React.FC<CoastleHintTooltipProps> = ({
  visible,
  onClose,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });

      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Reanimated.View style={[styles.tooltipBackdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Reanimated.View>
      <Reanimated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.tooltipCard}>
          <Ionicons name="bulb-outline" size={24} color={colors.text.meta} />
          <Text style={styles.tooltipText}>Hints unlock at guesses 3 & 6</Text>
        </View>
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── CoastleHintContent ──────────────────────────────
  content: {
    flex: 1,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // ── HintPage ─────────────────────────────────────────
  page: {
    alignSelf: 'stretch',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  pageCounter: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    textAlign: 'center',
  },
  pageContentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hintLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.label * 1.4,
  },
  hintLetter: {
    fontSize: 80,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    lineHeight: 88,
  },
  hintPattern: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 32,
  },
  hintPatternFirst: {
    color: colors.accent.primary,
  },
  hintPatternRest: {
    color: colors.text.secondary,
  },

  // ── Shared footer ─────────────────────────────────────
  footer: {
    alignItems: 'center',
  },
  button: {
    height: 40,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // ── CoastleHintPreContent ────────────────────────────
  preContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  preHintText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // ── CoastleHintTooltip ───────────────────────────────
  tooltipBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 200,
  },
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    ...shadows.small,
  },
  tooltipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
