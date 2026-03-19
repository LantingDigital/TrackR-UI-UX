/**
 * RateRidesScreen — Dedicated screen to rate all unrated coasters
 *
 * Shows a 2-column grid of unrated coaster cards. Tap a card to open
 * the RatingSheet, then a full-screen celebration overlay plays
 * (matching LogConfirmSheet's celebration) before the card fades out
 * and the grid reflows with spring physics.
 *
 * Tab bar note: RatingSheet internally calls hideTabBar/showTabBar.
 * We keep the sheet mounted (visible prop) instead of unmounting it,
 * so its cleanup path fires correctly and hideCount stays balanced.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { useTabBar } from '../contexts/TabBarContext';
import { haptics } from '../services/haptics';

import { CoasterCard } from '../components/CoasterCard';
import type { CoasterStats } from '../components/CoasterCard';
import { RatingSheet } from '../components/RatingSheet';
import ConfettiBurst from '../components/feedback/ConfettiBurst';

import {
  getUnratedCoasters,
  getRatingForCoaster,
} from '../stores/rideLogStore';
import type { CoasterRating } from '../types/rideLog';

import { COASTER_BY_ID } from '../data/coasterIndex';
import { CARD_ART, getRarityFromRank } from '../data/cardArt';
import { FogHeader } from '../components/FogHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Grid Layout (matches LogbookScreen Collection tab) ──
const CARD_GAP = spacing.md;
const CARD_PADDING = spacing.xl;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const MAX_STAGGER = 8;

// Celebration uses phased timers (matching LogConfirmSheet):
// T+300ms: slide up + check pop + confetti
// T+1600ms: check fades out
// T+1900ms: overlay removed, card fades out

interface GridItem {
  coasterId: string;
  coasterName: string;
  parkName: string;
  rarity: ReturnType<typeof getRarityFromRank>;
  stats?: CoasterStats;
  artSource?: any;
}

// ── Helper ──
function getCoasterStats(coasterId: string): CoasterStats | undefined {
  const c = COASTER_BY_ID[coasterId];
  if (!c) return undefined;
  return {
    heightFt: c.heightFt,
    speedMph: c.speedMph,
    lengthFt: c.lengthFt,
    inversions: c.inversions,
    yearOpened: c.yearOpened,
    manufacturer: c.manufacturer,
    material: c.material,
  };
}

// ══════════════════════════════════════════════════════════
// Empty State
// ══════════════════════════════════════════════════════════

const EmptyState: React.FC = () => {
  const confettiProgress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      confettiProgress.value = withTiming(1, { duration: 700 });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
        <ConfettiBurst progress={confettiProgress} />
      </View>
      <Text style={emptyStyles.title}>All caught up!</Text>
      <Text style={emptyStyles.subtitle}>
        Every ride has been rated. Nice work!
      </Text>
    </Animated.View>
  );
};

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: 100,
  },
  iconWrap: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

// ══════════════════════════════════════════════════════════
// RateRidesScreen
// ══════════════════════════════════════════════════════════

export const RateRidesScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const backPress = useSpringPress({ scale: 0.95 });

  // ── State ──
  const [items, setItems] = useState<GridItem[]>([]);
  // Keep ratingTarget data separate from visibility so RatingSheet
  // can animate out (and call showTabBar) before being unmounted.
  const [ratingTarget, setRatingTarget] = useState<GridItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // ── Hide tab bar on mount, show on unmount ──
  useEffect(() => {
    tabBar?.hideTabBar();
    return () => {
      tabBar?.showTabBar();
    };
  }, []);

  // ── Build items from store ──
  const buildItems = useCallback((): GridItem[] => {
    return getUnratedCoasters().map((c) => {
      const coasterData = COASTER_BY_ID[c.coasterId];
      const rank = coasterData?.popularityRank ?? 9999;
      return {
        coasterId: c.coasterId,
        coasterName: c.coasterName,
        parkName: c.parkName,
        rarity: getRarityFromRank(rank),
        stats: getCoasterStats(c.coasterId),
        artSource: CARD_ART[c.coasterId],
      };
    });
  }, []);

  // ── Build items on mount ──
  useEffect(() => {
    setItems(buildItems());
  }, [buildItems]);

  // ── Handlers ──
  const handleCardTap = useCallback((item: GridItem) => {
    haptics.tap();
    setRatingTarget(item);
    setSheetVisible(true);
  }, []);

  const handleRatingClose = useCallback(() => {
    // Let RatingSheet animate out and call showTabBar internally
    setSheetVisible(false);
    // Clear target after RatingSheet has time to unmount cleanly
    setTimeout(() => setRatingTarget(null), 400);
  }, []);

  const handleRatingComplete = useCallback((_rating: CoasterRating) => {
    // Close sheet + rebuild items (celebration already played inside RatingSheet)
    setSheetVisible(false);
    setTimeout(() => {
      setRatingTarget(null);
      setItems(buildItems());
    }, 400);
  }, [buildItems]);

  // ── Auto-close when all caught up ──
  useEffect(() => {
    if (items.length === 0) {
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [items.length, navigation]);

  const handleBack = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  // ── Staggered header entrance ──
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
    headerTranslateY.value = withSpring(0, SPRINGS.responsive);
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  // ── Render item ──
  const renderItem = useCallback(({ item, index }: { item: GridItem; index: number }) => {
    return (
      <Animated.View
        entering={FadeIn.delay(Math.min(index, MAX_STAGGER) * 60).duration(200)}
        exiting={FadeOut.duration(250)}
        layout={Layout.springify().damping(16).stiffness(180)}
        style={{ width: CARD_WIDTH }}
      >
        <View style={{ position: 'relative' }}>
          {/* Card with pointer events disabled to prevent flip-on-tap */}
          <View pointerEvents="none">
            <CoasterCard
              coasterId={item.coasterId}
              coasterName={item.coasterName}
              parkName={item.parkName}
              artSource={item.artSource}
              isUnlocked={true}
              rarity={item.rarity}
              stats={item.stats}
              size="small"
            />
          </View>

          {/* Tap overlay — opens RatingSheet */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => handleCardTap(item)}
          />
        </View>
      </Animated.View>
    );
  }, [handleCardTap]);

  const keyExtractor = useCallback((item: GridItem) => item.coasterId, []);

  const pendingCount = items.length;

  const SUBTITLE_HEIGHT = pendingCount > 0 ? 32 : 0;
  const headerTotalHeight = insets.top + 52 + SUBTITLE_HEIGHT;

  return (
    <View style={styles.container}>
      {/* ── Grid or Empty State ── */}
      {pendingCount === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.gridContent,
            { paddingTop: headerTotalHeight + spacing.sm, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerAnimStyle]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={handleBack}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Rate Rides</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Subtitle counter — above fog */}
      {pendingCount > 0 && (
        <Animated.View style={[styles.subtitleWrap, { top: insets.top + 52 }, headerAnimStyle]}>
          <Text style={styles.subtitle}>
            {pendingCount} {pendingCount === 1 ? 'ride' : 'rides'} to rate
          </Text>
        </Animated.View>
      )}

      {/* ── Rating Sheet (kept mounted, visibility controlled via prop) ── */}
      {ratingTarget && (
        <RatingSheet
          visible={sheetVisible}
          coasterId={ratingTarget.coasterId}
          coasterName={ratingTarget.coasterName}
          parkName={ratingTarget.parkName}
          existingRating={getRatingForCoaster(ratingTarget.coasterId)}
          onClose={handleRatingClose}
          onComplete={handleRatingComplete}
        />
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // ── Header (matches SettingsScreen) ──
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },

  // ── Subtitle ──
  subtitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },

  // ── Grid ──
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  gridContent: {
    paddingHorizontal: CARD_PADDING,
  },
});
