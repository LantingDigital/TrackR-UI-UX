/**
 * FriendRow — Horizontal friend card for Friends tab
 *
 * Compact card showing avatar, name, credit count, top coaster.
 * Spring press feedback. Tap → ProfileView.
 */

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
import type { Friend } from '../types/community';

interface FriendRowProps {
  friend: Friend;
  onPress: (friendId: string) => void;
}

export const FriendRow = React.memo(function FriendRow({ friend, onPress }: FriendRowProps) {
  const press = useCardPress();

  return (
    <Pressable
      {...press.pressHandlers}
      onPress={() => {
        haptics.tap();
        onPress(friend.id);
      }}
    >
      <Animated.View style={[styles.card, press.animatedStyle]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{friend.initials}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{friend.name}</Text>
        <View style={styles.statRow}>
          <Ionicons name="ticket-outline" size={12} color={colors.text.meta} />
          <Text style={styles.statText}>{friend.creditCount}</Text>
        </View>
        <Text style={styles.topCoaster} numberOfLines={1}>{friend.topCoaster}</Text>
        {friend.mutualFriends > 0 && (
          <Text style={styles.mutual}>{friend.mutualFriends} mutual</Text>
        )}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.xs,
  },
  statText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  topCoaster: {
    fontSize: typography.sizes.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  mutual: {
    fontSize: 10,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
});
