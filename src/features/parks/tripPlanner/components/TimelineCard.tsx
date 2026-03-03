import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import type { TripStop, POICategory } from '../types';

// ============================================
// Category Icon Mapping
// ============================================

const CATEGORY_ICONS: Record<POICategory, keyof typeof Ionicons.glyphMap> = {
  ride: 'flash-outline',
  food: 'restaurant-outline',
  shop: 'bag-outline',
  theater: 'film-outline',
  attraction: 'star-outline',
  service: 'information-circle-outline',
  break: 'cafe-outline',
};

// ============================================
// Props
// ============================================

interface TimelineCardProps {
  stop: TripStop;
  index: number;
  total: number;
  mode: 'preview' | 'execute';
  isActive?: boolean;
}

// ============================================
// Component
// ============================================

function TimelineCardInner({ stop, index, total, mode, isActive = false }: TimelineCardProps) {
  const isLast = index === total - 1;
  const isDimmed = stop.state === 'done' || stop.state === 'skipped';

  // Circle styling based on state
  const circleStyle = [
    styles.circle,
    stop.state === 'done' && styles.circleDone,
    stop.state === 'skipped' && styles.circleSkipped,
  ];

  // Build meta line
  let metaLine: string;
  if (stop.isBreak) {
    metaLine = `Break \u00B7 ${stop.breakDurationMin ?? 15}m`;
  } else if (stop.category === 'ride') {
    metaLine = `~${stop.estimatedWalkMin}m walk \u00B7 ~${stop.estimatedWaitMin}m wait \u00B7 ${stop.estimatedRideMin}m ride`;
  } else {
    const duration = stop.estimatedWaitMin || stop.estimatedRideMin || 10;
    metaLine = `~${stop.estimatedWalkMin}m walk \u00B7 ~${duration}m`;
  }

  return (
    <View style={[styles.container, isDimmed && styles.containerDimmed]}>
      {/* Left column: timeline line + circle */}
      <View style={styles.leftColumn}>
        <View style={circleStyle}>
          {stop.state === 'done' ? (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          ) : stop.state === 'skipped' ? (
            <Ionicons name="remove" size={14} color="#FFFFFF" />
          ) : (
            <Text style={styles.circleNumber}>{index + 1}</Text>
          )}
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Right column: card */}
      <View
        style={[
          styles.card,
          isActive && styles.cardActive,
        ]}
      >
        <View style={styles.nameRow}>
          <Ionicons
            name={CATEGORY_ICONS[stop.category]}
            size={16}
            color={colors.text.meta}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.name,
              isDimmed && styles.nameStrikethrough,
            ]}
            numberOfLines={1}
          >
            {stop.name}
          </Text>
        </View>
        <Text style={styles.meta}>{metaLine}</Text>
      </View>
    </View>
  );
}

export const TimelineCard = memo(TimelineCardInner);

// ============================================
// Styles
// ============================================

const LEFT_WIDTH = 36;
const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 72,
  },
  containerDimmed: {
    opacity: 0.5,
  },

  // Left column
  leftColumn: {
    width: LEFT_WIDTH,
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.status.success,
  },
  circleSkipped: {
    backgroundColor: colors.border.subtle,
  },
  circleNumber: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 2,
  },

  // Right column — card
  card: {
    flex: 1,
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    padding: spacing.md,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },
  cardActive: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  nameStrikethrough: {
    textDecorationLine: 'line-through',
  },
  meta: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
    marginLeft: 16 + spacing.sm, // align under name, past icon
  },
});
