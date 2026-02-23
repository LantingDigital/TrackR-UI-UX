import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { CoastleCoaster, GameStatus } from '../types/coastle';
import { searchCoasters } from '../data/coastleDatabase';

interface CoastleSearchBarProps {
  excludeIds: string[];
  gameStatus: GameStatus;
  targetName?: string;
  onSelect: (coaster: CoastleCoaster) => void;
  disabled?: boolean;
}

export const CoastleSearchBar: React.FC<CoastleSearchBarProps> = ({
  excludeIds,
  gameStatus,
  targetName,
  onSelect,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoastleCoaster[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

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

  // Game over states
  if (gameStatus === 'won') {
    return (
      <View style={[styles.inputRow, styles.inputCard]}>
        <Ionicons name="trophy" size={20} color={colors.coastle.correct} />
        <Text style={styles.resultText}>You got it!</Text>
      </View>
    );
  }

  if (gameStatus === 'lost') {
    return (
      <View style={[styles.inputRow, styles.inputCard]}>
        <Text style={styles.resultText}>
          It was <Text style={styles.resultBold}>{targetName}</Text>
        </Text>
      </View>
    );
  }

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
  resultText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  resultBold: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});
