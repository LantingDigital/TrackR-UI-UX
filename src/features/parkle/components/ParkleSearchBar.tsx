import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { ParklePark } from '../types/parkle';
import { searchParks } from '../data/parkleDatabase';

interface ParkleSearchBarProps {
  excludeIds: string[];
  onSelect: (park: ParklePark) => void;
  disabled?: boolean;
}

export const ParkleSearchBar: React.FC<ParkleSearchBarProps> = ({
  excludeIds,
  onSelect,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ParklePark[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (disabled) {
      setQuery('');
      setResults([]);
      setShowDropdown(false);
    }
    submittingRef.current = false;
  }, [disabled]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.length >= 1) {
        const found = searchParks(text, excludeIds);
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
    (park: ParklePark) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      haptics.tap();
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      inputRef.current?.blur();
      onSelect(park);
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
      <View style={[styles.inputRow, styles.inputCard]}>
        <Ionicons name="search" size={20} color={colors.text.meta} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder="Search a park..."
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
                <Text style={styles.parkName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.parkLocation} numberOfLines={1}>
                  {item.city ? `${item.city}, ` : ''}{item.country}
                </Text>
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
  parkName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  parkLocation: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
