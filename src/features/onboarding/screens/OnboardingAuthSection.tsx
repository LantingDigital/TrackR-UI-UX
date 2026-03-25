/**
 * OnboardingAuthSection — Final screen of the vertical-scroll onboarding.
 *
 * Light theme (#F7F7F7). Sign-in/Sign-up toggle on a single page.
 * Apple + Google + Email auth, wired to real Firebase services.
 * Card art collage background for visual continuity with screen 1.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
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
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
} from '../../../services/firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACCENT = colors.accent.primary;

// Card art for background collage
const COLLAGE_CARDS = [
  CARD_ART['tatsu'],
  CARD_ART['goliath'],
  CARD_ART['full-throttle'],
  CARD_ART['superman-escape-from-krypton'],
  CARD_ART['the-riddlers-revenge'],
  CARD_ART['scream'],
].filter(Boolean);

const CARD_W = 80;
const CARD_H = CARD_W * (7 / 5);

type AuthMode = 'signin' | 'signup';

interface OnboardingAuthSectionProps {
  isActive: boolean;
  /** Called when auth succeeds. needsEmailVerification = true for email sign-up. */
  onAuthComplete: (needsEmailVerification: boolean) => void;
  onBrowseWithoutAccount: () => void;
}

export const OnboardingAuthSection: React.FC<OnboardingAuthSectionProps> = ({
  isActive,
  onAuthComplete,
  onBrowseWithoutAccount,
}) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | 'email' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const applePress = useStrongPress({ disabled: loadingProvider !== null });
  const googlePress = useStrongPress({ disabled: loadingProvider !== null });
  const emailPress = useStrongPress({ disabled: loadingProvider !== null });
  const browsePress = useStrongPress({ disabled: loadingProvider !== null });

  // Entrance animations
  const collageOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const headingOpacity = useSharedValue(0);
  const headingTranslateY = useSharedValue(16);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  const termsOpacity = useSharedValue(0);

  // Mode toggle animation
  const modeProgress = useSharedValue(0); // 0 = signup, 1 = signin

  useEffect(() => {
    if (!isActive) return;

    collageOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));
    headingOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
    headingTranslateY.value = withDelay(350, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 350 }));
    buttonsTranslateY.value = withDelay(500, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    termsOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
  }, [isActive]);

  const collageStyle = useAnimatedStyle(() => ({ opacity: collageOpacity.value }));
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
  const termsStyle = useAnimatedStyle(() => ({ opacity: termsOpacity.value }));

  // Toggle pill indicator animation
  const toggleIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(modeProgress.value * 120, { duration: 200, easing: Easing.out(Easing.cubic) }) }],
  }));
  const signUpTextColor = useAnimatedStyle(() => ({
    color: interpolateColor(modeProgress.value, [0, 1], [colors.text.inverse, colors.text.primary]),
  }));
  const signInTextColor = useAnimatedStyle(() => ({
    color: interpolateColor(modeProgress.value, [0, 1], [colors.text.primary, colors.text.inverse]),
  }));

  // ── Mode toggle ──
  const toggleMode = useCallback((newMode: AuthMode) => {
    haptics.tap();
    setMode(newMode);
    setErrorMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    modeProgress.value = newMode === 'signin' ? 1 : 0;
  }, []);

  // ── Auth handlers ──
  const isLoading = loadingProvider !== null;

  const handleAppleAuth = useCallback(async () => {
    haptics.tap();
    setLoadingProvider('apple');
    setErrorMessage(null);
    try {
      const result = await signInWithApple();
      if (result.success) {
        onAuthComplete(false); // OAuth — no email verification needed
      } else if (
        result.error?.code !== 'auth/apple-cancelled' &&
        result.error?.code !== 'auth/apple-not-supported'
      ) {
        setErrorMessage(result.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  }, [onAuthComplete]);

  const handleGoogleAuth = useCallback(async () => {
    haptics.tap();
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onAuthComplete(false); // OAuth — no email verification needed
      } else if (result.error?.code !== 'auth/google-cancelled') {
        setErrorMessage(result.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  }, [onAuthComplete]);

  const handleEmailAuth = useCallback(async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    haptics.tap();
    setLoadingProvider('email');
    setErrorMessage(null);

    try {
      const result = mode === 'signup'
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

      if (result.success) {
        // Email sign-up needs verification; sign-in with verified email does not
        const needsVerification = mode === 'signup' || !result.data.emailVerified;
        onAuthComplete(needsVerification && result.data.authProvider === 'email');
      } else {
        setErrorMessage(result.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  }, [email, password, confirmPassword, mode, onAuthComplete]);

  const handleBrowse = useCallback(() => {
    haptics.tap();
    onBrowseWithoutAccount();
  }, [onBrowseWithoutAccount]);

  return (
    <View style={styles.container}>
      {/* Background card art collage */}
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
                  top: SCREEN_HEIGHT * 0.06 + offsetY,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
              resizeMode="cover"
            />
          );
        })}
        <LinearGradient
          colors={['rgba(247,247,247,0)', 'rgba(247,247,247,0.6)', 'rgba(247,247,247,1)']}
          locations={[0, 0.4, 0.7]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentRegion,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo + heading */}
          <View style={styles.headerSection}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Text style={styles.logoText}>T</Text>
            </Animated.View>

            <Animated.View style={headingStyle}>
              <Text style={styles.heading}>
                {mode === 'signup' ? 'Join TrackR' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'signup'
                  ? 'Your rides. Your collection.\nYour community.'
                  : 'Sign in to pick up\nwhere you left off.'}
              </Text>
            </Animated.View>
          </View>

          {/* Sign In / Sign Up toggle */}
          <Animated.View style={[styles.toggleContainer, buttonsStyle]}>
            <View style={styles.togglePill}>
              <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
              <Pressable style={styles.toggleOption} onPress={() => toggleMode('signup')}>
                <Animated.Text style={[styles.toggleText, signUpTextColor]}>Sign Up</Animated.Text>
              </Pressable>
              <Pressable style={styles.toggleOption} onPress={() => toggleMode('signin')}>
                <Animated.Text style={[styles.toggleText, signInTextColor]}>Sign In</Animated.Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Auth buttons */}
          <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
            {/* Apple */}
            {Platform.OS === 'ios' && (
              <Pressable
                {...applePress.pressHandlers}
                onPress={handleAppleAuth}
                disabled={isLoading}
              >
                <Animated.View style={[styles.authButton, styles.appleButton, applePress.animatedStyle]}>
                  {loadingProvider === 'apple' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                      <Text style={styles.authButtonTextLight}>Continue with Apple</Text>
                    </>
                  )}
                </Animated.View>
              </Pressable>
            )}

            {/* Google */}
            <Pressable
              {...googlePress.pressHandlers}
              onPress={handleGoogleAuth}
              disabled={isLoading}
            >
              <Animated.View style={[styles.authButton, styles.googleButton, googlePress.animatedStyle]}>
                {loadingProvider === 'google' ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color={colors.text.primary} />
                    <Text style={styles.authButtonTextDark}>Continue with Google</Text>
                  </>
                )}
              </Animated.View>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email fields */}
            <View style={styles.emailFieldsContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor={colors.text.meta}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!isLoading}
              />
              <TextInput
                ref={passwordRef}
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={colors.text.meta}
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
                secureTextEntry
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                returnKeyType={mode === 'signup' ? 'next' : 'done'}
                onSubmitEditing={() => {
                  if (mode === 'signup') confirmRef.current?.focus();
                  else handleEmailAuth();
                }}
                editable={!isLoading}
              />
              {mode === 'signup' && (
                <TextInput
                  ref={confirmRef}
                  style={styles.textInput}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.text.meta}
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(null); }}
                  secureTextEntry
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleEmailAuth}
                  editable={!isLoading}
                />
              )}
            </View>

            {/* Error message */}
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Email submit button */}
            <Pressable
              {...emailPress.pressHandlers}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              <Animated.View style={[styles.authButton, styles.emailButton, emailPress.animatedStyle]}>
                {loadingProvider === 'email' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.authButtonTextLight}>
                    {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Browse without account */}
          <Animated.View style={[styles.browseContainer, termsStyle]}>
            <Pressable
              {...browsePress.pressHandlers}
              onPress={handleBrowse}
              disabled={isLoading}
            >
              <Animated.View style={[styles.browseButton, browsePress.animatedStyle]}>
                <Text style={styles.browseText}>Browse without an account</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    height: SCREEN_HEIGHT * 0.40,
    overflow: 'hidden',
  },
  collageCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.sm,
    opacity: 0.35,
  },

  // Layout
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentRegion: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xxl,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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

  // Toggle pill
  toggleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    padding: 3,
    width: 243,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 120,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
  },
  toggleOption: {
    width: 120,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
  },

  // Auth buttons
  buttonsContainer: {
    gap: spacing.base,
    marginBottom: spacing.lg,
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

  // Email fields
  emailFieldsContainer: {
    gap: spacing.base,
  },
  textInput: {
    height: 50,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  // Error
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.status.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Browse
  browseContainer: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  browseButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  browseText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
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
