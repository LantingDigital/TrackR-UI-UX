// ============================================
// Execute View — Single Immersive Execute Phase
//
// The heart of Trip Planner v3. One component
// with 4 states: walking, in_line, celebration,
// all_done. Cross-fade transitions between states.
// Context-aware minimalism — shows only what
// matters right now.
// ============================================

import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { SPRINGS, TIMING } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';

import { ActionButton } from './ActionButton';
import { PeekTimeline } from './PeekTimeline';
import { OverflowMenu } from './OverflowMenu';
import { formatDuration } from '../planGenerator';
import type { TripPlan, TripStop, PaceSnapshot } from '../types';

// ============================================
// Props
// ============================================

interface ExecuteViewProps {
  plan: TripPlan;
  paceSnapshot: PaceSnapshot | null;
  onArrivedAtStop: (stopId: string) => void;
  onCompleteStop: (stopId: string) => void;
  onSkipStop: (stopId: string) => void;
  onPauseTrip: () => void;
  onResumeTrip: () => void;
  onAbandonTrip: () => void;
  onAddBreak: () => void;
  onPhaseComplete: () => void;
  onClose: () => void;
}

// ============================================
// Helpers
// ============================================

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

// ============================================
// Component
// ============================================

function ExecuteViewInner({
  plan,
  paceSnapshot,
  onArrivedAtStop,
  onCompleteStop,
  onSkipStop,
  onPauseTrip,
  onResumeTrip,
  onAbandonTrip,
  onAddBreak,
  onPhaseComplete,
  onClose,
}: ExecuteViewProps) {
  // ---- Derived state (memoized) ----
  const currentStop = useMemo(
    () => plan.stops.find((s) => s.state === 'walking' || s.state === 'in_line') ?? null,
    [plan.stops],
  );

  const nextStops = useMemo(
    () => plan.stops.filter((s) => s.state === 'pending'),
    [plan.stops],
  );

  const completedCount = useMemo(
    () => plan.stops.filter((s) => s.state === 'done' || s.state === 'skipped').length,
    [plan.stops],
  );

  const totalCount = plan.stops.length;
  const isSpeedRun = plan.mode === 'speed_run';
  const isPaused = plan.status === 'paused';

  // ---- Timer state (only thing that re-renders per second) ----
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Celebration state ----
  const [celebrationStop, setCelebrationStop] = useState<TripStop | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStopIdRef = useRef<string | null>(null);

  // ---- Menu state ----
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Animation shared values ----
  const timerScale = useSharedValue(1);
  const celebrationScale = useSharedValue(0);

  // ---- Timer effect ----
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);

    if (!currentStop) return;

    const origin =
      currentStop.state === 'walking' ? currentStop.walkStartedAt :
      currentStop.state === 'in_line' ? currentStop.lineStartedAt :
      null;
    if (!origin) return;

    setElapsed(Math.floor((Date.now() - origin) / 1000));
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - origin) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentStop?.id, currentStop?.state, currentStop?.walkStartedAt, currentStop?.lineStartedAt]);

  // ---- Detect stop completion for celebration ----
  useEffect(() => {
    const newStopId = currentStop?.id ?? null;
    const prevStopId = prevStopIdRef.current;

    // If current stop changed and the previous stop is now done, show celebration
    if (prevStopId && prevStopId !== newStopId) {
      const prevStop = plan.stops.find((s) => s.id === prevStopId);
      if (prevStop && prevStop.state === 'done') {
        setCelebrationStop(prevStop);
        celebrationScale.value = 0;
        celebrationScale.value = withSpring(1, SPRINGS.bouncy);
        haptics.success();

        // Clear celebration after 800ms
        celebrationTimer.current = setTimeout(() => {
          setCelebrationStop(null);
        }, 800);
      }
    }

    prevStopIdRef.current = newStopId;

    return () => {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    };
  }, [currentStop?.id, plan.stops]);

  // ---- State transition animations ----
  const prevStateRef = useRef(currentStop?.state);
  useEffect(() => {
    const newState = currentStop?.state;
    if (prevStateRef.current && newState && prevStateRef.current !== newState) {
      haptics.select();
      timerScale.value = withSequence(
        withSpring(1.05, SPRINGS.bouncy),
        withSpring(1, SPRINGS.responsive),
      );
    }
    prevStateRef.current = newState;
  }, [currentStop?.state]);

  // ---- Animated styles ----
  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  const celebrationAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  // ---- Handlers ----
  const handleArrived = useCallback(() => {
    if (!currentStop) return;
    haptics.select();
    onArrivedAtStop(currentStop.id);
  }, [currentStop, onArrivedAtStop]);

  const handleDone = useCallback(() => {
    if (!currentStop) return;
    onCompleteStop(currentStop.id);
  }, [currentStop, onCompleteStop]);

  const handleSkip = useCallback(() => {
    if (!currentStop) return;
    haptics.tap();
    onSkipStop(currentStop.id);
  }, [currentStop, onSkipStop]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      onResumeTrip();
    } else {
      onPauseTrip();
    }
  }, [isPaused, onPauseTrip, onResumeTrip]);

  // ---- Compute timer display ----
  const isWalking = currentStop?.state === 'walking';
  const isInLine = currentStop?.state === 'in_line';
  const allDone = !currentStop && completedCount > 0;

  let timerDisplay = '0:00';
  let timerSubtitle = '';
  let walkProgress = 0;

  if (currentStop && isWalking) {
    const remaining = Math.max(0, currentStop.estimatedWalkMin * 60 - elapsed);
    timerDisplay = formatTime(remaining);
    timerSubtitle = 'est. arrival';
    walkProgress = currentStop.estimatedWalkMin > 0
      ? Math.min(1, elapsed / (currentStop.estimatedWalkMin * 60))
      : 0;
  } else if (currentStop && isInLine) {
    timerDisplay = formatTime(elapsed);
    timerSubtitle = 'time in line';
  }

  // ---- Pace delta for Speed Run header ----
  const paceText = isSpeedRun && paceSnapshot
    ? paceSnapshot.deltaMin < 0
      ? `${Math.abs(Math.round(paceSnapshot.deltaMin))}m ahead`
      : `${Math.round(paceSnapshot.deltaMin)}m behind`
    : null;
  const paceColor = paceSnapshot && paceSnapshot.deltaMin < 0
    ? colors.status.success
    : colors.status.warning;

  // ============================================
  // Render: Celebration micro-state
  // ============================================

  if (celebrationStop) {
    const actualWait = celebrationStop.actualWaitMin ?? 0;
    const estimatedWait = celebrationStop.estimatedWaitMin;
    const isBetter = actualWait < estimatedWait;

    return (
      <View style={styles.container}>
        {/* Header */}
        <ExecuteHeader
          completedCount={completedCount}
          totalCount={totalCount}
          paceText={paceText}
          paceColor={paceColor}
          onClose={onClose}
          onMenuPress={() => {}}
          menuDisabled
        />

        {/* Celebration */}
        <View style={styles.heroArea}>
          <Animated.View style={[styles.checkCircle, celebrationAnimStyle]}>
            <Ionicons name="checkmark" size={32} color={colors.text.inverse} />
          </Animated.View>

          <Text style={styles.celebrationName}>{celebrationStop.name}</Text>
          <Text style={styles.celebrationDone}>done!</Text>

          {actualWait > 0 && (
            <Text style={[styles.celebrationStat, isBetter && styles.celebrationStatGood]}>
              Waited {Math.round(actualWait)}m (est. {Math.round(estimatedWait)}m)
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ============================================
  // Render: All done
  // ============================================

  if (allDone) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <ExecuteHeader
          completedCount={completedCount}
          totalCount={totalCount}
          paceText={null}
          paceColor={undefined}
          onClose={onClose}
          onMenuPress={() => setMenuOpen(true)}
        />

        <View style={styles.heroArea}>
          <Animated.View entering={FadeIn.duration(TIMING.normal)} style={styles.allDoneCheck}>
            <Ionicons name="checkmark-circle" size={72} color={colors.status.success} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(TIMING.normal)}>
            <Text style={styles.allDoneTitle}>All stops complete!</Text>
          </Animated.View>

          <View style={styles.allDoneActions}>
            <ActionButton
              label="View Trip Summary"
              onPress={onPhaseComplete}
            />
            <Pressable onPress={onClose} style={styles.ghostAction}>
              <Text style={styles.ghostActionText}>end trip</Text>
            </Pressable>
          </View>
        </View>

        {menuOpen && (
          <OverflowMenu
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            onAddBreak={onAddBreak}
            onPauseTrip={handlePauseToggle}
            onEndTrip={onAbandonTrip}
            isPaused={isPaused}
          />
        )}
      </View>
    );
  }

  // ============================================
  // Render: Walking / In Line (main states)
  // ============================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <ExecuteHeader
        completedCount={completedCount}
        totalCount={totalCount}
        paceText={paceText}
        paceColor={paceColor}
        onClose={onClose}
        onMenuPress={() => setMenuOpen(true)}
      />

      {/* Hero area */}
      <View style={styles.heroArea}>
        {/* State label */}
        <Text style={styles.stateLabel}>
          {isWalking ? 'WALKING TO' : 'IN LINE'}
        </Text>

        {/* Stop name */}
        <Text style={styles.stopName} numberOfLines={1}>
          {currentStop?.name}
        </Text>
        {currentStop?.area && (
          <Text style={styles.stopArea}>{currentStop.area}</Text>
        )}

        {/* Big timer */}
        <Animated.View style={[styles.timerContainer, timerAnimStyle]}>
          <Text style={styles.timerText}>{timerDisplay}</Text>
          <Text style={styles.timerSubtitle}>{timerSubtitle}</Text>
        </Animated.View>

        {/* Walk progress bar */}
        {isWalking && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${walkProgress * 100}%` }]} />
          </View>
        )}

        {/* In-line estimates */}
        {isInLine && currentStop && (
          <View style={styles.estimateRow}>
            <Text style={styles.estimateText}>est. ~{formatDuration(currentStop.estimatedWaitMin)}</Text>
          </View>
        )}

        {/* Primary action */}
        <View style={styles.actionArea}>
          {isWalking && (
            <ActionButton label="I'M HERE" onPress={handleArrived} />
          )}
          {isInLine && (
            <>
              <ActionButton label="DONE!" onPress={handleDone} variant="success" />
              <Pressable onPress={handleSkip} style={styles.ghostAction}>
                <Text style={styles.ghostActionText}>skip this stop</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Peek timeline */}
      <PeekTimeline stops={nextStops} maxVisible={2} />

      {/* Overflow menu */}
      {menuOpen && (
        <OverflowMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onAddBreak={onAddBreak}
          onPauseTrip={handlePauseToggle}
          onEndTrip={onAbandonTrip}
          isPaused={isPaused}
        />
      )}
    </View>
  );
}

export const ExecuteView = memo(ExecuteViewInner);

// ============================================
// Execute Header (internal)
// ============================================

function ExecuteHeader({
  completedCount,
  totalCount,
  paceText,
  paceColor,
  onClose,
  onMenuPress,
  menuDisabled,
}: {
  completedCount: number;
  totalCount: number;
  paceText: string | null;
  paceColor?: string;
  onClose: () => void;
  onMenuPress: () => void;
  menuDisabled?: boolean;
}) {
  return (
    <View style={headerStyles.container}>
      <Pressable onPress={onClose} hitSlop={8} style={headerStyles.closeBtn}>
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

      {!menuDisabled ? (
        <Pressable onPress={onMenuPress} hitSlop={8} style={headerStyles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
        </Pressable>
      ) : (
        <View style={headerStyles.menuBtn} />
      )}
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
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  stateLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  stopName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stopArea: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  timerText: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerSubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  progressBarTrack: {
    width: '80%',
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  estimateText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  actionArea: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },

  // ---- Celebration ----
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  celebrationName: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  celebrationDone: {
    fontSize: typography.sizes.label,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  celebrationStat: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
    marginTop: spacing.base,
    fontVariant: ['tabular-nums'],
  },
  celebrationStatGood: {
    color: colors.status.success,
  },

  // ---- All done ----
  allDoneCheck: {
    marginBottom: spacing.xl,
  },
  allDoneTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  allDoneActions: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  closeBtn: {
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
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
