// ============================================
// Plan Stop Card — Draggable card in plan preview
//
// Shows: grip handle + number + name + walk/wait.
// Used inside DraggableFlatList.
// ============================================

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { formatDuration } from '../planGenerator';
import type { TripStop } from '../types';

// ============================================
// Props
// ============================================

interface PlanStopCardProps {
  stop: TripStop;
  index: number;
  drag?: () => void;
  isActive?: boolean;
  onRemove?: (stopId: string) => void;
}

// ============================================
// Component
// ============================================

function PlanStopCardInner({ stop, index, drag, isActive, onRemove }: PlanStopCardProps) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Drag handle */}
      <Pressable onLongPress={drag} style={styles.dragHandle}>
        <Ionicons name="reorder-three" size={20} color={colors.text.meta} />
      </Pressable>

      {/* Number badge */}
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{index + 1}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{stop.name}</Text>
        <View style={styles.estimateRow}>
          {stop.estimatedWalkMin > 0 && (
            <Text style={styles.estimate}>~{Math.round(stop.estimatedWalkMin)}m walk</Text>
          )}
          {stop.estimatedWaitMin > 0 && (
            <Text style={styles.estimate}>~{Math.round(stop.estimatedWaitMin)}m wait</Text>
          )}
        </View>
      </View>

      {/* Remove button */}
      {onRemove && (
        <Pressable onPress={() => onRemove(stop.id)} hitSlop={8} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={20} color={colors.text.meta} />
        </Pressable>
      )}
    </View>
  );
}

export const PlanStopCard = memo(PlanStopCardInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardActive: {
    ...shadows.card,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  numberText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  estimateRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: 2,
  },
  estimate: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  removeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
});
