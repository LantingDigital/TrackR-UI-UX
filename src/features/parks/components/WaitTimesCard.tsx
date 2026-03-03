import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useCardPress } from '../../../hooks/useSpringPress';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { RideWaitTime, getWaitColor } from '../data/mockDashboardData';

// ============================================
// WaitTimePill (individual ride pill)
// ============================================

function WaitTimePill({
  ride,
  index,
  onPress,
}: {
  ride: RideWaitTime;
  index: number;
  onPress?: () => void;
}) {
  const { pressHandlers, animatedStyle: pressStyle } = useCardPress();
  const waitColor = getWaitColor(ride.waitMinutes, ride.isOpen);

  // Staggered entry
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * TIMING.stagger,
      withSpring(1, SPRINGS.responsive),
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [{ translateY: (1 - entryProgress.value) * 12 }],
  }));

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[styles.pill, pressStyle, entryStyle]}>
        <Text style={styles.pillName} numberOfLines={1}>
          {ride.name}
        </Text>
        <Text style={[styles.pillWait, { color: waitColor }]}>
          {ride.isOpen ? `${ride.waitMinutes} min` : 'Closed'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// WaitTimesCard
// ============================================

interface WaitTimesCardProps {
  waitTimes: RideWaitTime[];
  onRidePress?: (rideId: string) => void;
}

export function WaitTimesCard({ waitTimes, onRidePress }: WaitTimesCardProps) {
  const openCount = waitTimes.filter((r) => r.isOpen).length;

  return (
    <View>
      {/* Card background — visual only, does NOT clip children */}
      <View style={styles.cardBackground} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wait Times</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{openCount}</Text>
        </View>
        <View style={styles.liveGroup}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>LIVE</Text>
        </View>
      </View>

      {/* Carousel — sibling of background, not clipped by borderRadius */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {waitTimes.map((ride, i) => (
          <WaitTimePill
            key={ride.id}
            ride={ride}
            index={i}
            onPress={onRidePress ? () => onRidePress(ride.id) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  liveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28A745',
  },
  liveLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: '#28A745',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: spacing.md,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  pill: {
    width: 100,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  pillName: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  pillWait: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
});
