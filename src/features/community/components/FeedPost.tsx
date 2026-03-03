import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import {
  FeedItem,
  ReviewFeedItem,
  TripReportFeedItem,
  TopListFeedItem,
} from '../data/mockCommunityData';

const formatDaysAgo = (days: number): string => {
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1w ago';
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ─── Content Renderers ──────────────────────────────────────

const StarRow = ({ rating }: { rating: number }) => (
  <View style={styles.starRow}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color={i < rating ? colors.accent.primary : colors.border.subtle}
      />
    ))}
  </View>
);

const ReviewContent = ({ item }: { item: ReviewFeedItem }) => (
  <View style={styles.contentArea}>
    <StarRow rating={item.rating} />
    <Text style={styles.coasterName}>{item.coasterName}</Text>
    <Text style={styles.parkName}>{item.parkName}</Text>
    <Text style={styles.bodyText}>{item.reviewText}</Text>
  </View>
);

const TripReportContent = ({ item }: { item: TripReportFeedItem }) => (
  <View style={styles.contentArea}>
    <Text style={styles.tripTitle}>{item.title}</Text>
    <View style={styles.metaRow}>
      <Text style={styles.metaText}>📍 {item.parkName}</Text>
      <Text style={styles.metaText}> · </Text>
      <Text style={styles.metaText}>🎢 {item.rideCount} rides</Text>
    </View>
    <Text style={styles.bodyText} numberOfLines={4}>
      {item.excerpt}
    </Text>
  </View>
);

const TopListContent = ({ item }: { item: TopListFeedItem }) => (
  <View style={styles.contentArea}>
    <View style={styles.listTitleRow}>
      <Text style={styles.listEmoji}>{item.emoji}</Text>
      <Text style={styles.tripTitle}>{item.title}</Text>
    </View>
    <View style={styles.categoryPill}>
      <Text style={styles.categoryPillText}>{item.category}</Text>
    </View>
    <View style={styles.previewList}>
      {item.items.map((name, i) => (
        <View key={name} style={[styles.previewItem, i > 0 && styles.previewItemSpacing]}>
          <Text style={styles.previewRank}>{i + 1}</Text>
          <Text style={styles.previewName}>{name}</Text>
        </View>
      ))}
    </View>
  </View>
);

// ─── Main Component ─────────────────────────────────────────

export const FeedPost = ({ item }: { item: FeedItem }) => {
  const press = useCardPress();

  const renderContent = () => {
    switch (item.type) {
      case 'review':
        return <ReviewContent item={item} />;
      case 'trip_report':
        return <TripReportContent item={item} />;
      case 'top_list':
        return <TopListContent item={item} />;
    }
  };

  return (
    <Pressable onPress={() => haptics.tap()} {...press.pressHandlers}>
      <Animated.View style={[styles.card, press.animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.authorInitials}</Text>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.authorName}>{item.authorName}</Text>
          </View>
          <Text style={styles.timeAgo}>{formatDaysAgo(item.daysAgo)}</Text>
        </View>

        {/* Content */}
        {renderContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerAction}>
            <Ionicons name="heart-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.footerCount}>{item.likeCount}</Text>
          </View>
          <View style={styles.footerAction}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.footerCount}>{item.commentCount}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  headerTextCol: {
    flex: 1,
    marginLeft: spacing.base,
  },
  authorName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  timeAgo: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },

  // Shared content
  contentArea: {
    marginTop: spacing.base,
  },
  bodyText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.base,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },

  // Review
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  coasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  parkName: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },

  // Trip Report
  tripTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  metaText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },

  // Top List
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    marginTop: spacing.md,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  previewList: {
    marginTop: spacing.base,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewItemSpacing: {
    marginTop: spacing.sm,
  },
  previewRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    width: 20,
  },
  previewName: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerCount: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginLeft: spacing.xs,
  },
});
