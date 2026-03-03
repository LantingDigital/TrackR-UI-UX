import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';

import { MapCategory } from '../types';
import { MAP_CATEGORY_COLORS } from './poiGeoJSON';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

const FILTER_CHIPS: { category: MapCategory; label: string }[] = [
  { category: 'coaster', label: 'Coasters' },
  { category: 'ride', label: 'Rides' },
  { category: 'food', label: 'Food' },
  { category: 'show', label: 'Shows' },
  { category: 'shop', label: 'Shops' },
];

interface MapFilterChipsProps {
  activeFilters: Set<MapCategory>;
  onToggle: (category: MapCategory) => void;
}

export function MapFilterChips({ activeFilters, onToggle }: MapFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {FILTER_CHIPS.map(({ category, label }) => {
        const color = MAP_CATEGORY_COLORS[category];
        const active = activeFilters.has(category);

        return (
          <Pressable
            key={category}
            onPress={() => onToggle(category)}
            style={[
              styles.chip,
              active
                ? { backgroundColor: `${color}1F`, borderColor: `${color}4D`, borderWidth: 1 }
                : styles.chipInactive,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
              style={[
                styles.label,
                active && { color, fontWeight: typography.weights.semibold },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: spacing.md,
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: spacing.base,
    borderRadius: 15,
    gap: spacing.sm,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.small,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
