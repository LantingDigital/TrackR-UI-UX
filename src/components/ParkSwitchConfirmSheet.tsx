/**
 * ParkSwitchConfirmSheet — Themed confirmation for switching home park
 *
 * Appears when a user taps "View on Map" for a ride at a different park
 * than their current home park. Mirrors the RideActionSheet design language.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS } from '../constants/animations';
import { useTabBar } from '../contexts/TabBarContext';

interface ParkSwitchConfirmSheetProps {
  visible: boolean;
  currentParkName: string;
  targetParkName: string;
  rideName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismissStart?: () => void;
}

const SHEET_DISMISS_OFFSET = 400;

export function ParkSwitchConfirmSheet({
  visible,
  currentParkName,
  targetParkName,
  rideName,
  onConfirm,
  onCancel,
  onDismissStart,
}: ParkSwitchConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      tabBar?.hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    onDismissStart?.();
    tabBar?.showTabBar();
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onCancel)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onCancel, onDismissStart, tabBar]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.xl },
          sheetStyle,
        ]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="swap-horizontal" size={24} color={colors.accent.primary} />
          </View>
          <Text style={styles.title}>Switch Park?</Text>
          <Text style={styles.message}>
            Your home park is currently{' '}
            <Text style={styles.bold}>{currentParkName}</Text>. Switch to{' '}
            <Text style={styles.bold}>{targetParkName}</Text> to view{' '}
            <Text style={styles.bold}>{rideName}</Text> on the map?
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              tabBar?.showTabBar();
              translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 });
              backdropOpacity.value = withTiming(0, { duration: 200 });
              onConfirm();
            }}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionPrimary,
              pressed && styles.actionPrimaryPressed,
            ]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
            </View>
            <Text style={styles.actionPrimaryText}>Switch Park</Text>
          </Pressable>

          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons name="close" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.actionSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 210,
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.base,
  },
  handle: {
    width: 36, height: 5, borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  bold: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  actionIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  actionPrimary: {
    backgroundColor: colors.accent.primary,
  },
  actionPrimaryPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  actionPrimaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  actionSecondary: {
    backgroundColor: colors.background.input,
  },
  actionSecondaryPressed: {
    backgroundColor: colors.border.subtle,
  },
  actionIconSecondary: {
    backgroundColor: colors.accent.primaryLight,
  },
  actionSecondaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
});
