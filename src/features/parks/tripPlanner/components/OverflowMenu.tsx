// ============================================
// Overflow Menu — Three-dot dropdown
//
// Actions: Add Break, Pause/Resume Trip, End Trip.
// Animated dropdown from top-right corner.
// Only mounts when visible.
// ============================================

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { haptics } from '../../../../services/haptics';

// ============================================
// Props
// ============================================

interface OverflowMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddBreak: () => void;
  onPauseTrip: () => void;
  onEndTrip: () => void;
  isPaused: boolean;
}

// ============================================
// Menu Item
// ============================================

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const textColor = destructive ? colors.status.error : colors.text.primary;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={textColor}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

// ============================================
// Component
// ============================================

function OverflowMenuInner({
  visible,
  onClose,
  onAddBreak,
  onPauseTrip,
  onEndTrip,
  isPaused,
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
          onPress={() => { onAddBreak(); onClose(); }}
        />
        <MenuItem
          icon={isPaused ? 'play-outline' : 'pause-outline'}
          label={isPaused ? 'Resume Trip' : 'Pause Trip'}
          onPress={() => { onPauseTrip(); onClose(); }}
        />
        <View style={styles.separator} />
        <MenuItem
          icon="close-circle-outline"
          label="End Trip"
          onPress={() => { onEndTrip(); onClose(); }}
          destructive
        />
      </Animated.View>
    </>
  );
}

export const OverflowMenu = memo(OverflowMenuInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    ...shadows.card,
    zIndex: 11,
    minWidth: 180,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  menuItemPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  menuIcon: {
    marginRight: spacing.base,
  },
  menuLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xs,
  },
});
