// ============================================
// Overflow Menu — Three-dot dropdown
//
// Add Break / Pause Trip / End Trip.
// Scale + opacity spring entrance.
// ============================================

import React, { memo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';

// ============================================
// Props
// ============================================

interface OverflowMenuProps {
  visible: boolean;
  isPaused: boolean;
  onClose: () => void;
  onAddBreak: () => void;
  onPauseTrip: () => void;
  onEndTrip: () => void;
}

// ============================================
// Component
// ============================================

function OverflowMenuInner({
  visible,
  isPaused,
  onClose,
  onAddBreak,
  onPauseTrip,
  onEndTrip,
}: OverflowMenuProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Menu */}
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(100)}
        style={styles.menu}
      >
        <MenuItem
          icon="cafe-outline"
          label="Add a Break"
          onPress={() => { haptics.tap(); onAddBreak(); onClose(); }}
        />
        <View style={styles.separator} />
        <MenuItem
          icon={isPaused ? 'play-outline' : 'pause-outline'}
          label={isPaused ? 'Resume Trip' : 'Pause Trip'}
          onPress={() => { haptics.tap(); onPauseTrip(); onClose(); }}
        />
        <View style={styles.separator} />
        <MenuItem
          icon="close-circle-outline"
          label="End Trip"
          onPress={() => { haptics.heavy(); onEndTrip(); onClose(); }}
          danger
        />
      </Animated.View>
    </>
  );
}

export const OverflowMenu = memo(OverflowMenuInner);

// ============================================
// Menu Item
// ============================================

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={danger ? colors.status.error : colors.text.primary}
        style={styles.itemIcon}
      />
      <Text style={[styles.itemLabel, danger && styles.itemLabelDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  menu: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    minWidth: 180,
    zIndex: 21,
    ...shadows.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  itemPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  itemIcon: {
    marginRight: spacing.base,
  },
  itemLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  itemLabelDanger: {
    color: colors.status.error,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.base,
  },
});
