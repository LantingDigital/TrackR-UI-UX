/**
 * CommunityFriendsTab — Friends list + activity feed
 *
 * Top section: horizontal ScrollView of FriendRow cards
 * Bottom section: vertical activity feed (ride, review, milestone)
 * Stagger entrance throughout.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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
import { radius } from '../../../theme/radius';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useFriendsStore } from '../stores/friendsStore';
import { FriendRow } from './FriendRow';
import type { FriendActivity } from '../types/community';

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
}

export const CommunityFriendsTab = ({ topInset = 0 }: CommunityFriendsTabProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { friends, activity } = useFriendsStore();

  const handleFriendPress = useCallback((friendId: string) => {
    navigation.navigate('ProfileView', { userId: friendId });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Friends Section */}
      <StaggeredItem index={0}>
        <Text style={styles.sectionTitle}>Friends</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsStrip}
          style={styles.friendsScroll}
        >
          {friends.map((friend) => (
            <FriendRow
              key={friend.id}
              friend={friend}
              onPress={handleFriendPress}
            />
          ))}
        </ScrollView>
      </StaggeredItem>

      {/* Activity Section */}
      <StaggeredItem index={1}>
        <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Activity</Text>
      </StaggeredItem>

      {activity.map((item, index) => (
        <StaggeredItem key={item.id} index={index + 2}>
          <Pressable
            style={styles.activityRow}
            onPress={() => {
              haptics.tap();
              navigation.navigate('ProfileView', { userId: item.friendId });
            }}
          >
            {/* Activity type indicator */}
            <View style={[styles.activityIcon, { backgroundColor: activityColor(item.type) + '18' }]}>
              <Ionicons
                name={activityIcon(item.type) as any}
                size={16}
                color={activityColor(item.type)}
              />
            </View>

            {/* Content */}
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{item.friendName}</Text>
                <Text style={styles.activityTime}>{formatDaysAgo(item.daysAgo)}</Text>
              </View>
              <Text style={styles.activityText}>{item.text}</Text>
            </View>
          </Pressable>
        </StaggeredItem>
      ))}
    </ScrollView>
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
    marginBottom: spacing.base,
  },

  // Friends strip
  friendsScroll: {
    marginHorizontal: -spacing.lg,
  },
  friendsStrip: {
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
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
});
