import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import type { FirstSessionStep } from '../data/firstSessionSteps';

interface FirstSessionCardProps {
  step: FirstSessionStep;
  index: number;
  onAction: (action: FirstSessionStep['ctaAction']) => void;
  onDismiss: (id: string) => void;
}

export const FirstSessionCard: React.FC<FirstSessionCardProps> = ({
  step,
  index,
  onAction,
  onDismiss,
}) => {
  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  // Dismiss animation
  const cardHeight = useSharedValue<number | null>(null);
  const dismissOpacity = useSharedValue(1);
  const dismissScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.stiff));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * dismissOpacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: dismissScale.value },
    ],
  }));

  const handleCTA = () => {
    haptics.tap();
    onAction(step.ctaAction);
  };

  const handleDismiss = () => {
    haptics.tap();
    dismissOpacity.value = withTiming(0, { duration: TIMING.fast });
    dismissScale.value = withSpring(0.95, SPRINGS.stiff, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(step.id);
      }
    });
  };

  return (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      {/* Dismiss X */}
      <Pressable
        onPress={handleDismiss}
        hitSlop={12}
        style={styles.dismissButton}
      >
        <Ionicons name="close" size={16} color={colors.text.meta} />
      </Pressable>

      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <Ionicons
          name={step.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={colors.accent.primary}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>

      {/* CTA Button */}
      <Pressable onPress={handleCTA} style={styles.ctaButton}>
        <Text style={styles.ctaLabel}>{step.ctaLabel}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    ...shadows.card,
  },
  dismissButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    paddingRight: spacing.lg, // space for dismiss button
  },
  title: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
  ctaButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primary,
    flexShrink: 0,
  },
  ctaLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
