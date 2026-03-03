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
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { ParkPOI } from '../types';
import { getEnrichedCoaster } from '../data/coasterDetailData';

// ============================================
// Type badge helpers
// ============================================

const TYPE_LABELS: Record<string, string> = {
  ride: 'Ride',
  food: 'Food',
  shop: 'Shop',
  theater: 'Show',
  attraction: 'Attraction',
  service: 'Service',
};

const AREA_LABELS: Record<string, string> = {
  'camp-snoopy': 'Camp Snoopy',
  'fiesta-village': 'Fiesta Village',
  'boardwalk': 'The Boardwalk',
  'ghost-town': 'Ghost Town',
  'california-marketplace': 'California Marketplace',
  'western-trails': 'Western Trails',
};

// ============================================
// POIActionSheet
// ============================================

interface POIActionSheetProps {
  poi: ParkPOI | null;
  visible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onViewOnMap: () => void;
}

const SHEET_DISMISS_OFFSET = 400;

export function POIActionSheet({
  poi,
  visible,
  onClose,
  onViewDetails,
  onViewOnMap,
}: POIActionSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && poi) {
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else if (!visible) {
      translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, poi]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!poi) return null;

  const typeLabel = TYPE_LABELS[poi.type] || poi.type;
  const areaLabel = AREA_LABELS[poi.area] || poi.area;
  const hasDetails = poi.type === 'ride' && !!getEnrichedCoaster(poi.coasterId || poi.id);
  const isRide = poi.type === 'ride';

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

        {/* Header: POI name + meta */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {poi.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
            <Text style={styles.area}>{areaLabel}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          {hasDetails && (
            <Pressable
              onPress={onViewDetails}
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
          )}

          <Pressable
            onPress={onViewOnMap}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons name="map-outline" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.actionSecondaryText}>View on Map</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={styles.chevron}
            />
          </Pressable>

          {isRide && (
            <Pressable
              onPress={() => haptics.tap()}
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
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  // ---- Overlay ----
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },

  // ---- Sheet ----
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

  // ---- Handle ----
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

  // ---- Header ----
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
  area: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },

  // ---- Divider ----
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },

  // ---- Actions ----
  actions: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  // Shared row structure
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

  // Primary button (View Details)
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

  // Secondary buttons (View on Map, Log Ride)
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
