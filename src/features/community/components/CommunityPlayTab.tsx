import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
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

// ─── Game Data ──────────────────────────────────────────────

interface GameDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  stats: { label: string; value: string }[];
  badge?: string;
}

const GAMES: GameDef[] = [
  {
    id: 'coastle',
    title: 'Coastle',
    subtitle: 'Daily coaster puzzle',
    description: 'Guess the coaster from clues. A new puzzle every day.',
    icon: 'game-controller-outline',
    accentColor: colors.accent.primary,
    badge: `Daily #${MOCK_COASTLE_STATS.dailyNumber}`,
    stats: [
      { label: 'Streak', value: `${MOCK_COASTLE_STATS.streak}` },
      { label: 'Played', value: `${MOCK_COASTLE_STATS.gamesPlayed}` },
      { label: 'Win Rate', value: `${MOCK_COASTLE_STATS.winRate}%` },
    ],
  },
  {
    id: 'speed-sorter',
    title: 'Speed Sorter',
    subtitle: 'Sort coasters by stats',
    description: 'Drag cards to rank coasters by speed, height, and more.',
    icon: 'swap-vertical-outline',
    accentColor: colors.accent.primary,
    stats: [
      { label: 'Played', value: '0' },
      { label: 'Best', value: '--' },
      { label: 'Perfect', value: '0' },
    ],
  },
  {
    id: 'blind-ranking',
    title: 'Blind Ranking',
    subtitle: 'Rank without peeking',
    description: 'See items one at a time. Place them where you think they belong.',
    icon: 'eye-off-outline',
    accentColor: colors.accent.primary,
    stats: [
      { label: 'Played', value: '0' },
      { label: 'Categories', value: '4' },
      { label: 'Favorite', value: '--' },
    ],
  },
  {
    id: 'trivia',
    title: 'Coaster Trivia',
    subtitle: 'Test your knowledge',
    description: '10 questions per round. Parks, coasters, history, and more.',
    icon: 'help-circle-outline',
    accentColor: colors.accent.primary,
    stats: [
      { label: 'Played', value: '0' },
      { label: 'Best Streak', value: '0' },
      { label: 'Accuracy', value: '--' },
    ],
  },
];

// ─── Props ──────────────────────────────────────────────────

interface CommunityPlayTabProps {
  topInset?: number;
  onPlayCoastle: () => void;
  onPlaySpeedSorter?: () => void;
  onPlayBlindRanking?: () => void;
  onPlayTrivia?: () => void;
}

// ─── Stat Chip ──────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

// ─── Game Card ──────────────────────────────────────────────

function GameCard({
  game,
  index,
  onPress,
}: {
  game: GameDef;
  index: number;
  onPress: () => void;
}) {
  const press = useCardPress();

  // Staggered entrance animation
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      index * 80,
      withTiming(1, { duration: 280, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: interpolate(entrance.value, [0, 1], [24, 0]) },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      {...press.pressHandlers}
    >
      <Animated.View style={[styles.gameCard, entranceStyle, press.animatedStyle]}>
        {/* Top Section: Icon + Title + Arrow */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardIconCircle}>
            <Ionicons name={game.icon as any} size={22} color={game.accentColor} />
          </View>

          <View style={styles.cardTitleCol}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{game.title}</Text>
              {game.badge && (
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{game.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
          </View>

          <View style={styles.cardArrow}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.meta} />
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDescription}>{game.description}</Text>

        {/* Stats Row */}
        <View style={styles.cardStatsRow}>
          {game.stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.cardStatDivider} />}
              <StatChip label={stat.label} value={stat.value} />
            </React.Fragment>
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Section Header ─────────────────────────────────────────

function SectionHeader({ index }: { index: number }) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 300, easing: EASE_OUT });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [12, 0]) }],
  }));

  return (
    <Animated.View style={[styles.sectionHeader, entranceStyle]}>
      <View style={styles.sectionIconCircle}>
        <Ionicons name="game-controller" size={18} color={colors.accent.primary} />
      </View>
      <View style={styles.sectionTextCol}>
        <Text style={styles.sectionTitle}>Games</Text>
        <Text style={styles.sectionSubtitle}>Daily puzzles, trivia, and more</Text>
      </View>
    </Animated.View>
  );
}

// ─── Quick Play Strip ───────────────────────────────────────

function QuickPlayStrip({
  games,
  onPress,
}: {
  games: GameDef[];
  onPress: (id: string) => void;
}) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      40,
      withTiming(1, { duration: 260, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [16, 0]) }],
  }));

  return (
    <Animated.View style={[styles.quickPlayContainer, entranceStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickPlayScroll}
        contentContainerStyle={styles.quickPlayContent}
      >
        {games.map((game) => (
          <QuickPlayChip key={game.id} game={game} onPress={() => onPress(game.id)} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function QuickPlayChip({ game, onPress }: { game: GameDef; onPress: () => void }) {
  const press = useCardPress();

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      {...press.pressHandlers}
    >
      <Animated.View style={[styles.quickPlayChip, press.animatedStyle]}>
        <Ionicons name={game.icon as any} size={16} color={game.accentColor} />
        <Text style={styles.quickPlayChipText}>{game.title}</Text>
        <Ionicons name="play" size={12} color={colors.text.meta} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ─────────────────────────────────────────

export const CommunityPlayTab = ({
  topInset = 0,
  onPlayCoastle,
  onPlaySpeedSorter,
  onPlayBlindRanking,
  onPlayTrivia,
}: CommunityPlayTabProps) => {
  const insets = useSafeAreaInsets();

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
    }
  }, [onPlayCoastle, onPlaySpeedSorter, onPlayBlindRanking, onPlayTrivia]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Header */}
      <SectionHeader index={0} />

      {/* Quick Play Strip */}
      <QuickPlayStrip games={GAMES} onPress={handleGamePress} />

      {/* Game Cards */}
      <View style={styles.cardsColumn}>
        {GAMES.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            index={index}
            onPress={() => handleGamePress(game.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTextCol: {
    marginLeft: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Quick play strip
  quickPlayContainer: {
    marginHorizontal: -spacing.lg,
    // Compensate for shadow padding on top; keep bottom margin for spacing
    marginTop: -spacing.base,
    marginBottom: spacing.md,
  },
  quickPlayScroll: {
    overflow: 'visible' as const,
  },
  quickPlayContent: {
    paddingHorizontal: spacing.lg,
    // Accommodate shadows.small spread (shadowRadius: 12, offset: 4)
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  quickPlayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.small,
  },
  quickPlayChipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // Game cards
  cardsColumn: {
    gap: spacing.lg,
  },
  gameCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.card,
  },

  // Card top row
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
    marginLeft: spacing.base,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  cardBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card description
  cardDescription: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginTop: spacing.base,
  },

  // Card stats
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  cardStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
  },
  statChipValue: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statChipLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 2,
  },
});
