/**
 * RideActionSheet — Bottom sheet with ride actions
 *
 * Mirrors the POIActionSheet design from parks, but works with
 * coaster index data (search results, feed cards, etc.).
 *
 * Actions: View Details, View on Map, Log Ride
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS } from '../constants/animations';
import { useTabBar } from '../contexts/TabBarContext';

// ============================================
// Types
// ============================================

export interface RideActionData {
  id: string;
  name: string;
  parkName: string;
  imageUrl?: string;
}

interface RideActionSheetProps {
  ride: RideActionData | null;
  visible: boolean;
  onClose: () => void;
  onDismissStart?: () => void;
  onViewDetails: (ride: RideActionData) => void;
  onLogRide: (ride: RideActionData) => void;
  onViewRankings?: (ride: RideActionData) => void;
}

// ============================================
// Component
// ============================================

const SHEET_DISMISS_OFFSET = 400;

export function RideActionSheet({
  ride,
  visible,
  onClose,
  onDismissStart,
  onViewDetails,
  onLogRide,
  onViewRankings,
}: RideActionSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && ride) {
      tabBar?.hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [visible, ride]);

  const dismiss = useCallback(() => {
    onDismissStart?.();
    tabBar?.showTabBar();
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, onDismissStart, tabBar]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!ride) return null;

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
            {ride.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>Ride</Text>
            </View>
            <Text style={styles.parkName}>{ride.parkName}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              dismiss();
              onViewDetails(ride);
            }}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionPrimary,
              pressed && styles.actionPrimaryPressed,
            ]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="stats-chart" size={18} color={colors.text.inverse} />
            </View>
            <Text style={styles.actionPrimaryText}>View Details</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.text.inverse}
              style={styles.chevron}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              dismiss();
              onLogRide(ride);
            }}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.accent.primary}
              />
            </View>
            <Text style={styles.actionSecondaryText}>Log Ride</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={styles.chevron}
            />
          </Pressable>

          {onViewRankings && (
            <Pressable
              onPress={() => {
                dismiss();
                onViewRankings(ride);
              }}
              style={({ pressed }) => [
                styles.actionRow,
                styles.actionSecondary,
                pressed && styles.actionSecondaryPressed,
              ]}
            >
              <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
                <Ionicons name="trophy-outline" size={18} color={colors.accent.primary} />
              </View>
              <Text style={styles.actionSecondaryText}>View Rankings</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.meta}
                style={styles.chevron}
              />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles (mirrors POIActionSheet)
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
  parkName: {
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
});
