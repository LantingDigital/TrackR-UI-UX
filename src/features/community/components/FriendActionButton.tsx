/**
 * FriendActionButton — Renders the appropriate friend action button
 * based on FriendshipStatus.
 *
 * States:
 *  - 'none': "Add Friend" button (accent, solid)
 *  - 'request_sent': "Request Sent" (muted, disabled)
 *  - 'request_received': "Accept" + "Decline" buttons
 *  - 'friends': "Friends" badge (green checkmark) + overflow menu
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { TIMING } from '../../../constants/animations';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import type { FriendshipStatus } from '../types/community';

interface FriendActionButtonProps {
  status: FriendshipStatus;
  onAddFriend: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onOverflowPress: () => void;
}

export function FriendActionButton({
  status,
  onAddFriend,
  onAccept,
  onDecline,
  onOverflowPress,
}: FriendActionButtonProps) {
  const addPress = useSpringPress();
  const acceptPress = useSpringPress();
  const declinePress = useSpringPress();
  const overflowPress = useSpringPress();

  // Fade animation for status changes
  const opacity = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleAdd = useCallback(() => {
    haptics.select();
    // Quick fade to signal state change
    opacity.value = withTiming(0.5, { duration: 100, easing: Easing.out(Easing.cubic) }, () => {
      opacity.value = withTiming(1, { duration: TIMING.fast });
    });
    onAddFriend();
  }, [onAddFriend, opacity]);

  const handleAccept = useCallback(() => {
    haptics.success();
    onAccept();
  }, [onAccept]);

  const handleDecline = useCallback(() => {
    haptics.tap();
    onDecline();
  }, [onDecline]);

  const handleOverflow = useCallback(() => {
    haptics.tap();
    onOverflowPress();
  }, [onOverflowPress]);

  switch (status) {
    case 'none':
      return (
        <Animated.View style={fadeStyle}>
          <Pressable
            {...addPress.pressHandlers}
            onPress={handleAdd}
          >
            <Animated.View style={[styles.addBtn, addPress.animatedStyle]}>
              <Ionicons name="person-add-outline" size={16} color={colors.text.inverse} />
              <Text style={styles.addBtnText}>Add Friend</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      );

    case 'request_sent':
      return (
        <View style={styles.sentBtn}>
          <Ionicons name="time-outline" size={16} color={colors.text.meta} />
          <Text style={styles.sentBtnText}>Request Sent</Text>
        </View>
      );

    case 'request_received':
      return (
        <View style={styles.requestRow}>
          <Pressable
            {...acceptPress.pressHandlers}
            onPress={handleAccept}
          >
            <Animated.View style={[styles.acceptBtn, acceptPress.animatedStyle]}>
              <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Animated.View>
          </Pressable>
          <Pressable
            {...declinePress.pressHandlers}
            onPress={handleDecline}
          >
            <Animated.View style={[styles.declineBtn, declinePress.animatedStyle]}>
              <Ionicons name="close" size={16} color={colors.text.secondary} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </Animated.View>
          </Pressable>
        </View>
      );

    case 'friends':
      return (
        <View style={styles.friendsRow}>
          <View style={styles.friendsBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.successSoft} />
            <Text style={styles.friendsBadgeText}>Friends</Text>
          </View>
          <Pressable
            {...overflowPress.pressHandlers}
            onPress={handleOverflow}
            hitSlop={8}
          >
            <Animated.View style={[styles.overflowBtn, overflowPress.animatedStyle]}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text.secondary} />
            </Animated.View>
          </Pressable>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  // Add Friend
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  addBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // Request Sent
  sentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.input,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  sentBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },

  // Accept / Decline
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  acceptBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.input,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  declineBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },

  // Friends badge + overflow
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  friendsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  friendsBadgeText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.status.successSoft,
  },
  overflowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
