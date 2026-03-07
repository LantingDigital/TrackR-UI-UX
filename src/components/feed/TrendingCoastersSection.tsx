/**
 * TrendingCoastersSection - Horizontal scroll of trending coasters with rank badges.
 * Each card shows rank, name, park, and a popularity score indicator.
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { SPRINGS } from '../../constants/animations';
import { TRENDING_COASTERS, TrendingCoasterEntry } from '../../data/trendingData';
import { CARD_ART } from '../../data/cardArt';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.38;
const CARD_HEIGHT = 200;

// ── Individual Trending Card ──

interface TrendingCardProps {
  item: TrendingCoasterEntry;
  index: number;
  onPress: (item: TrendingCoasterEntry) => void;
  onLongPress?: (item: TrendingCoasterEntry) => void;
}

const TrendingCard = React.memo<TrendingCardProps>(({ item, index, onPress, onLongPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.95, opacity: 0.9 });
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * 75,
      withSpring(1, SPRINGS.bouncy)
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { translateX: (1 - entryProgress.value) * 40 },
      { scale: 0.85 + entryProgress.value * 0.15 },
    ],
  }));

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.text.meta;
  };

  return (
    <Animated.View style={[entryStyle, animatedStyle]}>
      <Pressable
        onPress={() => { haptics.select(); onPress(item); }}
        onLongPress={onLongPress ? () => { haptics.heavy(); onLongPress(item); } : undefined}
        delayLongPress={400}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={CARD_ART[item.id] ?? { uri: item.imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.id}
          />
          <View style={styles.imageOverlay} />
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}>
            <Text style={styles.rankText}>#{item.rank}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPark} numberOfLines={1}>{item.park}</Text>
          <View style={styles.scoreRow}>
            <Ionicons name="trending-up" size={12} color={colors.accent.primary} />
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ── Main Component ──

interface TrendingCoastersSectionProps {
  onCoasterPress?: (item: TrendingCoasterEntry) => void;
  onCoasterLongPress?: (item: TrendingCoasterEntry) => void;
  onSeeAll?: () => void;
}

export const TrendingCoastersSection = React.memo<TrendingCoastersSectionProps>(({ onCoasterPress, onCoasterLongPress, onSeeAll }) => {
  const handlePress = useCallback((item: TrendingCoasterEntry) => {
    onCoasterPress?.(item);
  }, [onCoasterPress]);

  const handleLongPress = useCallback((item: TrendingCoasterEntry) => {
    onCoasterLongPress?.(item);
  }, [onCoasterLongPress]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Trending This Week</Text>
        <Pressable onPress={() => { haptics.tap(); onSeeAll?.(); }} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.base}
      >
        {TRENDING_COASTERS.slice(0, 7).map((coaster, index) => (
          <TrendingCard
            key={coaster.id}
            item={coaster}
            index={index}
            onPress={handlePress}
            onLongPress={handleLongPress}
          />
        ))}
      </ScrollView>
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  scrollView: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_HEIGHT * 0.6,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.trendingRank,
    minWidth: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.primary,
  },
  cardContent: {
    padding: spacing.base,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardPark: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});
