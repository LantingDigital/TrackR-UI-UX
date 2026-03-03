import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ParkPOI, POIType, MapCategory } from '../types';
import { MapFilterChips } from './MapFilterChips';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

// ============================================
// Types
// ============================================

interface SearchEntry {
  poi: ParkPOI;
  text: string;        // searchable text (lowercased)
  label: string;       // POI name for display
  detail: string;      // what matched — menu item name or area
  matchType: 'name' | 'menu';
}

interface MapSearchBarProps {
  pois: ParkPOI[];
  onSelectPoi: (poi: ParkPOI) => void;
  onSearchFilter: (query: string, poiIds: Set<string>) => void;
  onClose: () => void;
  insetTop: number;
  activeFilters: Set<MapCategory>;
  onFilterToggle: (category: MapCategory) => void;
}

// ============================================
// Constants
// ============================================

const TYPE_ICONS: Record<POIType, string> = {
  ride: '\u{1F3A2}', food: '\u{1F355}', shop: '\u{1F6CD}',
  theater: '\u{1F3AD}', attraction: '\u{1F4F8}', service: '\u{1F6BB}',
};

const AREA_LABELS: Record<string, string> = {
  'camp-snoopy': 'Camp Snoopy', 'fiesta-village': 'Fiesta Village',
  'boardwalk': 'Boardwalk', 'ghost-town': 'Ghost Town',
  'california-marketplace': 'California Marketplace', 'western-trails': 'Western Trails',
};

const MAX_RESULTS = 8;

// ============================================
// MapSearchBar
// ============================================

export function MapSearchBar({ pois, onSelectPoi, onSearchFilter, onClose, insetTop, activeFilters, onFilterToggle }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Results visibility animation
  const resultsOpacity = useSharedValue(0);

  const resultsStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
  }));

  // Build search index from POI data
  const searchIndex = useMemo((): SearchEntry[] => {
    const entries: SearchEntry[] = [];
    for (const poi of pois) {
      // Skip service POIs (restrooms etc.) from search
      if (poi.type === 'service') continue;

      // Name entry
      entries.push({
        poi,
        text: poi.name.toLowerCase(),
        label: poi.name,
        detail: AREA_LABELS[poi.area] ?? poi.area,
        matchType: 'name',
      });

      // Menu item entries
      if (poi.menuItems) {
        for (const item of poi.menuItems) {
          entries.push({
            poi,
            text: item.toLowerCase(),
            label: poi.name,
            detail: item,
            matchType: 'menu',
          });
        }
      }
    }
    return entries;
  }, [pois]);

  // Filter results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const matches = searchIndex.filter((entry) => entry.text.includes(q));

    // Dedupe by POI id — prefer name matches over menu matches
    const seen = new Map<string, SearchEntry>();
    for (const match of matches) {
      const existing = seen.get(match.poi.id);
      if (!existing || (match.matchType === 'name' && existing.matchType === 'menu')) {
        seen.set(match.poi.id, match);
      }
    }

    return Array.from(seen.values()).slice(0, MAX_RESULTS);
  }, [query, searchIndex]);

  // Show/hide results
  const showResults = query.trim().length > 0 && results.length > 0;
  if (showResults) {
    resultsOpacity.value = withTiming(1, { duration: 150 });
  } else {
    resultsOpacity.value = withTiming(0, { duration: 100 });
  }

  const handleSelect = useCallback(
    (poi: ParkPOI) => {
      setQuery('');
      Keyboard.dismiss();
      onSelectPoi(poi);
    },
    [onSelectPoi],
  );

  // "Search for X" — highlight all matching POIs on the map
  const handleSearchFilter = useCallback(() => {
    const ids = new Set(results.map((r) => r.poi.id));
    const q = query.trim();
    setQuery('');
    Keyboard.dismiss();
    onSearchFilter(q, ids);
  }, [results, query, onSearchFilter]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    setQuery('');
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <View style={[styles.container, { top: insetTop + spacing.md }]} pointerEvents="box-none">
      {/* Top bar: search input + close button */}
      <View style={styles.topBar}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={16} color={colors.text.meta} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search rides, food, shops..."
            placeholderTextColor={colors.text.meta}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            onSubmitEditing={showResults ? handleSearchFilter : undefined}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.text.meta} />
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <MapFilterChips activeFilters={activeFilters} onToggle={onFilterToggle} />

      {/* Results dropdown */}
      {showResults && (
        <Animated.View style={[styles.resultsCard, resultsStyle]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
          >
            {/* "Search for X" — show all matches on map */}
            <Pressable
              onPress={handleSearchFilter}
              style={({ pressed }) => [
                styles.resultRow,
                styles.resultDivider,
                pressed && styles.resultPressed,
              ]}
            >
              <Ionicons name="search" size={18} color={colors.accent.primary} style={styles.searchFilterIcon} />
              <Text style={styles.searchFilterText} numberOfLines={1}>
                Search for "{query.trim()}"
              </Text>
              <Text style={styles.searchFilterCount}>{results.length} results</Text>
            </Pressable>
            {results.map((entry, index) => (
              <Pressable
                key={`${entry.poi.id}-${entry.matchType}`}
                onPress={() => handleSelect(entry.poi)}
                style={({ pressed }) => [
                  styles.resultRow,
                  index < results.length - 1 && styles.resultDivider,
                  pressed && styles.resultPressed,
                ]}
              >
                <Text style={styles.resultIcon}>{TYPE_ICONS[entry.poi.type]}</Text>
                <View style={styles.resultText}>
                  <Text style={styles.resultName} numberOfLines={1}>{entry.label}</Text>
                  <Text style={styles.resultDetail} numberOfLines={1}>
                    {entry.matchType === 'menu' ? entry.detail : entry.detail}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: spacing.base,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  resultsCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    maxHeight: 280,
    overflow: 'hidden',
    ...shadows.card,
  },
  resultsList: {
    maxHeight: 280,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  resultDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  resultPressed: {
    backgroundColor: colors.background.input,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: spacing.base,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  resultDetail: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  searchFilterIcon: {
    marginRight: spacing.base,
  },
  searchFilterText: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  searchFilterCount: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginLeft: spacing.md,
  },
});
