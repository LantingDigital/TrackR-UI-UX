/**
 * GamesSection - Horizontal scrolling strip of game cards for the home feed.
 * Shows available games (Coastle, Speed Sorter, Blind Ranking, Trivia)
 * plus a "View All" card that navigates to the full games list.
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { onBecomeVisible, offBecomeVisible, hasBeenVisible } from '../../utils/feedAnimations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { typography } from '../../theme/typography';
import { haptics } from '../../services/haptics';

// ── Game Definitions ──

interface GameDef {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const GAMES: GameDef[] = [
  {
    id: 'coastle',
    title: 'Coastle',
    subtitle: 'Daily puzzle',
    icon: 'game-controller-outline',
  },
  {
    id: 'speed-sorter',
    title: 'Speed Sorter',
    subtitle: 'Sort by stats',
    icon: 'swap-vertical-outline',
  },
  {
    id: 'blind-ranking',
    title: 'Blind Ranking',
    subtitle: 'Rank unseen',
    icon: 'eye-off-outline',
  },
  {
    id: 'trivia',
    title: 'Coaster Trivia',
    subtitle: 'Test knowledge',
    icon: 'help-circle-outline',
  },
];

// ── Card Width ──
// Sized so ~2.3 cards are visible, making the last one peek off-screen
const CARD_WIDTH = 148;

// ── Game Card ──

const GameCard = React.memo(({
  game,
  onPress,
}: {
  game: GameDef;
  onPress: () => void;
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.96, opacity: 0.9 });

  return (
    <Pressable
      onPress={() => { haptics.select(); onPress(); }}
      onPressIn={pressHandlers.onPressIn}
      onPressOut={pressHandlers.onPressOut}
    >
      <Reanimated.View style={[styles.gameCard, animatedStyle]}>
        <View style={styles.iconCircle}>
          <Ionicons name={game.icon as any} size={24} color={colors.accent.primary} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{game.subtitle}</Text>
        <View style={styles.playRow}>
          <Text style={styles.playText}>Play</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accent.primary} />
        </View>
      </Reanimated.View>
    </Pressable>
  );
});

// ── View All Card ──

const ViewAllCard = React.memo(({ onPress }: { onPress?: () => void }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.96, opacity: 0.9 });

  return (
    <Pressable
      onPress={() => { haptics.tap(); onPress?.(); }}
      onPressIn={pressHandlers.onPressIn}
      onPressOut={pressHandlers.onPressOut}
    >
      <Reanimated.View style={[styles.gameCard, styles.viewAllLayout, animatedStyle]}>
        <View style={styles.iconCircle}>
          <Ionicons name="arrow-forward-outline" size={24} color={colors.accent.primary} />
        </View>
        <Text style={styles.viewAllTitle}>View All</Text>
        <Text style={styles.viewAllSubtitle}>See all games</Text>
      </Reanimated.View>
    </Pressable>
  );
});

// ── Main Component ──

interface GamesSectionProps {
  sectionId?: string;
  onPlayCoastle: () => void;
  onPlaySpeedSorter: () => void;
  onPlayBlindRanking: () => void;
  onPlayTrivia: () => void;
  onViewAll?: () => void;
}

export const GamesSection = React.memo<GamesSectionProps>(({
  sectionId,
  onPlayCoastle,
  onPlaySpeedSorter,
  onPlayBlindRanking,
  onPlayTrivia,
  onViewAll,
}) => {
  const entrance = useSharedValue(sectionId ? (hasBeenVisible(sectionId) ? 1 : 0) : 1);

  useEffect(() => {
    if (!sectionId) return;
    onBecomeVisible(sectionId, () => {
      entrance.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => offBecomeVisible(sectionId);
  }, [sectionId]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [20, 0]) }],
  }));

  const handlePress = useCallback((id: string) => {
    switch (id) {
      case 'coastle': onPlayCoastle(); break;
      case 'speed-sorter': onPlaySpeedSorter(); break;
      case 'blind-ranking': onPlayBlindRanking(); break;
      case 'trivia': onPlayTrivia(); break;
    }
  }, [onPlayCoastle, onPlaySpeedSorter, onPlayBlindRanking, onPlayTrivia]);

  const handleCoastle = useCallback(() => handlePress('coastle'), [handlePress]);
  const handleSpeedSorter = useCallback(() => handlePress('speed-sorter'), [handlePress]);
  const handleBlindRanking = useCallback(() => handlePress('blind-ranking'), [handlePress]);
  const handleTrivia = useCallback(() => handlePress('trivia'), [handlePress]);

  return (
    <Reanimated.View style={entranceStyle}>
      <Text style={styles.sectionLabel}>Games</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={
              game.id === 'coastle' ? handleCoastle :
              game.id === 'speed-sorter' ? handleSpeedSorter :
              game.id === 'blind-ranking' ? handleBlindRanking :
              handleTrivia
            }
          />
        ))}
        <ViewAllCard onPress={onViewAll} />
      </ScrollView>
    </Reanimated.View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  // Shadow-safe horizontal scroll (see shadow-clipping.md)
  scrollContainer: {
    marginHorizontal: -spacing.lg,
    marginVertical: -spacing.xl,
    overflow: 'visible' as const,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.base,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  playText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  viewAllLayout: {
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  viewAllTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    marginTop: spacing.sm,
    marginBottom: 2,
    textAlign: 'center',
  },
  viewAllSubtitle: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.accent.primary,
    textAlign: 'center',
  },
});
