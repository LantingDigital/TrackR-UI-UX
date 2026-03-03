import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { CoastleCoaster } from '../types/coastle';
import { searchCoasters } from '../data/coastleDatabase';

interface CoastleSearchBarProps {
  excludeIds: string[];
  onSelect: (coaster: CoastleCoaster) => void;
  disabled?: boolean;
}

export const CoastleSearchBar: React.FC<CoastleSearchBarProps> = ({
  excludeIds,
  onSelect,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoastleCoaster[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Synchronous guard — prevents double-submission when onPress fires twice
  // (a known Pressable-inside-FlatList quirk on iOS where state hasn't committed yet)
  const submittingRef = useRef(false);

  // When a guess starts revealing (disabled flips to true), force-clear the dropdown.
  // This guarantees the search is always in a clean state by the time the flip animation plays,
  // regardless of whether handleSelect successfully closed it.
  useEffect(() => {
    if (disabled) {
      setQuery('');
      setResults([]);
      setShowDropdown(false);
    }
    // Reset the guard whenever disabled changes (true = new guess started, false = reveal done)
    submittingRef.current = false;
  }, [disabled]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.length >= 1) {
        const found = searchCoasters(text, excludeIds);
        setResults(found);
        setShowDropdown(found.length > 0);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    },
    [excludeIds],
  );

  const handleSelect = useCallback(
    (coaster: CoastleCoaster) => {
      // Ref check is synchronous — blocks even if React state hasn't committed yet
      if (submittingRef.current) return;
      submittingRef.current = true;
      haptics.tap();
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      inputRef.current?.blur();
      onSelect(coaster);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    haptics.tick();
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Input row — white card with shadow */}
      <View style={[styles.inputRow, styles.inputCard]}>
        <Ionicons name="search" size={20} color={colors.text.meta} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder="Search a coaster..."
          placeholderTextColor={colors.text.meta}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.text.meta} />
          </Pressable>
        )}
      </View>

      {/* Dropdown below input */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.dropdownRow}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.coasterName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.parkName} numberOfLines={1}>{item.park}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 50,
  },
  inputRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  inputCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  searchIcon: {},
  input: {
    flex: 1,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    height: '100%',
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 250,
    zIndex: 100,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  dropdownRow: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  coasterName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  parkName: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
