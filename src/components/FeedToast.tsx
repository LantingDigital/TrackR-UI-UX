/**
 * FeedToast — Bottom-positioned toast/snackbar for feed actions.
 *
 * Appears above the tab bar with an optional "Undo" action button.
 * Slides up from below with withTiming, auto-dismisses after a configurable duration.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';

export interface FeedToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
  onDismiss: () => void;
}

const TAB_BAR_HEIGHT = 49;
const TOAST_OFFSCREEN = 120;

export const FeedToast: React.FC<FeedToastProps> = ({
  visible,
  message,
  duration = 3000,
  undoLabel,
  onUndo,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(TOAST_OFFSCREEN);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const animateOut = useCallback(() => {
    translateY.value = withTiming(TOAST_OFFSCREEN, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [onDismiss, translateY, opacity]);

  useEffect(() => {
    if (visible) {
      haptics.tap();
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });

      clearTimer();
      timerRef.current = setTimeout(() => {
        animateOut();
      }, duration);
    }

    return clearTimer;
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.md },
        animatedStyle,
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {undoLabel && onUndo && (
          <Pressable
            onPress={() => {
              haptics.tap();
              clearTimer();
              onUndo();
              animateOut();
            }}
            hitSlop={8}
            style={styles.undoButton}
          >
            <Text style={styles.undoText}>{undoLabel}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9998,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    paddingLeft: spacing.lg,
    paddingRight: spacing.base,
    ...shadows.card,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  undoButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
  },
  undoText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
});
