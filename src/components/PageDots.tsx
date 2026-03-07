/**
 * PageDots — Shared progress dot indicator
 *
 * Matches Coastle's bottom-positioned page dots with spring-animated
 * width transitions. Reusable across all game screens.
 *
 * Props:
 *   current  — number of filled dots (completed steps)
 *   total    — total number of dots
 *   label    — optional label text below dots (e.g. "3/6")
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface PageDotsProps {
  current: number;
  total: number;
  label?: string;
}

const DOT_HEIGHT = 8;
const DOT_INACTIVE_WIDTH = 8;
const DOT_ACTIVE_WIDTH = 20;

const SPRING_CONFIG = { damping: 20, stiffness: 120, mass: 0.8 };

const COLOR_UNFILLED = colors.border.subtle;
const COLOR_FILLED = colors.text.meta;
const COLOR_ACTIVE = colors.accent.primary;

const Dot: React.FC<{ index: number; current: number; total: number }> = React.memo(({
  index,
  current,
}) => {
  const progress = useSharedValue(0);

  // Spring-animate active state on current change
  React.useEffect(() => {
    const isActive = index === current;
    progress.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
  }, [current, index]);

  const isFilled = index < current;
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
    <Reanimated.View style={[styles.dot, animStyle]} />
  );
});

export const PageDots: React.FC<PageDotsProps> = React.memo(({
  current,
  total,
  label,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }, (_, i) => (
          <Dot
            key={i}
            index={i}
            current={current}
            total={total}
          />
        ))}
      </View>
      {label != null && (
        <Text style={styles.counter}>{label}</Text>
      )}
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
