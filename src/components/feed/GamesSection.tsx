/**
 * GamesSection - Horizontal scrolling strip of game cards for the home feed.
 * Shows available games (Coastle, Speed Sorter, Blind Ranking, Trivia)
 * plus a "Coming Soon" placeholder that peeks off-screen to hint at scrolling.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
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
      <Animated.View style={[styles.gameCard, animatedStyle]}>
        <View style={styles.iconCircle}>
          <Ionicons name={game.icon as any} size={24} color={colors.accent.primary} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{game.subtitle}</Text>
        <View style={styles.playRow}>
          <Text style={styles.playText}>Play</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accent.primary} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ── Coming Soon Card ──

const ComingSoonCard = React.memo(() => (
  <View style={styles.comingSoonCard}>
    <View style={styles.comingSoonIconCircle}>
      <Ionicons name="add-outline" size={24} color={colors.text.meta} />
    </View>
    <Text style={styles.comingSoonTitle}>More Games</Text>
    <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
  </View>
));

// ── Main Component ──

interface GamesSectionProps {
  onPlayCoastle: () => void;
  onPlaySpeedSorter: () => void;
  onPlayBlindRanking: () => void;
  onPlayTrivia: () => void;
}

export const GamesSection = React.memo<GamesSectionProps>(({
  onPlayCoastle,
  onPlaySpeedSorter,
  onPlayBlindRanking,
  onPlayTrivia,
}) => {
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
    <View>
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
        <ComingSoonCard />
      </ScrollView>
    </View>
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
  scrollContainer: {
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
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
  comingSoonCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.page,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  comingSoonTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    marginBottom: 2,
  },
  comingSoonSubtitle: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});
