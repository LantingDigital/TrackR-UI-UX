/**
 * OnboardingAuthEmbed — The actual auth UI for the design sampler's final screen.
 *
 * Full-screen, light mode. This is a REAL interaction point (not a demo).
 * Three auth paths: Apple, Google, Email. Staggered entrance. Premium feel.
 * Subtle card art collage behind the content as a callback to Screen 1.
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { CARD_ART } from '../../../data/cardArt';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACCENT = colors.accent.primary;

// Card art for background collage — pick a curated set of visually striking cards
const COLLAGE_CARDS = [
  CARD_ART['tatsu'],
  CARD_ART['goliath'],
  CARD_ART['full-throttle'],
  CARD_ART['superman-escape-from-krypton'],
  CARD_ART['the-riddlers-revenge'],
  CARD_ART['scream'],
].filter(Boolean);

const CARD_W = 80;
const CARD_H = CARD_W * (7 / 5); // TCG aspect

interface OnboardingAuthEmbedProps {
  isActive: boolean;
  onSignIn?: () => void;
}

export const OnboardingAuthEmbed: React.FC<OnboardingAuthEmbedProps> = ({
  isActive,
  onSignIn,
}) => {
  const insets = useSafeAreaInsets();
  const applePress = useStrongPress();
  const googlePress = useStrongPress();
  const emailPress = useStrongPress();

  // Entrance animations
  const collageOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const headingOpacity = useSharedValue(0);
  const headingTranslateY = useSharedValue(16);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  const termsOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Collage fades in first
    collageOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));

    // Logo pops in
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));

    // Heading slides up
    headingOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
    headingTranslateY.value = withDelay(350, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));

    // Buttons slide up
    buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 350 }));
    buttonsTranslateY.value = withDelay(500, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));

    // Terms fade in last
    termsOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
  }, [isActive]);

  const collageStyle = useAnimatedStyle(() => ({
    opacity: collageOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const headingStyle = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
    transform: [{ translateY: headingTranslateY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const termsStyle = useAnimatedStyle(() => ({
    opacity: termsOpacity.value,
  }));

  const handleAuth = useCallback(() => {
    haptics.success();
    onSignIn?.();
  }, [onSignIn]);

  return (
    <View style={styles.container}>
      {/* Background card art collage — faded, scattered behind content */}
      <Animated.View style={[styles.collageContainer, collageStyle]} pointerEvents="none">
        {COLLAGE_CARDS.map((source, i) => {
          const angle = -15 + i * 8;
          const offsetX = -100 + i * 50;
          const offsetY = -40 + (i % 3) * 35;
          return (
            <Image
              key={`collage-${i}`}
              source={source}
              style={[
                styles.collageCard,
                {
                  left: SCREEN_WIDTH / 2 + offsetX - CARD_W / 2,
                  top: SCREEN_HEIGHT * 0.08 + offsetY,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
              resizeMode="cover"
            />
          );
        })}
        {/* Gradient overlay to fade the collage into background */}
        <LinearGradient
          colors={['rgba(247,247,247,0)', 'rgba(247,247,247,0.6)', 'rgba(247,247,247,1)']}
          locations={[0, 0.4, 0.7]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <View style={[styles.contentRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Logo + heading */}
        <View style={styles.headerSection}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Text style={styles.logoText}>T</Text>
          </Animated.View>

          <Animated.View style={headingStyle}>
            <Text style={styles.heading}>Join TrackR</Text>
            <Text style={styles.subtitle}>
              Your rides. Your collection.{'\n'}Your community.
            </Text>
          </Animated.View>
        </View>

        {/* Auth buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
          {/* Apple */}
          <Pressable {...applePress.pressHandlers} onPress={handleAuth}>
            <Animated.View style={[styles.authButton, styles.appleButton, applePress.animatedStyle]}>
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={styles.authButtonTextLight}>Continue with Apple</Text>
            </Animated.View>
          </Pressable>

          {/* Google */}
          <Pressable {...googlePress.pressHandlers} onPress={handleAuth}>
            <Animated.View style={[styles.authButton, styles.googleButton, googlePress.animatedStyle]}>
              <Ionicons name="logo-google" size={18} color={colors.text.primary} />
              <Text style={styles.authButtonTextDark}>Continue with Google</Text>
            </Animated.View>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <Pressable {...emailPress.pressHandlers} onPress={handleAuth}>
            <Animated.View style={[styles.authButton, styles.emailButton, emailPress.animatedStyle]}>
              <Ionicons name="mail-outline" size={18} color={colors.text.inverse} />
              <Text style={styles.authButtonTextLight}>Sign up with email</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Terms */}
        <Animated.View style={[styles.termsContainer, termsStyle]}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Collage
  collageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
    overflow: 'hidden',
  },
  collageCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.sm,
    opacity: 0.35,
  },

  // Content
  contentRegion: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xxl,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.card,
  },
  logoText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: ACCENT,
  },
  heading: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },

  // Auth buttons
  buttonsContainer: {
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  authButton: {
    height: 54,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: colors.background.card,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    ...shadows.small,
  },
  emailButton: {
    backgroundColor: ACCENT,
  },
  authButtonTextDark: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  authButtonTextLight: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginHorizontal: spacing.lg,
  },

  // Terms
  termsContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  termsText: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    textAlign: 'center',
    lineHeight: typography.sizes.small * 1.6,
  },
  termsLink: {
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
