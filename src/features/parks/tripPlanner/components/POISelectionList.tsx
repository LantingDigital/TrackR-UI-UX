import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';
import { POISelectionRow } from './POISelectionRow';
import type { SelectablePOI, POICategory } from '../types';

// ============================================
// Category config
// ============================================

interface CategoryTab {
  key: POICategory | 'all';
  label: string;
  icon: string;
}

const ALL_TAB: CategoryTab = { key: 'all', label: 'All', icon: 'grid-outline' };

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'ride', label: 'Rides', icon: 'flash-outline' },
  { key: 'food', label: 'Food', icon: 'restaurant-outline' },
  { key: 'shop', label: 'Shops', icon: 'bag-outline' },
  { key: 'theater', label: 'Shows', icon: 'film-outline' },
  { key: 'attraction', label: 'Attractions', icon: 'star-outline' },
  { key: 'service', label: 'Services', icon: 'information-circle-outline' },
];

// ============================================
// Props
// ============================================

interface POISelectionListProps {
  pois: SelectablePOI[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAllRides: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

// ============================================
// Component
// ============================================

export function POISelectionList({
  pois,
  selectedIds,
  onToggle,
  onSelectAllRides,
  searchQuery,
  onSearchChange,
}: POISelectionListProps) {
  const [activeTab, setActiveTab] = useState<POICategory | 'all'>('all');

  // Build available tabs (only categories that have POIs)
  const availableTabs = useMemo(() => {
    const categoriesWithData = new Set(pois.map((p) => p.category));
    const tabs = CATEGORY_TABS.filter((t) => categoriesWithData.has(t.key as POICategory));
    return [ALL_TAB, ...tabs];
  }, [pois]);

  // Count per category (for badge on tab)
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set('all', pois.length);
    for (const p of pois) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [pois]);

  // Filtered list: category filter + search query
  const filteredPOIs = useMemo(() => {
    let list = activeTab === 'all' ? pois : pois.filter((p) => p.category === activeTab);

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.area && p.area.toLowerCase().includes(query)) ||
          (p.menuDescription && p.menuDescription.toLowerCase().includes(query)),
      );
    }
    return list;
  }, [pois, activeTab, searchQuery]);

  const handleTabPress = useCallback((key: POICategory | 'all') => {
    haptics.tap();
    setActiveTab(key);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SelectablePOI }) => (
      <POISelectionRow
        poi={item}
        selected={selectedIds.has(item.id)}
        onToggle={() => onToggle(item.id)}
      />
    ),
    [selectedIds, onToggle],
  );

  const keyExtractor = useCallback((item: SelectablePOI) => item.id, []);

  // Show "Select All Rides" only when on Rides tab or All tab
  const showSelectAll = activeTab === 'all' || activeTab === 'ride';
  const hasRides = pois.some((p) => p.category === 'ride');

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.text.meta} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rides, food, shops..."
            placeholderTextColor={colors.text.meta}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.text.meta} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsRow}
      >
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = categoryCounts.get(tab.key) ?? 0;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? colors.text.inverse : colors.text.secondary}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Select All Rides shortcut */}
      {showSelectAll && hasRides && (
        <Pressable onPress={onSelectAllRides} style={styles.selectAllButton}>
          <Text style={styles.selectAllText}>Select All Rides</Text>
        </Pressable>
      )}

      {/* POI list */}
      <FlatList
        data={filteredPOIs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results</Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    padding: 0,
  },

  // ---- Category tabs ----
  tabsRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabIcon: {
    marginRight: spacing.xs,
  },
  tabLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.text.inverse,
  },
  tabCount: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text.meta,
  },
  tabCountTextActive: {
    color: colors.text.inverse,
  },

  // ---- Select all ----
  selectAllButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  selectAllText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // ---- List ----
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
