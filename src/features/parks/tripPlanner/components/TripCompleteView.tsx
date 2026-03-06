// ============================================
// Trip Complete View — Phase 4
//
// ProgressRing + stats grid (2x2 like Logbook)
// + staggered entrance + "Done" button.
// ============================================

import React, { memo, useMemo, useEffect } from 'react';
import { View, Text, Image, FlatList, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { DELAYS, SPRINGS } from '../../../../constants/animations';
import { CARD_ART } from '../../../../data/cardArt';
import { ProgressRing } from '../../components/ProgressRing';
import { ActionButton } from './ActionButton';
import { formatDuration } from '../planGenerator';
import { computePaceSnapshot } from '../paceEngine';
import type { TripPlan, TripStop } from '../types';

// ============================================
// Props
// ============================================

interface TripCompleteViewProps {
  plan: TripPlan;
  onDone: () => void;
}

// ============================================
// Component
// ============================================

function TripCompleteViewInner({ plan, onDone }: TripCompleteViewProps) {
  const stats = useMemo(() => {
    const completedStops = plan.stops.filter((s) => s.state === 'done');
    const skippedStops = plan.stops.filter((s) => s.state === 'skipped');
    const totalStops = plan.stops.length;

    const totalMin = plan.startedAt && plan.completedAt
      ? (plan.completedAt - plan.startedAt) / 60_000
      : 0;

    const waitEntries = plan.waitTimeLog;
    const totalEstimatedWait = waitEntries.reduce((s, e) => s + e.estimatedMin, 0);
    const totalActualWait = waitEntries.reduce((s, e) => s + e.actualMin, 0);
    const waitDelta = totalActualWait - totalEstimatedWait;

    const avgWait = waitEntries.length > 0
      ? Math.round(totalActualWait / waitEntries.length)
      : 0;

    // Pace grade based on final pace snapshot
    const snapshot = computePaceSnapshot(plan);
    const absDelta = Math.abs(snapshot.deltaMin);
    let paceGrade: string;
    if (absDelta <= 5) paceGrade = 'A';
    else if (absDelta <= 15) paceGrade = 'B';
    else if (absDelta <= 25) paceGrade = 'C';
    else if (absDelta <= 35) paceGrade = 'D';
    else paceGrade = 'F';

    const paceLabel = snapshot.deltaMin < -2
      ? `${Math.round(Math.abs(snapshot.deltaMin))} min ahead`
      : snapshot.deltaMin > 2
        ? `${Math.round(snapshot.deltaMin)} min behind`
        : 'Right on time';

    return {
      completedCount: completedStops.length,
      skippedCount: skippedStops.length,
      totalStops,
      totalMin,
      waitDelta: Math.round(waitDelta),
      avgWait,
      ridesCompleted: completedStops.filter((s) => s.category === 'ride').length,
      completedRideStops: completedStops.filter((s) => s.category === 'ride'),
      paceGrade,
      paceLabel,
    };
  }, [plan]);

  const progress = stats.totalStops > 0 ? stats.completedCount / stats.totalStops : 1;

  // Pace grade scale-in animation
  const gradeScale = useSharedValue(0);
  useEffect(() => {
    gradeScale.value = withDelay(600, withSpring(1, SPRINGS.bouncy));
  }, []);
  const gradeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gradeScale.value }],
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Celebration area */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.celebrationArea}>
        <View style={styles.ringContainer}>
          <ProgressRing progress={progress} size={120} strokeWidth={6} />
          <Text style={styles.ringLabel}>{stats.completedCount}/{stats.totalStops}</Text>
        </View>
        <Text style={styles.title}>Trip Complete!</Text>
        <Text style={styles.subtitle}>
          {stats.ridesCompleted} ride{stats.ridesCompleted !== 1 ? 's' : ''} at {plan.parkName}
        </Text>
      </Animated.View>

      {/* Pace grade */}
      <Animated.View style={[styles.gradeContainer, gradeStyle]}>
        <Text style={styles.gradeLabel}>Pace Grade</Text>
        <Text style={styles.gradeValue}>{stats.paceGrade}</Text>
        <Text style={styles.gradeSubtext}>{stats.paceLabel}</Text>
      </Animated.View>

      {/* Coaster art scroll */}
      {stats.completedRideStops.length > 0 && (
        <Animated.View entering={FadeInUp.delay(400).duration(300)}>
          <Text style={styles.sectionLabel}>RIDES CONQUERED</Text>
          <FlatList
            data={stats.completedRideStops}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artListContent}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <RideArtCard stop={item} index={index} />
            )}
          />
        </Animated.View>
      )}

      {/* 2x2 Stats grid (like Logbook) */}
      <View style={styles.statsGrid}>
        <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 0).duration(300)} style={styles.statCard}>
          <Text style={styles.statLabel}>Total Time</Text>
          <Text style={styles.statValue}>{formatDuration(stats.totalMin)}</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 1).duration(300)} style={styles.statCard}>
          <Text style={styles.statLabel}>Stops</Text>
          <Text style={styles.statValue}>{stats.completedCount}/{stats.totalStops}</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 2).duration(300)} style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Wait</Text>
          <Text style={styles.statValue}>{stats.avgWait}m</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200 + DELAYS.cascade * 3).duration(300)} style={styles.statCard}>
          <Text style={styles.statLabel}>Wait vs Est.</Text>
          <Text style={[
            styles.statValue,
            { color: stats.waitDelta > 5 ? colors.status.warning : stats.waitDelta < -5 ? colors.status.success : colors.text.primary },
          ]}>
            {stats.waitDelta > 0 ? '+' : ''}{stats.waitDelta}m
          </Text>
        </Animated.View>
      </View>

      {/* Done button */}
      <Animated.View entering={FadeInUp.delay(500).duration(300)} style={styles.bottomArea}>
        <ActionButton label="Done" onPress={onDone} />
      </Animated.View>
    </ScrollView>
  );
}

export const TripCompleteView = memo(TripCompleteViewInner);

// ============================================
// Ride Art Card (internal)
// ============================================

const ART_CARD_WIDTH = 160;

function RideArtCard({ stop, index }: { stop: TripStop; index: number }) {
  // Try to find card art via coasterId pattern (poi id may match)
  const artSource = CARD_ART[stop.poiId] ?? null;
  const actualWait = stop.actualWaitMin ?? 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(DELAYS.cascade * index).duration(250)}
      style={artStyles.card}
    >
      {artSource ? (
        <Image source={artSource} style={artStyles.image} resizeMode="cover" />
      ) : (
        <View style={artStyles.placeholder} />
      )}
      <View style={artStyles.info}>
        <Text style={artStyles.name} numberOfLines={1}>{stop.name}</Text>
        {actualWait > 0 && (
          <Text style={artStyles.wait}>Waited {Math.round(actualWait)}m</Text>
        )}
      </View>
    </Animated.View>
  );
}

const artStyles = StyleSheet.create({
  card: {
    width: ART_CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  image: {
    width: ART_CARD_WIDTH,
    height: 100,
  },
  placeholder: {
    width: ART_CARD_WIDTH,
    height: 100,
    backgroundColor: colors.background.imagePlaceholder,
  },
  info: {
    padding: spacing.md,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  wait: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
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
  gradeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  gradeLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  gradeValue: {
    fontSize: 56,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  gradeSubtext: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  artListContent: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
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
