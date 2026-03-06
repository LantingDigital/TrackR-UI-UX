/**
 * ItemSearchInput — Inline search input for coasters or parks
 *
 * TextInput with filtered dropdown results.
 * Supports 'coaster' and 'park' modes.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { COASTER_INDEX, CoasterIndexEntry } from '../../../data/coasterIndex';
import { PARK_INDEX, ParkIndexEntry } from '../../../data/parkIndex';
import { haptics } from '../../../services/haptics';

interface CoasterSearchResult {
  type: 'coaster';
  id: string;
  name: string;
  park: string;
}

interface ParkSearchResult {
  type: 'park';
  id: string;
  name: string;
  country: string;
}

type SearchResult = CoasterSearchResult | ParkSearchResult;

interface ItemSearchInputProps {
  mode: 'coaster' | 'park' | 'both';
  placeholder?: string;
  onSelect: (item: SearchResult) => void;
}

const MAX_RESULTS = 8;

export function ItemSearchInput({ mode, placeholder, onSelect }: ItemSearchInputProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

    const items: SearchResult[] = [];

    if (mode === 'coaster' || mode === 'both') {
      const coasterMatches = COASTER_INDEX
        .filter((c) => c.name.toLowerCase().includes(q) || c.park.toLowerCase().includes(q))
        .slice(0, MAX_RESULTS)
        .map((c): CoasterSearchResult => ({
          type: 'coaster',
          id: c.id,
          name: c.name,
          park: c.park,
        }));
      items.push(...coasterMatches);
    }

    if (mode === 'park' || mode === 'both') {
      const parkMatches = PARK_INDEX
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, MAX_RESULTS)
        .map((p): ParkSearchResult => ({
          type: 'park',
          id: p.id,
          name: p.name,
          country: p.country,
        }));
      items.push(...parkMatches);
    }

    return items.slice(0, MAX_RESULTS);
  }, [query, mode]);

  const handleSelect = useCallback((item: SearchResult) => {
    haptics.tap();
    setQuery(item.name);
    setShowResults(false);
    onSelect(item);
  }, [onSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={16} color={colors.text.meta} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder ?? (mode === 'park' ? 'Search parks...' : 'Search coasters...')}
          placeholderTextColor={colors.text.meta}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setShowResults(false); }} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.text.meta} />
          </Pressable>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item) => (
            <Pressable
              key={`${item.type}-${item.id}`}
              style={styles.resultRow}
              onPress={() => handleSelect(item)}
            >
              <Ionicons
                name={item.type === 'coaster' ? 'flash-outline' : 'location-outline'}
                size={14}
                color={colors.accent.primary}
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {item.type === 'coaster' ? item.park : item.country}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    padding: 0,
  },
  dropdown: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    ...shadows.card,
    maxHeight: 240,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
    gap: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  resultMeta: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
});
