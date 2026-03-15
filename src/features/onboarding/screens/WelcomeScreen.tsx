import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dark theme colors for onboarding
const ONBOARDING = {
  bg: '#0A0A0C',
  surface: '#161618',
  surfaceLight: '#1E1E22',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMeta: 'rgba(255,255,255,0.35)',
  accent: colors.accent.primary,
  accentGlow: 'rgba(207,103,105,0.15)',
};

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();
  const ctaPress = useStrongPress();

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const accentLineWidth = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(16);
  const copyrightOpacity = useSharedValue(0);
  // Decorative elements
  const glowOpacity = useSharedValue(0);
  const topFadeOpacity = useSharedValue(0);

  useEffect(() => {
    // Background glow
    glowOpacity.value = withDelay(0, withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }));
    topFadeOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));

    // Logo rises in
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    logoTranslateY.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // Accent line draws
    accentLineWidth.value = withDelay(600, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));

    // Tagline
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    taglineTranslateY.value = withDelay(800, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // CTA button
    ctaOpacity.value = withDelay(1100, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    ctaTranslateY.value = withDelay(1100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Copyright
    copyrightOpacity.value = withDelay(1300, withTiming(1, { duration: TIMING.slow }));
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const topFadeStyle = useAnimatedStyle(() => ({
    opacity: topFadeOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const accentLineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: accentLineWidth.value }],
    opacity: accentLineWidth.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const copyrightStyle = useAnimatedStyle(() => ({
    opacity: copyrightOpacity.value,
  }));

  const handleContinue = () => {
    haptics.tap();
    onContinue();
  };

  return (
    <View style={styles.container}>
      {/* Background glow behind logo */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[ONBOARDING.accentGlow, 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 0.7 }}
        />
      </Animated.View>

      {/* Top accent fade */}
      <Animated.View style={[styles.topFade, topFadeStyle]}>
        <LinearGradient
          colors={['rgba(207,103,105,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Hero content -- shift visual center upward to eliminate top-heavy feel */}
      <View style={[styles.heroRegion, { marginTop: -spacing.xxxl }]}>
        <Animated.View style={logoStyle}>
          <Text style={styles.logoText}>TrackR</Text>
        </Animated.View>

        {/* Accent line */}
        <Animated.View style={[styles.accentLine, accentLineStyle]}>
          <LinearGradient
            colors={['transparent', ONBOARDING.accent, 'transparent']}
            style={styles.accentLineInner}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Every ride tells a story.</Text>
          <Text style={styles.taglineSub}>Track it. Rate it. Live it.</Text>
        </Animated.View>
      </View>

      {/* CTA Region */}
      <View style={[styles.ctaRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Animated.View style={ctaStyle}>
          <Pressable {...ctaPress.pressHandlers} onPress={handleContinue}>
            <Animated.View style={ctaPress.animatedStyle}>
              <LinearGradient
                colors={[ONBOARDING.accent, '#B85557']}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.ctaText}>Get Started</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Copyright */}
        <Animated.View style={[styles.copyrightContainer, copyrightStyle]}>
          <Text style={styles.copyright}>
            {'\u00A9'} {new Date().getFullYear()} Lanting Digital LLC
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Background glow
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },

  // Top fade
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // Hero
  heroRegion: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -2,
  },

  // Accent line
  accentLine: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    width: 160,
    height: 2,
  },
  accentLineInner: {
    flex: 1,
    borderRadius: 1,
  },

  // Tagline
  tagline: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  taglineSub: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },

  // CTA
  ctaRegion: {
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 48,
    height: 56,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Copyright
  copyrightContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  copyright: {
    fontSize: typography.sizes.small,
    color: 'rgba(255,255,255,0.25)',
  },
});
