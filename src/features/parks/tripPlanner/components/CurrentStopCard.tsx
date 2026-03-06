// ============================================
// Current Stop Card — Hero card in active trip
//
// Single card with 2 visual states: walking / in_line.
// Cross-fade transitions between states. Timer is
// isolated in TripTimer component.
// ============================================

import React, { memo, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';

import { TripTimer } from './TripTimer';
import { ActionButton } from './ActionButton';
import { formatDuration } from '../planGenerator';
import type { TripStop } from '../types';

// ============================================
// Area labels
// ============================================

const AREA_LABELS: Record<string, string> = {
  'camp-snoopy': 'Camp Snoopy',
  'fiesta-village': 'Fiesta Village',
  'boardwalk': 'Boardwalk',
  'ghost-town': 'Ghost Town',
  'california-marketplace': 'Marketplace',
  'western-trails': 'Western Trails',
};

// ============================================
// Props
// ============================================

interface CurrentStopCardProps {
  stop: TripStop;
  onArrived: () => void;
  onDone: () => void;
  onSkip: () => void;
}

// ============================================
// Component
// ============================================

function CurrentStopCardInner({ stop, onArrived, onDone, onSkip }: CurrentStopCardProps) {
  const isWalking = stop.state === 'walking';
  const isInLine = stop.state === 'in_line';
  const areaLabel = stop.area ? AREA_LABELS[stop.area] ?? stop.area : '';

  // Animate stripe opacity on state change
  const stripeOpacity = useSharedValue(isWalking ? 1 : 0);

  useEffect(() => {
    stripeOpacity.value = withTiming(isWalking ? 1 : 0, { duration: TIMING.fast });
    if (isInLine) haptics.select();
  }, [isWalking, isInLine]);

  const stripeStyle = useAnimatedStyle(() => ({
    opacity: stripeOpacity.value,
  }));

  // Walk progress (for countdown)
  const walkProgress = useMemo(() => {
    if (!isWalking || !stop.walkStartedAt || stop.estimatedWalkMin <= 0) return 0;
    const elapsed = (Date.now() - stop.walkStartedAt) / 60_000;
    return Math.min(1, elapsed / stop.estimatedWalkMin);
  }, [isWalking, stop.walkStartedAt, stop.estimatedWalkMin]);

  return (
    <Animated.View entering={FadeIn.duration(TIMING.normal)} style={styles.card}>
      {/* Accent stripe (walking only) */}
      <Animated.View style={[styles.stripe, stripeStyle]} />

      <View style={styles.content}>
        {/* State label */}
        <Text style={styles.stateLabel}>
          {isWalking ? 'WALKING TO' : 'IN LINE'}
        </Text>

        {/* Stop name */}
        <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
        {areaLabel.length > 0 && (
          <Text style={styles.stopArea}>{areaLabel}</Text>
        )}

        {/* Timer */}
        <View style={styles.timerContainer}>
          {isWalking && stop.walkStartedAt && (
            <TripTimer
              startTime={stop.walkStartedAt}
              mode="countdown"
              durationSec={Math.round(stop.estimatedWalkMin * 60)}
            />
          )}
          {isInLine && stop.lineStartedAt && (
            <TripTimer
              startTime={stop.lineStartedAt}
              mode="countup"
            />
          )}
          <Text style={styles.timerSubtitle}>
            {isWalking ? 'est. arrival' : 'time in line'}
          </Text>
        </View>

        {/* Walk progress bar */}
        {isWalking && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${walkProgress * 100}%` }]} />
          </View>
        )}

        {/* In-line estimate */}
        {isInLine && (
          <Text style={styles.estimateText}>
            est. ~{formatDuration(stop.estimatedWaitMin)}
          </Text>
        )}

        {/* Action */}
        <View style={styles.actionArea}>
          {isWalking && (
            <ActionButton label="I'M HERE" onPress={onArrived} />
          )}
          {isInLine && (
            <>
              <ActionButton label="DONE!" onPress={onDone} variant="success" />
              <Pressable onPress={onSkip} style={styles.ghostAction}>
                <Text style={styles.ghostActionText}>skip this stop</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export const CurrentStopCard = memo(CurrentStopCardInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  stripe: {
    height: 4,
    backgroundColor: colors.accent.primary,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  stateLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.5,
    marginBottom: spacing.lg,
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
  timerSubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  progressTrack: {
    width: '80%',
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  estimateText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginBottom: spacing.xl,
  },
  actionArea: {
    width: '100%',
    marginTop: spacing.md,
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
