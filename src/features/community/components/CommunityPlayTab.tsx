/**
 * CommunityPlayTab — Redesigned games hub
 *
 * Featured game: single card that rotates daily (day of year % game count).
 * More Games: horizontal carousel of remaining games + placeholder 5th game.
 * Weekly challenge and quick tip below.
 */

import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { MOCK_COASTLE_STATS } from '../data/mockCommunityData';

const EASE_OUT = Easing.out(Easing.ease);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Carousel card sizing: ~2.5 cards visible at a time
const CAROUSEL_CARD_SIZE = (SCREEN_WIDTH - spacing.lg * 2) * 0.38;
const CAROUSEL_GAP = spacing.base;

// ─── Props ──────────────────────────────────────────────────

interface CommunityPlayTabProps {
  topInset?: number;
  onPlayCoastle: () => void;
  onPlaySpeedSorter?: () => void;
  onPlayBlindRanking?: () => void;
  onPlayTrivia?: () => void;
  onPlayParkle?: () => void;
  scrollY?: SharedValue<number>;
}

// ─── Game Definitions ───────────────────────────────────────

interface GameDef {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  dailyLabel: string;
  dailyNumber: number;
  streak: number;
  stats: { value: string; label: string }[];
  ctaText: string;
}

const ALL_GAMES: GameDef[] = [
  {
    id: 'coastle',
    title: 'Coastle',
    subtitle: 'Guess the coaster from clues',
    icon: 'game-controller',
    iconColor: colors.accent.primary,
    dailyLabel: 'Daily',
    dailyNumber: MOCK_COASTLE_STATS.dailyNumber,
    streak: MOCK_COASTLE_STATS.streak,
    stats: [
      { value: String(MOCK_COASTLE_STATS.gamesPlayed), label: 'Played' },
      { value: `${MOCK_COASTLE_STATS.winRate}%`, label: 'Win Rate' },
      { value: '4.2', label: 'Avg Guesses' },
    ],
    ctaText: "Play Today's Coastle",
  },
  {
    id: 'speed-sorter',
    title: 'Speed Sorter',
    subtitle: 'Sort coasters by stats against the clock',
    icon: 'swap-vertical',
    iconColor: '#5B8DEF',
    dailyLabel: 'Challenge',
    dailyNumber: 15,
    streak: 3,
    stats: [
      { value: '28', label: 'Played' },
      { value: '12s', label: 'Best Time' },
      { value: '85%', label: 'Accuracy' },
    ],
    ctaText: 'Play Speed Sorter',
  },
  {
    id: 'blind-ranking',
    title: 'Blind Ranking',
    subtitle: 'Rank coasters without peeking at stats',
    icon: 'eye-off',
    iconColor: '#9B6FD4',
    dailyLabel: 'Round',
    dailyNumber: 8,
    streak: 0,
    stats: [
      { value: '14', label: 'Played' },
      { value: '72%', label: 'Accuracy' },
      { value: '3', label: 'Perfect' },
    ],
    ctaText: 'Play Blind Ranking',
  },
  {
    id: 'trivia',
    title: 'Trivia',
    subtitle: 'Test your coaster knowledge',
    icon: 'help-circle',
    iconColor: '#E8A838',
    dailyLabel: 'Quiz',
    dailyNumber: 22,
    streak: 7,
    stats: [
      { value: '56', label: 'Played' },
      { value: '91%', label: 'Accuracy' },
      { value: '18', label: 'Perfect' },
    ],
    ctaText: 'Play Trivia',
  },
  {
    id: 'parkle',
    title: 'Parkle',
    subtitle: 'Guess the park from clues',
    icon: 'location',
    iconColor: '#7BA3C9',
    dailyLabel: 'Daily',
    dailyNumber: 42,
    streak: 0,
    stats: [
      { value: '0', label: 'Played' },
      { value: '0%', label: 'Win Rate' },
      { value: '0', label: 'Streak' },
    ],
    ctaText: "Play Today's Parkle",
  },
];

// ─── Daily rotation helper ──────────────────────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getFeaturedIndex(): number {
  return getDayOfYear() % ALL_GAMES.length;
}

// ─── Streak Dots ─────────────────────────────────────────────

function StreakDots({ streak }: { streak: number }) {
  const dots = Math.min(streak, 7);
  return (
    <View style={styles.streakDots}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.streakDot,
            i < dots ? styles.streakDotActive : styles.streakDotInactive,
          ]}
        />
      ))}
    </View>
  );
}


// ─── Featured Game Card (single, no paging) ─────────────────

function FeaturedGameCard({ game, onPress }: { game: GameDef; onPress: () => void }) {
  const press = useCardPress();
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 350, easing: EASE_OUT });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [24, 0]) }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      {...press.pressHandlers}
    >
      <Animated.View style={[styles.heroCard, entranceStyle, press.animatedStyle]}>
        {/* Daily badge + streak flame */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="today-outline" size={12} color={colors.accent.primary} />
            <Text style={styles.heroBadgeText}>{game.dailyLabel} #{game.dailyNumber}</Text>
          </View>
          <View style={styles.heroStreakBadge}>
            <Ionicons name="flame" size={14} color="#E07A5F" />
            {game.streak > 0 && (
              <Text style={styles.heroStreakBadgeText}>{game.streak}</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <View style={styles.heroTitleRow}>
          <View style={[styles.heroIconCircle, { backgroundColor: game.iconColor + '15' }]}>
            <Ionicons name={game.icon as any} size={28} color={game.iconColor} />
          </View>
          <View style={styles.heroTitleCol}>
            <Text style={styles.heroTitle}>{game.title}</Text>
            <Text style={styles.heroSubtitle}>{game.subtitle}</Text>
          </View>
        </View>

        {/* Streak dots — always shown. Empty dots if no streak */}
        <View style={styles.heroStreakSection}>
          <StreakDots streak={game.streak} />
          <Text style={styles.heroStreakLabel}>
            {game.streak > 0 ? `${game.streak} day streak` : 'Start a streak'}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.heroStatsRow}>
          {game.stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.heroStatDivider} />}
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{stat.value}</Text>
                <Text style={styles.heroStatLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Play CTA */}
        <View style={styles.heroPlayCta}>
          <Ionicons name="play" size={16} color={colors.text.inverse} />
          <Text style={styles.heroPlayCtaText}>{game.ctaText}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Carousel Game Card (square) ────────────────────────────

function CarouselGameCard({
  game,
  onPress,
}: {
  game: GameDef;
  onPress: () => void;
}) {
  const press = useCardPress();

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      {...press.pressHandlers}
    >
      <Animated.View style={[styles.carouselCard, press.animatedStyle]}>
        {/* Streak badge (top-right) */}
        {game.streak > 0 && (
          <View style={styles.carouselStreakBadge}>
            <Ionicons name="flame" size={11} color="#E07A5F" />
            <Text style={styles.carouselStreakText}>{game.streak}</Text>
          </View>
        )}

        <View style={[styles.carouselIconCircle, { backgroundColor: game.iconColor + '15' }]}>
          <Ionicons name={game.icon as any} size={22} color={game.iconColor} />
        </View>

        <Text
          style={styles.carouselTitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {game.title}
        </Text>
        <Text
          style={styles.carouselSubtitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {game.subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Challenge Card (Weekly) ─────────────────────────────────

function WeeklyChallenge() {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      400,
      withTiming(1, { duration: 300, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [16, 0]) }],
  }));

  return (
    <Animated.View style={[styles.challengeCard, entranceStyle]}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIconCircle}>
          <Ionicons name="ribbon-outline" size={16} color={colors.accent.primary} />
        </View>
        <View style={styles.challengeTitleCol}>
          <Text style={styles.challengeTitle}>Weekly Challenge</Text>
          <Text style={styles.challengeDescription}>
            Play all 4 games this week to earn the Explorer badge
          </Text>
        </View>
      </View>
      <View style={styles.challengeProgress}>
        <View style={styles.challengeBarTrack}>
          <View style={[styles.challengeBarFill, { width: '25%' }]} />
        </View>
        <Text style={styles.challengeProgressText}>1 / 4</Text>
      </View>
    </Animated.View>
  );
}

// ─── Quick Tip Card ──────────────────────────────────────────

function QuickTip() {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      500,
      withTiming(1, { duration: 300, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [12, 0]) }],
  }));

  return (
    <Animated.View style={[styles.tipCard, entranceStyle]}>
      <Ionicons name="bulb-outline" size={16} color={colors.text.meta} />
      <Text style={styles.tipText}>
        Tip: In Coastle, start with a popular coaster — they share common clue patterns
      </Text>
    </Animated.View>
  );
}

// ─── Section Label ───────────────────────────────────────────

function SectionLabel({ label, delay }: { label: string; delay: number }) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(delay, withTiming(1, { duration: 250, easing: EASE_OUT }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: entrance.value,
  }));

  return (
    <Animated.Text style={[styles.sectionLabel, style]}>{label}</Animated.Text>
  );
}

// ─── More Games Carousel ────────────────────────────────────

function MoreGamesCarousel({
  games,
  onGamePress,
}: {
  games: GameDef[];
  onGamePress: (id: string) => void;
}) {
  const entrance = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    entrance.value = withDelay(
      150,
      withTiming(1, { duration: 300, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [20, 0]) }],
  }));

  return (
    <Animated.View style={[entranceStyle, { overflow: 'visible' }]}>
      <View style={styles.carouselShadowSafe}>
        <FlatList
          ref={flatListRef}
          data={games}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          snapToInterval={CAROUSEL_CARD_SIZE + CAROUSEL_GAP}
          decelerationRate="fast"
          style={{ overflow: 'visible' }}
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item }) => (
            <View style={styles.carouselItem}>
              <CarouselGameCard
                game={item}
                onPress={() => onGamePress(item.id)}
              />
            </View>
          )}
        />
      </View>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────

export const CommunityPlayTab = ({
  topInset = 0,
  onPlayCoastle,
  onPlaySpeedSorter,
  onPlayBlindRanking,
  onPlayTrivia,
  onPlayParkle,
  scrollY,
}: CommunityPlayTabProps) => {
  const insets = useSafeAreaInsets();

  const playScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y;
    },
  });

  const featuredIndex = useMemo(() => getFeaturedIndex(), []);
  const featuredGame = ALL_GAMES[featuredIndex];

  // Build carousel items: all games except featured
  const carouselGames = useMemo(() => {
    return ALL_GAMES.filter((_, i) => i !== featuredIndex);
  }, [featuredIndex]);

  const handleGamePress = useCallback((id: string) => {
    switch (id) {
      case 'coastle':
        onPlayCoastle();
        break;
      case 'speed-sorter':
        onPlaySpeedSorter?.();
        break;
      case 'blind-ranking':
        onPlayBlindRanking?.();
        break;
      case 'trivia':
        onPlayTrivia?.();
        break;
      case 'parkle':
        onPlayParkle?.();
        break;
    }
  }, [onPlayCoastle, onPlaySpeedSorter, onPlayBlindRanking, onPlayTrivia, onPlayParkle]);

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={playScrollHandler}
      scrollEventThrottle={16}
    >
      {/* Featured: Single daily game */}
      <SectionLabel label="FEATURED" delay={0} />
      <View style={styles.featuredShadowSafe}>
        <FeaturedGameCard
          game={featuredGame}
          onPress={() => handleGamePress(featuredGame.id)}
        />
      </View>

      {/* More Games: Horizontal carousel */}
      <SectionLabel label="MORE GAMES" delay={120} />
      <View style={styles.carouselSection}>
        <MoreGamesCarousel games={carouselGames} onGamePress={handleGamePress} />
      </View>

      {/* Weekly Challenge */}
      <SectionLabel label="CHALLENGES" delay={350} />
      <WeeklyChallenge />

      {/* Quick Tip */}
      <QuickTip />
    </Animated.ScrollView>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // Section labels
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginTop: spacing.xxl,
    marginBottom: spacing.base,
  },

  // Featured hero card — shadow-safe wrapper
  featuredShadowSafe: {
    paddingVertical: spacing.xl,
    marginVertical: -spacing.xl,
  },

  // Hero card
  heroCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  heroStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E07A5F15',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  heroStreakBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: '#E07A5F',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    marginLeft: spacing.base,
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Streak section
  heroStreakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  heroStreakLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakDotActive: {
    backgroundColor: '#E07A5F',
  },
  streakDotInactive: {
    backgroundColor: colors.border.subtle,
  },

  // Hero stats
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.subtle,
  },
  heroStatValue: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroStatLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 2,
  },

  // Play CTA
  heroPlayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
  },
  heroPlayCtaText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },

  // More Games carousel
  carouselSection: {
    marginHorizontal: -spacing.lg,
  },
  carouselShadowSafe: {
    marginVertical: -spacing.base,
    overflow: 'visible',
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: CAROUSEL_GAP,
  },
  carouselItem: {
    width: CAROUSEL_CARD_SIZE,
    height: CAROUSEL_CARD_SIZE,
    aspectRatio: 1,
  },
  carouselCard: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  carouselStreakBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E07A5F12',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  carouselStreakText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#E07A5F',
  },
  carouselIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  carouselTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  carouselSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: 2,
  },

  // Weekly challenge
  challengeCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  challengeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  challengeTitleCol: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  challengeBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  challengeProgressText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },

  // Quick tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
  },
  tipText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
});
