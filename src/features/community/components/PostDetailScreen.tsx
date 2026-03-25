/**
 * PostDetailScreen — Full-screen view of a single post with comments
 *
 * Shows complete post content (no truncation) + staggered comment list
 * + keyboard-aware comment input at the bottom.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { FogHeader } from '../../../components/FogHeader';
import { haptics } from '../../../services/haptics';
import {
  getFeedItem,
  toggleLike,
  addComment,
  toggleCommentLike,
  useCommunityStore,
} from '../stores/communityStore';
import type { FeedItem, Comment } from '../types/community';

// ─── Time formatter ─────────────────────────────────────────

function formatTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatDaysAgo(days: number): string {
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1w ago';
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Stagger helper ─────────────────────────────────────────

function StaggeredItem({ index, children }: { index: number; children: React.ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const delay = Math.min(index, 8) * 40;
    progress.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Comment Row ────────────────────────────────────────────

function CommentRow({ comment, itemId, index }: { comment: Comment; itemId: string; index: number }) {
  return (
    <StaggeredItem index={index}>
      <View style={styles.commentRow}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{comment.authorInitials}</Text>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{comment.authorName}</Text>
            <Text style={styles.commentTime}>{formatTimestamp(comment.timestamp)}</Text>
          </View>
          <Text style={styles.commentText}>{comment.text}</Text>
          <Pressable
            style={styles.commentLikeRow}
            onPress={() => {
              haptics.tap();
              toggleCommentLike(itemId, comment.id);
            }}
            hitSlop={8}
          >
            <Ionicons
              name={comment.isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={comment.isLiked ? colors.accent.primary : colors.text.meta}
            />
            {comment.likeCount > 0 && (
              <Text style={[styles.commentLikeCount, comment.isLiked && { color: colors.accent.primary }]}>
                {comment.likeCount}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </StaggeredItem>
  );
}

// ─── Post Content (no truncation) ───────────────────────────

function FullPostContent({ item }: { item: FeedItem }) {
  switch (item.type) {
    case 'review':
      return (
        <View style={styles.postContent}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingScore}>{(item.rating * 2).toFixed(1)}</Text>
            <Text style={styles.ratingMax}>/10</Text>
          </View>
          <Text style={styles.postCoasterName}>{item.coasterName}</Text>
          <Text style={styles.postParkName}>{item.parkName}</Text>
          <Text style={styles.postBody}>{item.reviewText}</Text>
        </View>
      );
    case 'trip_report':
      return (
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{'\u{1F4CD}'} {item.parkName}</Text>
            <Text style={styles.metaText}> · </Text>
            <Text style={styles.metaText}>{'\u{1F3A2}'} {item.rideCount} rides</Text>
          </View>
          <Text style={styles.postBody}>{item.fullText ?? item.excerpt}</Text>
        </View>
      );
    case 'top_list':
      return (
        <View style={styles.postContent}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listEmoji}>{item.emoji}</Text>
            <Text style={styles.postTitle}>{item.title}</Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category}</Text>
          </View>
          {item.items.map((entry, i) => (
            <View key={typeof entry === 'string' ? entry : entry.name} style={styles.listItem}>
              <Text style={styles.listRank}>{i + 1}</Text>
              <Text style={styles.listName}>{typeof entry === 'string' ? entry : entry.name}</Text>
            </View>
          ))}
        </View>
      );
    case 'bucket_list':
      return (
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>Bucket List</Text>
          </View>
          {item.items.map((entry) => (
            <View key={entry.id} style={styles.listItem}>
              <Ionicons
                name={entry.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={entry.completed ? '#4CAF50' : colors.text.meta}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[styles.listName, entry.completed && styles.completedItem]}>
                {entry.name}
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

// ─── Main Screen ────────────────────────────────────────────

export function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const backPress = useSpringPress();
  const { feed } = useCommunityStore();
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const HEADER_ROW_HEIGHT = 52;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  const itemId = route.params?.itemId;
  const item = getFeedItem(itemId);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: headerTotalHeight }]}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const handleSendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text) return;
    haptics.tap();
    addComment(itemId, text);
    setCommentText('');
    inputRef.current?.blur();
  }, [itemId, commentText]);

  const handleLike = useCallback(() => {
    haptics.tap();
    toggleLike(itemId);
  }, [itemId]);

  const typeLabel = item.type === 'review' ? 'Review'
    : item.type === 'trip_report' ? 'Trip Report'
    : item.type === 'top_list' ? 'List'
    : 'Bucket List';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => { haptics.tap(); navigation.goBack(); }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backBtn, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>{typeLabel}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content + Comments */}
      <FlatList
        data={item.comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.base, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.authorInitials}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{item.authorName}</Text>
                <Text style={styles.timeAgo}>{formatDaysAgo(item.daysAgo)}</Text>
              </View>
            </View>

            {/* Full post content */}
            <FullPostContent item={item} />

            {/* Like/comment bar */}
            <View style={styles.actionBar}>
              <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={8}>
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={item.isLiked ? colors.accent.primary : colors.text.secondary}
                />
                <Text style={[styles.actionCount, item.isLiked && { color: colors.accent.primary }]}>
                  {item.likeCount}
                </Text>
              </Pressable>
              <View style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.actionCount}>{item.commentCount}</Text>
              </View>
            </View>

            {/* Comments header */}
            {item.comments.length > 0 && (
              <Text style={styles.commentsHeader}>
                {item.comments.length} {item.comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item: comment, index }) => (
          <CommentRow comment={comment} itemId={itemId} index={index} />
        )}
      />

      {/* Comment input */}
      <View style={[styles.commentInputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text.meta}
          returnKeyType="send"
          onSubmitEditing={handleSendComment}
        />
        <Pressable
          onPress={handleSendComment}
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          disabled={!commentText.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={commentText.trim() ? colors.accent.primary : colors.text.meta}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: 100,
  },

  // Header
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  headerSpacer: { width: 36 },

  // Scroll content
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  authorInfo: {
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
    marginTop: 1,
  },

  // Post content
  postContent: {
    marginTop: spacing.xl,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  ratingScore: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  ratingMax: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginLeft: 2,
  },
  postCoasterName: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  postParkName: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  postTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 28,
  },
  postBody: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
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
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  listRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    width: 24,
  },
  listName: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    flex: 1,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    color: colors.text.meta,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    marginLeft: spacing.sm,
  },

  // Comments
  commentsHeader: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.xxl,
    marginBottom: spacing.base,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
    marginTop: 2,
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentAuthor: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  commentTime: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  commentText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  commentLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  commentLikeCount: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },

  // Comment input bar
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
