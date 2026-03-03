import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { TIMING } from '../../../../constants/animations';

// ============================================
// Props
// ============================================

interface ReorderWarningProps {
  message: string;
  visible: boolean;
}

// ============================================
// Component
// ============================================

function ReorderWarningInner({ message, visible }: ReorderWarningProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: TIMING.fast }),
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      <Ionicons
        name="alert-circle-outline"
        size={16}
        color={colors.banner.warningText}
        style={styles.icon}
      />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export const ReorderWarning = memo(ReorderWarningInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.banner.warningBg,
    borderWidth: 1,
    borderColor: colors.banner.warningBorder,
    borderRadius: radius.sm,
    padding: spacing.base,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.meta,
    color: colors.banner.warningText,
  },
});
