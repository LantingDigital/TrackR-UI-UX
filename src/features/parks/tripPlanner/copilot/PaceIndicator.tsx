// ============================================
// Pace Indicator — Inline pace status badge
//
// Shows a breathing colored dot + "X min ahead"
// or "X min behind" text. Hidden when within
// ±2 min (on pace).
// ============================================

import React, { memo, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { TIMING } from '../../../../constants/animations';
import type { PaceSnapshot } from '../types';

interface PaceIndicatorProps {
  snapshot: PaceSnapshot | null;
}

function PaceIndicatorInner({ snapshot }: PaceIndicatorProps) {
  const dotScale = useSharedValue(1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  if (!snapshot) return null;

  const { deltaMin } = snapshot;
  const absDelta = Math.abs(deltaMin);

  // Hide when within ±2 minutes (on pace)
  if (absDelta < 2) return null;

  const isAhead = deltaMin < 0;
  const dotColor = isAhead ? colors.status.success : colors.status.warning;
  const label = `${Math.round(absDelta)} min ${isAhead ? 'ahead' : 'behind'}`;

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dotStyle]} />
      <Text style={[styles.label, { color: dotColor }]}>{label}</Text>
    </Animated.View>
  );
}

export const PaceIndicator = memo(PaceIndicatorInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
  },
});
