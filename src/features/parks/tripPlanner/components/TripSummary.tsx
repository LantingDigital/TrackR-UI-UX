// ============================================
// Trip Summary
//
// Completion screen shown in Phase 4 after all
// stops are done. Shows stats and celebration.
// ============================================

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { DELAYS } from '../../../../constants/animations';
import { ProgressRing } from '../../components/ProgressRing';
import { ActionButton } from './ActionButton';
import type { TripPlan } from '../types';

// ============================================
// Props
// ============================================

interface TripSummaryProps {
  plan: TripPlan;
  onDone: () => void;
}

// ============================================
// Helpers
// ============================================

function formatDuration(min: number): string {
  const rounded = Math.round(min);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ============================================
// Component
// ============================================

function TripSummaryInner({ plan, onDone }: TripSummaryProps) {
  const stats = useMemo(() => {
    const completedStops = plan.stops.filter((s) => s.state === 'done');
    const skippedStops = plan.stops.filter((s) => s.state === 'skipped');
    const totalStops = plan.stops.length;

    // Total trip time
    const totalMin = plan.startedAt && plan.completedAt
      ? (plan.completedAt - plan.startedAt) / 60_000
      : 0;

    // Actual vs estimated waits
    const waitEntries = plan.waitTimeLog;
    const totalEstimatedWait = waitEntries.reduce((s, e) => s + e.estimatedMin, 0);
    const totalActualWait = waitEntries.reduce((s, e) => s + e.actualMin, 0);
    const waitDelta = totalActualWait - totalEstimatedWait;

    // Average actual wait
    const avgWait = waitEntries.length > 0
      ? Math.round(totalActualWait / waitEntries.length)
      : 0;

    return {
      completedCount: completedStops.length,
      skippedCount: skippedStops.length,
      totalStops,
      totalMin,
      totalEstimatedWait: Math.round(totalEstimatedWait),
      totalActualWait: Math.round(totalActualWait),
      waitDelta: Math.round(waitDelta),
      avgWait,
      ridesCompleted: completedStops.filter((s) => s.category === 'ride').length,
    };
  }, [plan]);

  const progress = stats.totalStops > 0 ? stats.completedCount / stats.totalStops : 1;

  return (
    <View style={styles.container}>
      {/* Celebration with ProgressRing */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.celebrationArea}>
        <View style={styles.ringContainer}>
          <ProgressRing progress={progress} size={120} strokeWidth={6} />
          <Text style={styles.ringLabel}>{stats.completedCount}/{stats.totalStops}</Text>
        </View>
        <Text style={styles.title}>Trip Complete!</Text>
        <Text style={styles.subtitle}>
          {stats.ridesCompleted} ride{stats.ridesCompleted !== 1 ? 's' : ''} conquered at {plan.parkName}
        </Text>
      </Animated.View>

      {/* Stats — staggered cascade */}
      <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 0).duration(300)} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatItem label="Total Time" value={formatDuration(stats.totalMin)} />
          <StatItem label="Stops" value={`${stats.completedCount}/${stats.totalStops}`} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 1).duration(300)} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatItem label="Avg Wait" value={`${stats.avgWait}m`} />
          <StatItem
            label="Wait vs Est."
            value={`${stats.waitDelta > 0 ? '+' : ''}${stats.waitDelta}m`}
            valueColor={stats.waitDelta > 5 ? colors.status.warning : stats.waitDelta < -5 ? colors.status.success : undefined}
          />
        </View>
      </Animated.View>

      {stats.skippedCount > 0 && (
        <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 2).duration(300)} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatItem label="Skipped" value={`${stats.skippedCount}`} />
            <StatItem label="Mode" value={plan.mode === 'speed_run' ? 'Speed Run' : 'Concierge'} />
          </View>
        </Animated.View>
      )}

      {/* Done button */}
      <Animated.View entering={FadeInUp.delay(500).duration(300)} style={styles.bottomArea}>
        <ActionButton label="Done" onPress={onDone} />
      </Animated.View>
    </View>
  );
}

export const TripSummary = memo(TripSummaryInner);

// ============================================
// Stat Item
// ============================================

function StatItem({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  celebrationArea: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  ringContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ringLabel: {
    position: 'absolute',
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  bottomArea: {
    marginTop: 'auto',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
});
