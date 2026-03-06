// ============================================
// Category Chips — Horizontal filter pills
// ============================================

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';

// ============================================
// Types
// ============================================

export type ChipCategory = 'all' | 'ride' | 'food' | 'shop' | 'theater' | 'attraction';

interface CategoryChipsProps {
  selected: ChipCategory;
  onSelect: (cat: ChipCategory) => void;
}

const CHIPS: Array<{ key: ChipCategory; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'ride', label: 'Rides', icon: 'flash-outline' },
  { key: 'food', label: 'Food', icon: 'restaurant-outline' },
  { key: 'shop', label: 'Shops', icon: 'bag-outline' },
  { key: 'theater', label: 'Shows', icon: 'musical-notes-outline' },
  { key: 'attraction', label: 'More', icon: 'star-outline' },
];

// ============================================
// Component
// ============================================

function CategoryChipsInner({ selected, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map((chip) => {
        const isActive = chip.key === selected;
        return (
          <Chip
            key={chip.key}
            chipKey={chip.key}
            label={chip.label}
            icon={chip.icon}
            isActive={isActive}
            onSelect={onSelect}
          />
        );
      })}
    </ScrollView>
  );
}

export const CategoryChips = memo(CategoryChipsInner);

// ============================================
// Single Chip
// ============================================

const Chip = memo(function Chip({
  chipKey,
  label,
  icon,
  isActive,
  onSelect,
}: {
  chipKey: ChipCategory;
  label: string;
  icon: string;
  isActive: boolean;
  onSelect: (cat: ChipCategory) => void;
}) {
  const handlePress = useCallback(() => {
    haptics.tap();
    onSelect(chipKey);
  }, [chipKey, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.chip, isActive && styles.chipActive]}>
        <Ionicons
          name={icon as any}
          size={14}
          color={isActive ? colors.text.inverse : colors.text.secondary}
          style={styles.chipIcon}
        />
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  chipActive: {
    backgroundColor: colors.accent.primary,
  },
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
});
