// ============================================
// Active Trip View — Phase 3 Orchestrator
//
// Manages current stop card, upcoming rows,
// celebration overlay, overflow menu, and the
// "all done" state.
// ============================================

import React, { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { TIMING } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';

import { CurrentStopCard } from './CurrentStopCard';
import { UpcomingStopRow } from './UpcomingStopRow';
import { CelebrationOverlay } from './CelebrationOverlay';
import { OverflowMenu } from './OverflowMenu';
import { ActionButton } from './ActionButton';
import type { TripPlan, TripStop, PaceSnapshot } from '../types';

// ============================================
// Props
// ============================================

interface ActiveTripViewProps {
  plan: TripPlan;
  paceSnapshot: PaceSnapshot | null;
  onArrivedAtStop: (stopId: string) => void;
  onCompleteStop: (stopId: string) => void;
  onSkipStop: (stopId: string) => void;
  onPauseTrip: () => void;
  onResumeTrip: () => void;
  onAbandonTrip: () => void;
  onAddBreak: () => void;
  onViewSummary: () => void;
  onClose: () => void;
}

// ============================================
// Fog gradient for upcoming stops
// ============================================

const FOG_COLORS = [
  'rgba(247,247,247,0)',
  'rgba(247,247,247,0.3)',
  'rgba(247,247,247,0.7)',
  'rgba(247,247,247,1)',
] as const;

// ============================================
// Component
// ============================================

function ActiveTripViewInner({
  plan,
  paceSnapshot,
  onArrivedAtStop,
  onCompleteStop,
  onSkipStop,
  onPauseTrip,
  onResumeTrip,
  onAbandonTrip,
  onAddBreak,
  onViewSummary,
  onClose,
}: ActiveTripViewProps) {
  // ---- Derived state ----
  const currentStop = useMemo(
    () => plan.stops.find((s) => s.state === 'walking' || s.state === 'in_line') ?? null,
    [plan.stops],
  );

  const nextStops = useMemo(
    () => plan.stops.filter((s) => s.state === 'pending').slice(0, 3),
    [plan.stops],
  );

  const completedCount = useMemo(
    () => plan.stops.filter((s) => s.state === 'done' || s.state === 'skipped').length,
    [plan.stops],
  );

  const totalCount = plan.stops.length;
  const isPaused = plan.status === 'paused';
  const isSpeedRun = plan.mode === 'speed_run';
  const allDone = !currentStop && completedCount > 0;

  // ---- Celebration state ----
  const [celebrationStop, setCelebrationStop] = useState<TripStop | null>(null);
  const prevStopIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newStopId = currentStop?.id ?? null;
    const prevStopId = prevStopIdRef.current;

    if (prevStopId && prevStopId !== newStopId) {
      const prevStop = plan.stops.find((s) => s.id === prevStopId);
      if (prevStop && prevStop.state === 'done') {
        setCelebrationStop(prevStop);
      }
    }

    prevStopIdRef.current = newStopId;
  }, [currentStop?.id, plan.stops]);

  const handleCelebrationDismiss = useCallback(() => {
    setCelebrationStop(null);
  }, []);

  // ---- Menu state ----
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Pace display ----
  const paceText = isSpeedRun && paceSnapshot
    ? paceSnapshot.deltaMin < 0
      ? `${Math.abs(Math.round(paceSnapshot.deltaMin))}m ahead`
      : `${Math.round(paceSnapshot.deltaMin)}m behind`
    : null;
  const paceColor = paceSnapshot && paceSnapshot.deltaMin < 0
    ? colors.status.success
    : colors.status.warning;

  // ---- Handlers ----
  const handleArrived = useCallback(() => {
    if (currentStop) {
      haptics.select();
      onArrivedAtStop(currentStop.id);
    }
  }, [currentStop, onArrivedAtStop]);

  const handleDone = useCallback(() => {
    if (currentStop) onCompleteStop(currentStop.id);
  }, [currentStop, onCompleteStop]);

  const handleSkip = useCallback(() => {
    if (currentStop) {
      haptics.tap();
      onSkipStop(currentStop.id);
    }
  }, [currentStop, onSkipStop]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) onResumeTrip();
    else onPauseTrip();
  }, [isPaused, onPauseTrip, onResumeTrip]);

  // ============================================
  // Render: All Done
  // ============================================

  if (allDone && !celebrationStop) {
    return (
      <View style={styles.container}>
        <Header
          completedCount={completedCount}
          totalCount={totalCount}
          paceText={null}
          paceColor={undefined}
          onClose={onClose}
          onMenuPress={() => setMenuOpen(true)}
        />

        <View style={styles.allDoneArea}>
          <Animated.View entering={FadeIn.duration(TIMING.normal)}>
            <Ionicons name="checkmark-circle" size={72} color={colors.status.success} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(TIMING.normal)}>
            <Text style={styles.allDoneTitle}>All stops complete!</Text>
          </Animated.View>

          <View style={styles.allDoneActions}>
            <ActionButton label="View Trip Summary" onPress={onViewSummary} />
            <Pressable onPress={onClose} style={styles.ghostAction}>
              <Text style={styles.ghostActionText}>end trip</Text>
            </Pressable>
          </View>
        </View>

        <OverflowMenu
          visible={menuOpen}
          isPaused={isPaused}
          onClose={() => setMenuOpen(false)}
          onAddBreak={onAddBreak}
          onPauseTrip={handlePauseToggle}
          onEndTrip={onAbandonTrip}
        />
      </View>
    );
  }

  // ============================================
  // Render: Walking / In Line + Celebration
  // ============================================

  return (
    <View style={styles.container}>
      {/* Celebration overlay */}
      {celebrationStop && (
        <CelebrationOverlay
          stop={celebrationStop}
          onDismiss={handleCelebrationDismiss}
        />
      )}

      {/* Header */}
      <Header
        completedCount={completedCount}
        totalCount={totalCount}
        paceText={paceText}
        paceColor={paceColor}
        onClose={onClose}
        onMenuPress={() => setMenuOpen(true)}
      />

      {/* Current stop card */}
      {currentStop && (
        <View style={styles.cardArea}>
          <CurrentStopCard
            key={currentStop.id}
            stop={currentStop}
            onArrived={handleArrived}
            onDone={handleDone}
            onSkip={handleSkip}
          />
        </View>
      )}

      {/* Upcoming stops */}
      {nextStops.length > 0 && (
        <View style={styles.upcomingArea}>
          <Text style={styles.upcomingLabel}>UP NEXT</Text>
          {nextStops.map((stop, i) => (
            <UpcomingStopRow
              key={stop.id}
              stop={stop}
              index={completedCount + 2 + i}
            />
          ))}
          {/* Fog gradient */}
          <LinearGradient
            colors={[...FOG_COLORS]}
            style={styles.fog}
            pointerEvents="none"
          />
        </View>
      )}

      {/* Overflow menu */}
      <OverflowMenu
        visible={menuOpen}
        isPaused={isPaused}
        onClose={() => setMenuOpen(false)}
        onAddBreak={onAddBreak}
        onPauseTrip={handlePauseToggle}
        onEndTrip={onAbandonTrip}
      />
    </View>
  );
}

export const ActiveTripView = memo(ActiveTripViewInner);

// ============================================
// Header (internal)
// ============================================

function Header({
  completedCount,
  totalCount,
  paceText,
  paceColor,
  onClose,
  onMenuPress,
}: {
  completedCount: number;
  totalCount: number;
  paceText: string | null;
  paceColor?: string;
  onClose: () => void;
  onMenuPress: () => void;
}) {
  return (
    <View style={headerStyles.container}>
      <Pressable onPress={onClose} hitSlop={8} style={headerStyles.btn}>
        <Ionicons name="close" size={22} color={colors.text.primary} />
      </Pressable>

      <View style={headerStyles.center}>
        <Text style={headerStyles.progress}>{completedCount} of {totalCount}</Text>
        {paceText && (
          <View style={headerStyles.paceRow}>
            <View style={[headerStyles.paceDot, { backgroundColor: paceColor }]} />
            <Text style={[headerStyles.paceText, { color: paceColor }]}>{paceText}</Text>
          </View>
        )}
      </View>

      <Pressable onPress={onMenuPress} hitSlop={8} style={headerStyles.btn}>
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  upcomingArea: {
    paddingBottom: spacing.xl,
  },
  upcomingLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  fog: {
    height: 40,
    marginTop: -40,
  },
  allDoneArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  allDoneTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  allDoneActions: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
  },
  ghostAction: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  ghostActionText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  progress: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  paceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  paceText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
  },
});
