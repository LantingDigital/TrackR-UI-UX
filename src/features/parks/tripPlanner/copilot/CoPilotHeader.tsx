// ============================================
// Co-Pilot Header — Compact top bar
//
// Close button, progress counter with pace
// indicator, and overflow menu button.
// ============================================

import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { PaceIndicator } from './PaceIndicator';
import type { PaceSnapshot } from '../types';

interface CoPilotHeaderProps {
  completedCount: number;
  totalStops: number;
  paceSnapshot: PaceSnapshot | null;
  onClose: () => void;
  onPause: () => void;
  onAbandon: () => void;
  onAddBreak: () => void;
}

function CoPilotHeaderInner({
  completedCount,
  totalStops,
  paceSnapshot,
  onClose,
  onPause,
  onAbandon,
  onAddBreak,
}: CoPilotHeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable onPress={onClose} hitSlop={8} style={styles.btn}>
        <Ionicons name="chevron-down" size={24} color={colors.text.primary} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.progress}>{completedCount} of {totalStops}</Text>
        <PaceIndicator snapshot={paceSnapshot} />
      </View>

      <Pressable onPress={toggleMenu} hitSlop={8} style={styles.btn}>
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
      </Pressable>

      {/* Overflow menu */}
      {menuOpen && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
          <View style={[styles.menu, { top: insets.top + 52 }]}>
            <MenuItem
              icon="add-circle-outline"
              label="Add break"
              onPress={() => { closeMenu(); onAddBreak(); }}
            />
            <MenuItem
              icon="pause-circle-outline"
              label="Pause trip"
              onPress={() => { closeMenu(); onPause(); }}
            />
            <MenuItem
              icon="close-circle-outline"
              label="End trip"
              onPress={() => { closeMenu(); onAbandon(); }}
              danger
            />
          </View>
        </>
      )}
    </View>
  );
}

export const CoPilotHeader = memo(CoPilotHeaderInner);

// ============================================
// Menu Item (internal)
// ============================================

function MenuItem({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.status.error : colors.text.primary}
      />
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  progress: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  menu: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    zIndex: 51,
    minWidth: 180,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  menuItemPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  menuItemText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  menuItemDanger: {
    color: colors.status.error,
  },
});
