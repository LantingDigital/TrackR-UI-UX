/**
 * FeedPost — Interactive community feed card
 *
 * Features:
 * - Double-tap to like (heart burst animation)
 * - "More" button for truncated text (inline expand)
 * - Like button toggle in footer
 * - Tap comment icon → PostDetailScreen
 * - Tap author avatar/name → ProfileView
 * - Bucket list rendering with check marks
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { HeartBurst } from './HeartBurst';
import type {
  FeedItem,
  ReviewFeedItem,
  TripReportFeedItem,
  TopListFeedItem,
  BucketListFeedItem,
} from '../types/community';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDaysAgo = (days: number): string => {
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1w ago';
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ─── Props ──────────────────────────────────────────────────

interface FeedPostProps {
  item: FeedItem;
  onLike: (itemId: string) => void;
  onCommentTap: (item: FeedItem) => void;
  onAuthorTap: (authorId: string) => void;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
}

// ─── Content Renderers ──────────────────────────────────────

const RatingBadge = ({ rating }: { rating: number }) => {
  // Convert 1-5 star scale to X.X/10 display
  const score = (rating * 2).toFixed(1);
  return (
    <View style={styles.ratingBadge}>
      <Text style={styles.ratingScore}>{score}</Text>
      <Text style={styles.ratingMax}>/10</Text>
    </View>
  );
};

const ReviewContent = ({ item, expanded, onMore, onCoasterTap }: { item: ReviewFeedItem; expanded: boolean; onMore: () => void; onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void }) => (
  <View style={styles.contentArea}>
    <RatingBadge rating={item.rating} />
    <Pressable
      onPress={() => {
        if (onCoasterTap) {
          haptics.tap();
          onCoasterTap(item.coasterId, item.coasterName, item.parkName);
        }
      }}
      hitSlop={4}
    >
      <Text style={[styles.coasterName, onCoasterTap && styles.tappableCoaster]}>{item.coasterName}</Text>
    </Pressable>
    <Text style={styles.parkName}>{item.parkName}</Text>
    <Text
      style={styles.bodyText}
      numberOfLines={expanded ? undefined : 3}
    >
      {item.reviewText}
    </Text>
    {!expanded && item.reviewText.length > 150 && (
      <Pressable onPress={onMore} hitSlop={8}>
        <Text style={styles.moreText}>more</Text>
      </Pressable>
    )}
  </View>
);

const TripReportContent = ({ item, expanded, onMore }: { item: TripReportFeedItem; expanded: boolean; onMore: () => void }) => {
  const displayText = expanded && 'fullText' in item ? (item as any).fullText : item.excerpt;
  return (
    <View style={styles.contentArea}>
      <Text style={styles.tripTitle}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{'\u{1F4CD}'} {item.parkName}</Text>
        <Text style={styles.metaText}> · </Text>
        <Text style={styles.metaText}>{'\u{1F3A2}'} {item.rideCount} rides</Text>
      </View>
      <Text
        style={styles.bodyText}
        numberOfLines={expanded ? undefined : 4}
      >
        {displayText}
      </Text>
      {!expanded && (
        <Pressable onPress={onMore} hitSlop={8}>
          <Text style={styles.moreText}>more</Text>
        </Pressable>
      )}
    </View>
  );
};

const TopListContent = ({ item, onCoasterTap }: { item: TopListFeedItem; onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void }) => (
  <View style={styles.contentArea}>
    <View style={styles.listTitleRow}>
      <Text style={styles.listEmoji}>{item.emoji}</Text>
      <Text style={styles.tripTitle}>{item.title}</Text>
    </View>
    <View style={styles.categoryPill}>
      <Text style={styles.categoryPillText}>{item.category}</Text>
    </View>
    <View style={styles.previewList}>
      {item.items.map((entry, i) => (
        <Pressable
          key={entry.coasterId}
          style={[styles.previewItem, i > 0 && styles.previewItemSpacing]}
          onPress={() => {
            if (onCoasterTap) {
              haptics.tap();
              onCoasterTap(entry.coasterId, entry.name, '');
            }
          }}
        >
          <Text style={styles.previewRank}>{i + 1}</Text>
          <Text style={[styles.previewName, onCoasterTap && styles.tappableCoaster]}>{entry.name}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const BucketListContent = ({ item, onCoasterTap }: { item: BucketListFeedItem; onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void }) => (
  <View style={styles.contentArea}>
    <Text style={styles.tripTitle}>{item.title}</Text>
    <View style={styles.categoryPill}>
      <Text style={styles.categoryPillText}>Bucket List</Text>
    </View>
    <View style={styles.previewList}>
      {item.items.map((entry, i) => (
        <Pressable
          key={entry.id}
          style={[styles.previewItem, i > 0 && styles.previewItemSpacing]}
          onPress={() => {
            if (onCoasterTap && entry.itemType === 'coaster') {
              haptics.tap();
              onCoasterTap(entry.refId, entry.name, '');
            }
          }}
        >
          <Ionicons
            name={entry.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={entry.completed ? '#4CAF50' : colors.text.meta}
            style={styles.bucketCheckIcon}
          />
          <Text style={[
            styles.previewName,
            entry.completed && styles.completedItem,
            onCoasterTap && entry.itemType === 'coaster' && styles.tappableCoaster,
          ]}>
            {entry.name}
          </Text>
          <Text style={styles.bucketType}>
            {entry.itemType === 'park' ? 'Park' : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

// ─── Main Component ─────────────────────────────────────────

export const FeedPost = React.memo(({ item, onLike, onCommentTap, onAuthorTap, onCoasterTap }: FeedPostProps) => {
  const press = useCardPress();
  const [expanded, setExpanded] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = React.useRef(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (!item.isLiked) {
        haptics.success();
        onLike(item.id);
        setShowHeart(true);
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [item.id, item.isLiked, onLike]);

  const handleMore = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(true);
  }, []);

  const handleLikePress = useCallback(() => {
    haptics.tap();
    onLike(item.id);
    if (!item.isLiked) {
      setShowHeart(true);
    }
  }, [item.id, item.isLiked, onLike]);

  const handleCommentPress = useCallback(() => {
    haptics.tap();
    onCommentTap(item);
  }, [item, onCommentTap]);

  const handleAuthorPress = useCallback(() => {
    haptics.tap();
    onAuthorTap(item.authorId);
  }, [item.authorId, onAuthorTap]);

  const renderContent = () => {
    switch (item.type) {
      case 'review':
        return <ReviewContent item={item} expanded={expanded} onMore={handleMore} onCoasterTap={onCoasterTap} />;
      case 'trip_report':
        return <TripReportContent item={item} expanded={expanded} onMore={handleMore} />;
      case 'top_list':
        return <TopListContent item={item} onCoasterTap={onCoasterTap} />;
      case 'bucket_list':
        return <BucketListContent item={item} onCoasterTap={onCoasterTap} />;
    }
  };

  return (
    <Pressable onPress={handleDoubleTap} {...press.pressHandlers}>
      <Animated.View style={[styles.card, press.animatedStyle]}>
        {/* Heart burst overlay */}
        <HeartBurst
          visible={showHeart}
          onComplete={() => setShowHeart(false)}
        />

        {/* Header */}
        <Pressable style={styles.header} onPress={handleAuthorPress}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.authorInitials}</Text>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.authorName}>{item.authorName}</Text>
          </View>
          <Text style={styles.timeAgo}>{formatDaysAgo(item.daysAgo)}</Text>
        </Pressable>

        {/* Content */}
        {renderContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.footerAction} onPress={handleLikePress} hitSlop={8}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? colors.accent.primary : colors.text.secondary}
            />
            <Text style={[styles.footerCount, item.isLiked && styles.footerCountActive]}>
              {item.likeCount}
            </Text>
          </Pressable>
          <Pressable style={styles.footerAction} onPress={handleCommentPress} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.footerCount}>{item.commentCount}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
    overflow: 'hidden',
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
  moreText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },

  // Review
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingScore: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  ratingMax: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginLeft: 1,
  },
  coasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  tappableCoaster: {
    color: colors.accent.primary,
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
    flex: 1,
  },

  // Bucket List
  bucketCheckIcon: {
    marginRight: spacing.sm,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    color: colors.text.meta,
  },
  bucketType: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginLeft: spacing.sm,
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
  footerCountActive: {
    color: colors.accent.primary,
  },
});
