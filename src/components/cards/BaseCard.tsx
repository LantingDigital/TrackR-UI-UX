/**
 * BaseCard Component
 *
 * The foundation for all card-style components in TrackR.
 * Provides consistent styling, shadows, press feedback, and animation.
 *
 * Usage:
 *   <BaseCard onPress={handlePress}>
 *     <Text>Card content</Text>
 *   </BaseCard>
 *
 *   <BaseCard variant="elevated" pressScale="strong">
 *     <Text>Elevated card with strong press</Text>
 *   </BaseCard>
 */

import React from 'react';
import {
  StyleSheet,
  ViewStyle,
  Pressable,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { useSpringPress } from '../../hooks/useSpringPress';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { PRESS_SCALES } from '../../constants/animations';

// ===========================================
// Types
// ===========================================

export type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined';
export type PressScale = 'subtle' | 'normal' | 'strong' | 'none';

export interface BaseCardProps {
  /**
   * Card content.
   */
  children: React.ReactNode;

  /**
   * Visual variant of the card.
   * - default: Standard shadow
   * - elevated: More prominent shadow
   * - flat: No shadow
   * - outlined: Border instead of shadow
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Press feedback intensity.
   * @default 'normal'
   */
  pressScale?: PressScale;

  /**
   * Border radius preset or custom value.
   * @default radius.card (20)
   */
  borderRadius?: number;

  /**
   * Whether the card is pressable.
   * @default true if onPress is provided
   */
  pressable?: boolean;

  /**
   * Whether the card is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Press handler.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Long press handler.
   */
  onLongPress?: (event: GestureResponderEvent) => void;

  /**
   * Additional styles for the card container.
   */
  style?: ViewStyle;

  /**
   * Test ID for testing.
   */
  testID?: string;
}

// ===========================================
// Shadow Presets
// ===========================================

const SHADOWS: Record<CardVariant, ViewStyle> = {
  default: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 32,
    elevation: 12,
  },
  flat: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  outlined: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ===========================================
// Scale Value Mapping
// ===========================================

const SCALE_MAP: Record<PressScale, number> = {
  subtle: PRESS_SCALES.subtle,
  normal: PRESS_SCALES.normal,
  strong: PRESS_SCALES.strong,
  none: 1,
};

// ===========================================
// Component
// ===========================================

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  variant = 'default',
  pressScale = 'normal',
  borderRadius: customBorderRadius,
  pressable: customPressable,
  disabled = false,
  onPress,
  onLongPress,
  style,
  testID,
}) => {
  // Determine if pressable
  const isPressable = customPressable ?? (!!onPress || !!onLongPress);
  const scale = SCALE_MAP[pressScale];

  // Get press feedback (only if pressable and not disabled)
  const { scaleValue, opacityValue, pressHandlers } = useSpringPress({
    scale,
    opacity: isPressable ? 0.95 : 1,
    disabled: disabled || !isPressable,
  });

  // Compute styles
  const cardBorderRadius = customBorderRadius ?? radius.card;
  const shadowStyle = SHADOWS[variant];
  const borderStyle = variant === 'outlined' ? styles.outlined : undefined;

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: colors.background.card,
    borderRadius: cardBorderRadius,
    ...shadowStyle,
    ...borderStyle,
    ...(disabled && styles.disabled),
    ...style,
  };

  // If not pressable, render without Pressable wrapper
  if (!isPressable) {
    return (
      <Animated.View style={containerStyle} testID={testID}>
        {children}
      </Animated.View>
    );
  }

  // Render pressable card
  return (
    <Animated.View
      style={[
        containerStyle,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
      testID={testID}
    >
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.pressable}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// ===========================================
// Styles
// ===========================================

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  disabled: {
    opacity: 0.5,
  },
});

// ===========================================
// Default Export
// ===========================================

export default BaseCard;
