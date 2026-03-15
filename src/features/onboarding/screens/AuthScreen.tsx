import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
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
import { TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';

const ACCENT = colors.accent.primary;

interface AuthScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete, onSkip }) => {
  const insets = useSafeAreaInsets();
  const applePress = useStrongPress();
  const googlePress = useStrongPress();
  const emailPress = useStrongPress();

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(16);
  const skipOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });

    buttonsOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    buttonsTranslateY.value = withDelay(200, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));

    skipOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const handleAuth = useCallback(() => {
    haptics.tap();
    // Auth integration happens later (Phase 2). For now, proceed.
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    haptics.tap();
    onSkip();
  }, [onSkip]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Decorative glow */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(207,103,105,0.1)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Content */}
      <View style={styles.contentRegion}>
        {/* Header */}
        <Animated.View style={[styles.headerContainer, headerStyle]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subtitle}>
            Sync your rides across devices and join the community.
          </Text>
        </Animated.View>

        {/* Auth buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
          {/* Apple */}
          <Pressable {...applePress.pressHandlers} onPress={handleAuth}>
            <Animated.View style={[styles.authButton, styles.appleButton, applePress.animatedStyle]}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text style={styles.authButtonTextDark}>Continue with Apple</Text>
            </Animated.View>
          </Pressable>

          {/* Google */}
          <Pressable {...googlePress.pressHandlers} onPress={handleAuth}>
            <Animated.View style={[styles.authButton, styles.googleButton, googlePress.animatedStyle]}>
              <Ionicons name="logo-google" size={18} color="#FFFFFF" />
              <Text style={styles.authButtonTextLight}>Continue with Google</Text>
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
              <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emailButtonText}>Sign up with email</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom */}
      <View style={[styles.bottomRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Animated.View style={skipStyle}>
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Continue without an account</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.termsContainer, skipStyle]}>
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

  // Glow
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  glowGradient: {
    flex: 1,
  },

  // Content
  contentRegion: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: -spacing.xxxl,
  },

  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2E2E32',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: ACCENT,
  },
  heading: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
  },

  // Auth buttons
  buttonsContainer: {
    gap: spacing.base,
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
    backgroundColor: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#2E2E32',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emailButton: {
    backgroundColor: ACCENT,
  },
  authButtonTextDark: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#000000',
  },
  authButtonTextLight: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  emailButtonText: {
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
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dividerText: {
    fontSize: typography.sizes.meta,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.lg,
  },

  // Bottom
  bottomRegion: {
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.5)',
    paddingVertical: spacing.md,
  },
  termsContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  termsText: {
    fontSize: typography.sizes.small,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: typography.sizes.small * 1.6,
  },
  termsLink: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'underline',
  },
});
