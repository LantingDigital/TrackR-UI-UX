import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { TrackSpinner } from '../../../components/feedback/TrackSpinner';
import { ParkData } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Change pill dimensions (must match pill styling for accurate morph)
const PILL_WIDTH = 80;
const PILL_HEIGHT = 32;

// Expanded park switcher dimensions
const EXPANDED_WIDTH = SCREEN_WIDTH - 32;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.72;

interface ParkHubHeaderProps {
  parkName: string;
  /** e.g. "Buena Park, California, USA" */
  location: string;
  /** e.g. "Open Today: 10:00 AM – 10:00 PM" */
  parkHours?: string;
  /** Park list for the switcher */
  parks: ParkData[];
  /** Called when user selects a park from the switcher */
  onSelectPark: (name: string) => void;
  /** Animated progress: 1 = expanded, 0 = collapsed */
  progress: SharedValue<number>;
  /** When true, force-close the MorphingPill switcher (e.g. on tab blur) */
  forceClose?: boolean;
}

export function ParkHubHeader({
  parkName,
  location,
  parkHours,
  parks,
  onSelectPark,
  progress,
  forceClose,
}: ParkHubHeaderProps) {
  const insets = useSafeAreaInsets();
  const morphRef = useRef<MorphingPillRef>(null);
  const [listState, setListState] = useState<'closed' | 'preview' | 'full'>('closed');

  // Defer list rendering until morph animation settles — prevents frame drops
  // during the arc/expansion. Header + search render immediately; list fills after.
  const handleAnimationStart = useCallback((isOpening: boolean) => {
    if (!isOpening) setListState('closed');
  }, []);

  const handleAnimationComplete = useCallback((isOpen: boolean) => {
    if (isOpen) setListState('full');
  }, []);

  // Force-close the MorphingPill from parent (e.g. on tab blur)
  useEffect(() => {
    if (forceClose && morphRef.current?.isOpen) {
      morphRef.current.close();
    }
  }, [forceClose]);

  const PREVIEW_COUNT = 10;
  const listParks = listState === 'full'
    ? parks
    : listState === 'preview'
      ? parks.slice(0, PREVIEW_COUNT)
      : [];

  // Park name scales down on collapse (transform only — no layout shift)
  const parkNameStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.80, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { scale },
        { translateX: interpolate(progress.value, [0, 1], [-12, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  // Location text fades + slides up on collapse (transform only)
  const locationStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-4, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
    ],
  }));

  // Change pill fades + slides in from right (transform only)
  const changePillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [16, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textGroup}>
          <Animated.Text
            style={[styles.parkName, parkNameStyle]}
            numberOfLines={1}
          >
            {parkName}
          </Animated.Text>
          <Animated.Text style={[styles.location, locationStyle]} numberOfLines={1}>
            {location}
          </Animated.Text>
          {parkHours && (
            <Animated.Text style={[styles.parkHours, locationStyle]} numberOfLines={1}>
              {parkHours}
            </Animated.Text>
          )}
        </View>
        <Animated.View style={changePillStyle}>
          <MorphingPill
            ref={morphRef}
            standalone
            holdPillDuringArc
            pillWidth={PILL_WIDTH}
            pillHeight={PILL_HEIGHT}
            pillBorderRadius={radius.pill}
            pillBackgroundColor={colors.accent.primary}
            expandedWidth={EXPANDED_WIDTH}
            expandedHeight={EXPANDED_HEIGHT}
            expandedBorderRadius={radius.card}
            expandedY={insets.top + 60}
            backdropType="blur"
            blurIntensity={20}
            showBackdrop
            overshootAngle={10}
            overshootMagnitude={6}
            duration={620}
            tuning={{
              easingP1X: 0.25,
              easingP1Y: 0.40,
              easingP2X: 0.40,
              easingP2Y: 1.0,
              sizeStart: 0.45,
              overshootAmount: 1.02,
              springDamping: 22,
              springStiffness: 250,
              closeSpringDamping: 30,
            }}
            onAnimationStart={handleAnimationStart}
            onAnimationComplete={handleAnimationComplete}
            pillContent={
              <View style={styles.changePill}>
                <Text style={styles.changePillText}>Change</Text>
              </View>
            }
            expandedContent={(close) => (
              <SwitcherContent
                parks={listParks}
                currentPark={parkName}
                loading={listState === 'preview'}
                listState={listState}
                onSelect={(name) => {
                  onSelectPark(name);
                  close();
                }}
                onClose={close}
              />
            )}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ============================================
// SwitcherContent — expanded park selector
// ============================================

const MemoizedSwitcherContent = React.memo(SwitcherContent);

function SwitcherContent({
  parks,
  currentPark,
  loading,
  listState,
  onSelect,
  onClose,
}: {
  parks: ParkData[];
  currentPark: string;
  loading: boolean;
  listState: 'closed' | 'preview' | 'full';
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  // Reset search query whenever the switcher closes so it's empty on re-open
  useEffect(() => {
    if (listState === 'closed') {
      setQuery('');
    }
  }, [listState]);

  const filtered = useMemo(() => {
    if (!query.trim()) return parks;
    const q = query.toLowerCase();
    return parks.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q),
    );
  }, [parks, query]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ParkData>) => (
      <Pressable
        onPress={() => onSelect(item.name)}
        style={({ pressed }) => [
          switcherStyles.row,
          pressed && switcherStyles.rowPressed,
        ]}
      >
        <View style={switcherStyles.rowText}>
          <Text style={switcherStyles.parkName}>{item.name}</Text>
          <Text style={switcherStyles.country}>{item.location || item.country}</Text>
        </View>
        <View style={switcherStyles.rowRight}>
          <View style={switcherStyles.countBadge}>
            <Text style={switcherStyles.countText}>{item.count}</Text>
          </View>
          {item.name === currentPark && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.accent.primary}
              style={switcherStyles.checkIcon}
            />
          )}
        </View>
      </Pressable>
    ),
    [currentPark, onSelect],
  );

  const separator = useCallback(
    () => <View style={switcherStyles.separator} />,
    [],
  );

  const keyExtractor = useCallback((item: ParkData) => item.name, []);

  const listFooter = useCallback(
    () =>
      loading ? (
        <View style={switcherStyles.footerLoader}>
          <ActivityIndicator size="small" color={colors.text.meta} />
        </View>
      ) : null,
    [loading],
  );

  return (
    <View style={switcherStyles.container}>
      {/* Header */}
      <View style={switcherStyles.header}>
        <Text style={switcherStyles.title}>Choose a Park</Text>
        <Pressable onPress={onClose} style={switcherStyles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={switcherStyles.searchWrap}>
        <TextInput
          style={switcherStyles.searchInput}
          placeholder="Search parks..."
          placeholderTextColor={colors.text.meta}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* Park list — deferred until morph animation settles */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={separator}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={switcherStyles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={3}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={switcherStyles.loadingState}>
            <TrackSpinner size={36} />
            <Text style={switcherStyles.loadingText}>Loading parks...</Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================
// Header styles
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
    marginRight: spacing.base,
  },
  parkName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    transformOrigin: 'left center',
  },
  location: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  parkHours: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.status.success,
    marginTop: 2,
  },
  changePill: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  changePillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});

// ============================================
// Switcher expanded content styles
// ============================================

const switcherStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.heading,
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  loadingText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: spacing.sm,
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
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
