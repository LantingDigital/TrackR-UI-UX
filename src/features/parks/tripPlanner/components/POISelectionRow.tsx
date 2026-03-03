import React, { memo } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { useSpringPress } from '../../../../hooks/useSpringPress';
import type { SelectablePOI, POICategory } from '../types';

// ============================================
// Category Icon Mapping
// ============================================

const CATEGORY_ICONS: Record<POICategory, keyof typeof Ionicons.glyphMap> = {
  ride: 'flash-outline',
  food: 'restaurant-outline',
  shop: 'bag-outline',
  theater: 'film-outline',
  attraction: 'star-outline',
  service: 'information-circle-outline',
  break: 'cafe-outline',
};

// ============================================
// Props
// ============================================

interface POISelectionRowProps {
  poi: SelectablePOI;
  selected: boolean;
  onToggle: () => void;
}

// ============================================
// Component
// ============================================

function POISelectionRowInner({ poi, selected, onToggle }: POISelectionRowProps) {
  const { pressHandlers, animatedStyle } = useSpringPress();

  const metaText =
    poi.category === 'ride' && poi.thrillLevel
      ? poi.thrillLevel.charAt(0).toUpperCase() + poi.thrillLevel.slice(1)
      : poi.category === 'food' && poi.menuDescription
        ? poi.menuDescription
        : poi.area ?? '';

  return (
    <Pressable onPress={onToggle} {...pressHandlers}>
      <Animated.View style={[styles.row, animatedStyle]}>
        {/* Checkbox */}
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Ionicons
              name={CATEGORY_ICONS[poi.category]}
              size={18}
              color={colors.text.meta}
              style={styles.categoryIcon}
            />
            <Text style={styles.name} numberOfLines={1}>
              {poi.name}
            </Text>
          </View>
          {metaText !== '' && (
            <Text style={styles.meta} numberOfLines={1}>
              {metaText}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const POISelectionRow = memo(POISelectionRowInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  content: {
    flex: 1,
    marginLeft: spacing.base,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
    marginLeft: 18 + spacing.sm, // align under name, past icon
  },
});
