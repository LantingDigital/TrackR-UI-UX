/**
 * FriendRequestsSection — Pending friend request rows
 *
 * Shows between Stories and Activity in CommunityFriendsTab.
 * Only renders when there are pending requests.
 * Each row has avatar, name, credit count, time, Accept/Decline buttons.
 * Accepted/declined rows animate out.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import type { FriendRequest } from '../types/community';

// ─── Time formatter ─────────────────────────────────────────

function formatTimeAgo(daysAgo: number): string {
  if (daysAgo < 1) return 'just now';
  if (daysAgo === 1) return '1d ago';
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return '1w ago';
  return `${Math.floor(daysAgo / 7)}w ago`;
}

// ─── Single Request Row ─────────────────────────────────────

interface RequestRowProps {
  request: FriendRequest;
  index: number;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

const RequestRow = React.memo(function RequestRow({
  request,
  index,
  onAccept,
  onDecline,
}: RequestRowProps) {
  const acceptPress = useSpringPress();
  const declinePress = useSpringPress();

  const handleAccept = useCallback(() => {
    haptics.success();
    onAccept(request.id);
  }, [request.id, onAccept]);

  const handleDecline = useCallback(() => {
    haptics.tap();
    onDecline(request.id);
  }, [request.id, onDecline]);

  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 50)}
      exiting={FadeOut.duration(150)}
      layout={Layout.duration(200)}
      style={styles.requestRow}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{request.fromUserInitials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{request.fromUserName}</Text>
          <Text style={styles.time}>{formatTimeAgo(request.daysAgo)}</Text>
        </View>
        <View style={styles.creditRow}>
          <Ionicons name="ticket-outline" size={11} color={colors.text.meta} />
          <Text style={styles.creditText}>{request.fromUserCreditCount} credits</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          {...acceptPress.pressHandlers}
          onPress={handleAccept}
        >
          <Animated.View style={[styles.acceptBtn, acceptPress.animatedStyle]}>
            <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
          </Animated.View>
        </Pressable>
        <Pressable
          {...declinePress.pressHandlers}
          onPress={handleDecline}
        >
          <Animated.View style={[styles.declineBtn, declinePress.animatedStyle]}>
            <Ionicons name="close" size={16} color={colors.text.secondary} />
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
});

// ─── Section ────────────────────────────────────────────────

interface FriendRequestsSectionProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function FriendRequestsSection({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsSectionProps) {
  if (requests.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Friend Requests</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </View>

      {/* Request rows */}
      <View style={styles.card}>
        {requests.map((request, index) => (
          <RequestRow
            key={request.id}
            request={request}
            index={index}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    ...shadows.small,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  avatarText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  info: {
    flex: 1,
    marginRight: spacing.base,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  time: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginLeft: spacing.sm,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  creditText: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
