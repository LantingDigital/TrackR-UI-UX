// ============================================
// Selection View — Phase 1
//
// Park name header, category chips, search bar,
// scrollable POI list, "Next" footer.
// ============================================

import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { DELAYS } from '../../../../constants/animations';
import { CategoryChips, ChipCategory } from './CategoryChips';
import { SelectionRow } from './SelectionRow';
import { ActionButton } from './ActionButton';
import type { SelectablePOI } from '../types';

// ============================================
// Props
// ============================================

interface SelectionViewProps {
  parkName: string;
  pois: SelectablePOI[];
  selectedIds: Set<string>;
  onToggle: (poiId: string) => void;
  onNext: () => void;
}

// ============================================
// Component
// ============================================

function SelectionViewInner({
  parkName,
  pois,
  selectedIds,
  onToggle,
  onNext,
}: SelectionViewProps) {
  const [category, setCategory] = useState<ChipCategory>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = pois;
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (search.length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.area && p.area.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [pois, category, search]);

  const selectedCount = selectedIds.size;

  const renderItem = useCallback(
    ({ item }: { item: SelectablePOI }) => (
      <SelectionRow
        poi={item}
        isSelected={selectedIds.has(item.id)}
        onToggle={onToggle}
      />
    ),
    [selectedIds, onToggle],
  );

  const keyExtractor = useCallback((item: SelectablePOI) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <Text style={styles.parkName}>{parkName}</Text>
        <Text style={styles.subtitle}>Choose your stops</Text>
      </Animated.View>

      {/* Category chips */}
      <Animated.View entering={FadeInUp.delay(DELAYS.cascade).duration(200)}>
        <CategoryChips selected={category} onSelect={setCategory} />
      </Animated.View>

      {/* Search bar */}
      <Animated.View entering={FadeInUp.delay(DELAYS.cascade * 2).duration(200)} style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search attractions..."
          placeholderTextColor={colors.text.meta}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      {/* POI list */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Footer */}
      <View style={styles.footer}>
        <ActionButton
          label={selectedCount > 0 ? `Next (${selectedCount} selected)` : 'Select stops to continue'}
          onPress={onNext}
          disabled={selectedCount === 0}
        />
      </View>
    </View>
  );
}

export const SelectionView = memo(SelectionViewInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  parkName: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.background.input,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
});
