/**
 * TimelineActionSheet — Bottom sheet for timeline entry long-press actions.
 * Mirrors CardActionSheet visual language.
 *
 * Actions: Edit Date (inline DateTimePicker), Edit Rating, Delete Ride.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS } from '../constants/animations';
import { haptics } from '../services/haptics';
import { useTabBar } from '../contexts/TabBarContext';

// ============================================
// Types
// ============================================

export interface TimelineActionTarget {
  logId: string;
  coasterId: string;
  coasterName: string;
  parkName: string;
  timestamp: string;
  isRated: boolean;
}

interface TimelineActionSheetProps {
  target: TimelineActionTarget | null;
  visible: boolean;
  onClose: () => void;
  onDateChanged: (logId: string, newTimestamp: string) => void;
  onEditRating: (target: TimelineActionTarget) => void;
  onDelete: (target: TimelineActionTarget) => void;
}

const SHEET_DISMISS_OFFSET = 500;

// ============================================
// Component
// ============================================

export function TimelineActionSheet({
  target,
  visible,
  onClose,
  onDateChanged,
  onEditRating,
  onDelete,
}: TimelineActionSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const datePickerExpand = useSharedValue(0);

  useEffect(() => {
    if (visible && target) {
      setShowDatePicker(false);
      setPendingDate(null);
      datePickerExpand.value = 0;
      tabBar?.hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else if (!visible) {
      tabBar?.showTabBar();
      setShowDatePicker(false);
      datePickerExpand.value = 0;
      translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, target]);

  const dismiss = useCallback(() => {
    tabBar?.showTabBar();
    // Apply pending date if picker was open with a selection
    if (pendingDate && target) {
      onDateChanged(target.logId, pendingDate.toISOString());
    }
    setShowDatePicker(false);
    setPendingDate(null);
    datePickerExpand.value = 0;
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, tabBar, pendingDate, target, onDateChanged]);

  const handleDatePress = useCallback(() => {
    haptics.tap();
    if (showDatePicker) {
      // Collapse: animate out, apply pending date, then unmount
      datePickerExpand.value = withTiming(0, { duration: 250 });
      if (pendingDate && target) {
        onDateChanged(target.logId, pendingDate.toISOString());
      }
      setTimeout(() => {
        setShowDatePicker(false);
        setPendingDate(null);
      }, 260);
    } else {
      // Expand: mount first, then animate in
      setShowDatePicker(true);
      setPendingDate(null);
      datePickerExpand.value = withTiming(1, { duration: 300 });
    }
  }, [showDatePicker, pendingDate, target, onDateChanged]);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate) return;
      setPendingDate(selectedDate);
    },
    [],
  );

  const handleEditRating = useCallback(() => {
    if (!target) return;
    haptics.tap();
    tabBar?.showTabBar();
    onEditRating(target);
  }, [target, onEditRating, tabBar]);

  const handleDelete = useCallback(() => {
    if (!target) return;
    haptics.tap();
    tabBar?.showTabBar();
    onDelete(target);
  }, [target, onDelete, tabBar]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const datePickerAnimStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(datePickerExpand.value, [0, 1], [0, 380], Extrapolation.CLAMP),
    opacity: datePickerExpand.value,
    marginTop: interpolate(datePickerExpand.value, [0, 1], [0, -spacing.xs], Extrapolation.CLAMP),
  }));

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(datePickerExpand.value, [0, 1], [0, 90], Extrapolation.CLAMP)}deg` },
    ],
  }));

  if (!target) return null;

  const displayDate = pendingDate ?? new Date(target.timestamp);
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
            {target.coasterName}
          </Text>
          <Text style={styles.parkLabel}>{target.parkName}</Text>
          <Text style={styles.dateLabel}>{formattedDate}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          {/* Edit Date */}
          <Pressable
            onPress={handleDatePress}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionPrimary,
              pressed && styles.actionPrimaryPressed,
            ]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={colors.text.inverse} />
            </View>
            <Text style={styles.actionPrimaryText}>Edit Date</Text>
            <Animated.View style={[styles.chevron, chevronAnimStyle]}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.text.inverse}
              />
            </Animated.View>
          </Pressable>

          {/* Inline Date Picker — animated expand/collapse */}
          {showDatePicker && (
            <Animated.View style={[styles.datePickerWrap, datePickerAnimStyle]}>
              <DateTimePicker
                value={new Date(target.timestamp)}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={handleDateChange}
                textColor={colors.text.primary}
              />
            </Animated.View>
          )}

          {/* Edit Rating */}
          <Pressable
            onPress={handleEditRating}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons
                name={target.isRated ? 'star' : 'star-outline'}
                size={18}
                color={colors.accent.primary}
              />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionSecondaryText}>
                {target.isRated ? 'Edit Rating' : 'Rate This Ride'}
              </Text>
              <Text style={styles.actionDisclaimer}>
                Rating applies to all rides on this coaster
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={styles.chevron}
            />
          </Pressable>

          {/* Delete Ride */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionDestructive,
              pressed && styles.actionDestructivePressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconDestructive]}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </View>
            <Text style={styles.actionDestructiveText}>Delete Ride</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#DC2626"
              style={styles.chevron}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
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
    marginBottom: spacing.xs,
  },
  parkLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  dateLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: 2,
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
  actionTextWrap: {
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },

  // Primary (Edit Date)
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
    flex: 1,
  },

  // Secondary (Edit Rating)
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
  actionDisclaimer: {
    fontSize: typography.sizes.small,
    fontStyle: 'italic',
    color: colors.text.meta,
    marginTop: 1,
  },

  // Destructive (Delete)
  actionDestructive: {
    backgroundColor: '#FEE2E2',
  },
  actionDestructivePressed: {
    backgroundColor: '#FECACA',
  },
  actionIconDestructive: {
    backgroundColor: '#FEE2E2',
  },
  actionDestructiveText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: '#DC2626',
    flex: 1,
  },

  // Date Picker
  datePickerWrap: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
});
