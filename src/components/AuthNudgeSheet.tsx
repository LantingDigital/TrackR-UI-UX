/**
 * AuthNudgeSheet — Reusable bottom sheet for anonymous users.
 *
 * Slides up when an anonymous user taps a locked feature.
 * Contextual message per feature + Sign Up / Maybe Later buttons.
 *
 * Usage:
 *   <AuthNudgeSheet
 *     visible={showNudge}
 *     feature="log"
 *     onSignUp={() => navigation.navigate(...)}
 *     onDismiss={() => setShowNudge(false)}
 *   />
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../services/haptics';
import { useStrongPress } from '../hooks/useSpringPress';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACCENT = colors.accent.primary;

// ── Feature-specific messages ──
const NUDGE_MESSAGES: Record<string, { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }> = {
  log: {
    icon: 'flash',
    title: 'Log your rides',
    body: 'Sign up to log your first ride and start building your coaster history.',
  },
  rate: {
    icon: 'star',
    title: 'Rate coasters',
    body: 'Sign up to rate rides and build your personal rankings.',
  },
  wallet: {
    icon: 'wallet',
    title: 'Your wallet',
    body: 'Sign up to save park passes and tickets to your digital wallet.',
  },
  community: {
    icon: 'people',
    title: 'Join the community',
    body: 'Sign up to connect with other riders, share rides, and make friends.',
  },
  friends: {
    icon: 'person-add',
    title: 'Add friends',
    body: 'Sign up to follow other riders and share your coaster adventures.',
  },
  merch: {
    icon: 'cart',
    title: 'Collect cards',
    body: 'Sign up to order custom coaster trading cards from your collection.',
  },
  post: {
    icon: 'create',
    title: 'Share your rides',
    body: 'Sign up to post updates and share your park visits with the community.',
  },
  pro: {
    icon: 'diamond',
    title: 'Go Pro',
    body: 'Sign up to unlock TrackR Pro features and support the app.',
  },
};

const DEFAULT_NUDGE = {
  icon: 'lock-closed' as const,
  title: 'Sign up to continue',
  body: 'Create a free account to unlock all of TrackR.',
};

interface AuthNudgeSheetProps {
  visible: boolean;
  feature: string;
  onSignUp: () => void;
  onDismiss: () => void;
}

export const AuthNudgeSheet: React.FC<AuthNudgeSheetProps> = ({
  visible,
  feature,
  onSignUp,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const signUpPress = useStrongPress();
  const laterPress = useStrongPress();

  const nudge = NUDGE_MESSAGES[feature] ?? DEFAULT_NUDGE;

  useEffect(() => {
    if (visible) {
      haptics.tap();
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSignUp = useCallback(() => {
    haptics.tap();
    onSignUp();
  }, [onSignUp]);

  const handleDismiss = useCallback(() => {
    haptics.tap();
    onDismiss();
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={nudge.icon} size={28} color={ACCENT} />
        </View>

        {/* Text */}
        <Text style={styles.title}>{nudge.title}</Text>
        <Text style={styles.body}>{nudge.body}</Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            {...signUpPress.pressHandlers}
            onPress={handleSignUp}
          >
            <Animated.View style={[styles.signUpButton, signUpPress.animatedStyle]}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            {...laterPress.pressHandlers}
            onPress={handleDismiss}
          >
            <Animated.View style={[styles.laterButton, laterPress.animatedStyle]}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.base,
    ...shadows.modal,
  },

  handleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xxl,
  },

  buttonsContainer: {
    gap: spacing.base,
  },
  signUpButton: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  laterButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
});
