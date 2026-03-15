import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';
import { radius } from '../../../theme/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = colors.accent.primary;

// Phone frame
const PHONE_WIDTH = SCREEN_WIDTH * 0.62;
const PHONE_HEIGHT = PHONE_WIDTH * 2.0;
const PHONE_RADIUS = 40;
const PHONE_BORDER = 3;
const DYNAMIC_ISLAND_W = 90;
const DYNAMIC_ISLAND_H = 28;

// Pill dimensions
const PILL_COLLAPSED_W = 72;
const PILL_COLLAPSED_H = 36;
const PILL_EXPANDED_W = PHONE_WIDTH - PHONE_BORDER * 2 - spacing.xl * 2;
const PILL_EXPANDED_H = 44;

// Timeline delays (cumulative, in ms)
const T_MORPH = 400;       // pill starts expanding
const T_CURSOR = 900;      // cursor appears
const T_TYPE = 1200;       // search text appears
const T_TYPE_END = 1800;   // cursor hides
const T_RESULT = 2150;     // result slides in
const T_TAP = 2900;        // "tap" result — fade search, show success
const T_SUCCESS = 3100;    // checkmark + text
const T_RESET = 4700;      // fade everything, collapse
const T_LOOP = 5600;       // next cycle starts

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingLogRide: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();
  const loopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunning = useRef(false);
  const hasEntrance = useRef(false);

  // Entrance
  const phoneOpacity = useSharedValue(0);
  const phoneY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(16);
  const descOpacity = useSharedValue(0);
  const descY = useSharedValue(12);

  // Internal phone state
  const pillMorph = useSharedValue(0);
  const searchTextOpacity = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultY = useSharedValue(12);
  const successOpacity = useSharedValue(0);
  const successScale = useSharedValue(0.8);

  // All animation scheduling runs on JS thread (no worklets needed).
  // withDelay/withTiming/withSpring are called from JS but execute on UI thread.
  const runCycle = () => {
    if (!isRunning.current) return;

    // Reset all values instantly
    pillMorph.value = 0;
    searchTextOpacity.value = 0;
    cursorOpacity.value = 0;
    resultOpacity.value = 0;
    resultY.value = 12;
    successOpacity.value = 0;
    successScale.value = 0.8;

    // 1. Morph pill to search bar
    pillMorph.value = withDelay(T_MORPH, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));

    // 2. Cursor appears
    cursorOpacity.value = withDelay(T_CURSOR, withTiming(1, { duration: 150 }));

    // 3. Search text fades in
    searchTextOpacity.value = withDelay(T_TYPE, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    cursorOpacity.value = withDelay(T_TYPE_END, withTiming(0, { duration: 100 }));

    // 4. Result row slides in
    resultOpacity.value = withDelay(T_RESULT, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    resultY.value = withDelay(T_RESULT, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // 5. Tap result — fade search, show success
    resultOpacity.value = withDelay(T_TAP, withTiming(0, { duration: 200 }));
    searchTextOpacity.value = withDelay(T_TAP, withTiming(0, { duration: 200 }));

    successOpacity.value = withDelay(T_SUCCESS, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    successScale.value = withDelay(T_SUCCESS, withSpring(1, { damping: 20, stiffness: 220 }));

    // 6. Reset
    successOpacity.value = withDelay(T_RESET, withTiming(0, { duration: 250 }));
    pillMorph.value = withDelay(T_RESET + 100, withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }));

    // Schedule next loop
    loopTimer.current = setTimeout(runCycle, T_LOOP);
  };

  useEffect(() => {
    if (isActive && !hasEntrance.current) {
      hasEntrance.current = true;

      // Entrance animations
      phoneOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
      phoneY.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

      titleOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
      titleY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

      descOpacity.value = withDelay(600, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
      descY.value = withDelay(600, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

      // Start loop
      isRunning.current = true;
      loopTimer.current = setTimeout(runCycle, 900);
    }

    return () => {
      isRunning.current = false;
      if (loopTimer.current) {
        clearTimeout(loopTimer.current);
        loopTimer.current = null;
      }
    };
  }, [isActive]);

  // ── Animated styles ──
  const phoneContainerStyle = useAnimatedStyle(() => ({
    opacity: phoneOpacity.value,
    transform: [{ translateY: phoneY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descY.value }],
  }));

  // Internal phone styles
  const pillStyle = useAnimatedStyle(() => {
    const w = PILL_COLLAPSED_W + (PILL_EXPANDED_W - PILL_COLLAPSED_W) * pillMorph.value;
    const h = PILL_COLLAPSED_H + (PILL_EXPANDED_H - PILL_COLLAPSED_H) * pillMorph.value;
    return {
      width: w,
      height: h,
      borderRadius: h / 2,
      backgroundColor: pillMorph.value > 0.5 ? colors.background.card : colors.text.primary,
    };
  });
  const pillLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - pillMorph.value,
    transform: [{ scale: 1 - pillMorph.value * 0.3 }],
  }));
  const searchAreaStyle = useAnimatedStyle(() => ({
    opacity: pillMorph.value,
  }));
  const searchTextStyle = useAnimatedStyle(() => ({
    opacity: searchTextOpacity.value,
  }));
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));
  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ translateY: resultY.value }],
  }));
  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));
  const pillBorderStyle = useAnimatedStyle(() => ({
    borderWidth: pillMorph.value > 0.5 ? 1.5 : 0,
    borderColor: colors.border.subtle,
  }));

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={[styles.textRegion, { paddingTop: insets.top + spacing.xxxl + spacing.lg }]}>
        <Animated.View style={titleStyle}>
          <Text style={styles.featureTitle}>Log Every Ride</Text>
        </Animated.View>
        <Animated.View style={[descStyle, { marginTop: spacing.md }]}>
          <Text style={styles.featureDesc}>
            Search, tap, done.{'\n'}Your coaster life, tracked.
          </Text>
        </Animated.View>
      </View>

      {/* Phone frame */}
      <Animated.View style={[styles.phoneContainer, phoneContainerStyle]}>
        <View style={styles.phoneFrame}>
          <View style={styles.dynamicIsland} />
          <View style={styles.phoneScreen}>
            <View style={styles.phoneHeader}>
              <Text style={styles.phoneHeaderText}>Home</Text>
            </View>

            {/* Morphing pill */}
            <View style={styles.pillArea}>
              <Animated.View style={[styles.pill, pillStyle, pillBorderStyle, shadows.small]}>
                {/* Collapsed: "Log" label */}
                <Animated.View style={[styles.pillLabelContainer, pillLabelStyle]}>
                  <Ionicons name="add" size={16} color={colors.text.inverse} />
                  <Text style={styles.pillLabel}>Log</Text>
                </Animated.View>

                {/* Expanded: search input */}
                <Animated.View style={[styles.searchInputContainer, searchAreaStyle]}>
                  <Ionicons name="search" size={16} color={colors.text.meta} />
                  <View style={styles.searchTextRow}>
                    <Animated.Text style={[styles.searchText, searchTextStyle]}>
                      Steel Vengeance
                    </Animated.Text>
                    <Animated.View style={[styles.cursor, cursorStyle]} />
                  </View>
                </Animated.View>
              </Animated.View>

              {/* Result row */}
              <Animated.View style={[styles.resultRow, resultStyle]}>
                <View style={styles.resultIcon}>
                  <Ionicons name="flash" size={14} color={ACCENT} />
                </View>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultName}>Steel Vengeance</Text>
                  <Text style={styles.resultPark}>Cedar Point</Text>
                </View>
                <Ionicons name="add-circle" size={20} color={ACCENT} />
              </Animated.View>
            </View>

            {/* Success overlay */}
            <Animated.View style={[styles.successOverlay, successStyle]}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={28} color={colors.text.inverse} />
              </View>
              <Text style={styles.successText}>Ride Logged!</Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    alignItems: 'center',
  },
  textRegion: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    zIndex: 2,
  },
  featureTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    letterSpacing: 0.2,
  },
  phoneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: PHONE_RADIUS,
    borderWidth: PHONE_BORDER,
    borderColor: '#2C2C2E',
    backgroundColor: colors.background.page,
    overflow: 'hidden',
    ...shadows.section,
  },
  dynamicIsland: {
    alignSelf: 'center',
    width: DYNAMIC_ISLAND_W,
    height: DYNAMIC_ISLAND_H,
    borderRadius: DYNAMIC_ISLAND_H / 2,
    backgroundColor: '#1A1A1C',
    marginTop: spacing.base,
  },
  phoneScreen: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  phoneHeader: {
    marginBottom: spacing.xl,
  },
  phoneHeaderText: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pillArea: {
    alignItems: 'center',
  },
  pill: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillLabelContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pillLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  searchInputContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  searchTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  searchText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  cursor: {
    width: 2,
    height: 16,
    backgroundColor: ACCENT,
    marginLeft: 1,
    borderRadius: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginTop: spacing.md,
    width: '100%',
    ...shadows.small,
  },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resultName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  resultPark: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: 1,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  successText: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
