import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';

// ─── Mock Data ──────────────────────────────────────────────

interface PendingRating {
  id: string;
  coasterName: string;
  park: string;
  dateLogged: string;
}

interface ActivityEntry {
  id: string;
  coasterName: string;
  park: string;
  date: string;
  rating?: number;
  isPending: boolean;
}

const MOCK_PENDING: PendingRating[] = [
  { id: '1', coasterName: 'Steel Vengeance', park: 'Cedar Point', dateLogged: '2024-02-20' },
  { id: '2', coasterName: 'Iron Gwazi', park: 'Busch Gardens Tampa', dateLogged: '2024-02-18' },
  { id: '3', coasterName: 'Velocicoaster', park: 'Islands of Adventure', dateLogged: '2024-02-15' },
];

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: 'a1', coasterName: 'Steel Vengeance', park: 'Cedar Point', date: '2024-02-20', isPending: true },
  { id: 'a2', coasterName: 'Iron Gwazi', park: 'Busch Gardens Tampa', date: '2024-02-18', isPending: true },
  { id: 'a3', coasterName: 'Millennium Force', park: 'Cedar Point', date: '2024-02-17', rating: 8.4, isPending: false },
  { id: 'a4', coasterName: 'Maverick', park: 'Cedar Point', date: '2024-02-17', rating: 9.1, isPending: false },
  { id: 'a5', coasterName: 'Fury 325', park: 'Carowinds', date: '2024-02-14', rating: 8.8, isPending: false },
  { id: 'a6', coasterName: 'Lightning Rod', park: 'Dollywood', date: '2024-02-12', rating: 9.3, isPending: false },
  { id: 'a7', coasterName: 'El Toro', park: 'Six Flags Great Adventure', date: '2024-02-10', rating: 8.6, isPending: false },
  { id: 'a8', coasterName: 'Twisted Timbers', park: 'Kings Dominion', date: '2024-02-08', rating: 7.9, isPending: false },
];

const MAX_STAGGER_ITEMS = 6;

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Pending Rating Card ────────────────────────────────────

const PendingCard = memo(({ item, index }: { item: PendingRating; index: number }) => {
  const progress = useSharedValue(0);
  const { pressHandlers, animatedStyle: pressStyle } = useSpringPress({
    scale: 0.97,
  });

  useEffect(() => {
    const delay = index < MAX_STAGGER_ITEMS ? 200 + index * TIMING.stagger : 0;
    progress.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [16, 0]) },
    ],
  }));

  const handleRateNow = () => {
    haptics.select();
  };

  return (
    <Animated.View style={[styles.pendingCard, cardAnimatedStyle]}>
      <View style={styles.pendingCardContent}>
        <View style={styles.pendingCardInfo}>
          <Text style={styles.pendingCoasterName} numberOfLines={1}>
            {item.coasterName}
          </Text>
          <Text style={styles.pendingParkName} numberOfLines={1}>
            {item.park}
          </Text>
          <Text style={styles.pendingDate}>{formatDate(item.dateLogged)}</Text>
        </View>
        <Pressable
          onPress={handleRateNow}
          {...pressHandlers}
        >
          <Animated.View style={[styles.rateNowButton, pressStyle]}>
            <Text style={styles.rateNowText}>Rate Now</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
});

// ─── Empty State ────────────────────────────────────────────

const EmptyPendingState = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(300, withTiming(1, { duration: TIMING.normal }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [16, 0]) },
    ],
  }));

  return (
    <Animated.View style={[styles.emptyState, animatedStyle]}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="checkmark-circle" size={40} color={colors.status.success} />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>No pending ratings</Text>
    </Animated.View>
  );
};

// ─── Timeline Entry ─────────────────────────────────────────

const TimelineEntry = memo(({ item, index, isLast }: { item: ActivityEntry; index: number; isLast: boolean }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = index < MAX_STAGGER_ITEMS ? 400 + index * TIMING.stagger : 0;
    progress.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
  }, []);

  const entryAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [16, 0]) },
    ],
  }));

  return (
    <Animated.View style={[styles.timelineEntry, entryAnimatedStyle]}>
      {/* Timeline dot + line */}
      <View style={styles.timelineDotColumn}>
        <View
          style={[
            styles.timelineDot,
            item.isPending
              ? styles.timelineDotPending
              : styles.timelineDotRated,
          ]}
        />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Entry content */}
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineCoasterName} numberOfLines={1}>
            {item.coasterName}
          </Text>
          {item.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.accent.primary} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          {item.isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>
        <Text style={styles.timelinePark}>{item.park}</Text>
        <Text style={styles.timelineDate}>{formatDate(item.date)}</Text>
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ────────────────────────────────────────────

export const ActivityScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const headerProgress = useSharedValue(0);

  const pendingItems = MOCK_PENDING;
  const hasPending = pendingItems.length > 0;

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: TIMING.normal });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [
      { translateY: interpolate(headerProgress.value, [0, 1], [-8, 0]) },
    ],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Ratings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Ratings</Text>
            {hasPending && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingItems.length}</Text>
              </View>
            )}
          </View>

          {hasPending ? (
            <View style={styles.pendingList}>
              {pendingItems.map((item, index) => (
                <PendingCard key={item.id} item={item} index={index} />
              ))}
            </View>
          ) : (
            <EmptyPendingState />
          )}
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          <View style={styles.timeline}>
            {MOCK_ACTIVITY.map((item, index) => (
              <TimelineEntry
                key={item.id}
                item={item}
                index={index}
                isLast={index === MOCK_ACTIVITY.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Section
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  countBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },

  // Pending Cards
  pendingList: {
    gap: spacing.base,
  },
  pendingCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  pendingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingCardInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  pendingCoasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  pendingParkName: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  pendingDate: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
  rateNowButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rateNowText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },

  // Timeline
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineEntry: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timelineDotColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineDotRated: {
    backgroundColor: colors.accent.primary,
  },
  timelineDotPending: {
    backgroundColor: colors.border.subtle,
    borderWidth: 2,
    borderColor: colors.text.meta,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.base,
    paddingBottom: spacing.xl,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timelineCoasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  pendingBadge: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  timelinePark: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: 2,
  },
});
