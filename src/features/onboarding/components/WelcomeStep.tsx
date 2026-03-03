import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

const SHEET_HEIGHT = 420;

// ── Animated track line ──────────────────────────
// A coaster-style path with a teardrop loop that draws itself,
// then erases its trail, leaving a clean accent line.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const TRACK_W = 220;
const TRACK_H = 100;
// Path: flat approach → teardrop loop → flat exit
// Total approximate length measured for strokeDasharray
const TRACK_PATH = [
  'M10,70',           // start left, lower third
  'C40,70 50,70 70,60',  // gentle rise
  'C90,45 100,20 110,15', // climb into loop
  'C130,5 145,20 140,40', // top of teardrop
  'C135,55 120,60 115,50', // loop back down
  'C110,35 120,20 130,25', // exit loop
  'C140,30 150,55 160,65', // descend
  'C170,72 180,70 210,70', // flatten out
].join(' ');
const TRACK_TOTAL_LENGTH = 380;

interface WelcomeStepProps {
  onContinue: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Hero entrance animations ──────────────────
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(24);
  const drawHead = useSharedValue(0);   // how much of the path the head has drawn
  const drawTail = useSharedValue(0);   // how much of the trail has been erased
  const lineOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(16);
  const copyrightOpacity = useSharedValue(0);

  // ── Sheet animations ──────────────────────────
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    // Hero text rises in
    heroOpacity.value = withDelay(100, withTiming(1, { duration: TIMING.slow }));
    heroTranslateY.value = withDelay(100, withSpring(0, SPRINGS.gentle));

    // Track line draws itself then erases its trail
    lineOpacity.value = withDelay(300, withTiming(1, { duration: TIMING.normal }));
    // Head draws the full path
    drawHead.value = withDelay(400,
      withTiming(TRACK_TOTAL_LENGTH, { duration: 2000 })
    );
    // Tail follows behind, erasing the trail (starts after head has some lead)
    drawTail.value = withDelay(800,
      withTiming(TRACK_TOTAL_LENGTH, { duration: 2000 })
    );

    // CTA button
    ctaOpacity.value = withDelay(350, withTiming(1, { duration: TIMING.normal }));
    ctaTranslateY.value = withDelay(350, withSpring(0, SPRINGS.responsive));

    // Copyright
    copyrightOpacity.value = withDelay(450, withTiming(1, { duration: TIMING.slow }));
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  // ── Animated track line props ────────────────────
  // Uses strokeDasharray + strokeDashoffset to show only the segment
  // between tail and head, creating a draw-and-erase effect.
  const lineProps = useAnimatedProps(() => {
    const visible = drawHead.value - drawTail.value;
    const gap = TRACK_TOTAL_LENGTH - visible;
    return {
      strokeDasharray: `${visible} ${gap}`,
      strokeDashoffset: -drawTail.value,
      opacity: lineOpacity.value,
    };
  });

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const copyrightStyle = useAnimatedStyle(() => ({
    opacity: copyrightOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // ── Sheet controls ────────────────────────────
  const openSheet = useCallback(() => {
    haptics.tap();
    setSheetOpen(true);
    backdropOpacity.value = withTiming(1, { duration: TIMING.normal });
    sheetTranslateY.value = withSpring(0, SPRINGS.responsive);
  }, []);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: TIMING.fast });
    sheetTranslateY.value = withSpring(SHEET_HEIGHT, SPRINGS.responsive, (finished) => {
      if (finished) runOnJS(setSheetOpen)(false);
    });
  }, []);

  // ── Auth handlers ─────────────────────────────
  const ctaPress = useStrongPress();
  const applePress = useStrongPress();
  const googlePress = useStrongPress();

  const handleAuth = useCallback(() => {
    haptics.tap();
    onContinue();
  }, [onContinue]);

  return (
    <View style={styles.container}>
      {/* ── Hero content ── */}
      <View style={styles.heroRegion}>
        <Animated.View style={heroStyle}>
          <Text style={styles.heroName}>TrackR</Text>
          <Svg width={TRACK_W} height={TRACK_H} style={styles.accentLine}>
            <AnimatedPath
              d={TRACK_PATH}
              animatedProps={lineProps}
              stroke={colors.accent.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.heroTagline}>Your rides. Your way.</Text>
        </Animated.View>
      </View>

      {/* ── Get Started CTA ── */}
      <View style={styles.ctaRegion}>
        <Animated.View style={ctaStyle}>
          <Pressable {...ctaPress.pressHandlers} onPress={openSheet}>
            <Animated.View style={[styles.ctaButton, ctaPress.animatedStyle]}>
              <Text style={styles.ctaText}>Get Started</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Login link below CTA */}
        <Animated.View style={[styles.loginContainer, ctaStyle]}>
          <Text style={styles.loginMeta}>Already have an account? </Text>
          <Pressable onPress={handleAuth}>
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* ── Copyright ── */}
      <Animated.View style={[styles.copyrightContainer, { paddingBottom: insets.bottom + spacing.sm }, copyrightStyle]}>
        <Text style={styles.copyright}>
          {'\u00A9'} {new Date().getFullYear()} Lanting Digital LLC
        </Text>
      </Animated.View>

      {/* ── Bottom sheet overlay ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }, sheetStyle]}>
            {/* Drag indicator */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Create your account</Text>
            <Text style={styles.sheetSubtitle}>
              Track your coasters, build rankings, and join the community.
            </Text>

            {/* Auth buttons */}
            <View style={styles.buttonsContainer}>
              <Pressable {...applePress.pressHandlers} onPress={handleAuth}>
                <Animated.View style={[styles.filledButton, applePress.animatedStyle]}>
                  <Ionicons name="logo-apple" size={20} color={colors.text.inverse} />
                  <Text style={styles.filledButtonText}>Continue with Apple</Text>
                </Animated.View>
              </Pressable>

              <Pressable {...googlePress.pressHandlers} onPress={handleAuth}>
                <Animated.View style={[styles.outlinedButton, googlePress.animatedStyle]}>
                  <Ionicons name="logo-google" size={18} color={colors.text.primary} />
                  <Text style={styles.outlinedButtonText}>Continue with Google</Text>
                </Animated.View>
              </Pressable>
            </View>

            {/* Email option */}
            <Pressable onPress={handleAuth} style={styles.emailContainer}>
              <Text style={styles.emailLink}>Sign up with email</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // ── Hero ──────────────────────────────────────
  heroRegion: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 52,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  accentLine: {
    alignSelf: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.lg,
  },
  heroTagline: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // ── CTA ───────────────────────────────────────
  ctaRegion: {
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: spacing.xxxl,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    ...shadows.small,
  },
  ctaText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginMeta: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  loginLink: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // ── Copyright ─────────────────────────────────
  copyrightContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  copyright: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },

  // ── Backdrop ──────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 100,
  },

  // ── Sheet ─────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.xxl,
    ...shadows.modal,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sheetSubtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xxl,
  },
  buttonsContainer: {
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  filledButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.small,
  },
  filledButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  outlinedButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.small,
  },
  outlinedButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  emailContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emailLink: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
});
