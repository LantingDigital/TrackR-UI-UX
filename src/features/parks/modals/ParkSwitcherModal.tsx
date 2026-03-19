import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { TIMING } from '../../../constants/animations';
import { SheetFog } from '../../../components/SheetFog';
import { buildParkList } from '../utils/parkDataUtils';
import { ParkData } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParkSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPark: (parkName: string) => void;
  currentPark: string;
}

export function ParkSwitcherModal({
  visible,
  onClose,
  onSelectPark,
  currentPark,
}: ParkSwitcherModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const parks = useMemo(() => buildParkList(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return parks;
    const q = query.toLowerCase();
    return parks.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q),
    );
  }, [parks, query]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setQuery('');
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelect = useCallback(
    (parkName: string) => {
      onSelectPark(parkName);
      onClose();
    },
    [onSelectPark, onClose],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ParkData>) => (
      <Pressable
        onPress={() => handleSelect(item.name)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowText}>
          <Text style={styles.parkName}>{item.name}</Text>
          <Text style={styles.country}>{item.country}</Text>
        </View>
        <View style={styles.rowRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.count}</Text>
          </View>
          {item.name === currentPark && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.accent.primary}
              style={styles.checkIcon}
            />
          )}
        </View>
      </Pressable>
    ),
    [currentPark, handleSelect],
  );

  const separator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const keyExtractor = useCallback((item: ParkData) => item.name, []);

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
          contentStyle,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose a Park</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search parks..."
            placeholderTextColor={colors.text.meta}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {/* Fog gradient — fades content as it scrolls under the header/search */}
        <SheetFog headerHeight={96} />

        {/* Park list */}
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={separator}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.xl,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  searchInput: {
    backgroundColor: colors.background.input,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
  },
  parkName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  country: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  checkIcon: {
    marginLeft: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },
});
