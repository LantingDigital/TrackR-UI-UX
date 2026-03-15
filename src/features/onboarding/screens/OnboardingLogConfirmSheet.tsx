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
 *  - Rate nudge (optional, controlled by showRateNudge prop)
 *
 * Added:
 *  - triggerLog() via imperative ref (for demo automation)
 *  - triggerRate() via imperative ref (for demo automation)
 *  - onLogComplete callback (fires after celebration finishes)
 *  - showRateNudge prop (boolean) — shows "Rate this ride?" nudge after celebration
 *  - onRate callback — fires when "Rate this ride" is tapped (or triggered via ref)
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
  useAnimatedScrollHandler,
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
  ScrollView as GHScrollView,
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
import { COASTER_DETAILS } from '../../../data/coasterDetails';
import ConfettiBurst from '../../../components/feedback/ConfettiBurst';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

// ── Layout constants ──
const HANDLE_AREA = 33;
const IMAGE_MARGIN = 12;
const STATS_MARGIN = 12;
const ACTION_MARGIN = 10;

// How far content lifts (translateY) — single lift for celebration
const LIFT_AMOUNT = -60;

// Mini stat card size — 4 across within sheet padding (compact for onboarding)
const STAT_CARD_SIZE = Math.floor((SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 3) / 4) - 4;

// ============================================
// Props & Ref
// ============================================

export interface OnboardingLogConfirmSheetRef {
  /** Programmatically triggers the "Log It" button action (for demo automation) */
  triggerLog: () => void;
  /** Programmatically scrolls the pager to page 2 (for demo automation) */
  scrollToPage2: () => void;
  /** Programmatically scrolls the pager back to page 1 (for demo automation) */
  scrollToPage1: () => void;
  /** Programmatically triggers the "Rate this ride" action (for demo automation) */
  triggerRate: () => void;
}

interface OnboardingLogConfirmSheetProps {
  coaster: { id: string; name: string; parkName: string; description?: string };
  visible: boolean;
  onClose: () => void;
  /** Fires after celebration finishes (checkmark + "Logged!" sequence complete) */
  onLogComplete?: () => void;
  /** When true, shows the "Rate this ride?" nudge after celebration instead of firing onLogComplete immediately */
  showRateNudge?: boolean;
  /** Fires when "Rate this ride" is tapped or triggered via ref */
  onRate?: () => void;
}

// ============================================
// OnboardingLogConfirmSheet
// ============================================

export const OnboardingLogConfirmSheet = forwardRef<OnboardingLogConfirmSheetRef, OnboardingLogConfirmSheetProps>(
  function OnboardingLogConfirmSheet({ coaster, visible, onClose, onLogComplete, showRateNudge = false, onRate }, ref) {
    const insets = useSafeAreaInsets();

    const [mounted, setMounted] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [showingNudge, setShowingNudge] = useState(false);
    const [nudgeCountdown, setNudgeCountdown] = useState(5);
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [measuredImageH, setMeasuredImageH] = useState(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Pager state ──
    const [measuredPagerW, setMeasuredPagerW] = useState(0);
    const pagerScrollX = useSharedValue(0);
    const pagerWidthSV = useSharedValue(0);
    const pagerRef = useRef<Animated.ScrollView>(null);

    const pagerScrollHandler = useAnimatedScrollHandler({
      onScroll: (e) => {
        pagerScrollX.value = e.contentOffset.x;
      },
    });

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

    // Page 2 secondary stats
    const secondaryStats = useMemo(() => {
      if (!coasterData) return [];
      const items: { label: string; display: string }[] = [];
      if (coasterData.dropFt) items.push({ label: 'Drop', display: `${coasterData.dropFt}ft` });
      if (coasterData.gForce) items.push({ label: 'G-Force', display: `${coasterData.gForce}g` });
      if (coasterData.duration) items.push({ label: 'Duration', display: `${coasterData.duration}s` });
      if (coasterData.yearOpened > 0) items.push({ label: 'Opened', display: `${coasterData.yearOpened}` });
      return items;
    }, [coaster.id]);

    // Page 2 detail items (manufacturer, designer, model, material, type, status)
    const detailItems = useMemo(() => {
      if (!coasterData) return [];
      const items: { label: string; value: string }[] = [];
      if (coasterData.manufacturer) items.push({ label: 'Manufacturer', value: coasterData.manufacturer });
      if (coasterData.designer) items.push({ label: 'Designer', value: coasterData.designer });
      if (coasterData.model) items.push({ label: 'Model', value: coasterData.model });
      if (coasterData.material) items.push({ label: 'Material', value: coasterData.material.charAt(0).toUpperCase() + coasterData.material.slice(1) });
      if (coasterData.type) items.push({ label: 'Type', value: coasterData.type });
      if (coasterData.status) items.push({ label: 'Status', value: coasterData.status });
      return items;
    }, [coaster.id]);

    // Page 2 rich details (description from COASTER_DETAILS, fallback to prop)
    const richDetails = useMemo(() => {
      const details = COASTER_DETAILS[coaster.id];
      if (details) return details;
      // Fallback: use description from coaster prop if available
      if (coaster.description) return { description: coaster.description };
      return null;
    }, [coaster.id, coaster.description]);

    const hasPage2 =
      secondaryStats.length > 0 ||
      detailItems.length > 0 ||
      !!richDetails?.description;

    // ── Sheet geometry ──
    // Use a larger top offset so the sheet doesn't overflow in the scaled onboarding container
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
    const nudgeOpacity = useSharedValue(0);

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
        setShowingNudge(false);
        setNudgeCountdown(5);
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
        nudgeOpacity.value = 0;

        // Clear countdown interval
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }

        // Reset pager to page 1
        pagerScrollX.value = 0;
        pagerRef.current?.scrollTo({ x: 0, animated: false });

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

    // ── Handle confirm (multi-phase celebration, optionally followed by rate nudge) ──
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

      if (showRateNudge) {
        // Phase 3: Checkmark fades out (at 3000ms — 3500ms celebration total)
        addTimer(() => {
          checkOpacity.value = withTiming(0, { duration: 250 });
          checkScale.value = withTiming(0.9, { duration: 250, easing: Easing.in(Easing.cubic) });
          loggedTextOpacity.value = withTiming(0, { duration: 200 });
        }, 3000);

        // Phase 4: Rate nudge fades in (at 3500ms — after celebration finishes)
        addTimer(() => {
          setShowingNudge(true);
          nudgeOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
        }, 3500);
      } else {
        // No rate nudge — fire onLogComplete after celebration
        addTimer(() => {
          onLogComplete?.();
        }, 3500);
      }
    }, [confirmed, onLogComplete, showRateNudge]);

    // ── Countdown timer for rate nudge ──
    useEffect(() => {
      if (showingNudge) {
        setNudgeCountdown(5);
        countdownRef.current = setInterval(() => {
          setNudgeCountdown(prev => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              countdownRef.current = null;
              dismiss();
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
    }, [showingNudge]);

    // ── Handle rate ──
    const handleRate = useCallback(() => {
      haptics.select();
      clearTimers();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      onRate?.();
    }, [onRate, clearTimers]);

    // ── Expose triggerLog + scrollToPage2 + triggerRate via ref ──
    useImperativeHandle(ref, () => ({
      triggerLog: () => {
        handleConfirm();
      },
      scrollToPage2: () => {
        if (measuredPagerW > 0 && pagerRef.current) {
          pagerRef.current.scrollTo({ x: measuredPagerW, animated: true });
        }
      },
      scrollToPage1: () => {
        if (pagerRef.current) {
          pagerRef.current.scrollTo({ x: 0, animated: true });
        }
      },
      triggerRate: () => {
        handleRate();
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

    const nudgeAnimStyle = useAnimatedStyle(() => ({
      opacity: nudgeOpacity.value,
      transform: [{ translateY: interpolate(nudgeOpacity.value, [0, 1], [20, 0], Extrapolation.CLAMP) }],
    }));

    // ── Pager dot styles ──
    const dot1Style = useAnimatedStyle(() => {
      const progress = pagerWidthSV.value > 0
        ? pagerScrollX.value / pagerWidthSV.value
        : 0;
      return {
        opacity: interpolate(progress, [0, 1], [1, 0.3], Extrapolation.CLAMP),
        width: interpolate(progress, [0, 1], [16, 6], Extrapolation.CLAMP),
      };
    });

    const dot2Style = useAnimatedStyle(() => {
      const progress = pagerWidthSV.value > 0
        ? pagerScrollX.value / pagerWidthSV.value
        : 0;
      return {
        opacity: interpolate(progress, [0, 1], [0.3, 1], Extrapolation.CLAMP),
        width: interpolate(progress, [0, 1], [6, 16], Extrapolation.CLAMP),
      };
    });

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
          <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
            {/* Header */}
            <Animated.View style={headerStyle}>
              <Text style={styles.name} numberOfLines={2}>{coaster.name}</Text>
              <Text style={styles.park} numberOfLines={1}>{coaster.parkName}</Text>
              {metaLine.length > 0 && (
                <Text style={styles.metaLine} numberOfLines={1}>{metaLine}</Text>
              )}
            </Animated.View>

            {/* Hero Image / Info Pager — flex fills remaining space */}
            <Animated.View
              style={[styles.imageSection, imageEntranceStyle]}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                const w = e.nativeEvent.layout.width;
                setMeasuredImageH(h);
                setMeasuredPagerW(w);
                pagerWidthSV.value = w;
              }}
            >
              {measuredPagerW > 0 ? (
                <>
                  <Animated.ScrollView
                    ref={pagerRef}
                    horizontal
                    pagingEnabled
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    onScroll={pagerScrollHandler}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                  >
                    {/* ── Page 1: Card Art ── */}
                    <View style={{ width: measuredPagerW, height: '100%' }}>
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
                    </View>

                    {/* ── Page 2: Ride Info ── */}
                    {hasPage2 && (
                      <View style={{ width: measuredPagerW, height: '100%' }}>
                        <View style={styles.page2Card}>
                          <GHScrollView
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.page2Content}
                          >
                            <Text style={styles.p2Header}>Ride Info</Text>

                            {/* Secondary stats */}
                            {secondaryStats.length > 0 && (
                              <View style={styles.p2StatsRow}>
                                {secondaryStats.map((s) => (
                                  <View key={s.label} style={styles.p2StatCard}>
                                    <Text
                                      style={styles.p2StatValue}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit
                                      minimumFontScale={0.5}
                                    >
                                      {s.display}
                                    </Text>
                                    <Text
                                      style={styles.p2StatLabel}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit
                                      minimumFontScale={0.6}
                                    >
                                      {s.label}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Details */}
                            {detailItems.length > 0 && (
                              <View style={styles.p2Section}>
                                <Text style={styles.p2SectionLabel}>DETAILS</Text>
                                <View style={styles.p2DetailsCard}>
                                  {detailItems.map((d, i) => (
                                    <View
                                      key={d.label}
                                      style={[
                                        styles.p2DetailRow,
                                        i < detailItems.length - 1 && styles.p2DetailRowBorder,
                                      ]}
                                    >
                                      <Text style={styles.p2DetailLabel}>{d.label}</Text>
                                      <Text style={styles.p2DetailValue}>{d.value}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}

                            {/* About */}
                            {richDetails?.description && (
                              <View style={styles.p2Section}>
                                <Text style={styles.p2SectionLabel}>ABOUT</Text>
                                <Text style={styles.p2Description}>{richDetails.description}</Text>
                              </View>
                            )}
                          </GHScrollView>
                        </View>
                      </View>
                    )}
                  </Animated.ScrollView>

                  {/* Dot indicators — frosted dark pill */}
                  {hasPage2 && (
                    <View style={styles.dotsOuter}>
                      <View style={styles.dotsPill}>
                        <Animated.View style={[styles.dot, dot1Style]} />
                        <Animated.View style={[styles.dot, dot2Style]} />
                      </View>
                    </View>
                  )}
                </>
              ) : (
                // Placeholder while measuring width
                <View style={[styles.imageCard, styles.imagePlaceholder]} />
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

            {/* Celebration + Rate nudge — pinned to bottom of sheet, doesn't lift */}
            <View style={styles.bottomAnchor} pointerEvents="box-none">
              {/* Celebration — centered in available space */}
              <Animated.View style={[styles.celebrationContainer, celebSlideStyle]} pointerEvents="none">
                <ConfettiBurst progress={confettiProgress} />
                <Animated.View style={[styles.checkCircle, checkAnimStyle]}>
                  <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                </Animated.View>
                <Animated.View style={loggedTextAnimStyle}>
                  <Text style={styles.loggedText}>Logged!</Text>
                </Animated.View>
              </Animated.View>

              {/* Rate nudge — fills from bottom */}
              {showRateNudge && (
                <Animated.View
                  style={[styles.nudgeContainer, nudgeAnimStyle]}
                  pointerEvents={showingNudge ? 'auto' : 'none'}
                >
                  <View style={styles.nudgeCheckRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.nudgeLoggedText}>Ride logged</Text>
                  </View>
                  <Pressable style={styles.rateButton} onPress={handleRate}>
                    <Ionicons name="star" size={16} color={colors.accent.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.rateButtonText}>Rate this ride</Text>
                  </Pressable>
                  <Pressable onPress={() => { haptics.tap(); dismiss(); }}>
                    <Text style={styles.skipText}>Maybe later ({nudgeCountdown})</Text>
                  </Pressable>
                </Animated.View>
              )}
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
  // FIXED height instead of flex:1 — prevents image from pushing stats/button off screen.
  // The sheet is inside a transform-scaled container, so SCREEN_HEIGHT is the unscaled value.
  // Header (~90) + image + stats (~80) + button (~50) + handle (~33) + margins (~40) must fit.
  imageSection: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.50, // tall card art — fills available space above stats
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
    paddingBottom: 16,
  },
  logButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // -- Bottom anchor for celebration (stays in place while content lifts) --
  // Covers the bottom half of the sheet so celebration + nudge center properly
  // in the visible space below the lifted content
  bottomAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '65%', // starts below where stats end after lift — centers in the revealed gap
    justifyContent: 'center',
    alignItems: 'center',
  },

  // -- Celebration -- centered vertically within bottomAnchor
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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

  // -- Rate nudge -- centered in the available space
  nudgeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
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

  // -- Pager dots (frosted dark pill) --
  dotsOuter: {
    position: 'absolute',
    bottom: spacing.base,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // -- Page 2 --
  page2Card: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
  },
  page2Content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  p2Header: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },
  p2StatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  p2StatCard: (() => {
    const size = Math.floor((SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 3) / 4) - 4;
    return {
      width: size,
      height: size,
      backgroundColor: colors.background.page,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      gap: 2,
    };
  })(),
  p2StatValue: {
    width: '100%',
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  p2StatLabel: {
    width: '100%',
    fontSize: typography.sizes.small,
    lineHeight: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  p2Section: {
    marginTop: spacing.xl,
  },
  p2SectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.base,
  },
  p2DetailsCard: {
    backgroundColor: colors.background.page,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  p2DetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  p2DetailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  p2DetailLabel: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  p2DetailValue: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.lg,
  },
  p2Description: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * 1.6,
  },
});
