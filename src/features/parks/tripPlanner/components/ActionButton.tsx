// ============================================
// Action Button — Full-width spring-animated CTA
//
// Shared button component for Execute, Preview,
// and Summary phases.
// ============================================

import React, { memo, useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { useSpringPress } from '../../../../hooks/useSpringPress';

// ============================================
// Props
// ============================================

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  disabled?: boolean;
}

// ============================================
// Variant Styles
// ============================================

const VARIANT_BG = {
  primary: colors.accent.primary,
  success: colors.status.success,
  danger: 'transparent',
  ghost: 'transparent',
} as const;

const VARIANT_TEXT = {
  primary: colors.text.inverse,
  success: colors.text.inverse,
  danger: colors.status.error,
  ghost: colors.text.meta,
} as const;

// ============================================
// Component
// ============================================

function ActionButtonInner({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ActionButtonProps) {
  const { pressHandlers, animatedStyle } = useSpringPress({ disabled });

  return (
    <Pressable onPress={onPress} disabled={disabled} {...pressHandlers}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: VARIANT_BG[variant] },
          disabled && styles.disabled,
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.text.meta : VARIANT_TEXT[variant] },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export const ActionButton = memo(ActionButtonInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  disabled: {
    backgroundColor: colors.border.subtle,
  },
});
