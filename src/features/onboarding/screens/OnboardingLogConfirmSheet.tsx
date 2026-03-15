/**
 * OnboardingLogConfirmSheet
 *
 * A stripped copy of LogConfirmSheet (src/components/LogConfirmSheet.tsx)
 * for use in the onboarding demo. Identical layout, animations, and styles.
 *
 * Stripped:
 *  - useTabBar() replaced with no-ops (onboarding has no tab bar)
 *  - addQuickLog / ride log store imports (demo doesn't actually log rides)
 *  - RatingSheet integration (rating is a separate onboarding step)
 *  - Navigation calls
 *  - Rate nudge (countdown timer, "Rate this ride" button, "Maybe later")
 *  - Pager / Page 2 ("Ride Info") — single page with card art only
 *
 * Kept:
 *  - Entrance animation (staggered content reveal)
 *  - Card art hero image (CARD_ART)
 *  - Stats display (hero stat cards)
 *  - Header (coaster name, park, meta)
 *  - "Log It" button
 *  - Celebration animation (checkmark pop + "Logged!" text + confetti)
 *  - Dismiss/close animation
 *  - BlurView backdrop
 *  - Gesture-based dismiss (GestureDetector)
 *  - All spring configs and timing
 *
 * Added:
 *  - triggerLog() via imperative ref (for demo automation)
 *  - onLogComplete callback (fires after celebration finishes)
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { typography } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { COASTER_BY_ID } from '../../../data/coasterIndex';
import { CARD_ART, CARD_ART_FOCAL } from '../../../data/cardArt';
import ConfettiBurst from '../../../components/feedback/ConfettiBurst';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

// ── Layout constants ──
const HANDLE_AREA = 33;
const IMAGE_MARGIN = 12;
const STATS_MARGIN = 12;
const ACTION_MARGIN = 12;

// How far content lifts (translateY) — single lift for celebration
const LIFT_AMOUNT = -80;

// Mini stat card size — 4 across within sheet padding
const STAT_CARD_SIZE = Math.floor((SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 3) / 4);

// ============================================
// Props & Ref
// ============================================

export interface OnboardingLogConfirmSheetRef {
  /** Programmatically triggers the "Log It" button action (for demo automation) */
  triggerLog: () => void;
}

interface OnboardingLogConfirmSheetProps {
  coaster: { id: string; name: string; parkName: string };
  visible: boolean;
  onClose: () => void;
  /** Fires after celebration finishes (checkmark + "Logged!" sequence complete) */
  onLogComplete?: () => void;
}

// ============================================
// OnboardingLogConfirmSheet
// ============================================

export const OnboardingLogConfirmSheet = forwardRef<OnboardingLogConfirmSheetRef, OnboardingLogConfirmSheetProps>(
  function OnboardingLogConfirmSheet({ coaster, visible, onClose, onLogComplete }, ref) {
    const insets = useSafeAreaInsets();

    const [mounted, setMounted] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [measuredImageH, setMeasuredImageH] = useState(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // ── Data ──
    const coasterData = COASTER_BY_ID[coaster.id];
    const localArt = CARD_ART[coaster.id];
    const focalY = CARD_ART_FOCAL[coaster.id] ?? 0.5;
    const resolvedImage = localArt || coasterData?.imageUrl;
    const hasImage = (localArt || resolvedImage) && !imageError;

    const stats = useMemo(() => {
      if (!coasterData) return [];
      const result: { label: string; display: string }[] = [];
      if (coasterData.heightFt > 0) result.push({ label: 'Height', display: `${coasterData.heightFt}ft` });
      if (coasterData.speedMph > 0) result.push({ label: 'Speed', display: `${coasterData.speedMph}mph` });
      if (coasterData.inversions > 0) result.push({ label: 'Inversions', display: `${coasterData.inversions}` });
      if (coasterData.lengthFt > 0) result.push({ label: 'Length', display: `${coasterData.lengthFt.toLocaleString()}ft` });
      return result.slice(0, 4);
    }, [coaster.id]);

    const metaLine = useMemo(() => {
      if (!coasterData) return '';
      const parts: string[] = [];
      if (coasterData.manufacturer) parts.push(coasterData.manufacturer);
      if (coasterData.material) {
        parts.push(coasterData.material.charAt(0).toUpperCase() + coasterData.material.slice(1));
      }
      if (coasterData.yearOpened > 0) parts.push(String(coasterData.yearOpened));
      return parts.join(' \u00B7 ');
    }, [coaster.id]);

    // ── Sheet geometry ──
    const sheetTop = insets.top + 16;
    const sheetHeight = SCREEN_HEIGHT - sheetTop;

    // ── Animation shared values ──
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const entrance = useSharedValue(0);
    const imageOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(1);
    const buttonPressScale = useSharedValue(1);
    const checkScale = useSharedValue(0);
    const checkOpacity = useSharedValue(0);
    const loggedTextOpacity = useSharedValue(0);
    const confettiProgress = useSharedValue(0);
    const celebSlideY = useSharedValue(30);
    const liftY = useSharedValue(0);

    // ── Timer helpers ──
    const clearTimers = useCallback(() => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
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
        setConfirmed(false);
        setImageError(false);
        setImageLoaded(false);
        imageOpacity.value = 0;

        // Reset celebration values
        buttonOpacity.value = 1;
        buttonPressScale.value = 1;
        checkScale.value = 0;
        checkOpacity.value = 0;
        loggedTextOpacity.value = 0;
        confettiProgress.value = 0;
        celebSlideY.value = 30;
        liftY.value = 0;

        haptics.select();

        // Entrance
        entrance.value = 0;
        translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
        backdropOpacity.value = withTiming(1, { duration: 300 });
        entrance.value = withTiming(1, { duration: 400 });
      } else {
        clearTimers();
        entrance.value = 0;
        backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
        const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    // ── Dismiss ──
    const dismiss = useCallback(() => {
      clearTimers();
      entrance.value = 0;
      translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onClose)();
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }, [onClose, sheetHeight, clearTimers]);

    // ── Handle confirm (multi-phase celebration — no rate nudge) ──
    const handleConfirm = useCallback(() => {
      if (confirmed) return;
      setConfirmed(true);
      haptics.success();

      // Phase 1: Button fades + content lifts up smoothly
      buttonOpacity.value = withTiming(0, { duration: 250 });
      liftY.value = withTiming(LIFT_AMOUNT, { duration: 350, easing: Easing.out(Easing.cubic) });

      // Phase 2: Celebration appears in the opened space
      addTimer(() => {
        celebSlideY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
        checkScale.value = withSequence(
          withTiming(1.05, { duration: 250, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
        );
        checkOpacity.value = withTiming(1, { duration: 250 });
        loggedTextOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));

        // Fire confetti
        confettiProgress.value = 0;
        confettiProgress.value = withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        });
      }, 300);

      // Phase 3: Hold celebration, then fire onLogComplete
      addTimer(() => {
        onLogComplete?.();
      }, 2000);
    }, [confirmed, onLogComplete]);

    // ── Expose triggerLog via ref ──
    useImperativeHandle(ref, () => ({
      triggerLog: () => {
        handleConfirm();
      },
    }));

    // ── Pan gesture dismiss (only before confirmed) ──
    const panGesture = Gesture.Pan()
      .enabled(visible && !confirmed)
      .onUpdate((e) => {
        'worklet';
        translateY.value = Math.max(0, e.translationY);
        backdropOpacity.value = interpolate(
          translateY.value,
          [0, sheetHeight * 0.4],
          [1, 0],
          Extrapolation.CLAMP,
        );
      })
      .onEnd((e) => {
        'worklet';
        if (
          translateY.value > sheetHeight * 0.25 ||
          e.velocityY > DISMISS_VELOCITY
        ) {
          translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
            if (finished) runOnJS(onClose)();
          });
          backdropOpacity.value = withTiming(0, { duration: 250 });
        } else {
          translateY.value = withSpring(0, SPRINGS.responsive);
          backdropOpacity.value = withSpring(1);
        }
      });

    // ── Animated styles ──
    const backdropAnimStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const imageFadeStyle = useAnimatedStyle(() => ({
      opacity: imageOpacity.value,
    }));

    const headerStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0, 0.15], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(entrance.value, [0, 0.15], [12, 0], Extrapolation.CLAMP) }],
    }));

    const imageEntranceStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0.05, 0.25], [0, 1], Extrapolation.CLAMP),
      transform: [{
        translateY: interpolate(entrance.value, [0.05, 0.25], [16, 0], Extrapolation.CLAMP) + liftY.value,
      }],
    }));

    const statsStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0.15, 0.35], [0, 1], Extrapolation.CLAMP),
      transform: [{
        translateY: interpolate(entrance.value, [0.15, 0.35], [16, 0], Extrapolation.CLAMP) + liftY.value,
      }],
    }));

    const actionStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0.25, 0.45], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(entrance.value, [0.25, 0.45], [16, 0], Extrapolation.CLAMP) + liftY.value }],
    }));

    const buttonAnimStyle = useAnimatedStyle(() => ({
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonPressScale.value }],
    }));

    const checkAnimStyle = useAnimatedStyle(() => ({
      opacity: checkOpacity.value,
      transform: [{ scale: checkScale.value }],
    }));

    const loggedTextAnimStyle = useAnimatedStyle(() => ({
      opacity: loggedTextOpacity.value,
    }));

    const celebSlideStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: celebSlideY.value }],
    }));

    if (!mounted && !visible) return null;

    return (
      <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
        {/* Blur backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
          <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={!confirmed ? () => { haptics.tap(); dismiss(); } : undefined}
            />
          </BlurView>
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.container,
            { top: sheetTop, height: sheetHeight },
            sheetStyle,
          ]}
        >
          {/* Drag handle */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.handleArea}>
              <View style={styles.handle} />
            </Animated.View>
          </GestureDetector>

          {/* Close button */}
          <Pressable
            onPress={() => { haptics.tap(); dismiss(); }}
            style={styles.closeBtn}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>

          {/* Content */}
          <View style={[styles.content, { paddingBottom: insets.bottom + 8 }]}>
            {/* Header */}
            <Animated.View style={headerStyle}>
              <Text style={styles.name} numberOfLines={2}>{coaster.name}</Text>
              <Text style={styles.park} numberOfLines={1}>{coaster.parkName}</Text>
              {metaLine.length > 0 && (
                <Text style={styles.metaLine} numberOfLines={1}>{metaLine}</Text>
              )}
            </Animated.View>

            {/* Hero Image — flex fills remaining space, single page (no pager) */}
            <Animated.View
              style={[styles.imageSection, imageEntranceStyle]}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setMeasuredImageH(h);
              }}
            >
              {hasImage ? (
                <View style={styles.imageCard}>
                  {!imageLoaded && (
                    <View style={styles.imageSpinner}>
                      <ActivityIndicator size="small" color={colors.text.meta} />
                    </View>
                  )}
                  <Animated.View style={[imageFadeStyle, { flex: 1, overflow: 'hidden' }]}>
                    <Image
                      source={localArt || (typeof resolvedImage === 'string' ? { uri: resolvedImage } : resolvedImage)}
                      style={[
                        { width: '100%', height: '100%' },
                        localArt && measuredImageH > 0 ? {
                          height: measuredImageH * 1.2,
                          position: 'absolute' as const,
                          top: -focalY * (measuredImageH * 0.2),
                        } : undefined,
                      ]}
                      resizeMode="cover"
                      onLoad={() => {
                        setImageLoaded(true);
                        imageOpacity.value = withTiming(1, { duration: 300 });
                      }}
                      onError={() => setImageError(true)}
                    />
                  </Animated.View>
                </View>
              ) : (
                <View style={[styles.imageCard, styles.imagePlaceholder]}>
                  <Ionicons
                    name={coasterData?.material === 'wood' ? 'leaf-outline' : 'flash-outline'}
                    size={48}
                    color={colors.text.meta}
                  />
                </View>
              )}
            </Animated.View>

            {/* Stats */}
            {stats.length > 0 && (
              <Animated.View style={[{ marginTop: STATS_MARGIN }, statsStyle]}>
                <View style={styles.statsRow}>
                  {stats.map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                      <Text
                        style={styles.statValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        {stat.display}
                      </Text>
                      <Text
                        style={styles.statLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Action Area — button lifts with content, celebration stays anchored */}
            <Animated.View style={[styles.actionArea, actionStyle]}>
              <Animated.View style={buttonAnimStyle} pointerEvents={!confirmed ? 'auto' : 'none'}>
                <Pressable
                  style={styles.logButton}
                  onPressIn={() => { buttonPressScale.value = withTiming(0.96, { duration: 100 }); }}
                  onPressOut={() => { buttonPressScale.value = withTiming(1, { duration: 150 }); }}
                  onPress={handleConfirm}
                >
                  <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.logButtonText}>Log It</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

            {/* Celebration — pinned to bottom of sheet, doesn't lift */}
            <View style={styles.bottomAnchor} pointerEvents="box-none">
              <Animated.View style={[styles.celebrationContainer, celebSlideStyle]} pointerEvents="none">
                <ConfettiBurst progress={confettiProgress} />
                <Animated.View style={[styles.checkCircle, checkAnimStyle]}>
                  <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                </Animated.View>
                <Animated.View style={loggedTextAnimStyle}>
                  <Text style={styles.loggedText}>Logged!</Text>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  },
);

// ============================================
// Styles (matches LogConfirmSheet exactly)
// ============================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    overflow: 'hidden',
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // -- Header --
  name: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    paddingRight: 40,
  },
  park: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  metaLine: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },

  // -- Image --
  imageSection: {
    flex: 1,
    marginTop: IMAGE_MARGIN,
  },
  imageCard: {
    flex: 1,
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.background.imagePlaceholder,
    overflow: 'hidden',
  },
  imageSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Stats --
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'visible',
  },
  statCard: (() => {
    const size = STAT_CARD_SIZE;
    return {
      width: size,
      height: size,
      backgroundColor: colors.background.card,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
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
    };
  })(),
  statValue: {
    width: '100%',
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statLabel: {
    width: '100%',
    fontSize: typography.sizes.small,
    lineHeight: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  // -- Action Area --
  actionArea: {
    marginTop: ACTION_MARGIN,
  },
  logButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

  // -- Bottom anchor for celebration (stays in place while content lifts) --
  bottomAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Math.abs(LIFT_AMOUNT) + 64,
  },

  // -- Celebration -- centered in the full empty space, nudged up
  celebrationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
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
});
