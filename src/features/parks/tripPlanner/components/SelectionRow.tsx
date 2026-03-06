// ============================================
// Selection Row — Single POI in selection list
//
// 56px minimum height to prevent text overlap.
// Ionicons category icon + name + area + checkbox.
// ============================================

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';
import type { SelectablePOI } from '../types';

// ============================================
// Props
// ============================================

interface SelectionRowProps {
  poi: SelectablePOI;
  isSelected: boolean;
  onToggle: (poiId: string) => void;
}

// ============================================
// Category → icon mapping
// ============================================

const CATEGORY_ICON: Record<string, string> = {
  ride: 'flash-outline',
  food: 'restaurant-outline',
  shop: 'bag-outline',
  theater: 'musical-notes-outline',
  attraction: 'star-outline',
  service: 'information-circle-outline',
};

const AREA_LABELS: Record<string, string> = {
  'camp-snoopy': 'Camp Snoopy',
  'fiesta-village': 'Fiesta Village',
  'boardwalk': 'Boardwalk',
  'ghost-town': 'Ghost Town',
  'california-marketplace': 'Marketplace',
  'western-trails': 'Western Trails',
};

// ============================================
// Component
// ============================================

function SelectionRowInner({ poi, isSelected, onToggle }: SelectionRowProps) {
  const handlePress = useCallback(() => {
    haptics.tap();
    onToggle(poi.id);
  }, [poi.id, onToggle]);

  const icon = CATEGORY_ICON[poi.category] ?? 'ellipse-outline';
  const areaLabel = poi.area ? AREA_LABELS[poi.area] ?? poi.area : '';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={isSelected ? colors.accent.primary : colors.text.meta}
        />
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.name} numberOfLines={1}>{poi.name}</Text>
        {areaLabel.length > 0 && (
          <Text style={styles.area} numberOfLines={1}>{areaLabel}</Text>
        )}
      </View>

      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
        )}
      </View>
    </Pressable>
  );
}

export const SelectionRow = memo(SelectionRowInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  rowPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.accent.primaryLight,
  },
  textColumn: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.base,
  },
  name: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  area: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
});
