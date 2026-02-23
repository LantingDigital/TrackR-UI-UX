import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { MAX_GUESSES } from '../types/coastle';

interface CoastlePageDotsProps {
  guessCount: number;
  activeIndex: number;
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

const Dot: React.FC<{ index: number; activeIndex: number; isFilled: boolean }> = ({
  index,
  activeIndex,
  isFilled,
}) => {
  const progress = useSharedValue(index === activeIndex ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(index === activeIndex ? 1 : 0, SPRING_CONFIG);
  }, [activeIndex]);

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
};

export const CoastlePageDots: React.FC<CoastlePageDotsProps> = ({
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
};

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
