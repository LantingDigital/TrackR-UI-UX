/**
 * RemoveFriendSheet — Confirmation bottom sheet for removing a friend.
 *
 * Reuses the same modal pattern as DangerousActionModal but styled as
 * a centered confirmation card. Shows "Remove [name] as a friend?"
 * with Cancel / Remove buttons.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xxxl * 2;

interface RemoveFriendSheetProps {
  visible: boolean;
  friendName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveFriendSheet({
  visible,
  friendName,
  onClose,
  onConfirm,
}: RemoveFriendSheetProps) {
  const [mounted, setMounted] = useState(false);

  const scale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      haptics.warning();
      scale.value = withTiming(1, {
        duration: TIMING.normal,
        easing: Easing.out(Easing.cubic),
      });
      cardOpacity.value = withTiming(1, { duration: TIMING.normal });
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
    } else {
      scale.value = withTiming(0.85, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      cardOpacity.value = withTiming(0, { duration: 200 });
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
    cardOpacity.value = withTiming(0, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, scale, cardOpacity, backdropOpacity]);

  const handleRemove = useCallback(() => {
    haptics.heavy();
    onConfirm();
    dismiss();
  }, [onConfirm, dismiss]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: cardOpacity.value,
  }));

  const bdStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, bdStyle]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="person-remove-outline" size={28} color={colors.status.error} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Remove Friend</Text>

          {/* Message */}
          <Text style={styles.message}>
            Remove {friendName} as a friend? You won't see their activity and they won't see yours.
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.cancelBtnPressed,
              ]}
              onPress={dismiss}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && styles.removeBtnPressed,
              ]}
              onPress={handleRemove}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
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
  removeBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: {
    backgroundColor: '#C12E3E',
  },
  removeBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
