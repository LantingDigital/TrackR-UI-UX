import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { SPRINGS, TIMING } from '../../constants/animations';
import { haptics } from '../../services/haptics';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  visible: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const ACCENT_COLORS: Record<ToastType, string> = {
  success: colors.status.successSoft,
  error: colors.status.error,
  info: colors.accent.primary,
};

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  message,
  duration = 2500,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRINGS.responsive);
      opacity.value = withTiming(1, { duration: TIMING.fast });

      if (type === 'success') haptics.success();
      else if (type === 'error') haptics.error();
      else haptics.tap();

      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: TIMING.normal });
        opacity.value = withTiming(0, { duration: TIMING.normal }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const accentColor = ACCENT_COLORS[type];
  const iconName = ICONS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.md },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <Ionicons
          name={iconName}
          size={20}
          color={accentColor}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  icon: {
    marginRight: spacing.md,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
});
