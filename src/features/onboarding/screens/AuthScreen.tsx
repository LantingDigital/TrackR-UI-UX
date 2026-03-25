import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';
import {
  signInWithGoogle,
  signInWithApple,
} from '../../../services/firebase/auth';

const ACCENT = colors.accent.primary;
const ACCENT_DARK = '#B85557';

// Dark theme tokens consistent with WelcomeScreen / ShowcaseScreen
const ONBOARDING = {
  surface: '#161618',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMeta: 'rgba(255,255,255,0.35)',
  accentGlow: 'rgba(207,103,105,0.12)',
  divider: 'rgba(255,255,255,0.06)',
};

interface AuthScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, onSkip }) => {
  const insets = useSafeAreaInsets();
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);

  const applePress = useStrongPress({ disabled: loadingProvider !== null });
  const googlePress = useStrongPress({ disabled: loadingProvider !== null });
  const skipPress = useStrongPress({ disabled: loadingProvider !== null });

  // Entrance animations — staggered like WelcomeScreen
  const glowOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(24);
  const accentLineWidth = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(16);
  const skipOpacity = useSharedValue(0);
  const termsOpacity = useSharedValue(0);

  useEffect(() => {
    // Background glow
    glowOpacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });

    // Header — logo + text
    headerOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
    );
    headerTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // Accent line draws
    accentLineWidth.value = withDelay(
      500,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
    );

    // Auth buttons
    buttonsOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
    );
    buttonsTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );

    // Skip + terms
    skipOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }),
    );
    termsOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 300 }),
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const accentLineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: accentLineWidth.value }],
    opacity: accentLineWidth.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const termsStyle = useAnimatedStyle(() => ({
    opacity: termsOpacity.value,
  }));

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const handleAppleAuth = useCallback(async () => {
    haptics.tap();
    setLoadingProvider('apple');
    try {
      const result = await signInWithApple();
      if (result.success) {
        onComplete();
      } else if (
        result.error?.code !== 'auth/apple-cancelled' &&
        result.error?.code !== 'auth/apple-not-supported'
      ) {
        Alert.alert('Sign In Error', result.error?.message ?? 'Something went wrong.');
      }
    } catch {
      Alert.alert('Sign In Error', 'An unexpected error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  }, [onComplete]);

  const handleGoogleAuth = useCallback(async () => {
    haptics.tap();
    setLoadingProvider('google');
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onComplete();
      } else if (result.error?.code !== 'auth/google-cancelled') {
        Alert.alert('Sign In Error', result.error?.message ?? 'Something went wrong.');
      }
    } catch {
      Alert.alert('Sign In Error', 'An unexpected error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    haptics.tap();
    onSkip();
  }, [onSkip]);

  const isLoading = loadingProvider !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Radial accent glow — mirrors WelcomeScreen */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[ONBOARDING.accentGlow, 'rgba(207,103,105,0)']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 0.7 }}
        />
      </Animated.View>

      {/* Top accent fade */}
      <Animated.View style={[styles.topFade, glowStyle]}>
        <LinearGradient
          colors={['rgba(207,103,105,0.06)', 'rgba(207,103,105,0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Content — vertically centered, shifted slightly up */}
      <View style={styles.contentRegion}>
        {/* Header: Logo + Heading + Subtitle */}
        <Animated.View style={[styles.headerContainer, headerStyle]}>
          <Text style={styles.logoText}>TrackR</Text>

          {/* Accent line — same treatment as WelcomeScreen */}
          <Animated.View style={[styles.accentLine, accentLineStyle]}>
            <LinearGradient
              colors={['rgba(207,103,105,0)', ACCENT, 'rgba(207,103,105,0)']}
              style={styles.accentLineInner}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </Animated.View>

          <Text style={styles.heading}>Your rides, your way.</Text>
          <Text style={styles.subtitle}>
            Sign in to sync your logbook, ratings, and collection across all your devices.
          </Text>
        </Animated.View>

        {/* Auth buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
          {/* Apple — hero button, white, prominent (Apple HIG) */}
          {Platform.OS === 'ios' && (
            <Pressable
              {...applePress.pressHandlers}
              onPress={handleAppleAuth}
              disabled={isLoading}
            >
              <Animated.View style={[styles.authButton, styles.appleButton, applePress.animatedStyle]}>
                {loadingProvider === 'apple' ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#000000" />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </>
                )}
              </Animated.View>
            </Pressable>
          )}

          {/* Google — dark surface with border */}
          <Pressable
            {...googlePress.pressHandlers}
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <Animated.View style={[styles.authButton, styles.googleButton, googlePress.animatedStyle]}>
              {loadingProvider === 'google' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom region — skip + terms */}
      <View style={[styles.bottomRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Skip / continue without account */}
        <Animated.View style={skipStyle}>
          <Pressable
            {...skipPress.pressHandlers}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Animated.View style={[styles.skipButton, skipPress.animatedStyle]}>
              <Text style={styles.skipText}>Continue without an account</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.4)" />
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
    backgroundColor: 'transparent',
  },

  // ── Glow ──────────────────────────────────────────────────────────────────
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  contentRegion: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    marginTop: -spacing.xxxl,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl + spacing.lg,
  },
  logoText: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.5,
  },

  // Accent line — matches WelcomeScreen treatment
  accentLine: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    width: 120,
    height: 2,
  },
  accentLineInner: {
    flex: 1,
    borderRadius: 1,
  },

  heading: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.6,
    maxWidth: 300,
  },

  // ── Auth buttons ──────────────────────────────────────────────────────────
  buttonsContainer: {
    gap: spacing.base,
  },
  authButton: {
    height: 56,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },

  // Apple — white, premium hero
  appleButton: {
    backgroundColor: '#FFFFFF',
  },
  appleButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#000000',
  },

  // Google — dark surface
  googleButton: {
    backgroundColor: ONBOARDING.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  googleButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },

  // ── Bottom ────────────────────────────────────────────────────────────────
  bottomRegion: {
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },

  // Skip — subtle but tappable
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.45)',
  },

  // Terms
  termsContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  termsText: {
    fontSize: typography.sizes.small,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    lineHeight: typography.sizes.small * 1.6,
  },
  termsLink: {
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'underline',
  },
});
