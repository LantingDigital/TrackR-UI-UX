/**
 * DangerousActionModal
 *
 * Centered modal (NOT a bottom sheet) for destructive actions like
 * Reset Onboarding and Delete Account. Intentionally different from
 * SettingsBottomSheet to signal severity.
 *
 * Features:
 *   - BlurView backdrop with tap-to-dismiss
 *   - Fade + scale entrance with withTiming (no bouncy springs)
 *   - haptics.warning() on open
 *   - Optional typed "DELETE" confirmation for severe actions
 *   - Severe mode uses error red; normal uses accent color
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { TIMING } from '../../constants/animations';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xxxl * 2;

// ============================================
// Types
// ============================================

interface DangerousActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  requireTypedConfirmation?: boolean;
  severe?: boolean;
}

// ============================================
// Component
// ============================================

export function DangerousActionModal({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  requireTypedConfirmation = false,
  icon = 'alert-circle-outline',
  severe = false,
}: DangerousActionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const canConfirm = requireTypedConfirmation
    ? typedText.toUpperCase() === 'DELETE'
    : true;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setTypedText('');
      haptics.warning();
      // Fade + scale entrance with withTiming — no bouncy springs (no-jello rule)
      scale.value = withTiming(1, {
        duration: TIMING.normal,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: TIMING.normal });
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
    } else {
      scale.value = withTiming(0.85, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    haptics.tap();
    scale.value = withTiming(0.85, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
    opacity.value = withTiming(0, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    haptics.heavy();
    onConfirm();
    dismiss();
  }, [canConfirm, onConfirm, dismiss]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  // Severe = error red, normal = accent color
  const accentColor = severe ? colors.status.error : colors.accent.primary;
  const iconBgColor = severe
    ? 'rgba(220, 53, 69, 0.1)'
    : colors.accent.primaryLight;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Dark blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centerWrap}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={32} color={colors.status.error} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Typed confirmation */}
          {requireTypedConfirmation && (
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>
                Type DELETE to confirm
              </Text>
              <TextInput
                style={[
                  styles.input,
                  typedText.toUpperCase() === 'DELETE' && styles.inputValid,
                ]}
                value={typedText}
                onChangeText={setTypedText}
                placeholder="DELETE"
                placeholderTextColor={colors.text.meta}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.cancelBtnPressed,
              ]}
              onPress={dismiss}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: canConfirm
                    ? (pressed ? (severe ? '#C12E3E' : colors.interactive.pressedAccentDark) : accentColor)
                    : colors.border.subtle,
                },
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Text
                style={[
                  styles.confirmBtnText,
                  !canConfirm && { color: colors.text.meta },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.modal,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.modal,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  inputWrap: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputValid: {
    borderColor: colors.status.error,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.base,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.background.page,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  cancelBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
