/**
 * SettingsBottomSheet
 *
 * Reusable bottom sheet for settings selections (units, rider type, visibility)
 * and warning confirmations (clear cache). Follows the CoasterSheet pattern:
 * BlurView backdrop, pan-to-dismiss, withTiming entrance (no jello), tab bar hide/show.
 *
 * Modes:
 *   - Selection: list of options with radio-style checkmark on selected
 *   - Warning: icon + message + cancel/confirm buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { TIMING } from '../../constants/animations';
import { useSheetTabBar } from '../../contexts/TabBarContext';
import { haptics } from '../../services/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

// ============================================
// Types
// ============================================

export interface SettingsSheetOption {
  key: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;

  // Selection mode
  options?: SettingsSheetOption[];
  selectedKey?: string;
  onSelect?: (key: string) => void;

  // Warning/confirmation mode
  warning?: boolean;
  warningMessage?: string;
  warningIcon?: keyof typeof Ionicons.glyphMap;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

// ============================================
// Component
// ============================================

export function SettingsBottomSheet({
  visible,
  onClose,
  title,
  options,
  selectedKey,
  onSelect,
  warning,
  warningMessage,
  warningIcon = 'warning-outline',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
}: SettingsBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Auto hide/show tab bar when sheet is visible
  useSheetTabBar(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      haptics.select();
      // withTiming slide-up entrance — no bouncy springs (no-jello rule)
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
    } else {
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .enabled(visible)
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, SCREEN_HEIGHT * 0.3],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (
        translateY.value > SCREEN_HEIGHT * 0.15 ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        // Snap back with withTiming — no bouncy spring
        translateY.value = withTiming(0, {
          duration: TIMING.normal,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: TIMING.normal });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSelect = useCallback(
    (key: string) => {
      haptics.select();
      onSelect?.(key);
      // Small delay so user sees the checkmark before sheet closes
      setTimeout(() => {
        dismiss();
      }, 150);
    },
    [onSelect, dismiss],
  );

  const handleConfirm = useCallback(() => {
    haptics.heavy();
    onConfirm?.();
    dismiss();
  }, [onConfirm, dismiss]);

  const handleCancel = useCallback(() => {
    haptics.tap();
    dismiss();
  }, [dismiss]);

  if (!mounted) return null;

  const isSelectionMode = !warning && options && options.length > 0;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet — anchored to bottom */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.handleArea}>
            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Selection mode */}
        {isSelectionMode && (
          <View style={styles.optionsList}>
            {options.map((opt, i) => {
              const isSelected = opt.key === selectedKey;
              const isLast = i === options.length - 1;

              return (
                <Pressable
                  key={opt.key}
                  style={({ pressed }) => [
                    styles.optionRow,
                    !isLast && styles.optionRowBorder,
                    pressed && styles.optionRowPressed,
                  ]}
                  onPress={() => handleSelect(opt.key)}
                >
                  {opt.icon && (
                    <View style={[
                      styles.optionIcon,
                      isSelected && styles.optionIconSelected,
                    ]}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={isSelected ? colors.accent.primary : colors.text.secondary}
                      />
                    </View>
                  )}
                  <View style={styles.optionTextGroup}>
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {opt.label}
                    </Text>
                    {opt.description ? (
                      <Text style={styles.optionDescription}>{opt.description}</Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.accent.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Warning/confirmation mode */}
        {warning && (
          <View style={styles.warningContent}>
            {warningIcon && (
              <View style={styles.warningIconCircle}>
                <Ionicons name={warningIcon} size={32} color={colors.accent.primary} />
              </View>
            )}
            {warningMessage && (
              <Text style={styles.warningMessage}>{warningMessage}</Text>
            )}
            <View style={styles.warningButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.confirmButtonPressed,
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },

  // -- Selection mode --
  optionsList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.page,
    borderRadius: radius.card,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base + spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  optionRowPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  optionIconSelected: {
    backgroundColor: colors.accent.primaryLight,
  },
  optionTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  optionLabelSelected: {
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  optionDescription: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // -- Warning mode --
  warningContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  warningIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  warningMessage: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xxl,
  },
  warningButtons: {
    flexDirection: 'row',
    gap: spacing.base,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.background.page,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  cancelButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  confirmButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
