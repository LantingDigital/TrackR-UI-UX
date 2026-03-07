import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useTabBar } from '../../../contexts/TabBarContext';
import { haptics } from '../../../services/haptics';
import { usePOIAction } from '../context/POIActionContext';
import { ParkPOI } from '../types';
import { RideWaitTime } from '../data/mockDashboardData';
import { POIListRow } from './POIListRow';
import { getAreaLabel } from '../data/areaLabels';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;

// ============================================
// Types
// ============================================

interface RideListViewProps {
  visible: boolean;
  onClose: () => void;
  pois: ParkPOI[];
  waitTimes: RideWaitTime[];
}

interface RideSection {
  area: string;
  areaLabel: string;
  rides: ParkPOI[];
}

// ============================================
// RideListView
// ============================================

export function RideListView({ visible, onClose, pois, waitTimes }: RideListViewProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const { openPOI } = usePOIAction();
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentReady, setContentReady] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const entrance = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  // Build wait time lookup
  const waitTimeMap = useMemo(() => {
    const map = new Map<string, RideWaitTime>();
    for (const wt of waitTimes) {
      map.set(wt.id, wt);
    }
    return map;
  }, [waitTimes]);

  // Filter to rides only
  const rides = useMemo(
    () => pois.filter(p => p.type === 'ride'),
    [pois],
  );

  // Search + group by area
  const sections = useMemo<RideSection[]>(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query.length > 0
      ? rides.filter(r => r.name.toLowerCase().includes(query))
      : rides;

    // Group by area
    const groups = new Map<string, ParkPOI[]>();
    for (const ride of filtered) {
      const existing = groups.get(ride.area) ?? [];
      existing.push(ride);
      groups.set(ride.area, existing);
    }

    // Sort areas alphabetically, rides within areas alphabetically
    return Array.from(groups.entries())
      .sort(([a], [b]) => getAreaLabel(a).localeCompare(getAreaLabel(b)))
      .map(([area, areaRides]) => ({
        area,
        areaLabel: getAreaLabel(area),
        rides: areaRides.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [rides, searchQuery]);

  // Flat list data: interleave section headers with ride rows
  const listData = useMemo(() => {
    const data: Array<{ type: 'header'; area: string; label: string; count: number } | { type: 'ride'; poi: ParkPOI }> = [];
    for (const section of sections) {
      data.push({ type: 'header', area: section.area, label: section.areaLabel, count: section.rides.length });
      for (const ride of section.rides) {
        data.push({ type: 'ride', poi: ride });
      }
    }
    return data;
  }, [sections]);

  const totalRideCount = rides.length;

  // ---- Animate in/out ----
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setIsDismissing(false);
      setSearchQuery('');
      setContentReady(false);
      tabBar?.hideTabBar();
      haptics.select();
      entrance.value = 0;
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 300 });
      entrance.value = withTiming(1, { duration: 400 });
      // Delay FlatList render until entrance animation settles
      const contentTimer = setTimeout(() => setContentReady(true), 350);
      return () => clearTimeout(contentTimer);
    } else if (!visible) {
      if (!isDismissing) {
        tabBar?.showTabBar();
      }
      setContentReady(false);
      entrance.value = 0;
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    setIsDismissing(true);
    tabBar?.showTabBar();
    entrance.value = 0;
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, sheetHeight, tabBar]);

  const showTabBarJS = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
  }, [tabBar]);

  // ---- Pan gesture for drag-to-dismiss ----
  const panGesture = Gesture.Pan()
    .enabled(visible)
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, sheetHeight * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (
        translateY.value > sheetHeight * 0.25 ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        runOnJS(showTabBarJS)();
        translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withSpring(0, SPRINGS.responsive);
        backdropOpacity.value = withSpring(1);
      }
    });

  // ---- Animated styles ----
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.2], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.2], [12, 0], Extrapolation.CLAMP) }],
  }));

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.15, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.15, 0.4], [16, 0], Extrapolation.CLAMP) }],
  }));

  const handleRidePress = useCallback((poiId: string) => {
    openPOI(poiId);
  }, [openPOI]);

  if (!mounted) return null;

  const renderItem = ({ item }: { item: typeof listData[number] }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.label}</Text>
          <Text style={styles.sectionCount}>{item.count}</Text>
        </View>
      );
    }
    const wt = waitTimeMap.get(item.poi.id);
    return (
      <POIListRow
        poi={item.poi}
        onPress={handleRidePress}
        waitMinutes={wt?.waitMinutes}
        isOpen={wt?.isOpen}
        mode="ride"
      />
    );
  };

  const keyExtractor = (item: typeof listData[number], index: number) => {
    if (item.type === 'header') return `header-${item.area}`;
    return item.poi.id;
  };

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.container,
          { top: sheetTop, height: sheetHeight },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.handleArea}>
            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>

        {/* Close button */}
        <Pressable
          onPress={() => { haptics.tap(); dismiss(); }}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.title}>Rides</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalRideCount}</Text>
          </View>
        </Animated.View>

        {/* Search bar */}
        <Animated.View style={[styles.searchWrap, headerStyle]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.text.meta} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search rides..."
              placeholderTextColor={colors.text.meta}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => { haptics.tap(); setSearchQuery(''); }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.text.meta} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* List */}
        <Animated.View style={[{ flex: 1 }, listStyle]}>
          {contentReady && listData.length > 0 ? (
            <FlatList
              data={listData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews
              initialNumToRender={12}
              maxToRenderPerBatch={8}
              windowSize={5}
            />
          ) : contentReady ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎢</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery.length > 0 ? 'No rides found' : 'No ride data'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.length > 0
                  ? `No rides match "${searchQuery}"`
                  : 'Ride data is not available for this park yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.text.meta} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 140,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.small,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Search
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.base,
    height: 40,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },

  // Loading state (shown during entrance animation)
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
