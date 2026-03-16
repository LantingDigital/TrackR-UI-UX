/**
 * ProBadge — Small Pro indicator for profile, leaderboards, etc.
 *
 * Shows tier-colored checkmark or small "PRO" text badge.
 * Clash Royale gold name style — subtle but noticeable.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { type ProTier, getTierColor } from '../../stores/proStore';

interface ProBadgeProps {
  tier: ProTier;
  size?: 'small' | 'medium';
  style?: object;
}

export const ProBadge: React.FC<ProBadgeProps> = ({ tier, size = 'small', style }) => {
  const tierColor = getTierColor(tier);
  const iconSize = size === 'small' ? 10 : 14;
  const badgeSize = size === 'small' ? 18 : 24;

  return (
    <View style={[
      styles.badge,
      { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, backgroundColor: tierColor },
      style,
    ]}>
      <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" />
    </View>
  );
};

/** Text-style "PRO" label — for inline use next to usernames */
export const ProLabel: React.FC<{ tier: ProTier; style?: object }> = ({ tier, style }) => {
  const tierColor = getTierColor(tier);

  return (
    <View style={[styles.label, { backgroundColor: tierColor + '20' }, style]}>
      <Text style={[styles.labelText, { color: tierColor }]}>PRO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  labelText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
});
