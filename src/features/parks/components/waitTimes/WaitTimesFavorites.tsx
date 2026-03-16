/**
 * WaitTimesFavorites — Horizontal scroll of featured/favorite rides
 * with larger cards showing prominent wait times.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
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

// ── Individual Favorite Card ──

const FavoriteCard = memo(function FavoriteCard({
  ride,
  index,
  onPress,
}: {
  ride: RideWaitTimeData;
  index: number;
  onPress?: () => void;
}) {
  const { pressHandlers, animatedStyle: pressStyle } = useCardPress();
  const isOpen = ride.status === 'open';
  const waitColor = getWaitColor(ride.waitMinutes, isOpen);

  // Staggered entry
  const entryProgress = useSharedValue(0);
  useEffect(() => {
    entryProgress.value = withDelay(
      index * TIMING.stagger,
      withSpring(1, SPRINGS.stiff),
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [{ translateY: (1 - entryProgress.value) * 12 }],
  }));

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[pressStyle, entryStyle]}>
        <View style={styles.favShadow}>
          <View style={styles.favCard}>
            <Text style={styles.favName} numberOfLines={2}>{ride.name}</Text>
            <View style={styles.favWaitWrap}>
              {isOpen ? (
                <>
                  <Text style={[styles.favWaitNumber, { color: waitColor }]}>
                    {ride.waitMinutes}
                  </Text>
                  <Text style={styles.favWaitUnit}>min</Text>
                </>
              ) : (
                <Text style={styles.favClosedText}>Closed</Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ── WaitTimesFavorites ──

interface WaitTimesFavoritesProps {
  rides: RideWaitTimeData[];
  onRidePress?: (rideId: string) => void;
}

export const WaitTimesFavorites = memo(function WaitTimesFavorites({
  rides,
  onRidePress,
}: WaitTimesFavoritesProps) {
  if (rides.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionLabel}>TOP PICKS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {rides.map((ride, i) => (
          <FavoriteCard
            key={ride.id}
            ride={ride}
            index={i}
            onPress={onRidePress ? () => onRidePress(ride.id) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const CARD_WIDTH = 130;

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  scrollContainer: {
    overflow: 'visible',
    marginVertical: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.base,
  },
  favShadow: {
    borderRadius: radius.card,
    ...shadows.small,
  },
  favCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: CARD_WIDTH,
  },
  favName: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
  },
  favWaitWrap: {
    marginTop: spacing.md,
  },
  favWaitNumber: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
  },
  favWaitUnit: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  favClosedText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
});
