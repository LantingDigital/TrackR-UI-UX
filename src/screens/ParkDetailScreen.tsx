/**
 * ParkDetailScreen
 *
 * Premium park detail page with hero image, park stats,
 * completion progress, and coaster list with card art thumbnails.
 * Staggered spring entrance on every section.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import {
  getAllLogs,
  subscribe as subscribeRideLog,
} from '../stores/rideLogStore';
import { CARD_ART } from '../data/cardArt';
import {
  getHeroUrlForPark,
  getParkGradientColors,
  getParkInitials,
} from '../utils/parkAssets';
import { buildParkList } from '../features/parks/utils/parkDataUtils';
import type { ParkData } from '../features/parks/types';
import type { CoastleCoaster } from '../features/coastle/types/coastle';

// ============================================
// Types
// ============================================

type ParkDetailRouteParams = {
  ParkDetail: {
    parkName: string;
  };
};

// ============================================
// Constants
// ============================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 220;
const COASTER_THUMB_SIZE = 52;

// ============================================
// Stagger entrance helper
// ============================================

function useStaggerEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: TIMING.normal, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, SPRINGS.stiff),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ============================================
// Park Stats Utility
// ============================================

function getParkStats(parkData: ParkData, riddenCoasterIds: Set<string>) {
  const totalCoasters = parkData.count;
  const riddenCount = parkData.coasters.filter((c) =>
    riddenCoasterIds.has(c.id),
  ).length;
  const completionPct =
    totalCoasters > 0 ? Math.round((riddenCount / totalCoasters) * 100) : 0;

  return { totalCoasters, riddenCount, completionPct };
}

// ============================================
// ParkDetailScreen
// ============================================

export function ParkDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParkDetailRouteParams, 'ParkDetail'>>();
  const { parkName } = route.params;

  // ---- Data ----
  const parks = useMemo(() => buildParkList(), []);
  const parkData = useMemo(
    () => parks.find((p) => p.name === parkName) ?? null,
    [parks, parkName],
  );

  // Ride log stats (reactive)
  const [riddenIds, setRiddenIds] = React.useState<Set<string>>(() => {
    const logs = getAllLogs();
    return new Set(logs.map((l) => l.coasterId));
  });

  useEffect(() => {
    const unsub = subscribeRideLog(() => {
      const logs = getAllLogs();
      setRiddenIds(new Set(logs.map((l) => l.coasterId)));
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    if (!parkData) return { totalCoasters: 0, riddenCount: 0, completionPct: 0 };
    return getParkStats(parkData, riddenIds);
  }, [parkData, riddenIds]);

  // Hero image
  const heroUrl = useMemo(
    () => (parkName ? getHeroUrlForPark(parkName) : undefined),
    [parkName],
  );
  const fallbackGradient = useMemo(
    () => getParkGradientColors(parkName),
    [parkName],
  );

  // ---- Scroll-driven header animation ----
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HERO_HEIGHT],
          [-50, 0, HERO_HEIGHT * 0.4],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.3, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // ---- Staggered entrance animations ----
  const headerAnim = useStaggerEntrance(0);
  const statsAnim = useStaggerEntrance(1);
  const progressAnim = useStaggerEntrance(2);
  const coasterListAnim = useStaggerEntrance(3);

  // ---- Press state for back button ----
  const backPress = useSpringPress();

  const handleBack = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  if (!parkData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Park not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero image area */}
      <Animated.View style={[styles.heroContainer, heroAnimStyle]}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.heroImage} />
        ) : (
          <LinearGradient
            colors={fallbackGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroInitials}>
              {getParkInitials(parkName)}
            </Text>
          </LinearGradient>
        )}
        {/* Gradient scrim at bottom of hero */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.heroScrim}
        />
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Spacer for hero */}
        <View style={{ height: HERO_HEIGHT }} />

        {/* Park name & location card */}
        <Animated.View style={[styles.infoSection, headerAnim]}>
          <Text style={styles.parkName}>{parkData.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.text.meta}
            />
            <Text style={styles.locationText}>{parkData.location}</Text>
          </View>
          {parkData.topStats.tallest > 0 && (
            <View style={styles.quickStatsRow}>
              <QuickStat
                icon="arrow-up-outline"
                value={`${parkData.topStats.tallest} ft`}
                label="Tallest"
              />
              <QuickStat
                icon="speedometer-outline"
                value={`${parkData.topStats.fastest} mph`}
                label="Fastest"
              />
              {parkData.topStats.mostInversions > 0 && (
                <QuickStat
                  icon="sync-outline"
                  value={`${parkData.topStats.mostInversions}`}
                  label="Max Inv."
                />
              )}
            </View>
          )}
        </Animated.View>

        {/* Stats card */}
        <Animated.View style={[styles.statsCard, statsAnim]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCoasters}</Text>
            <Text style={styles.statLabel}>Coasters</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.riddenCount}</Text>
            <Text style={styles.statLabel}>Ridden</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.accentValue]}>
              {stats.completionPct}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </Animated.View>

        {/* Completion progress bar */}
        <Animated.View style={[styles.progressSection, progressAnim]}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <Text style={styles.progressFraction}>
              {stats.riddenCount} / {stats.totalCoasters}
            </Text>
          </View>
          <View style={styles.progressBarOuter}>
            <ProgressBarFill percentage={stats.completionPct} />
          </View>
        </Animated.View>

        {/* Coasters list */}
        <Animated.View style={[styles.coasterSection, coasterListAnim]}>
          <Text style={styles.sectionTitle}>Coasters</Text>
          <View style={styles.coasterList}>
            {parkData.sortedCoasters.map((coaster) => (
              <CoasterRow
                key={coaster.id}
                coaster={coaster}
                isRidden={riddenIds.has(coaster.id)}
              />
            ))}
          </View>
          {parkData.sortedCoasters.length === 0 && (
            <Text style={styles.emptyCoasters}>
              No coaster data available yet
            </Text>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating back button */}
      <View style={[styles.backButtonContainer, { top: insets.top + spacing.md }]}>
        <Pressable {...backPress.pressHandlers} onPress={handleBack}>
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text.primary}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================
// QuickStat sub-component
// ============================================

function QuickStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.quickStatItem}>
      <Ionicons name={icon} size={14} color={colors.accent.primary} />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// ProgressBarFill sub-component (animated)
// ============================================

function ProgressBarFill({ percentage }: { percentage: number }) {
  const progress = useSharedValue(0);
  // Progress bar width = screen width - 2 * horizontal padding (spacing.lg = 16)
  const barWidth = SCREEN_WIDTH - spacing.lg * 2;

  useEffect(() => {
    progress.value = withDelay(
      400,
      withSpring(percentage / 100, { damping: 22, stiffness: 120, mass: 1 }),
    );
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(progress.value * barWidth, barWidth)),
  }));

  return <Animated.View style={[styles.progressBarFill, fillStyle]} />;
}

// ============================================
// CoasterRow sub-component
// ============================================

const CoasterRow = React.memo(
  ({
    coaster,
    isRidden,
  }: {
    coaster: CoastleCoaster;
    isRidden: boolean;
  }) => {
    const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });
    const cardArt = CARD_ART[coaster.id];

    const handlePress = useCallback(() => {
      haptics.tap();
      // Future: navigate to CoasterDetailScreen
    }, []);

    return (
      <Pressable {...pressHandlers} onPress={handlePress}>
        <Animated.View style={[styles.coasterRow, animatedStyle]}>
          {/* Thumbnail */}
          <View style={styles.thumbContainer}>
            {cardArt ? (
              <Image source={cardArt} style={styles.thumbImage} />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Ionicons
                  name="train-outline"
                  size={20}
                  color={colors.text.meta}
                />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.coasterInfo}>
            <Text style={styles.coasterName} numberOfLines={1}>
              {coaster.name}
            </Text>
            <Text style={styles.coasterMeta} numberOfLines={1}>
              {coaster.manufacturer} · {coaster.yearOpened}
              {coaster.heightFt > 0 ? ` · ${coaster.heightFt} ft` : ''}
            </Text>
          </View>

          {/* Ridden indicator */}
          {isRidden && (
            <View style={styles.riddenBadge}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.status.successSoft}
              />
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // ── Hero ──
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitials: {
    fontSize: typography.sizes.display + 16,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
  },
  heroScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // ── Scroll ──
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  // ── Info section ──
  infoSection: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xxl,
    borderRadius: radius.card,
    padding: spacing.xl,
    zIndex: 2,
    ...shadows.card,
  },
  parkName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  locationText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickStatValue: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  quickStatLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },

  // ── Stats card ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.section,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  accentValue: {
    color: colors.accent.primary,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },

  // ── Progress ──
  progressSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  progressFraction: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.input,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },

  // ── Coasters section ──
  coasterSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  coasterList: {
    gap: spacing.md,
  },
  coasterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.small,
  },
  thumbContainer: {
    width: COASTER_THUMB_SIZE,
    height: COASTER_THUMB_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
  },
  thumbImage: {
    width: COASTER_THUMB_SIZE,
    height: COASTER_THUMB_SIZE,
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coasterInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  coasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  coasterMeta: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  riddenBadge: {
    marginLeft: spacing.md,
  },
  emptyCoasters: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },

  // ── Back button ──
  backButtonContainer: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },

  // ── Empty state ──
  emptyText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default ParkDetailScreen;
