import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { haptics } from '../../services/haptics';
import { OnboardingCardLanding } from './screens/OnboardingCardLanding';
import { OnboardingSearch } from './screens/OnboardingSearch';
import { OnboardingLog } from './screens/OnboardingLog';
import { OnboardingScan } from './screens/OnboardingScan';
import { OnboardingRate } from './screens/OnboardingRate';

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
];

// Circle must cover the full screen diagonal
const PULSE_SIZE = Math.ceil(Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2)) + 40;

interface ScreenDef {
  name: string;
  Component: React.FC<{ isActive: boolean }>;
}

const SCREENS: ScreenDef[] = [
  { name: 'Card Art Landing', Component: OnboardingCardLanding },
  { name: 'Search', Component: OnboardingSearch },
  { name: 'Log', Component: OnboardingLog },
  { name: 'Scan', Component: OnboardingScan },
  { name: 'Rate', Component: OnboardingRate },
];

interface LandingDesignSamplerProps {
  onDismiss: () => void;
}

export const LandingDesignSampler: React.FC<LandingDesignSamplerProps> = ({ onDismiss }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeIndexRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const isFirstRender = useRef(true);

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

    // Reset then expand + fade
    pulseScale.value = 0;
    pulseOpacity.value = 1;
    pulseScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    pulseOpacity.value = withDelay(80, withTiming(0, { duration: 620, easing: Easing.in(Easing.ease) }));

    // "Whoosh" haptic — accelerating ticks that feel like a sweep
    const whoosh = [0, 20, 38, 54, 68, 80, 95];
    whoosh.forEach(ms => setTimeout(() => haptics.tick(), ms));
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
        withTiming(6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
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

  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / SCREEN_HEIGHT);
    if (index !== activeIndexRef.current && index >= 0 && index < SCREENS.length) {
      activeIndexRef.current = index;
      setActiveIndex(index);
    }
  }, []);

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
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <item.Component isActive={index === activeIndex} />
          </View>
        )}
      />

      {/* Radial color pulse overlay — 3 concentric circles for soft gradient */}
      {pulseColor && (
        <Animated.View
          style={[styles.pulseContainer, pulseStyle]}
          pointerEvents="none"
        >
          {/* Outer ring — softest */}
          <View style={[styles.pulseCircle, {
            width: PULSE_SIZE, height: PULSE_SIZE, borderRadius: PULSE_SIZE / 2,
            backgroundColor: pulseColor, opacity: 0.045,
          }]} />
          {/* Middle ring */}
          <View style={[styles.pulseCircle, {
            width: PULSE_SIZE * 0.6, height: PULSE_SIZE * 0.6, borderRadius: PULSE_SIZE * 0.3,
            left: PULSE_SIZE * 0.2, top: PULSE_SIZE * 0.2,
            backgroundColor: pulseColor, opacity: 0.06,
          }]} />
          {/* Inner core — densest */}
          <View style={[styles.pulseCircle, {
            width: PULSE_SIZE * 0.3, height: PULSE_SIZE * 0.3, borderRadius: PULSE_SIZE * 0.15,
            left: PULSE_SIZE * 0.35, top: PULSE_SIZE * 0.35,
            backgroundColor: pulseColor, opacity: 0.08,
          }]} />
        </Animated.View>
      )}

      {/* Skip button — top right */}
      <Pressable
        onPress={() => { haptics.tap(); onDismiss(); }}
        style={[styles.skipButton, { top: insets.top + spacing.lg }]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Bottom: static hint + bouncing chevron */}
      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + spacing.lg }]}
        pointerEvents="box-none"
      >
        <Text style={styles.hint} pointerEvents="none">SCROLL TO EXPLORE</Text>

        <Pressable onLongPress={onDismiss} delayLongPress={1500}>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={20} color={colors.text.meta} />
          </Animated.View>
        </Pressable>
      </View>
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
    zIndex: 50,
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
  skipButton: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
