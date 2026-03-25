/**
 * CommunityRankingsTab — Clean, minimal leaderboard
 *
 * Brand-red accent throughout, clean list layout, category chips,
 * time filters, staggered entrance animations, tappable coaster cross-refs.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { EmptyState } from '../../../components/EmptyState';
import { useRankingsStore } from '../stores/rankingsStore';
import type { RankingCategory, CommunityRankingEntry } from '../types/community';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EASE_OUT = Easing.out(Easing.ease);
const ACCENT = colors.accent.primary;
const ACCENT_LIGHT = colors.accent.primaryLight;

// ─── Time Filters ────────────────────────────────────────────

type TimeFilter = 'all' | 'month' | 'week';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
];

// ─── Rank Change Indicator ──────────────────────────────────

function RankChangeIndicator({ change }: { change?: number }) {
  if (change === undefined || change === 0) {
    return (
      <View style={s.rankChangeNeutral}>
        <View style={s.rankChangeDash} />
      </View>
    );
  }

  const isUp = change > 0;
  return (
    <View style={s.rankChangeContainer}>
      <Ionicons
        name={isUp ? 'caret-up' : 'caret-down'}
        size={10}
        color={isUp ? colors.status.success : colors.status.error}
      />
      <Text style={[s.rankChangeText, { color: isUp ? colors.status.success : colors.status.error }]}>
        {Math.abs(change)}
      </Text>
    </View>
  );
}

// ─── Category Chip ───────────────────────────────────────────

function CategoryChip({
  category,
  isActive,
  onPress,
}: {
  category: RankingCategory;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          s.categoryChip,
          isActive && s.categoryChipActive,
        ]}
      >
        <Ionicons
          name={category.icon as any}
          size={14}
          color={isActive ? colors.text.inverse : colors.text.secondary}
        />
        <Text
          style={[
            s.categoryChipText,
            isActive && s.categoryChipTextActive,
          ]}
        >
          {category.title.replace('Top 10 ', '').replace('Top 10 by ', '')}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Time Filter Chip ────────────────────────────────────────

function TimeFilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View style={[s.timeChip, isActive && s.timeChipActive]}>
        <Text style={[s.timeChipText, isActive && s.timeChipTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Ranked List Entry ───────────────────────────────────────

function RankedEntry({
  entry,
  rank,
  index,
  onCoasterTap,
}: {
  entry: CommunityRankingEntry;
  rank: number;
  index: number;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
}) {
  const progress = useSharedValue(0);
  const barProgress = useSharedValue(0);

  // Normalize score for bar width (5-10 range -> 0-100%)
  const barWidth = ((entry.averageScore - 5) / 5) * 100;
  const clampedWidth = Math.max(10, Math.min(100, barWidth));

  useEffect(() => {
    progress.value = withDelay(
      index * 50,
      withTiming(1, { duration: 280, easing: EASE_OUT }),
    );
    barProgress.value = withDelay(
      index * 50 + 180,
      withTiming(1, { duration: 400, easing: EASE_OUT }),
    );
  }, [entry.coasterId]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [16, 0]) }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${clampedWidth * barProgress.value}%`,
  }));

  const handlePress = useCallback(() => {
    if (onCoasterTap) {
      haptics.tap();
      onCoasterTap(entry.coasterId, entry.coasterName, entry.parkName);
    }
  }, [entry.coasterId, entry.coasterName, entry.parkName, onCoasterTap]);

  const isTop3 = rank <= 3;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[s.rankedCard, entryStyle]}>
        {/* Left: Rank number + change indicator */}
        <View style={s.rankedLeftCol}>
          <Text style={[s.rankedNumber, isTop3 && s.rankedNumberTop3]}>
            {rank}
          </Text>
          <RankChangeIndicator change={entry.rankChange} />
        </View>

        {/* Center: Coaster info */}
        <View style={s.rankedInfo}>
          <Text
            style={[s.rankedCoasterName, onCoasterTap && { color: ACCENT }]}
            numberOfLines={1}
          >
            {entry.coasterName}
          </Text>
          <Text style={s.rankedParkName} numberOfLines={1}>
            {entry.parkName}
          </Text>
          {/* Score bar */}
          <View style={s.rankedBarTrack}>
            <Animated.View
              style={[s.rankedBarFill, barStyle]}
            />
          </View>
        </View>

        {/* Right: Score + ratings */}
        <View style={s.rankedScoreCol}>
          <Text style={[s.rankedScore, isTop3 && s.rankedScoreTop3]}>
            {entry.averageScore.toFixed(1)}
          </Text>
          <Text style={s.rankedRatings}>
            {entry.totalRatings.toLocaleString()}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface CommunityRankingsTabProps {
  topInset?: number;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
  scrollY?: SharedValue<number>;
}

export const CommunityRankingsTab = ({ topInset = 0, onCoasterTap, scrollY }: CommunityRankingsTabProps) => {
  const insets = useSafeAreaInsets();
  const { categories } = useRankingsStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'overall');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [renderKey, setRenderKey] = useState(0);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === activeCategory) ?? categories[0],
    [categories, activeCategory],
  );

  const handleCategoryChange = useCallback((categoryId: string) => {
    haptics.select();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(categoryId);
    setRenderKey((k) => k + 1);
  }, []);

  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    haptics.tap();
    setTimeFilter(filter);
    setRenderKey((k) => k + 1);
  }, []);

  const entries = selectedCategory?.entries ?? [];
  const totalRatings = entries.reduce((sum, e) => sum + e.totalRatings, 0);

  if (categories.length === 0) {
    return (
      <View style={[s.container, s.emptyContainer, { paddingTop: topInset }]}>
        <EmptyState
          icon="podium-outline"
          title="No rankings yet"
          subtitle="Community rankings appear as riders log and rate coasters. Be the first to contribute!"
        />
      </View>
    );
  }

  const rankingsScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      style={s.container}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={rankingsScrollHandler}
      scrollEventThrottle={16}
    >
      {/* Category Chips — shadow-safe horizontal scroll */}
      <View style={s.chipSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipScrollOuter}
          contentContainerStyle={s.chipScrollContent}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isActive={cat.id === activeCategory}
              onPress={() => handleCategoryChange(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Time Filters + total ratings */}
      <View style={s.filterRow}>
        <View style={s.timeFilterRow}>
          {TIME_FILTERS.map((f) => (
            <TimeFilterChip
              key={f.id}
              label={f.label}
              isActive={f.id === timeFilter}
              onPress={() => handleTimeFilterChange(f.id)}
            />
          ))}
        </View>
        <Text style={s.totalRatingsLabel}>
          {totalRatings.toLocaleString()} ratings
        </Text>
      </View>

      {/* All Entries — clean unified list */}
      {entries.length > 0 && (
        <View key={`list-${renderKey}`} style={s.rankedList}>
          {entries.map((entry, i) => (
            <RankedEntry
              key={entry.coasterId}
              entry={entry}
              rank={i + 1}
              index={i}
              onCoasterTap={onCoasterTap}
            />
          ))}
        </View>
      )}
    </Animated.ScrollView>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // ── Empty state ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    textAlign: 'center' as const,
  },

  // ── Category chips (shadow-safe) ──
  chipSection: {
    marginHorizontal: -spacing.lg,
    // Negative vertical margin compensates for shadow padding
    marginBottom: spacing.md,
    marginTop: -spacing.base,
  },
  chipScrollOuter: {
    overflow: 'visible',
  },
  chipScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base, // shadow room (shadows.small = shadowRadius 12)
    gap: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    ...shadows.small,
  },
  categoryChipActive: {
    backgroundColor: ACCENT,
  },
  categoryChipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
  },

  // ── Filter row ──
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  timeFilterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  timeChipActive: {
    backgroundColor: ACCENT_LIGHT,
  },
  timeChipText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  timeChipTextActive: {
    color: ACCENT,
    fontWeight: typography.weights.semibold,
  },
  totalRatingsLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },

  // ── Rank change indicators ──
  rankChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  rankChangeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  rankChangeNeutral: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankChangeDash: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text.meta,
    opacity: 0.4,
  },

  // ── Ranked list entries (1-10, unified) ──
  rankedList: {
    gap: spacing.md,
    // Shadow-safe padding
    paddingVertical: spacing.base,
    marginVertical: -spacing.base,
  },
  rankedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  rankedLeftCol: {
    width: 36,
    alignItems: 'center',
    gap: 2,
  },
  rankedNumber: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  rankedNumberTop3: {
    color: ACCENT,
    fontWeight: typography.weights.bold,
  },
  rankedInfo: {
    flex: 1,
    marginHorizontal: spacing.base,
  },
  rankedCoasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  rankedParkName: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 1,
  },
  rankedBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  rankedBarFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: ACCENT,
  },
  rankedScoreCol: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  rankedScore: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  rankedScoreTop3: {
    color: ACCENT,
  },
  rankedRatings: {
    fontSize: 10,
    color: colors.text.meta,
    marginTop: 1,
  },
});
