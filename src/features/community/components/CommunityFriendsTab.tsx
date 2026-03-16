/**
 * CommunityFriendsTab — Stories + activity feed
 *
 * Top section: UserSearchSection (search bar for discovering users)
 * Stories row: StoriesRow (circular avatar bubbles with story rings)
 * Friend Requests: FriendRequestsSection (pending requests, only if any)
 * Bottom section: vertical activity feed (ride, review, milestone)
 * Pull-to-refresh + infinite scroll pagination.
 * Stagger entrance throughout.
 */

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useFriendsStore } from '../stores/friendsStore';
import { StoriesRow } from '../../../components/feed/StoriesRow';
import { UserSearchSection } from './UserSearchSection';
import { FriendRequestsSection } from './FriendRequestsSection';
import type { FriendActivity } from '../types/community';
import type { StoryItem } from '../../../data/mockFeed';

// ─── Stagger helper ─────────────────────────────────────────

function StaggeredItem({ index, children }: { index: number; children: React.ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const delay = Math.min(index, 8) * 60;
    progress.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Activity type icon ─────────────────────────────────────

function activityIcon(type: FriendActivity['type']): string {
  switch (type) {
    case 'ride': return 'flash-outline';
    case 'review': return 'star-outline';
    case 'milestone': return 'trophy-outline';
  }
}

function activityColor(type: FriendActivity['type']): string {
  switch (type) {
    case 'ride': return colors.accent.primary;
    case 'review': return '#D4A98A';
    case 'milestone': return '#4CAF50';
  }
}

// ─── Time formatter ─────────────────────────────────────────

function formatDaysAgo(days: number): string {
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1w ago';
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Main Component ─────────────────────────────────────────

interface CommunityFriendsTabProps {
  topInset?: number;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
}

/**
 * Renders activity text with tappable coaster and park names as accent-colored links.
 * Plain text segments are rendered normally; coaster/park names become Pressable links.
 */
function ActivityTextWithLinks({ text, item, onCoasterTap }: {
  text: string;
  item: FriendActivity;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
}) {
  if (!item.coasterName && !item.parkName) {
    return <Text style={styles.activityText}>{text}</Text>;
  }

  // Build segments: split text by coasterName and parkName occurrences
  const segments: { text: string; type: 'plain' | 'coaster' | 'park' }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchType: 'coaster' | 'park' = 'coaster';
    let matchStr = '';

    if (item.coasterName) {
      const idx = remaining.indexOf(item.coasterName);
      if (idx >= 0 && idx < earliestIdx) {
        earliestIdx = idx;
        matchType = 'coaster';
        matchStr = item.coasterName;
      }
    }
    if (item.parkName) {
      const idx = remaining.indexOf(item.parkName);
      if (idx >= 0 && idx < earliestIdx) {
        earliestIdx = idx;
        matchType = 'park';
        matchStr = item.parkName;
      }
    }

    if (earliestIdx === remaining.length) {
      // No more matches
      segments.push({ text: remaining, type: 'plain' });
      break;
    }

    if (earliestIdx > 0) {
      segments.push({ text: remaining.slice(0, earliestIdx), type: 'plain' });
    }
    segments.push({ text: matchStr, type: matchType });
    remaining = remaining.slice(earliestIdx + matchStr.length);
  }

  return (
    <Text style={styles.activityText}>
      {segments.map((seg, i) => {
        if (seg.type === 'coaster' && item.coasterId && onCoasterTap) {
          return (
            <Text
              key={i}
              style={styles.linkedText}
              onPress={() => {
                haptics.select();
                onCoasterTap(item.coasterId!, item.coasterName!, item.parkName ?? '');
              }}
            >
              {seg.text}
            </Text>
          );
        }
        if (seg.type === 'park' && item.parkName) {
          return (
            <Text
              key={i}
              style={styles.linkedText}
              onPress={() => {
                haptics.select();
                // Park taps also open the coaster action sheet if we have a coasterId
                if (item.coasterId && onCoasterTap) {
                  onCoasterTap(item.coasterId, item.coasterName ?? '', item.parkName!);
                }
              }}
            >
              {seg.text}
            </Text>
          );
        }
        return <Text key={i}>{seg.text}</Text>;
      })}
    </Text>
  );
}

const ActivityRow = React.memo(({ item, onPress, onCoasterTap }: { item: FriendActivity; onPress: (friendId: string) => void; onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void }) => {
  const iconColor = activityColor(item.type);

  const iconBgStyle = useMemo(
    () => [styles.activityIcon, { backgroundColor: iconColor + '18' }],
    [iconColor],
  );

  const handleNamePress = useCallback(() => {
    haptics.tap();
    onPress(item.friendId);
  }, [item.friendId, onPress]);

  return (
    <View style={styles.activityRow}>
      <View style={iconBgStyle}>
        <Ionicons
          name={activityIcon(item.type) as any}
          size={16}
          color={iconColor}
        />
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Pressable onPress={handleNamePress} hitSlop={4}>
            <Text style={styles.activityName}>{item.friendName}</Text>
          </Pressable>
          <Text style={styles.activityTime}>{formatDaysAgo(item.daysAgo)}</Text>
        </View>
        <ActivityTextWithLinks text={item.text} item={item} onCoasterTap={onCoasterTap} />
      </View>
    </View>
  );
});

const activityKeyExtractor = (item: FriendActivity) => item.id;

export const CommunityFriendsTab = ({ topInset = 0, onCoasterTap }: CommunityFriendsTabProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const {
    activity,
    friendRequests,
    searchUsers,
    sendRequest,
    acceptRequest,
    declineRequest,
    loadMoreActivity,
  } = useFriendsStore();

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [loadingMore, setLoadingMore] = useState(false);

  const handleStoryPress = useCallback((story: StoryItem) => {
    haptics.tap();
    // Navigate to profile if not own story
    if (!story.isOwn) {
      navigation.navigate('ProfileView', { userId: story.id });
    }
  }, [navigation]);

  const handleActivityPress = useCallback((friendId: string) => {
    navigation.navigate('ProfileView', { userId: friendId });
  }, [navigation]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Mock 1s delay then "refresh" (just re-render same data)
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Infinite scroll handler
  const handleEndReached = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    // Mock a brief delay before loading more
    setTimeout(() => {
      loadMoreActivity();
      setLoadingMore(false);
    }, 800);
  }, [loadingMore, loadMoreActivity]);

  // Friend request handlers
  const handleAcceptRequest = useCallback((requestId: string) => {
    acceptRequest(requestId);
  }, [acceptRequest]);

  const handleDeclineRequest = useCallback((requestId: string) => {
    declineRequest(requestId);
  }, [declineRequest]);

  // Search handler
  const handleSendRequest = useCallback((userId: string) => {
    sendRequest(userId);
  }, [sendRequest]);

  // Only show pending requests
  const pendingRequests = useMemo(
    () => friendRequests.filter((r) => r.status === 'pending'),
    [friendRequests],
  );

  const contentContainerStyle = useMemo(
    () => [styles.content, { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }],
    [topInset, insets.bottom],
  );

  const listHeader = useMemo(() => (
    <>
      {/* User Search */}
      <StaggeredItem index={0}>
        <UserSearchSection
          onSearch={searchUsers}
          onSendRequest={handleSendRequest}
        />
      </StaggeredItem>

      {/* Stories Section */}
      <StaggeredItem index={1}>
        <Text style={styles.sectionTitle}>Stories</Text>
        <StoriesRow onStoryPress={handleStoryPress} />
      </StaggeredItem>

      {/* Friend Requests Section */}
      {pendingRequests.length > 0 && (
        <StaggeredItem index={2}>
          <FriendRequestsSection
            requests={pendingRequests}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
        </StaggeredItem>
      )}

      {/* Activity Section */}
      <StaggeredItem index={pendingRequests.length > 0 ? 3 : 2}>
        <Text style={[styles.sectionTitle, styles.activitySectionTitle]}>Activity</Text>
      </StaggeredItem>
    </>
  ), [handleStoryPress, pendingRequests, handleAcceptRequest, handleDeclineRequest, searchUsers, handleSendRequest]);

  const renderActivity = useCallback(({ item, index }: ListRenderItemInfo<FriendActivity>) => (
    <StaggeredItem index={index + (pendingRequests.length > 0 ? 4 : 3)}>
      <ActivityRow item={item} onPress={handleActivityPress} onCoasterTap={onCoasterTap} />
    </StaggeredItem>
  ), [handleActivityPress, onCoasterTap, pendingRequests.length]);

  // Footer loading spinner for pagination
  const ListFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  }, [loadingMore]);

  return (
    <FlatList
      data={activity}
      renderItem={renderActivity}
      keyExtractor={activityKeyExtractor}
      ListHeaderComponent={listHeader}
      ListFooterComponent={ListFooter}
      style={styles.container}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent.primary}
          colors={[colors.accent.primary]}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
    />
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // Section headers
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  activitySectionTitle: {
    marginTop: spacing.xxl,
  },

  // Activity rows
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  activityText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  linkedText: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },

  // Footer loader
  footerLoader: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
