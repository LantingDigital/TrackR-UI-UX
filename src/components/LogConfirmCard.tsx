/**
 * LogConfirmCard — Full-screen log confirmation overlay
 *
 * Blur overlay that sits below the LOG header and MorphingPill (z-index 150)
 * but above all other content. Centered card with rich coaster data,
 * multi-phase celebration, countdown timer, and smooth entry/exit.
 *
 * Animation sequence after "Log It":
 * 1. Button fades + space opens (simultaneous, 300ms)
 * 2. Green checkmark pops up smoothly (no bouncing)
 * 3. "Logged!" text fades in
 * 4. Holds for ~1s
 * 5. Checkmark fades + space grows to nudge height
 * 6. Rate nudge fades in with countdown from 5
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';
import { SPRINGS } from '../constants/animations';
import { COASTER_BY_ID } from '../data/coasterIndex';
import { COASTER_DETAILS } from '../data/coasterDetails';
import { CARD_ART, CARD_ART_FOCAL } from '../data/cardArt';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const IMAGE_HEIGHT = 220;

// Mini stat card size — matches CoasterSheet secondary cards
const STAT_CARD_SIZE = Math.floor((CARD_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 4);

// Action area heights for celebration/nudge phases
const ACTION_HEIGHT_CELEBRATION = 100;
const ACTION_HEIGHT_NUDGE = 145;

interface LogConfirmCardProps {
  coasterName: string;
  parkName: string;
  coasterId: string;
  rideNumber: number;
  imageUrl?: string;
  onConfirm: () => void;
  onRate: () => void;
  onDismiss: () => void;
  onExitStart?: () => void;
  visible: boolean;
}

type Phase = 'confirm' | 'celebrating' | 'rate-nudge';

export const LogConfirmCard: React.FC<LogConfirmCardProps> = ({
  coasterName,
  parkName,
  coasterId,
  rideNumber,
  imageUrl,
  onConfirm,
  onRate,
  onDismiss,
  onExitStart,
  visible,
}) => {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('confirm');
  const [countdown, setCountdown] = useState(5);
  const [confirmed, setConfirmed] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Rich coaster data
  const coasterData = COASTER_BY_ID[coasterId];
  const details = COASTER_DETAILS[coasterId];
  const localArt = CARD_ART[coasterId];
  const resolvedImage = localArt || imageUrl || coasterData?.imageUrl;

  // Stats — value+unit on one line, label on second (matches CoasterSheet mini cards)
  const stats = useMemo(() => {
    if (!coasterData) return [];
    const result: { label: string; display: string }[] = [];
    if (coasterData.heightFt > 0) result.push({ label: 'Height', display: `${coasterData.heightFt}ft` });
    if (coasterData.speedMph > 0) result.push({ label: 'Speed', display: `${coasterData.speedMph}mph` });
    if (coasterData.inversions > 0) result.push({ label: 'Inversions', display: `${coasterData.inversions}` });
    if (coasterData.lengthFt > 0) result.push({ label: 'Length', display: `${coasterData.lengthFt.toLocaleString()}ft` });
    return result.slice(0, 4);
  }, [coasterId]);

  const focalY = CARD_ART_FOCAL[coasterId] ?? 0.5;

  // Manufacturer · Material · Year
  const metaLine = useMemo(() => {
    if (!coasterData) return '';
    const parts: string[] = [];
    if (coasterData.manufacturer) parts.push(coasterData.manufacturer);
    if (coasterData.material) {
      parts.push(coasterData.material.charAt(0).toUpperCase() + coasterData.material.slice(1));
    }
    if (coasterData.yearOpened > 0) parts.push(String(coasterData.yearOpened));
    return parts.join(' \u00B7 ');
  }, [coasterId]);

  // ── Animation shared values ──
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(1);
  const buttonPressScale = useSharedValue(1);
  const actionHeight = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const loggedTextOpacity = useSharedValue(0);
  const nudgeOpacity = useSharedValue(0);

  // ── Timer helpers ──
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const addTimer = useCallback((cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  // ── Mount/unmount ──
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setPhase('confirm');
      setConfirmed(false);
      setCountdown(5);

      // Reset all animation values
      buttonOpacity.value = 1;
      buttonPressScale.value = 1;
      actionHeight.value = 0;
      checkScale.value = 0;
      checkOpacity.value = 0;
      loggedTextOpacity.value = 0;
      nudgeOpacity.value = 0;

      // Entrance
      backdropOpacity.value = withTiming(1, { duration: 250 });
      cardScale.value = withSpring(1, SPRINGS.responsive);
      cardOpacity.value = withTiming(1, { duration: 200 });
    } else {
      clearTimers();
    }
  }, [visible]);

  // ── Countdown timer ──
  useEffect(() => {
    if (phase === 'rate-nudge') {
      setCountdown(5);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            animateOut(onDismiss);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [phase]);

  // ── Animate out ──
  const animateOut = useCallback((cb: () => void) => {
    clearTimers();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.92, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(cb)();
    });
  }, [clearTimers]);

  // ── Handle confirm (multi-phase celebration) ──
  const handleConfirm = useCallback(() => {
    if (confirmed) return;
    setConfirmed(true);
    haptics.success();
    onConfirm();

    // Phase 1: Button fades + space opens SIMULTANEOUSLY
    buttonOpacity.value = withTiming(0, { duration: 250 });
    actionHeight.value = withTiming(ACTION_HEIGHT_CELEBRATION, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });

    // Phase 2: Switch to celebrating phase (button already fading)
    addTimer(() => {
      setPhase('celebrating');
    }, 200);

    // Phase 3: Checkmark appears — smooth, no bouncing
    // Clear search query now so LogModal crossfades behind the blur
    addTimer(() => {
      onExitStart?.();
      checkScale.value = withSequence(
        withTiming(1.05, { duration: 250, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
      );
      checkOpacity.value = withTiming(1, { duration: 250 });
      loggedTextOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
    }, 350);

    // Phase 4: After hold, checkmark fades out
    addTimer(() => {
      checkOpacity.value = withTiming(0, { duration: 250 });
      checkScale.value = withTiming(0.9, { duration: 250, easing: Easing.in(Easing.cubic) });
      loggedTextOpacity.value = withTiming(0, { duration: 200 });
    }, 1600);

    // Phase 5: Space GROWS to accommodate nudge (larger than celebration)
    addTimer(() => {
      actionHeight.value = withTiming(ACTION_HEIGHT_NUDGE, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }, 1900);

    // Phase 6: Rate nudge fades in
    addTimer(() => {
      setPhase('rate-nudge');
      nudgeOpacity.value = withTiming(1, { duration: 300 });
    }, 2200);
  }, [onConfirm, confirmed]);

  // ── Handle rate ──
  const handleRate = useCallback(() => {
    haptics.select();
    clearTimers();
    animateOut(() => {
      setMounted(false);
      onRate();
    });
  }, [onRate, animateOut, clearTimers]);

  // ── Handle dismiss ──
  const handleDismiss = useCallback(() => {
    haptics.tap();
    animateOut(() => {
      setMounted(false);
      onDismiss();
    });
  }, [onDismiss, animateOut]);

  // ── Animated styles ──
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonPressScale.value }],
  }));

  const actionAreaAnimStyle = useAnimatedStyle(() => ({
    height: actionHeight.value,
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const loggedTextAnimStyle = useAnimatedStyle(() => ({
    opacity: loggedTextOpacity.value,
  }));

  const nudgeAnimStyle = useAnimatedStyle(() => ({
    opacity: nudgeOpacity.value,
  }));

  if (!mounted && !visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible || mounted ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={phase === 'confirm' ? handleDismiss : undefined}
        >
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {/* Centered card */}
      <View style={lcStyles.cardContainer} pointerEvents="box-none">
        <Animated.View style={[lcStyles.card, cardAnimStyle]}>
          {/* Close button — solid white with shadow */}
          <Pressable style={lcStyles.closeButton} onPress={handleDismiss} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.text.secondary} />
          </Pressable>

          {/* Coaster Image — taller with focal point for card art */}
          {resolvedImage ? (
            <View style={lcStyles.imageWrapper}>
              <Image
                source={typeof resolvedImage === 'string' ? { uri: resolvedImage } : resolvedImage}
                style={[
                  lcStyles.imageFill,
                  localArt ? {
                    height: IMAGE_HEIGHT * 1.2,
                    position: 'absolute' as const,
                    top: -focalY * (IMAGE_HEIGHT * 0.2),
                  } : undefined,
                ]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[lcStyles.imageWrapper, lcStyles.imagePlaceholder]}>
              <Ionicons
                name={coasterData?.material === 'wood' ? 'leaf-outline' : 'flash-outline'}
                size={36}
                color={colors.text.meta}
              />
            </View>
          )}

          {/* Coaster name + park */}
          <Text style={lcStyles.name} numberOfLines={2}>
            {coasterName}
          </Text>
          <Text style={lcStyles.park} numberOfLines={1}>
            {parkName}
          </Text>

          {/* Stats — mini square cards */}
          {stats.length > 0 && (
            <View style={lcStyles.statsRow}>
              {stats.map((stat, i) => (
                <View key={i} style={lcStyles.statCard}>
                  <Text
                    style={lcStyles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                  >
                    {stat.display}
                  </Text>
                  <Text
                    style={lcStyles.statLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta line (Manufacturer · Material · Year) */}
          {metaLine.length > 0 && (
            <Text style={lcStyles.metaLine}>{metaLine}</Text>
          )}

          {/* Description preview (for top-200 coasters) */}
          {details?.description && (
            <Text style={lcStyles.description} numberOfLines={3}>
              {details.description}
            </Text>
          )}

          {/* Ride count badge */}
          {rideNumber > 1 && phase === 'confirm' && (
            <View style={lcStyles.rideBadge}>
              <Ionicons name="repeat" size={14} color={colors.accent.primary} />
              <Text style={lcStyles.rideBadgeText}>Ride #{rideNumber} today</Text>
            </View>
          )}

          {/* Log It button — rendered outside action area so shadow isn't clipped */}
          {phase === 'confirm' && (
            <Animated.View style={[lcStyles.buttonWrapper, buttonAnimStyle]}>
              <Pressable
                style={lcStyles.logButton}
                onPressIn={() => {
                  buttonPressScale.value = withTiming(0.96, { duration: 100 });
                }}
                onPressOut={() => {
                  buttonPressScale.value = withTiming(1, { duration: 150 });
                }}
                onPress={handleConfirm}
              >
                <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={lcStyles.logButtonText}>Log It</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Action area — animated height for celebration/nudge (overflow:hidden) */}
          {phase !== 'confirm' && (
            <Animated.View style={[lcStyles.actionArea, actionAreaAnimStyle]}>
              {/* Celebration (checkmark + logged text) */}
              {phase === 'celebrating' && (
                <View style={lcStyles.celebrationContainer}>
                  <Animated.View style={[lcStyles.checkCircle, checkAnimStyle]}>
                    <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                  </Animated.View>
                  <Animated.View style={loggedTextAnimStyle}>
                    <Text style={lcStyles.loggedText}>Logged!</Text>
                  </Animated.View>
                </View>
              )}

              {/* Rate nudge with countdown */}
              {phase === 'rate-nudge' && (
                <Animated.View style={[{ flex: 1, justifyContent: 'space-evenly' }, nudgeAnimStyle]}>
                  <View style={lcStyles.nudgeCheckRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={lcStyles.nudgeLoggedText}>Ride logged</Text>
                  </View>
                  <Pressable style={lcStyles.rateButton} onPress={handleRate}>
                    <Ionicons
                      name="star"
                      size={16}
                      color={colors.accent.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={lcStyles.rateButtonText}>Rate this ride</Text>
                  </Pressable>
                  <Pressable onPress={handleDismiss}>
                    <Text style={lcStyles.skipText}>Maybe later ({countdown})</Text>
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const lcStyles = StyleSheet.create({
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.modal,
    padding: spacing.lg,
    ...shadows.modal,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    // Neutral shadow matching app standard
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: radius.md,
    marginBottom: spacing.base,
    backgroundColor: colors.background.imagePlaceholder,
    overflow: 'hidden',
  },
  imageFill: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 30,
    paddingRight: 40,
  },
  park: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.base,
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'visible',
  },
  statCard: {
    width: STAT_CARD_SIZE,
    height: STAT_CARD_SIZE,
    backgroundColor: colors.background.page,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    gap: 2,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    width: '100%',
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  statLabel: {
    width: '100%',
    fontSize: typography.sizes.small,
    lineHeight: typography.sizes.small,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  metaLine: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.base,
  },
  description: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: spacing.base,
  },
  rideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginTop: spacing.base,
    gap: 4,
  },
  rideBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // Button lives outside the overflow:hidden action area so shadow renders freely
  buttonWrapper: {
    marginTop: spacing.lg,
  },
  // Action area — overflow:hidden for celebration/nudge height transitions
  actionArea: {
    overflow: 'hidden',
  },
  logButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Standard neutral shadow — NOT accent-colored
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  logButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Celebration
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  loggedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: spacing.sm,
  },

  // Rate nudge
  nudgeCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeLoggedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  skipText: {
    fontSize: 14,
    color: colors.text.meta,
    textAlign: 'center',
  },
});
