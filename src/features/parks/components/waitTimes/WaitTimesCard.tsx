/**
 * WaitTimesCard — Individual ride row in the wait times list.
 * Color-coded wait time, status, historical comparison.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useCardPress } from '../../../../hooks/useSpringPress';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../../constants/animations';
import { getWaitColor } from '../../data/mockDashboardData';
import { RideWaitTimeData } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  closed: 'Closed',
  'temporarily-closed': 'Temp Closed',
  'weather-delay': 'Weather Delay',
};

interface WaitTimesCardProps {
  ride: RideWaitTimeData;
  index: number;
  onPress?: () => void;
}

export const WaitTimesCard = memo(function WaitTimesCard({
  ride,
  index,
  onPress,
}: WaitTimesCardProps) {
  const { pressHandlers, animatedStyle: pressStyle } = useCardPress();
  const isOpen = ride.status === 'open';
  const waitColor = getWaitColor(ride.waitMinutes, isOpen);

  // Staggered entry — cap at 8 items so late items don't wait forever
  const entryProgress = useSharedValue(0);
  useEffect(() => {
    const delay = Math.min(index, 8) * TIMING.stagger;
    entryProgress.value = withDelay(delay, withSpring(1, SPRINGS.stiff));
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [{ translateY: (1 - entryProgress.value) * 16 }],
  }));

  // Historical comparison
  const diff = ride.waitMinutes - ride.historicalAvgMinutes;
  const showDiff = isOpen && ride.historicalAvgMinutes > 0;
  let diffLabel = '';
  let diffColor = colors.text.meta;
  if (showDiff) {
    if (Math.abs(diff) <= 5) {
      diffLabel = '~avg';
    } else if (diff > 0) {
      diffLabel = `+${diff}`;
      diffColor = '#E8734A';
    } else {
      diffLabel = `${diff}`;
      diffColor = colors.status.success;
    }
  }

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[pressStyle, entryStyle]}>
        {/* Shadow wrapper (separate from clip layer per shadow-clipping rule) */}
        <View style={styles.shadowWrap}>
          <View style={styles.card}>
            {/* Color indicator bar */}
            <View style={[styles.indicator, { backgroundColor: waitColor }]} />

            {/* Ride info */}
            <View style={styles.infoSection}>
              <Text style={styles.rideName} numberOfLines={1}>{ride.name}</Text>
              <Text style={[styles.statusText, !isOpen && styles.statusClosed]}>
                {STATUS_LABELS[ride.status] ?? ride.status}
              </Text>
            </View>

            {/* Wait time display */}
            <View style={styles.waitSection}>
              {isOpen ? (
                <>
                  <Text style={[styles.waitNumber, { color: waitColor }]}>{ride.waitMinutes}</Text>
                  <Text style={styles.waitUnit}>min</Text>
                </>
              ) : (
                <Text style={styles.closedText}>Closed</Text>
              )}
              {showDiff && diffLabel !== '' && (
                <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel} vs avg</Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radius.md,
    ...shadows.small,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    paddingVertical: spacing.base,
    paddingRight: spacing.lg,
  },
  indicator: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  infoSection: {
    flex: 1,
    paddingLeft: spacing.base,
    gap: spacing.xs,
  },
  rideName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  statusText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.status.success,
  },
  statusClosed: {
    color: colors.text.meta,
  },
  waitSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  waitNumber: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
  },
  waitUnit: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: -2,
  },
  closedText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  diffText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
});
