/**
 * QuickActionsMenu Component
 *
 * Bottom sheet for pass quick actions, matching the RideActionSheet pattern.
 * Appears on long-press of a pass card.
 *
 * Actions:
 * - Scan: Opens gate mode with this pass
 * - Pin/Unpin: Toggle favorite status (max 3)
 * - Edit: Navigate to edit pass details
 * - Delete: Remove pass (with confirmation styling)
 *
 * Design:
 * - Bottom sheet with blur backdrop (matches RideActionSheet)
 * - Drag handle for dismiss gesture
 * - Reanimated spring entrance, timing exit
 * - Haptic feedback on actions
 * - Uses theme constants throughout
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SPRINGS } from '../../constants/animations';

// ============================================
// Types
// ============================================

interface QuickActionsMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** The ticket to perform actions on */
  ticket: Ticket | null;
  /** Called when menu should close */
  onClose: () => void;
  /** Called when Scan is pressed - opens gate mode */
  onScan?: (ticket: Ticket) => void;
  /** Called when Pin/Unpin is pressed */
  onToggleFavorite?: (ticket: Ticket) => void;
  /** Called when Edit is pressed */
  onEdit?: (ticket: Ticket) => void;
  /** Called when Delete is pressed */
  onDelete?: (ticket: Ticket) => void;
  /** Whether favorites limit (3) is reached - disables pin action */
  favoritesLimitReached?: boolean;
}

// ============================================
// Component
// ============================================

const SHEET_DISMISS_OFFSET = 500;

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  ticket,
  onClose,
  onScan,
  onToggleFavorite,
  onEdit,
  onDelete,
  favoritesLimitReached = false,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && ticket) {
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else if (!visible) {
      translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, ticket]);

  const dismiss = useCallback(() => {
    haptics.tap();
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const handleAction = useCallback((action: () => void) => {
    haptics.tap();
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(action)();
        runOnJS(onClose)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!ticket) return null;

  const isFavorite = ticket.isFavorite;
  const canPin = isFavorite || !favoritesLimitReached;
  const passTypeLabel = PASS_TYPE_LABELS[ticket.passType] || ticket.passType;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.xl },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {ticket.parkName}
          </Text>
          <View style={styles.meta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{passTypeLabel}</Text>
            </View>
            {ticket.passholder && (
              <Text style={styles.passholder}>{ticket.passholder}</Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          {/* Scan — Primary action */}
          <Pressable
            onPress={() => onScan && handleAction(() => onScan(ticket))}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionPrimary,
              pressed && styles.actionPrimaryPressed,
            ]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="scan" size={18} color={colors.text.inverse} />
            </View>
            <Text style={styles.actionPrimaryText}>Scan at Gate</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.text.inverse}
              style={styles.chevron}
            />
          </Pressable>

          {/* Toggle Favorite */}
          <Pressable
            onPress={() => canPin && onToggleFavorite && handleAction(() => onToggleFavorite(ticket))}
            disabled={!canPin}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
              !canPin && styles.actionDisabled,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={isFavorite ? '#FFD700' : colors.accent.primary}
              />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionSecondaryText, !canPin && styles.actionTextDisabled]}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
              {!canPin && !isFavorite && (
                <Text style={styles.actionHint}>Max 3 favorites reached</Text>
              )}
            </View>
            {canPin && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.meta}
                style={styles.chevron}
              />
            )}
          </Pressable>

          {/* Edit Details */}
          <Pressable
            onPress={() => onEdit && handleAction(() => onEdit(ticket))}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons name="pencil" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.actionSecondaryText}>Edit Details</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={styles.chevron}
            />
          </Pressable>

          {/* Delete — Destructive */}
          <Pressable
            onPress={() => onDelete && handleAction(() => onDelete(ticket))}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionDestructive,
              pressed && styles.actionDestructivePressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconDestructive]}>
              <Ionicons name="trash" size={18} color={colors.status.error} />
            </View>
            <Text style={styles.actionDestructiveText}>Delete Pass</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.status.error}
              style={styles.chevron}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================
// Styles (mirrors RideActionSheet pattern)
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.base,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  name: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
    marginBottom: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  typeBadgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  passholder: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },
  actions: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  chevron: {
    marginLeft: 'auto',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionHint: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },

  // Primary (accent background)
  actionPrimary: {
    backgroundColor: colors.accent.primary,
  },
  actionPrimaryPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  actionPrimaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // Secondary (input background)
  actionSecondary: {
    backgroundColor: colors.background.input,
  },
  actionSecondaryPressed: {
    backgroundColor: colors.border.subtle,
  },
  actionIconSecondary: {
    backgroundColor: colors.accent.primaryLight,
  },
  actionSecondaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  actionTextDisabled: {
    color: colors.text.meta,
  },
  actionDisabled: {
    opacity: 0.5,
  },

  // Destructive (delete)
  actionDestructive: {
    backgroundColor: '#FFEBEE',
  },
  actionDestructivePressed: {
    backgroundColor: '#FFCDD2',
  },
  actionIconDestructive: {
    backgroundColor: '#FFCDD2',
  },
  actionDestructiveText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.status.error,
  },
});

export default QuickActionsMenu;
