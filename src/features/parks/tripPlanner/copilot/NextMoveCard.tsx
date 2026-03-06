// ============================================
// Next Move Card — Hero card for Co-Pilot Mode
//
// Full-width immersive card with coaster art,
// state-dependent rendering (walking/in_line),
// and spring-animated card transitions.
// ============================================

import React, { memo, useMemo, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';
import { CARD_ART, CARD_ART_FOCAL } from '../../../../data/cardArt';
import { COASTER_BY_ID } from '../../../../data/coasterIndex';
import { addQuickLog, getCreditCount } from '../../../../stores/rideLogStore';
import { TripTimer } from '../components/TripTimer';
import { ActionButton } from '../components/ActionButton';
import { CelebrationToast } from './CelebrationToast';
import { formatDuration } from '../planGenerator';
import type { TripStop } from '../types';
import type { ParkPOI } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface NextMoveCardProps {
  stop: TripStop;
  poiMap: Map<string, ParkPOI>;
  onArrived: (stopId: string) => void;
  onDone: (stopId: string) => void;
  onSkip: (stopId: string) => void;
}

// ============================================
// Component
// ============================================

function NextMoveCardInner({
  stop,
  poiMap,
  onArrived,
  onDone,
  onSkip,
}: NextMoveCardProps) {
  const isWalking = stop.state === 'walking';
  const isInLine = stop.state === 'in_line';
  const isBreak = stop.isBreak;
  const areaLabel = stop.area ? AREA_LABELS[stop.area] ?? stop.area : '';

  const [showCelebration, setShowCelebration] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Card transition animation
  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // Resolve coaster image
  const poi = poiMap.get(stop.poiId);
  const coasterId = poi?.coasterId;
  const coaster = coasterId ? COASTER_BY_ID[coasterId] : null;
  const localArt = coasterId ? CARD_ART[coasterId] : null;
  const focalY = coasterId ? (CARD_ART_FOCAL[coasterId] ?? 0.5) : 0.5;
  const hasImage = (localArt || coaster?.imageUrl) && !imageError;

  // Walk progress
  const walkProgress = useMemo(() => {
    if (!isWalking || !stop.walkStartedAt || stop.estimatedWalkMin <= 0) return 0;
    const elapsed = (Date.now() - stop.walkStartedAt) / 60_000;
    return Math.min(1, elapsed / stop.estimatedWalkMin);
  }, [isWalking, stop.walkStartedAt, stop.estimatedWalkMin]);

  // Reset card position when stop changes
  useEffect(() => {
    cardTranslateX.value = SCREEN_WIDTH;
    cardOpacity.value = 0;
    cardTranslateX.value = withSpring(0, SPRINGS.responsive);
    cardOpacity.value = withTiming(1, { duration: TIMING.fast });
    setImageError(false);
  }, [stop.id]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardTranslateX.value }],
    opacity: cardOpacity.value,
  }));

  // Handle "Done" — log ride + celebrate + transition
  const handleDone = useCallback(() => {
    haptics.success();

    // Auto-log ride if it's a coaster
    if (coasterId && coaster) {
      addQuickLog({
        id: coasterId,
        name: coaster.name,
        parkName: coaster.park,
      });
    }

    setShowCelebration(true);
  }, [coasterId, coaster]);

  const handleCelebrationDismiss = useCallback(() => {
    setShowCelebration(false);

    // Animate card out, then notify parent
    cardTranslateX.value = withSpring(-SCREEN_WIDTH, SPRINGS.responsive, (finished) => {
      if (finished) {
        runOnJS(onDone)(stop.id);
      }
    });
    cardOpacity.value = withTiming(0, { duration: TIMING.fast });
  }, [stop.id, onDone]);

  const handleArrived = useCallback(() => {
    haptics.select();
    onArrived(stop.id);
  }, [stop.id, onArrived]);

  const handleSkip = useCallback(() => {
    cardTranslateX.value = withSpring(-SCREEN_WIDTH, SPRINGS.responsive, (finished) => {
      if (finished) {
        runOnJS(onSkip)(stop.id);
      }
    });
    cardOpacity.value = withTiming(0, { duration: TIMING.fast });
  }, [stop.id, onSkip]);

  return (
    <Animated.View style={[styles.container, cardAnimatedStyle]}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        {hasImage ? (
          <Image
            source={localArt || { uri: coaster?.imageUrl }}
            style={[
              styles.heroImage,
              { top: -focalY * 40 },
            ]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons
              name={isBreak ? 'cafe-outline' : 'flash-outline'}
              size={48}
              color={colors.text.meta}
            />
          </View>
        )}

        {/* Gradient overlay for text legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.03)', 'rgba(255,255,255,0.9)', colors.background.card]}
          locations={[0, 0.4, 0.75, 1]}
          style={styles.heroGradient}
        />

        {/* State badge */}
        <View style={styles.stateBadge}>
          <Text style={styles.stateBadgeText}>
            {isBreak ? 'BREAK' : isWalking ? 'WALKING TO' : 'IN LINE'}
          </Text>
        </View>
      </View>

      {/* Ride Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.rideName} numberOfLines={2}>{stop.name}</Text>
        {areaLabel.length > 0 && (
          <Text style={styles.areaLabel}>{areaLabel}</Text>
        )}

        {/* Info chips */}
        {!isBreak && (
          <View style={styles.chipRow}>
            {stop.estimatedWalkMin > 0 && (
              <View style={styles.chip}>
                <Ionicons name="walk-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.chipText}>~{Math.round(stop.estimatedWalkMin)} min</Text>
              </View>
            )}
            {stop.estimatedWaitMin > 0 && (
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.chipText}>~{Math.round(stop.estimatedWaitMin)} min wait</Text>
              </View>
            )}
          </View>
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
          {isBreak && stop.walkStartedAt && (
            <TripTimer
              startTime={stop.walkStartedAt}
              mode="countdown"
              durationSec={Math.round((stop.breakDurationMin ?? 10) * 60)}
            />
          )}
          <Text style={styles.timerSubtitle}>
            {isBreak ? 'break time' : isWalking ? 'est. arrival' : 'time in line'}
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

        {/* Action area */}
        <View style={styles.actionArea}>
          {isWalking && !isBreak && (
            <ActionButton label="I'M HERE" onPress={handleArrived} />
          )}
          {isBreak && (
            <ActionButton label="BREAK OVER" onPress={() => onDone(stop.id)} />
          )}
          {isInLine && (
            <>
              <ActionButton label="DONE — NEXT RIDE" onPress={handleDone} variant="success" />
              <Pressable onPress={handleSkip} style={styles.ghostAction}>
                <Text style={styles.ghostActionText}>skip this stop</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Celebration overlay */}
      {showCelebration && (
        <CelebrationToast
          stop={stop}
          creditNumber={coasterId ? getCreditCount() : undefined}
          onDismiss={handleCelebrationDismiss}
        />
      )}
    </Animated.View>
  );
}

export const NextMoveCard = memo(NextMoveCardInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroContainer: {
    height: '45%',
    minHeight: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '130%',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  heroPlaceholder: {
    flex: 1,
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  stateBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  stateBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    letterSpacing: 1.5,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  rideName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
  },
  areaLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
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
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  estimateText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginBottom: spacing.lg,
  },
  actionArea: {
    width: '100%',
    marginTop: 'auto',
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
