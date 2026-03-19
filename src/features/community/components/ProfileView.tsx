/**
 * ProfileView — Full-screen user profile
 *
 * Shows avatar, name, stats row, recent rides, recent ratings.
 * Includes FriendActionButton (add/remove/accept/decline) and
 * RemoveFriendSheet for confirmation.
 * Stagger entrance throughout. Registered as slide_from_right in RootNavigator.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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
import { getFriend, useFriendsStore } from '../stores/friendsStore';
import { FriendActionButton } from './FriendActionButton';
import { RemoveFriendSheet } from './RemoveFriendSheet';
import type { FriendshipStatus } from '../types/community';

// ─── Stagger helper ─────────────────────────────────────────

function StaggeredItem({ index, children }: { index: number; children: React.ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(index * 60, withSpring(1, SPRINGS.responsive));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Mock profile data (extends Friend) ─────────────────────

interface ProfileData {
  recentRides: { name: string; park: string; daysAgo: number }[];
  recentRatings: { name: string; rating: number }[];
}

function getProfileData(userId: string): ProfileData {
  // Mock extended data per user
  const profiles: Record<string, ProfileData> = {
    'u-am': {
      recentRides: [
        { name: 'Maverick', park: 'Cedar Point', daysAgo: 1 },
        { name: 'Steel Vengeance', park: 'Cedar Point', daysAgo: 1 },
        { name: 'Millennium Force', park: 'Cedar Point', daysAgo: 3 },
      ],
      recentRatings: [
        { name: 'Maverick', rating: 4 },
        { name: 'Steel Vengeance', rating: 5 },
      ],
    },
    'u-ms': {
      recentRides: [
        { name: 'Mako', park: 'SeaWorld Orlando', daysAgo: 2 },
        { name: 'Kraken', park: 'SeaWorld Orlando', daysAgo: 2 },
        { name: 'Velocicoaster', park: 'Islands of Adventure', daysAgo: 5 },
      ],
      recentRatings: [
        { name: 'Mako', rating: 4 },
        { name: 'Velocicoaster', rating: 5 },
        { name: 'Kraken', rating: 3 },
      ],
    },
    'u-cr': {
      recentRides: [
        { name: 'Intimidator 305', park: 'Kings Dominion', daysAgo: 4 },
        { name: 'Twisted Timbers', park: 'Kings Dominion', daysAgo: 4 },
        { name: 'Fury 325', park: 'Carowinds', daysAgo: 7 },
      ],
      recentRatings: [
        { name: 'Fury 325', rating: 5 },
        { name: 'Intimidator 305', rating: 5 },
      ],
    },
  };

  return profiles[userId] ?? {
    recentRides: [
      { name: 'Iron Gwazi', park: 'Busch Gardens Tampa', daysAgo: 5 },
      { name: 'Montu', park: 'Busch Gardens Tampa', daysAgo: 5 },
    ],
    recentRatings: [
      { name: 'Iron Gwazi', rating: 5 },
    ],
  };
}

// ─── Main Screen ────────────────────────────────────────────

export function ProfileView() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const backPress = useSpringPress();

  const userId = route.params?.userId;
  const friend = getFriend(userId);
  const profile = getProfileData(userId);

  // Store actions (reactive so UI updates on friend add/remove)
  const {
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    getFriendshipStatus,
    friendRequests,
  } = useFriendsStore();

  const friendshipStatus: FriendshipStatus = getFriendshipStatus(userId);

  // Find pending request from this user (if any)
  const pendingRequest = friendRequests.find(
    (r) => r.fromUserId === userId && r.status === 'pending'
  );

  // Remove friend sheet state
  const [showRemoveSheet, setShowRemoveSheet] = useState(false);

  // Fallback for unknown users (e.g., feed authors who aren't friends)
  const displayName = friend?.name ?? 'User';
  const displayInitials = friend?.initials ?? 'U';
  const creditCount = friend?.creditCount ?? 0;
  const topCoaster = friend?.topCoaster ?? '\u2014';

  const handleAddFriend = useCallback(() => {
    sendRequest(userId);
  }, [userId, sendRequest]);

  const handleAccept = useCallback(() => {
    if (pendingRequest) {
      acceptRequest(pendingRequest.id);
    }
  }, [pendingRequest, acceptRequest]);

  const handleDecline = useCallback(() => {
    if (pendingRequest) {
      declineRequest(pendingRequest.id);
    }
  }, [pendingRequest, declineRequest]);

  const handleOverflowPress = useCallback(() => {
    setShowRemoveSheet(true);
  }, []);

  const handleRemoveConfirm = useCallback(() => {
    removeFriend(userId);
  }, [userId, removeFriend]);

  const HEADER_ROW_HEIGHT = 52;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} fogExtension={30} />

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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.base, paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <StaggeredItem index={0}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayInitials}</Text>
            </View>
            <Text style={styles.profileName}>{displayName}</Text>
            {friend && (
              <Text style={styles.topCoaster}>Favorite: {topCoaster}</Text>
            )}
          </View>
        </StaggeredItem>

        {/* Friend Action Button */}
        <StaggeredItem index={1}>
          <View style={styles.actionRow}>
            <FriendActionButton
              status={friendshipStatus}
              onAddFriend={handleAddFriend}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onOverflowPress={handleOverflowPress}
            />
          </View>
        </StaggeredItem>

        {/* Stats row */}
        <StaggeredItem index={2}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{creditCount}</Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.recentRatings.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friend?.mutualFriends ?? 0}</Text>
              <Text style={styles.statLabel}>Mutual</Text>
            </View>
          </View>
        </StaggeredItem>

        {/* Recent Rides */}
        <StaggeredItem index={3}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          <View style={styles.sectionCard}>
            {profile.recentRides.map((ride, i) => (
              <View key={`${ride.name}-${i}`} style={[styles.rideRow, i > 0 && styles.rideRowBorder]}>
                <Ionicons name="flash-outline" size={16} color={colors.accent.primary} />
                <View style={styles.rideInfo}>
                  <Text style={styles.rideName}>{ride.name}</Text>
                  <Text style={styles.ridePark}>{ride.park}</Text>
                </View>
                <Text style={styles.rideTime}>{ride.daysAgo}d ago</Text>
              </View>
            ))}
          </View>
        </StaggeredItem>

        {/* Recent Ratings */}
        <StaggeredItem index={4}>
          <Text style={styles.sectionTitle}>Recent Ratings</Text>
          <View style={styles.sectionCard}>
            {profile.recentRatings.map((rating, i) => (
              <View key={`${rating.name}-${i}`} style={[styles.rideRow, i > 0 && styles.rideRowBorder]}>
                <View style={styles.starsRow}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Ionicons
                      key={s}
                      name={s < rating.rating ? 'star' : 'star-outline'}
                      size={12}
                      color={s < rating.rating ? colors.accent.primary : colors.border.subtle}
                    />
                  ))}
                </View>
                <Text style={[styles.rideName, { flex: 1, marginLeft: spacing.sm }]}>{rating.name}</Text>
              </View>
            ))}
          </View>
        </StaggeredItem>
      </ScrollView>

      {/* Remove Friend Confirmation Sheet */}
      <RemoveFriendSheet
        visible={showRemoveSheet}
        friendName={displayName}
        onClose={() => setShowRemoveSheet(false)}
        onConfirm={handleRemoveConfirm}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
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

  // Hero
  hero: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  profileName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  topCoaster: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Action row (friend button)
  actionRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.base,
    ...shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.border.subtle,
  },

  // Sections
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },

  // Ride rows
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rideRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  rideInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  rideName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  ridePark: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 1,
  },
  rideTime: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
});
