/**
 * WaitTimesHeader — Title, pulsing LIVE badge, last-updated text, sort/filter controls.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';

export type SortMode = 'waitTime' | 'alphabetical';

interface WaitTimesHeaderProps {
  lastUpdated: number;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  openCount: number;
  totalCount: number;
  showOpenOnly: boolean;
  onToggleOpenOnly: () => void;
}

export const WaitTimesHeader = memo(function WaitTimesHeader({
  lastUpdated,
  sortMode,
  onSortChange,
  openCount,
  showOpenOnly,
  onToggleOpenOnly,
}: WaitTimesHeaderProps) {
  // ── Pulsing LIVE dot ──
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.5, { duration: 0 }),
      ),
      -1,
    );
  }, []);

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // ── Sort pill animation (0 = waitTime, 1 = alphabetical) ──
  const sortProgress = useSharedValue(sortMode === 'waitTime' ? 0 : 1);

  const handleSortWait = useCallback(() => {
    haptics.tap();
    onSortChange('waitTime');
    sortProgress.value = withTiming(0, { duration: 200 });
  }, [onSortChange]);

  const handleSortAZ = useCallback(() => {
    haptics.tap();
    onSortChange('alphabetical');
    sortProgress.value = withTiming(1, { duration: 200 });
  }, [onSortChange]);

  const waitPillBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      sortProgress.value,
      [0, 1],
      [colors.accent.primary, colors.background.input],
    ),
  }));
  const waitPillText = useAnimatedStyle(() => ({
    color: interpolateColor(
      sortProgress.value,
      [0, 1],
      [colors.text.inverse, colors.text.secondary],
    ),
  }));
  const azPillBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      sortProgress.value,
      [0, 1],
      [colors.background.input, colors.accent.primary],
    ),
  }));
  const azPillText = useAnimatedStyle(() => ({
    color: interpolateColor(
      sortProgress.value,
      [0, 1],
      [colors.text.secondary, colors.text.inverse],
    ),
  }));

  // ── Open-only toggle animation ──
  const openOnlyProgress = useSharedValue(showOpenOnly ? 1 : 0);
  useEffect(() => {
    openOnlyProgress.value = withTiming(showOpenOnly ? 1 : 0, { duration: 200 });
  }, [showOpenOnly]);

  const openOnlyBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      openOnlyProgress.value,
      [0, 1],
      [colors.background.input, '#E8F5E9'],
    ),
  }));

  const handleToggleOpen = useCallback(() => {
    haptics.tap();
    onToggleOpenOnly();
  }, [onToggleOpenOnly]);

  // ── "X min ago" ──
  const minutesAgo = Math.max(0, Math.round((Date.now() - lastUpdated) / 60000));
  const updatedText = minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`;

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Wait Times</Text>
        <View style={styles.liveGroup}>
          <View style={styles.liveDotWrap}>
            <Animated.View style={[styles.livePulse, pulseAnimStyle]} />
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveLabel}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.updatedText}>Updated {updatedText}</Text>

      {/* Sort + filter controls */}
      <View style={styles.controlsRow}>
        <View style={styles.sortGroup}>
          <Pressable onPress={handleSortWait}>
            <Animated.View style={[styles.sortPill, waitPillBg]}>
              <Animated.Text style={[styles.sortPillText, waitPillText]}>By Wait</Animated.Text>
            </Animated.View>
          </Pressable>
          <Pressable onPress={handleSortAZ}>
            <Animated.View style={[styles.sortPill, azPillBg]}>
              <Animated.Text style={[styles.sortPillText, azPillText]}>A–Z</Animated.Text>
            </Animated.View>
          </Pressable>
        </View>

        <Pressable onPress={handleToggleOpen}>
          <Animated.View style={[styles.openPill, openOnlyBg]}>
            <View style={styles.openDot} />
            <Text style={styles.openPillText}>Open {openCount}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  liveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDotWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  liveLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.status.success,
    letterSpacing: 1,
  },
  updatedText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.base,
  },
  sortGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sortPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  sortPillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.success,
  },
  openPillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
  },
});
