// ============================================
// Trip Planner Section v4
//
// Parks tab card. Idle: "Plan your visit".
// Active: progress + pace delta.
// ============================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCardPress } from '../../../hooks/useSpringPress';
import { ProgressRing } from '../components/ProgressRing';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { estimateTotalMin, formatDuration } from './planGenerator';
import type { TripPlan, PaceSnapshot } from './types';

// ============================================
// Props
// ============================================

interface TripPlannerSectionProps {
  currentPlan: TripPlan | null;
  paceSnapshot?: PaceSnapshot | null;
  onPress: () => void;
}

// ============================================
// Component
// ============================================

export function TripPlannerSection({ currentPlan, paceSnapshot, onPress }: TripPlannerSectionProps) {
  const { pressHandlers, animatedStyle } = useCardPress();

  const isActive = currentPlan && (
    currentPlan.status === 'active' ||
    currentPlan.status === 'planning' ||
    currentPlan.status === 'paused'
  );

  const completedStops = isActive
    ? currentPlan.stops.filter((s) => s.state === 'done' || s.state === 'skipped').length
    : 0;
  const totalStops = isActive ? currentPlan.stops.length : 0;
  const progress = totalStops > 0 ? completedStops / totalStops : 0;

  const remainingMin = isActive
    ? estimateTotalMin(currentPlan.stops.filter((s) => s.state === 'pending' || s.state === 'walking' || s.state === 'in_line'))
    : 0;

  const modeLabel = isActive
    ? currentPlan.mode === 'speed_run' ? 'Speed Run' : 'Concierge'
    : null;

  const statusLabel = isActive && currentPlan.status === 'paused' ? 'Paused' : null;

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {isActive ? (
          <View style={styles.ringContainer}>
            <ProgressRing progress={progress} size={64} />
            <Text style={styles.ringLabel}>
              {completedStops}/{totalStops}
            </Text>
          </View>
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name="map-outline" size={28} color={colors.accent.primary} />
          </View>
        )}

        <View style={styles.textColumn}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>TRIP PLANNER</Text>
            {modeLabel && (
              <View style={[
                styles.modeBadge,
                currentPlan?.mode === 'speed_run' && styles.modeBadgeSpeedRun,
              ]}>
                <Text style={[
                  styles.modeBadgeText,
                  currentPlan?.mode === 'speed_run' && styles.modeBadgeTextSpeedRun,
                ]}>
                  {modeLabel}
                </Text>
              </View>
            )}
            {statusLabel && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>
            {isActive
              ? `${completedStops} of ${totalStops} stop${totalStops !== 1 ? 's' : ''} done`
              : 'Plan your visit'}
          </Text>
          <Text style={styles.subtitle}>
            {isActive
              ? `~${formatDuration(remainingMin)} remaining`
              : 'Build an optimized route'}
          </Text>
          {isActive && currentPlan.mode === 'speed_run' && paceSnapshot && (
            <Text style={[
              styles.paceText,
              { color: paceSnapshot.deltaMin < 0 ? colors.status.success : colors.status.warning },
            ]}>
              {paceSnapshot.deltaMin < 0
                ? `${Math.abs(Math.round(paceSnapshot.deltaMin))}m ahead`
                : `${Math.round(paceSnapshot.deltaMin)}m behind`}
            </Text>
          )}
        </View>

        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
  },
  modeBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  modeBadgeSpeedRun: {
    backgroundColor: colors.banner.warningBg,
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  modeBadgeTextSpeedRun: {
    color: colors.banner.warningText,
  },
  statusBadge: {
    backgroundColor: colors.banner.warningBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.semibold,
    color: colors.banner.warningText,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  paceText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
    fontVariant: ['tabular-nums' as const],
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
