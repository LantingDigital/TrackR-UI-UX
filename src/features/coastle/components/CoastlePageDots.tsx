import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Reanimated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { MAX_GUESSES } from '../types/coastle';

interface CoastlePageDotsProps {
  guessCount: number;
  activeIndex: SharedValue<number>;
  totalSlots: number;
}

const DOT_HEIGHT = 8;
const DOT_INACTIVE_WIDTH = 8;
const DOT_ACTIVE_WIDTH = 24;

const SPRING_CONFIG = { damping: 20, stiffness: 120, mass: 0.8 };

// Color constants for interpolation (must be outside component for worklet access)
const COLOR_UNFILLED = colors.border.subtle;    // #E5E5E5
const COLOR_FILLED = colors.text.meta;           // #999999
const COLOR_ACTIVE = colors.accent.primary;      // #CF6769

const Dot: React.FC<{ index: number; activeIndex: SharedValue<number>; isFilled: boolean }> = React.memo(({
  index,
  activeIndex,
  isFilled,
}) => {
  const progress = useSharedValue(0);

  // React to activeIndex changes entirely on the UI thread — no React re-renders
  useAnimatedReaction(
    () => (activeIndex.value === index ? 1 : 0),
    (target, prev) => {
      if (prev === null) {
        // Initial mount: set immediately (no spring)
        progress.value = target;
      } else if (target !== prev) {
        progress.value = withSpring(target, SPRING_CONFIG);
      }
    },
  );

  const baseColor = isFilled ? COLOR_FILLED : COLOR_UNFILLED;

  const animStyle = useAnimatedStyle(() => {
    const width = DOT_INACTIVE_WIDTH + progress.value * (DOT_ACTIVE_WIDTH - DOT_INACTIVE_WIDTH);
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [baseColor, COLOR_ACTIVE],
    );
    return { width, backgroundColor };
  });

  return (
    <Reanimated.View
      style={[styles.dot, animStyle]}
    />
  );
});

export const CoastlePageDots: React.FC<CoastlePageDotsProps> = React.memo(({
  guessCount,
  activeIndex,
  totalSlots,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: MAX_GUESSES }, (_, i) => (
          <Dot
            key={i}
            index={i}
            activeIndex={activeIndex}
            isFilled={i < guessCount}
          />
        ))}
      </View>
      <Text style={styles.counter}>{guessCount}/{MAX_GUESSES}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: DOT_HEIGHT,
    borderRadius: DOT_HEIGHT / 2,
  },
  counter: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
});
