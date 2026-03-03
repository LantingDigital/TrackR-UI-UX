// ============================================
// Peek Timeline — Ultra-compact upcoming stops
//
// Shows 2-3 upcoming stops below the execute hero
// with a fog gradient fade at the bottom. Static
// views only — no animations for performance.
// ============================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { formatDuration } from '../planGenerator';
import type { TripStop } from '../types';

// ============================================
// Props
// ============================================

interface PeekTimelineProps {
  stops: TripStop[];
  maxVisible?: number;
}

// ============================================
// Component
// ============================================

function PeekTimelineInner({ stops, maxVisible = 2 }: PeekTimelineProps) {
  const visible = stops.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>UP NEXT</Text>
      {visible.map((stop) => (
        <View key={stop.id} style={styles.row}>
          <Text style={styles.order}>{stop.order + 1}</Text>
          <Text style={styles.name} numberOfLines={1}>{stop.name}</Text>
          <Text style={styles.meta}>
            ~{formatDuration(stop.estimatedWalkMin)} walk{'  '}
            ~{formatDuration(stop.estimatedWaitMin)} wait
          </Text>
        </View>
      ))}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        style={styles.fog}
      />
    </View>
  );
}

export const PeekTimeline = memo(PeekTimelineInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  order: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    width: 24,
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginLeft: spacing.md,
  },
  fog: {
    height: 24,
    marginTop: -24,
  },
});
