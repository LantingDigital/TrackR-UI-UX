// ============================================
// Upcoming Stop Row — Compact row in peek area
//
// Static View + Text. No animation.
// ============================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import type { TripStop } from '../types';

// ============================================
// Props
// ============================================

interface UpcomingStopRowProps {
  stop: TripStop;
  index: number; // display number
}

// ============================================
// Component
// ============================================

function UpcomingStopRowInner({ stop, index }: UpcomingStopRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.number}>{index}</Text>
      <Text style={styles.name} numberOfLines={1}>{stop.name}</Text>
      <View style={styles.estimates}>
        {stop.estimatedWalkMin > 0 && (
          <Text style={styles.estimate}>~{Math.round(stop.estimatedWalkMin)}m walk</Text>
        )}
        {stop.estimatedWaitMin > 0 && (
          <Text style={styles.estimate}>~{Math.round(stop.estimatedWaitMin)}m wait</Text>
        )}
      </View>
    </View>
  );
}

export const UpcomingStopRow = memo(UpcomingStopRowInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  number: {
    width: 24,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    fontVariant: ['tabular-nums'],
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  estimates: {
    flexDirection: 'row',
    gap: spacing.md,
    marginLeft: spacing.md,
  },
  estimate: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
});
