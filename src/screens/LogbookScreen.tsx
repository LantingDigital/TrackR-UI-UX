/**
 * LogbookScreen — Ride collection, timeline & stats
 *
 * Three views via segmented control:
 * - Timeline: chronological ride feed grouped by date
 * - Collection: collectible CoasterCard grid (unlocked + locked)
 * - Stats: ride statistics dashboard
 *
 * All data sourced from rideLogStore (no mock data).
 */

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  interpolateColor,
  FadeIn,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { TIMING, SPRINGS } from '../constants/animations';
import { haptics } from '../services/haptics';
import { useSpringPress } from '../hooks/useSpringPress';
import {
  getAllLogs,
  getCreditCount,
  getTotalRideCount,
  getAllRatings,
  getUnratedCoasters,
  getRatingForCoaster,
  getTodayRideCountForCoaster,
  addQuickLog,
  hasLogForCoaster,
  updateLogTimestamp,
  deleteLog,
  useRideLogStore,
} from '../stores/rideLogStore';
import { COASTER_BY_ID, type CoasterIndexEntry } from '../data/coasterIndex';
import { CARD_ART, getRarityFromRank, type CardRarity } from '../data/cardArt';
import { CoasterCard, type CoasterStats } from '../components/CoasterCard';
import { CardActionSheet, type CardActionTarget } from '../components/CardActionSheet';
import { RatingSheet } from '../components/RatingSheet';
import { TimelineActionSheet, type TimelineActionTarget } from '../components/TimelineActionSheet';
import { LogbookLogSheet } from '../components/LogbookLogSheet';
import { LogConfirmSheet } from '../components/LogConfirmSheet';
import { FogHeader } from '../components/FogHeader';
import { EmptyState } from '../components/EmptyState';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import type { RideLog, CoasterRating } from '../types/rideLog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab bar height for FAB positioning
const TAB_BAR_HEIGHT = 49;

const VIEWS = ['Timeline', 'Collection', 'Stats', 'Pending'] as const;
type ViewMode = (typeof VIEWS)[number];

const MAX_STAGGER = 6;

// ─── Helpers ────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

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

// ─── Segmented Control (animated sliding pill) ──────────────

const SEGMENT_COUNT = VIEWS.length;

/** Per-label animated color that crossfades as the pill slides */
const SegmentLabel: React.FC<{
  view: ViewMode;
  index: number;
  indicatorX: SharedValue<number>;
  showDot: boolean;
}> = ({ view, index, indicatorX, showDot }) => {
  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      indicatorX.value,
      [index - 1, index, index + 1],
      [colors.text.secondary, colors.text.inverse, colors.text.secondary],
    );
    return { color };
  });

  return (
    <View style={styles.segmentLabelWrap}>
      <Animated.Text style={[styles.segmentLabel, colorStyle]}>
        {view}
      </Animated.Text>
      {showDot && <View style={styles.pendingDot} />}
    </View>
  );
};

const SegmentedControl: React.FC<{
  selected: ViewMode;
  onSelect: (view: ViewMode) => void;
  unratedCount?: number;
}> = ({ selected, onSelect, unratedCount = 0 }) => {
  const activeIndex = VIEWS.indexOf(selected);
  const indicatorX = useSharedValue(activeIndex);

  useEffect(() => {
    indicatorX.value = withSpring(VIEWS.indexOf(selected), {
      damping: 18,
      stiffness: 200,
      mass: 0.8,
    });
  }, [selected]);

  // Layout-based pill positioning
  const [containerWidth, setContainerWidth] = React.useState(0);
  const pillWidth = containerWidth > 0 ? (containerWidth - spacing.xs * 2) / SEGMENT_COUNT : 0;

  const indicatorLayoutStyle = useAnimatedStyle(() => {
    if (pillWidth <= 0) return { opacity: 0 };
    return {
      opacity: 1,
      width: pillWidth,
      transform: [{ translateX: indicatorX.value * pillWidth }],
    };
  });

  return (
    <View
      style={styles.segmentRow}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Animated indicator pill */}
      <Animated.View style={[styles.segmentIndicator, indicatorLayoutStyle]} />

      {/* Labels */}
      {VIEWS.map((view, i) => {
        const isActive = view === selected;
        const showDot = view === 'Pending' && unratedCount > 0 && !isActive;
        return (
          <Pressable
            key={view}
            style={styles.segmentChip}
            onPress={() => {
              haptics.tap();
              onSelect(view);
            }}
          >
            <SegmentLabel
              view={view}
              index={i}
              indicatorX={indicatorX}
              showDot={showDot}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── Timeline View ──────────────────────────────────────────

interface TimelineGroup {
  dateLabel: string;
  entries: RideLog[];
}

function groupLogsByDate(logs: RideLog[]): TimelineGroup[] {
  const groups: Map<string, RideLog[]> = new Map();
  for (const log of logs) {
    const dateKey = log.timestamp.slice(0, 10); // YYYY-MM-DD
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(log);
  }

  return Array.from(groups.entries()).map(([dateKey, entries]) => ({
    dateLabel: formatDateGroup(entries[0].timestamp),
    entries,
  }));
}

const TimelineEntryRow = memo(
  ({
    log,
    index,
    isLast,
    rating,
    onPress,
    onLongPress,
  }: {
    log: RideLog;
    index: number;
    isLast: boolean;
    rating?: CoasterRating;
    onPress: (log: RideLog) => void;
    onLongPress?: (log: RideLog) => void;
  }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
      const delay = index < MAX_STAGGER ? index * 60 : 0;
      progress.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    }, []);

    const animStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [16, 0]) }],
    }));

    const displayScore = rating
      ? (rating.weightedScore / 10).toFixed(1)
      : null;

    return (
      <Pressable
        onPress={() => onPress(log)}
        onLongPress={() => onLongPress?.(log)}
        delayLongPress={400}
      >
        <Animated.View style={[styles.timelineEntry, animStyle]}>
          {/* Dot + line */}
          <View style={styles.dotColumn}>
            <View
              style={[
                styles.dot,
                rating ? styles.dotRated : styles.dotUnrated,
              ]}
            />
            {!isLast && <View style={styles.dotLine} />}
          </View>

          {/* Content */}
          <View style={styles.entryContent}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryName} numberOfLines={1}>
                {log.coasterName}
              </Text>
              {displayScore && (
                <View style={styles.scoreBadge}>
                  <Ionicons name="star" size={11} color={colors.accent.primary} />
                  <Text style={styles.scoreText}>{displayScore}</Text>
                </View>
              )}
              {!rating && (
                <View style={styles.unratedBadge}>
                  <Text style={styles.unratedText}>Unrated</Text>
                </View>
              )}
            </View>
            <Text style={styles.entryPark}>{log.parkName}</Text>
            {log.rideCount > 1 && (
              <Text style={styles.entryRide}>Ride #{log.rideCount}</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    );
  },
);

const TimelineView: React.FC<{
  logs: RideLog[];
  ratings: Record<string, CoasterRating>;
  onEntryPress: (log: RideLog) => void;
  onEntryLongPress?: (log: RideLog) => void;
  onLogRide?: () => void;
}> = ({ logs, ratings, onEntryPress, onEntryLongPress, onLogRide }) => {
  const groups = useMemo(() => groupLogsByDate(logs), [logs]);

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="book-outline"
        title="No rides logged yet"
        subtitle="Start tracking your coaster adventures and build your ride history"
        ctaLabel="Log Your First Ride"
        onCtaPress={onLogRide}
        fillParent
      />
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {groups.map((group, gi) => (
        <View key={group.dateLabel + gi}>
          {/* Date header */}
          <Text style={styles.dateHeader}>{group.dateLabel}</Text>

          {/* Entries */}
          {group.entries.map((log, ei) => (
            <TimelineEntryRow
              key={log.id}
              log={log}
              index={gi * 3 + ei}
              isLast={gi === groups.length - 1 && ei === group.entries.length - 1}
              rating={ratings[log.coasterId]}
              onPress={onEntryPress}
              onLongPress={onEntryLongPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// ─── Collection View ────────────────────────────────────────

const CARD_GAP = spacing.md;
const CARD_PADDING = spacing.xl;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

interface CollectionItem {
  coasterId: string;
  coasterName: string;
  parkName: string;
  isUnlocked: boolean;
  rarity: CardRarity;
  rating?: CoasterRating;
  stats?: CoasterStats;
  artSource?: any;
}

const CollectionView: React.FC<{
  items: CollectionItem[];
  onCardPress?: (item: CollectionItem) => void;
  onCardLongPress?: (item: CollectionItem) => void;
  pendingFlipId?: string | null;
  onLogRide?: () => void;
}> = ({ items, onCardPress, onCardLongPress, pendingFlipId, onLogRide }) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="albums-outline"
        title="Your collection is empty"
        subtitle="Log rides to unlock collectible cards for every coaster you experience"
        ctaLabel="Log Your First Ride"
        onCtaPress={onLogRide}
        fillParent
      />
    );
  }

  const renderCollectionItem = useCallback(({ item, index }: { item: CollectionItem; index: number }) => (
    <Animated.View entering={FadeIn.delay(Math.min(index, MAX_STAGGER) * 60).duration(200)}>
      <CoasterCard
        coasterId={item.coasterId}
        coasterName={item.coasterName}
        parkName={item.parkName}
        artSource={item.artSource}
        isUnlocked={item.isUnlocked}
        rarity={item.rarity}
        rating={item.rating}
        stats={item.stats}
        size="small"
        onLongPress={() => onCardLongPress?.(item)}
        triggerFlip={pendingFlipId === item.coasterId}
      />
    </Animated.View>
  ), [onCardLongPress, pendingFlipId]);

  const collectionKeyExtractor = useCallback((item: CollectionItem) => item.coasterId, []);

  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={collectionKeyExtractor}
      columnWrapperStyle={styles.collectionRow}
      contentContainerStyle={styles.collectionContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} // parent ScrollView handles scrolling
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={5}
      renderItem={renderCollectionItem}
    />
  );
};

// ─── Stats View ─────────────────────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  index: number;
}

const StatCard = memo(({ icon, value, label, index }: StatCardProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      100 + index * 80,
      withSpring(1, SPRINGS.responsive),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [12, 0]) },
    ],
  }));

  return (
    <Animated.View style={[styles.statCard, animStyle]}>
      <View style={styles.statIconCircle}>
        <Ionicons name={icon} size={20} color={colors.accent.primary} />
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </Animated.View>
  );
});

const StatsView: React.FC<{
  creditCount: number;
  totalRides: number;
  parksVisited: number;
  topRating: number | null;
  mostRidden: { name: string; count: number }[];
  onLogRide?: () => void;
}> = ({ creditCount, totalRides, parksVisited, topRating, mostRidden, onLogRide }) => (
  <View style={creditCount === 0 ? { flex: 1 } : undefined}>
    {/* Stats grid — hidden when all zero */}
    {creditCount > 0 && (
      <View style={styles.statsGrid}>
        <StatCard icon="trophy-outline" value={creditCount} label="Credits" index={0} />
        <StatCard icon="repeat-outline" value={totalRides} label="Total Rides" index={1} />
        <StatCard icon="map-outline" value={parksVisited} label="Parks" index={2} />
        <StatCard
          icon="star-outline"
          value={topRating != null ? (topRating / 10).toFixed(1) : '—'}
          label="Top Rating"
          index={3}
        />
      </View>
    )}

    {/* Most ridden */}
    {mostRidden.length > 0 && (
      <View style={styles.mostRiddenSection}>
        <Text style={styles.sectionLabel}>MOST RIDDEN</Text>
        {mostRidden.map((item, i) => (
          <Animated.View
            key={item.name}
            entering={FadeIn.delay(400 + i * 60).duration(200)}
            style={styles.mostRiddenRow}
          >
            <Text style={styles.mostRiddenRank}>{i + 1}</Text>
            <Text style={styles.mostRiddenName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.mostRiddenCount}>
              {item.count} ride{item.count !== 1 ? 's' : ''}
            </Text>
          </Animated.View>
        ))}
      </View>
    )}

    {creditCount === 0 && (
      <EmptyState
        icon="analytics-outline"
        title="No stats yet"
        subtitle="Log rides and rate coasters to build your personal statistics"
        ctaLabel="Log Your First Ride"
        onCtaPress={onLogRide}
        fillParent
      />
    )}
  </View>
);

// ─── Pending View ────────────────────────────────────────────

interface PendingItem {
  coasterId: string;
  coasterName: string;
  parkName: string;
  rarity: CardRarity;
  stats?: CoasterStats;
  artSource?: any;
}

const PendingView: React.FC<{
  items: PendingItem[];
  onCardTap: (item: PendingItem) => void;
  onLogRide?: () => void;
}> = ({ items, onCardTap, onLogRide }) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="checkmark-circle-outline"
        iconColor="#4CAF50"
        title="All caught up!"
        subtitle="Every ride has been rated. Log more rides to unlock new cards to rate."
        ctaLabel="Log Another Ride"
        ctaIcon="flash-outline"
        onCtaPress={onLogRide}
      />
    );
  }

  const renderPendingItem = useCallback(({ item, index }: { item: PendingItem; index: number }) => (
    <Animated.View
      entering={FadeIn.delay(Math.min(index, MAX_STAGGER) * 60).duration(200)}
      style={styles.pendingCardWrapper}
    >
      <View style={styles.pendingCardRelative}>
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
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onCardTap(item)}
        />
      </View>
    </Animated.View>
  ), [onCardTap]);

  const pendingKeyExtractor = useCallback((item: PendingItem) => item.coasterId, []);

  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={pendingKeyExtractor}
      columnWrapperStyle={styles.collectionRow}
      contentContainerStyle={styles.collectionContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={5}
      renderItem={renderPendingItem}
    />
  );
};

// ─── Main Screen ────────────────────────────────────────────

export const LogbookScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { confirm } = useConfirmModal();
  const [activeView, setActiveView] = useState<ViewMode>('Timeline');
  const headerProgress = useSharedValue(0);
  const { pressHandlers: fabPressHandlers, animatedStyle: fabAnimatedStyle } = useSpringPress({ scale: 0.9 });

  // Rating sheet state
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    id: string;
    name: string;
    parkName: string;
  } | null>(null);
  const [ratingExisting, setRatingExisting] = useState<CoasterRating | undefined>();

  // Card action sheet state
  const [actionTarget, setActionTarget] = useState<CardActionTarget | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [pendingFlipId, setPendingFlipId] = useState<string | null>(null);

  // Timeline action sheet state
  const [timelineActionTarget, setTimelineActionTarget] = useState<TimelineActionTarget | null>(null);
  const [timelineActionVisible, setTimelineActionVisible] = useState(false);

  // Logbook log sheet state (search step)
  const [logSheetVisible, setLogSheetVisible] = useState(false);

  // Log confirmation sheet state (unified with HomeScreen flow)
  const [logConfirmCoaster, setLogConfirmCoaster] = useState<{
    id: string; name: string; parkName: string;
  } | null>(null);

  // Hide FABs when any sheet/modal is open
  const anySheetOpen = ratingVisible || actionSheetVisible || timelineActionVisible || logSheetVisible || !!logConfirmCoaster;

  // Subscribe to store for reactivity
  const { logs, ratings, creditCount, totalRideCount } = useRideLogStore();

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: TIMING.normal });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [
      { translateY: interpolate(headerProgress.value, [0, 1], [-8, 0]) },
    ],
  }));

  // ── Derived data ──

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [logs],
  );

  const ratingsMap = useMemo(() => {
    const map: Record<string, CoasterRating> = {};
    for (const r of Object.values(ratings)) {
      map[r.coasterId] = r;
    }
    return map;
  }, [ratings]);

  const parksVisited = useMemo(() => {
    const parks = new Set(logs.map((l) => l.parkName));
    return parks.size;
  }, [logs]);

  const topRating = useMemo(() => {
    const scores = Object.values(ratings).map((r) => r.weightedScore);
    return scores.length > 0 ? Math.max(...scores) : null;
  }, [ratings]);

  const mostRidden = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    for (const log of logs) {
      if (!counts[log.coasterId]) {
        counts[log.coasterId] = { name: log.coasterName, count: 0 };
      }
      counts[log.coasterId].count++;
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [logs]);

  // ── Collection items ──

  const collectionItems = useMemo((): CollectionItem[] => {
    // Build unlocked set from logs
    const loggedCoasters = new Map<
      string,
      { coasterId: string; coasterName: string; parkName: string; latestTimestamp: string }
    >();
    for (const log of logs) {
      const existing = loggedCoasters.get(log.coasterId);
      if (!existing || log.timestamp > existing.latestTimestamp) {
        loggedCoasters.set(log.coasterId, {
          coasterId: log.coasterId,
          coasterName: log.coasterName,
          parkName: log.parkName,
          latestTimestamp: log.timestamp,
        });
      }
    }

    // Unlocked cards — sorted by most recently logged
    const unlocked = Array.from(loggedCoasters.values())
      .sort((a, b) => b.latestTimestamp.localeCompare(a.latestTimestamp))
      .map((c): CollectionItem => {
        const coasterData = COASTER_BY_ID[c.coasterId];
        const rank = coasterData?.popularityRank ?? 9999;
        return {
          coasterId: c.coasterId,
          coasterName: c.coasterName,
          parkName: c.parkName,
          isUnlocked: true,
          rarity: getRarityFromRank(rank),
          rating: ratingsMap[c.coasterId],
          stats: getCoasterStats(c.coasterId),
          artSource: CARD_ART[c.coasterId],
        };
      });

    return unlocked;
  }, [logs, ratingsMap]);

  // ── Pending (unrated) items ──
  const toRateItems = useMemo((): PendingItem[] => {
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
  }, [logs, ratingsMap]);

  const unratedCount = toRateItems.length;

  // ── Handlers ──

  const handlePendingCardTap = useCallback((item: PendingItem) => {
    haptics.select();
    setRatingTarget({
      id: item.coasterId,
      name: item.coasterName,
      parkName: item.parkName,
    });
    setRatingExisting(undefined);
    setRatingVisible(true);
  }, []);

  const handleEntryPress = useCallback((log: RideLog) => {
    haptics.select();
    setRatingTarget({
      id: log.coasterId,
      name: log.coasterName,
      parkName: log.parkName,
    });
    setRatingExisting(getRatingForCoaster(log.coasterId));
    setRatingVisible(true);
  }, []);

  const handleCardLongPress = useCallback((item: CollectionItem) => {
    setActionTarget({
      coasterId: item.coasterId,
      coasterName: item.coasterName,
      parkName: item.parkName,
      rarity: item.rarity,
      rating: item.rating,
    });
    setActionSheetVisible(true);
  }, []);

  const handleActionClose = useCallback(() => {
    setActionSheetVisible(false);
    setActionTarget(null);
  }, []);

  const handleActionViewDetails = useCallback((target: CardActionTarget) => {
    setActionSheetVisible(false);
    setActionTarget(null);
    setPendingFlipId(target.coasterId);
    // Clear after a tick so the prop resets for future taps
    setTimeout(() => setPendingFlipId(null), 600);
  }, []);

  const handleActionRate = useCallback((target: CardActionTarget) => {
    setActionSheetVisible(false);
    setActionTarget(null);
    setRatingTarget({
      id: target.coasterId,
      name: target.coasterName,
      parkName: target.parkName,
    });
    setRatingExisting(target.rating);
    setRatingVisible(true);
  }, []);

  const handleRatingClose = useCallback(() => {
    setRatingVisible(false);
    setRatingTarget(null);
    setRatingExisting(undefined);
  }, []);

  const handleRatingComplete = useCallback(() => {
    setRatingVisible(false);
    setRatingTarget(null);
    setRatingExisting(undefined);
  }, []);

  // ── Log confirm sheet handlers (unified with HomeScreen) ──

  const handleLogCoasterSelect = useCallback((coaster: CoasterIndexEntry) => {
    setLogConfirmCoaster({
      id: coaster.id,
      name: coaster.name,
      parkName: coaster.park,
    });
  }, []);

  const handleLogConfirm = useCallback(() => {
    if (!logConfirmCoaster) return;
    addQuickLog({
      id: logConfirmCoaster.id,
      name: logConfirmCoaster.name,
      parkName: logConfirmCoaster.parkName,
    });
  }, [logConfirmCoaster]);

  const handleLogRate = useCallback(() => {
    if (!logConfirmCoaster) return;
    setLogConfirmCoaster(null);
    setRatingTarget({
      id: logConfirmCoaster.id,
      name: logConfirmCoaster.name,
      parkName: logConfirmCoaster.parkName,
    });
    setRatingExisting(getRatingForCoaster(logConfirmCoaster.id));
    setRatingVisible(true);
  }, [logConfirmCoaster]);

  const handleLogConfirmDismiss = useCallback(() => {
    setLogConfirmCoaster(null);
  }, []);

  // ── Timeline action sheet handlers ──

  const handleEntryLongPress = useCallback((log: RideLog) => {
    haptics.select();
    setTimelineActionTarget({
      logId: log.id,
      coasterId: log.coasterId,
      coasterName: log.coasterName,
      parkName: log.parkName,
      timestamp: log.timestamp,
      isRated: !!ratingsMap[log.coasterId],
    });
    setTimelineActionVisible(true);
  }, [ratingsMap]);

  const handleTimelineActionClose = useCallback(() => {
    setTimelineActionVisible(false);
    setTimelineActionTarget(null);
  }, []);

  const handleTimelineEditDate = useCallback((logId: string, newTimestamp: string) => {
    updateLogTimestamp(logId, newTimestamp);
  }, []);

  const handleTimelineEditRating = useCallback((target: TimelineActionTarget) => {
    setTimelineActionVisible(false);
    setTimelineActionTarget(null);
    setRatingTarget({
      id: target.coasterId,
      name: target.coasterName,
      parkName: target.parkName,
    });
    setRatingExisting(getRatingForCoaster(target.coasterId));
    setRatingVisible(true);
  }, []);

  const handleTimelineDelete = useCallback((target: TimelineActionTarget) => {
    setTimelineActionVisible(false);
    setTimelineActionTarget(null);
    confirm({
      title: 'Delete Ride',
      message: `Remove this ride on ${target.coasterName}? This cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteLog(target.logId),
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 49 + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats summary header — no redundant title */}
        <Animated.View style={[styles.header, headerAnimStyle]}>
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{creditCount}</Text>
              <Text style={styles.headerStatLabel}>Credits</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{totalRideCount}</Text>
              <Text style={styles.headerStatLabel}>Rides</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{parksVisited}</Text>
              <Text style={styles.headerStatLabel}>Parks</Text>
            </View>
          </View>
        </Animated.View>

        {/* Segmented Control */}
        <SegmentedControl selected={activeView} onSelect={(v: ViewMode) => { setActiveView(v); }} unratedCount={unratedCount} />

        {/* View content */}
        {activeView === 'Timeline' && (
          <TimelineView
            logs={sortedLogs}
            ratings={ratingsMap}
            onEntryPress={handleEntryPress}
            onEntryLongPress={handleEntryLongPress}
            onLogRide={() => setLogSheetVisible(true)}
          />
        )}

        {activeView === 'Collection' && (
          <CollectionView
            items={collectionItems}
            onCardLongPress={handleCardLongPress}
            pendingFlipId={pendingFlipId}
            onLogRide={() => setLogSheetVisible(true)}
          />
        )}

        {activeView === 'Stats' && (
          <StatsView
            creditCount={creditCount}
            totalRides={totalRideCount}
            parksVisited={parksVisited}
            topRating={topRating}
            mostRidden={mostRidden}
            onLogRide={() => setLogSheetVisible(true)}
          />
        )}

        {activeView === 'Pending' && (
          <PendingView
            items={toRateItems}
            onCardTap={handlePendingCardTap}
            onLogRide={() => setLogSheetVisible(true)}
          />
        )}
      </Animated.ScrollView>

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={insets.top} />

      {/* Card Action Sheet */}
      <CardActionSheet
        target={actionTarget}
        visible={actionSheetVisible}
        onClose={handleActionClose}
        onViewDetails={handleActionViewDetails}
        onRate={handleActionRate}
      />

      {/* Rating Sheet */}
      <RatingSheet
        visible={ratingVisible}
        coasterId={ratingTarget?.id ?? ''}
        coasterName={ratingTarget?.name ?? ''}
        parkName={ratingTarget?.parkName ?? ''}
        existingRating={ratingExisting}
        onClose={handleRatingClose}
        onComplete={handleRatingComplete}
      />

      {/* Timeline Action Sheet */}
      <TimelineActionSheet
        target={timelineActionTarget}
        visible={timelineActionVisible}
        onClose={handleTimelineActionClose}
        onDateChanged={handleTimelineEditDate}
        onEditRating={handleTimelineEditRating}
        onDelete={handleTimelineDelete}
      />

      {/* Logbook Log Sheet (search step) */}
      <LogbookLogSheet
        visible={logSheetVisible}
        onClose={() => setLogSheetVisible(false)}
        onCoasterSelect={handleLogCoasterSelect}
      />

      {/* Log Confirmation Sheet (unified with HomeScreen) */}
      <LogConfirmSheet
        visible={!!logConfirmCoaster}
        coasterId={logConfirmCoaster?.id ?? ''}
        coasterName={logConfirmCoaster?.name ?? ''}
        parkName={logConfirmCoaster?.parkName ?? ''}
        rideNumber={logConfirmCoaster ? getTodayRideCountForCoaster(logConfirmCoaster.id) + 1 : 1}
        onConfirm={handleLogConfirm}
        onRate={handleLogRate}
        onDismiss={handleLogConfirmDismiss}
      />

      {/* Card Shop FAB — bottom left, opposite the log FAB */}
      {activeView === 'Collection' && !anySheetOpen && (
        <Pressable
          onPress={() => {
            haptics.select();
            navigation.navigate('MerchStore');
          }}
          style={[
            styles.shopFab,
            { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.lg },
          ]}
        >
          <View style={styles.shopFabInner}>
            <Ionicons name="bag-outline" size={24} color={colors.accent.primary} />
          </View>
        </Pressable>
      )}

      {/* Log Ride FAB — hidden when any sheet is open */}
      {!anySheetOpen && <Pressable
        {...fabPressHandlers}
        onPress={() => {
          haptics.tap();
          setLogSheetVisible(true);
        }}
        style={[
          styles.fab,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.lg },
        ]}
      >
        <Animated.View style={[styles.fabInner, fabAnimatedStyle]}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </Pressable>}
    </View>
  );
};

export default LogbookScreen;

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },

  // ── Header ──
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerStatLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: 1,
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.subtle,
  },

  // ── Segmented Control ──
  segmentRow: {
    flexDirection: 'row',
    marginBottom: spacing.xxl,
    backgroundColor: colors.background.card,
    borderRadius: radius.button,
    padding: spacing.xs,
    position: 'relative',
    ...shadows.small,
  },
  segmentIndicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.button - spacing.xs,
    backgroundColor: colors.accent.primary,
    ...shadows.small,
  },
  segmentChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },

  // ── Timeline ──
  timelineContainer: {
    paddingLeft: spacing.xs,
  },
  dateHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  timelineEntry: {
    flexDirection: 'row',
    minHeight: 60,
  },
  dotColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  dotRated: {
    backgroundColor: colors.accent.primary,
  },
  dotUnrated: {
    backgroundColor: colors.border.subtle,
    borderWidth: 2,
    borderColor: colors.text.meta,
  },
  dotLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 4,
  },
  entryContent: {
    flex: 1,
    paddingLeft: spacing.base,
    paddingBottom: spacing.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  entryName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  unratedBadge: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  unratedText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  entryPark: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  entryRide: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 1,
  },

  // ── Pending ──
  pendingCardWrapper: {
    width: CARD_WIDTH,
  },
  pendingCardRelative: {
    position: 'relative',
  },

  // ── Card Shop Banner ──
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.base,
    ...shadows.small,
  },
  shopBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  shopBannerText: {
    flex: 1,
  },
  shopBannerTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  shopBannerSubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // ── Collection ──
  collectionRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  collectionContent: {
    paddingBottom: spacing.lg,
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  statCardValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statCardLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: 2,
  },

  // ── Most Ridden ──
  mostRiddenSection: {
    marginTop: spacing.xxl,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.base,
  },
  mostRiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  mostRiddenRank: {
    width: 24,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.meta,
    textAlign: 'center',
  },
  mostRiddenName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginLeft: spacing.base,
  },
  mostRiddenCount: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },

  // ── FABs ──
  shopFab: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 20,
  },
  shopFabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 20,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    textAlign: 'center',
    maxWidth: 240,
  },
});
