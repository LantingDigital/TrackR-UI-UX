/**
 * EmailVerificationScreen — Blocks app access until email is verified.
 *
 * Shown when:
 * 1. User just signed up with email → auto-sends verification → this screen
 * 2. User relaunches app with unverified email → this screen
 *
 * Features:
 * - Polls Firebase auth state every 3 seconds to detect verification
 * - "Resend email" button with cooldown
 * - "Use a different account" to sign out
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useStrongPress } from '../../../hooks/useSpringPress';
import {
  sendEmailVerification,
  reloadCurrentUser,
  signOut,
} from '../../../services/firebase/auth';
import { useAuthStore, setAuthUser } from '../../../stores/authStore';

const ACCENT = colors.accent.primary;
const RESEND_COOLDOWN = 30; // seconds

interface EmailVerificationScreenProps {
  onVerified: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ onVerified }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resendPress = useStrongPress({ disabled: resendCooldown > 0 || isSending });
  const signOutPress = useStrongPress();

  // Entrance animations
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(16);

  useEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    contentTranslateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // ── Poll for verification ──
  useEffect(() => {
    pollIntervalRef.current = setInterval(async () => {
      const refreshed = await reloadCurrentUser();
      if (refreshed?.emailVerified) {
        // Update the auth store with the verified user
        setAuthUser(refreshed);
        onVerified();
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [onVerified]);

  // ── Resend cooldown timer ──
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Send verification email on mount ──
  useEffect(() => {
    sendEmailVerification();
  }, []);

  const handleResend = useCallback(async () => {
    haptics.tap();
    setIsSending(true);
    setStatusMessage(null);
    const result = await sendEmailVerification();
    setIsSending(false);
    if (result.success) {
      setResendCooldown(RESEND_COOLDOWN);
      setStatusMessage('Verification email sent!');
    } else {
      setStatusMessage(result.error?.message ?? 'Could not send email. Try again.');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    haptics.tap();
    await signOut();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={48} color={ACCENT} />
        </View>

        {/* Text */}
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.emailText}>{user?.email ?? 'your email'}</Text>
          {'\n\n'}
          Tap the link in the email to verify your account. This page will update automatically.
        </Text>

        {/* Status message */}
        {statusMessage && (
          <Text style={styles.statusText}>{statusMessage}</Text>
        )}

        {/* Resend button */}
        <Pressable
          {...resendPress.pressHandlers}
          onPress={handleResend}
          disabled={resendCooldown > 0 || isSending}
        >
          <Animated.View
            style={[
              styles.resendButton,
              (resendCooldown > 0 || isSending) && styles.resendButtonDisabled,
              resendPress.animatedStyle,
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.resendButtonText}>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend verification email'}
              </Text>
            )}
          </Animated.View>
        </Pressable>

        {/* Sign out / different account */}
        <Pressable
          {...signOutPress.pressHandlers}
          onPress={handleSignOut}
        >
          <Animated.View style={[styles.signOutButton, signOutPress.animatedStyle]}>
            <Text style={styles.signOutText}>Use a different account</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  // Text
  heading: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xxl,
  },
  emailText: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // Status
  statusText: {
    fontSize: typography.sizes.caption,
    color: colors.status.success,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Resend
  resendButton: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    width: '100%',
    marginBottom: spacing.lg,
  },
  resendButtonDisabled: {
    opacity: 0.4,
  },
  resendButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },

  // Sign out
  signOutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signOutText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
});
