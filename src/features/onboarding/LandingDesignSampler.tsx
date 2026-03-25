import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { haptics } from '../../services/haptics';
import { Player } from 'expo-ahap';
import { OnboardingCardLanding } from './screens/OnboardingCardLanding';
import { OnboardingSearch } from './screens/OnboardingSearch';
import { OnboardingLog } from './screens/OnboardingLog';
import { OnboardingScan } from './screens/OnboardingScan';
import { OnboardingRate } from './screens/OnboardingRate';
import { OnboardingParks } from './screens/OnboardingParks';
import { OnboardingRankings } from './screens/OnboardingRankings';
import { OnboardingCommunity } from './screens/OnboardingCommunity';
import { OnboardingAuthSection } from './screens/OnboardingAuthSection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Radial color pulse per screen ──
// Null = no pulse (first screen). Colors are the "full" rgb — opacity is
// built up by layering 3 concentric circles for a soft radial gradient feel.
const SCREEN_PULSE_COLORS: (string | null)[] = [
  null,                        // Card Landing — entry, no pulse
  'rgb(207, 103, 105)',        // Search — coral (app accent)
  'rgb(100, 140, 210)',        // Log — soft blue
  'rgb(90, 175, 130)',         // Scan — sage green
  'rgb(210, 175, 70)',         // Rate — warm gold
  'rgb(70, 160, 140)',         // Parks — teal
  'rgb(150, 100, 200)',        // Rankings — deep purple
  'rgb(220, 150, 60)',         // Community — warm amber
  'rgb(207, 103, 105)',        // Auth — coral (app accent, bookend with Search)
];

// Circle must cover the full screen diagonal
const PULSE_SIZE = Math.ceil(Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2)) + 40;

// ── Core Haptics "Siri Whoosh" — transient hit + deep sustained buzz, 380ms ──
const WHOOSH_PLAYER = Platform.OS === 'ios' ? new Player({ Pattern: [
  { Event: { Time: 0.0, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.8 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.4 },
  ]}},
  { Event: { Time: 0.03, EventType: 'HapticContinuous', EventDuration: 0.38, EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.7 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.2 },
  ]}},
  { ParameterCurve: { ParameterID: 'HapticIntensityControl', Time: 0.03, ParameterCurveControlPoints: [
    { Time: 0, ParameterValue: 0.4 }, { Time: 0.08, ParameterValue: 1.0 },
    { Time: 0.22, ParameterValue: 0.9 }, { Time: 0.38, ParameterValue: 0.15 },
  ]}},
  { ParameterCurve: { ParameterID: 'HapticSharpnessControl', Time: 0.03, ParameterCurveControlPoints: [
    { Time: 0, ParameterValue: -0.4 }, { Time: 0.12, ParameterValue: 0.1 }, { Time: 0.38, ParameterValue: -0.2 },
  ]}},
]}) : null;

interface ScreenDef {
  name: string;
  Component: React.FC<{ isActive: boolean }>;
  isAuth?: boolean;
}

const SHOWCASE_SCREENS: ScreenDef[] = [
  { name: 'Card Art Landing', Component: OnboardingCardLanding },
  { name: 'Search', Component: OnboardingSearch },
  { name: 'Log', Component: OnboardingLog },
  { name: 'Scan', Component: OnboardingScan },
  { name: 'Rate', Component: OnboardingRate },
  { name: 'Parks', Component: OnboardingParks },
  { name: 'Rankings', Component: OnboardingRankings },
  { name: 'Community', Component: OnboardingCommunity },
];

// Auth is always appended last — a placeholder in the data array.
// The actual OnboardingAuthSection is rendered specially in renderItem.
const AUTH_SCREEN: ScreenDef = {
  name: 'Auth',
  Component: () => null, // Placeholder — real component rendered in renderItem
  isAuth: true,
};

const SCREENS: ScreenDef[] = [...SHOWCASE_SCREENS, AUTH_SCREEN];
const AUTH_INDEX = SCREENS.length - 1;

interface LandingDesignSamplerProps {
  /** Called when auth succeeds. needsEmailVerification = true for email sign-up. */
  onDismiss: (needsEmailVerification: boolean) => void;
  /** Called when user taps "Browse without an account" — separate from auth success */
  onBrowseWithoutAccount?: () => void;
}

export const LandingDesignSampler: React.FC<LandingDesignSamplerProps> = ({ onDismiss, onBrowseWithoutAccount }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeIndexRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const isFirstRender = useRef(true);

  // ── Scroll position tracking for overlay fade ──
  const scrollY = useSharedValue(0);

  // ── Radial pulse ──
  const pulseScale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const [pulseColor, setPulseColor] = React.useState<string | null>(null);

  useEffect(() => {
    // Don't pulse on initial mount
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    const color = SCREEN_PULSE_COLORS[activeIndex] ?? null;
    if (!color) return;

    setPulseColor(color);
    pulseScale.value = 0;
    pulseOpacity.value = 1;
    pulseScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    pulseOpacity.value = withDelay(80, withTiming(0, { duration: 620, easing: Easing.in(Easing.ease) }));

    // Core Haptics whoosh (iOS) or fallback (Android)
    if (WHOOSH_PLAYER) {
      WHOOSH_PLAYER.start();
    } else {
      haptics.select();
    }
  }, [activeIndex]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Bouncing chevron
  const chevronY = useSharedValue(0);

  useEffect(() => {
    chevronY.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    ));
    return () => cancelAnimation(chevronY);
  }, []);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chevronY.value }],
  }));

  // ── Skip button + bottom overlay: fade out as auth section comes into view ──
  // The auth section starts at AUTH_INDEX * SCREEN_HEIGHT.
  // Fade begins when the PREVIOUS screen is ~50% scrolled past (auth section coming into view).
  const authScrollStart = (AUTH_INDEX - 1) * SCREEN_HEIGHT + SCREEN_HEIGHT * 0.5;
  const authScrollEnd = AUTH_INDEX * SCREEN_HEIGHT;

  const skipFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [authScrollStart, authScrollEnd],
      [1, 0],
      'clamp',
    ),
  }));

  const bottomFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [authScrollStart, authScrollEnd],
      [1, 0],
      'clamp',
    ),
  }));

  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollY.value = offset;
    const index = Math.round(offset / SCREEN_HEIGHT);
    if (index !== activeIndexRef.current && index >= 0 && index < SCREENS.length) {
      activeIndexRef.current = index;
      setActiveIndex(index);
    }
  }, []);

  // ── Skip button scrolls to auth section ──
  const handleSkip = useCallback(() => {
    haptics.tap();
    flatListRef.current?.scrollToIndex({
      index: AUTH_INDEX,
      animated: true,
    });
  }, []);

  // ── Auth completion ──
  const handleAuthComplete = useCallback((needsEmailVerification: boolean) => {
    onDismiss(needsEmailVerification);
  }, [onDismiss]);

  const handleBrowseWithoutAccount = useCallback(() => {
    if (onBrowseWithoutAccount) {
      onBrowseWithoutAccount();
    } else {
      onDismiss(false);
    }
  }, [onBrowseWithoutAccount, onDismiss]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Vertical snap pages */}
      <FlatList
        ref={flatListRef}
        data={SCREENS}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => `screen-${i}`}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: colors.background.page }}>
            {/* Radial pulse — behind screen content, in front of wrapper bg */}
            {pulseColor && (
              <Animated.View
                style={[styles.pulseContainer, pulseStyle]}
                pointerEvents="none"
              >
                <View style={[styles.pulseCircle, {
                  width: PULSE_SIZE, height: PULSE_SIZE, borderRadius: PULSE_SIZE / 2,
                  backgroundColor: pulseColor, opacity: 0.045,
                }]} />
                <View style={[styles.pulseCircle, {
                  width: PULSE_SIZE * 0.6, height: PULSE_SIZE * 0.6, borderRadius: PULSE_SIZE * 0.3,
                  left: PULSE_SIZE * 0.2, top: PULSE_SIZE * 0.2,
                  backgroundColor: pulseColor, opacity: 0.06,
                }]} />
                <View style={[styles.pulseCircle, {
                  width: PULSE_SIZE * 0.3, height: PULSE_SIZE * 0.3, borderRadius: PULSE_SIZE * 0.15,
                  left: PULSE_SIZE * 0.35, top: PULSE_SIZE * 0.35,
                  backgroundColor: pulseColor, opacity: 0.08,
                }]} />
              </Animated.View>
            )}
            {item.isAuth ? (
              <OnboardingAuthSection
                isActive={index === activeIndex}
                onAuthComplete={handleAuthComplete}
                onBrowseWithoutAccount={handleBrowseWithoutAccount}
              />
            ) : (
              <item.Component isActive={index === activeIndex} />
            )}
          </View>
        )}
      />

      {/* Skip button — top right, fades out when auth is visible */}
      <Animated.View style={[styles.skipButtonWrapper, { top: insets.top + spacing.lg }, skipFadeStyle]}>
        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Bottom: static hint + bouncing chevron, fades out when auth is visible */}
      <Animated.View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + spacing.lg }, bottomFadeStyle]}
        pointerEvents="box-none"
      >
        <Text style={styles.hint} pointerEvents="none">SCROLL TO EXPLORE</Text>

        <Pressable onLongPress={() => onDismiss(false)} delayLongPress={1500}>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={20} color={colors.text.meta} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pulseContainer: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    left: SCREEN_WIDTH / 2 - PULSE_SIZE / 2,
    top: SCREEN_HEIGHT / 2 - PULSE_SIZE / 2,
    zIndex: 0,
  },
  pulseCircle: {
    position: 'absolute',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 100,
  },
  hint: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    letterSpacing: 1.5,
  },
  skipButtonWrapper: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 100,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
