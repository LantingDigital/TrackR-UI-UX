import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { COASTER_DATABASE } from '../../coastle/data/coastleDatabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = spacing.xxl;
const MAX_SELECTIONS = 5;

// Derive unique park names from the coaster database
const ALL_PARKS = Array.from(
  new Set(COASTER_DATABASE.map((c) => c.park))
).sort();

interface HomeParksStepProps {
  selectedParks: string[];
  onParksChange: (parks: string[]) => void;
  onContinue: () => void;
}

// ── Park Row ──────────────────────────────────────
interface ParkRowProps {
  name: string;
  isSelected: boolean;
  onPress: () => void;
  coasterCount: number;
}

const ParkRow: React.FC<ParkRowProps> = ({ name, isSelected, onPress, coasterCount }) => {
  const borderOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    borderOpacity.value = withTiming(isSelected ? 1 : 0, { duration: TIMING.fast });
  }, [isSelected]);

  const rowBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(207,103,105,${borderOpacity.value})`,
    backgroundColor: `rgba(207,103,105,${borderOpacity.value * 0.08})`,
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.parkRow, rowBorderStyle]}>
        <View style={styles.parkInfo}>
          <Text style={styles.parkName} numberOfLines={1}>{name}</Text>
          <Text style={styles.parkMeta}>
            {coasterCount} coaster{coasterCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={colors.accent.primary} />
        )}
      </Animated.View>
    </Pressable>
  );
};

// ── Main Component ─────────────────────────────────
export const HomeParksStep: React.FC<HomeParksStepProps> = ({
  selectedParks,
  onParksChange,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const continuePress = useStrongPress({ disabled: selectedParks.length === 0 });

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const searchOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
    headerTranslateY.value = withSpring(0, SPRINGS.responsive);
    searchOpacity.value = withDelay(100, withTiming(1, { duration: TIMING.normal }));
    listOpacity.value = withDelay(200, withTiming(1, { duration: TIMING.normal }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
  }));

  const listStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  // Continue button fade
  const continueOpacity = useSharedValue(0);
  useEffect(() => {
    continueOpacity.value = withTiming(
      selectedParks.length > 0 ? 1 : 0,
      { duration: TIMING.fast }
    );
  }, [selectedParks.length]);
  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  // Coaster count per park (memoized)
  const parkCoasterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    COASTER_DATABASE.forEach((c) => {
      counts[c.park] = (counts[c.park] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered parks
  const filteredParks = useMemo(() => {
    if (!search.trim()) return ALL_PARKS;
    const q = search.toLowerCase();
    return ALL_PARKS.filter((p) => p.toLowerCase().includes(q));
  }, [search]);

  const handleTogglePark = useCallback(
    (park: string) => {
      if (selectedParks.includes(park)) {
        haptics.select();
        onParksChange(selectedParks.filter((p) => p !== park));
      } else if (selectedParks.length < MAX_SELECTIONS) {
        haptics.select();
        onParksChange([...selectedParks, park]);
      }
    },
    [selectedParks, onParksChange]
  );

  const handleContinue = () => {
    if (selectedParks.length === 0) return;
    Keyboard.dismiss();
    haptics.tap();
    onContinue();
  };

  const renderPark = useCallback(
    ({ item }: { item: string }) => (
      <ParkRow
        name={item}
        isSelected={selectedParks.includes(item)}
        onPress={() => handleTogglePark(item)}
        coasterCount={parkCoasterCounts[item] || 0}
      />
    ),
    [selectedParks, handleTogglePark, parkCoasterCounts]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxxl }]}>
      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>Pick your home parks</Text>
        <Text style={styles.subtitle}>
          Select up to {MAX_SELECTIONS} parks ({selectedParks.length}/{MAX_SELECTIONS})
        </Text>
      </Animated.View>

      {/* Search bar */}
      <Animated.View style={[styles.searchContainer, searchStyle]}>
        <Ionicons
          name="search"
          size={18}
          color={colors.text.meta}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parks..."
          placeholderTextColor={colors.text.meta}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.text.meta} />
          </Pressable>
        )}
      </Animated.View>

      {/* Park list */}
      <Animated.View style={[styles.listContainer, listStyle]}>
        <FlatList
          data={filteredParks}
          keyExtractor={(item) => item}
          renderItem={renderPark}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </Animated.View>

      {/* Continue button */}
      <View style={[styles.continueContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={continueStyle}>
          <Pressable
            {...continuePress.pressHandlers}
            onPress={handleContinue}
            disabled={selectedParks.length === 0}
          >
            <Animated.View style={[styles.continueButton, continuePress.animatedStyle]}>
              <Text style={styles.continueText}>Continue</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerContainer: {
    paddingHorizontal: CONTENT_PADDING,
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: CONTENT_PADDING,
    marginBottom: spacing.lg,
    height: 44,
    borderRadius: radius.searchBar,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: spacing.lg,
  },
  parkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  parkInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  parkName: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  parkMeta: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  continueContainer: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: spacing.base,
  },
  continueButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
