import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { haptics } from '../../services/haptics';
import { useCoastleStore } from './stores/coastleStore';
import { CoastleCoaster, MAX_GUESSES } from './types/coastle';
import {
  CoastleHeader,
  CoastleGridCarousel,
  CoastlePageDots,
  CoastleSearchBar,
  CoastleHintButton,
  CoastleHintModal,
  CoastleStatsCard,
} from './components';

const REVEAL_DURATION = 880; // 9 cells × ~80ms stagger + flip time

export const CoastleScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { game, stats, startGame, submitGuess, resetGame, generateShareText } = useCoastleStore();

  const [activeGridIndex, setActiveGridIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Hint state
  const [viewedHintIds, setViewedHintIds] = useState<number[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [isHintTooltip, setIsHintTooltip] = useState(false);

  // Start a daily game on mount
  useEffect(() => {
    if (!game) {
      startGame('daily');
    }
  }, []);

  // Reset hint state on new game
  useEffect(() => {
    if (game && game.guesses.length === 0) {
      setViewedHintIds([]);
      setShowHintModal(false);
      setIsHintTooltip(false);
    }
  }, [game?.guesses.length]);

  // Show stats card after game ends (brief delay for last reveal)
  useEffect(() => {
    if (game && (game.status === 'won' || game.status === 'lost')) {
      const timer = setTimeout(() => setShowStats(true), REVEAL_DURATION + 300);
      return () => clearTimeout(timer);
    }
  }, [game?.status]);

  const handleClose = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  const handleSettings = useCallback(() => {
    haptics.tap();
    setShowStats(true);
  }, []);

  const handleCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setShowStats(false);
    setActiveGridIndex(0);
    setRevealingIndex(null);
    setViewedHintIds([]);
    setShowHintModal(false);
    resetGame();
    startGame('practice');
  }, [resetGame, startGame]);

  const handleGuess = useCallback(
    (coaster: CoastleCoaster) => {
      if (!game || game.status !== 'playing' || isRevealing) return;

      haptics.select();
      setIsRevealing(true);

      const guessIndex = game.guesses.length;
      submitGuess(coaster);
      setRevealingIndex(guessIndex);

      setTimeout(() => {
        setIsRevealing(false);
      }, REVEAL_DURATION);
    },
    [game, isRevealing, submitGuess],
  );

  // Hint handlers
  const handleViewHints = useCallback(() => {
    if (!game) return;
    // Mark all current hints as viewed
    setViewedHintIds(game.hints.map((h) => h.afterGuess));
    setIsHintTooltip(false);
    setShowHintModal(true);
  }, [game]);

  const handleShowTooltip = useCallback(() => {
    setIsHintTooltip(true);
    setShowHintModal(true);
  }, []);

  const handleCloseHint = useCallback(() => {
    setShowHintModal(false);
    setIsHintTooltip(false);
  }, []);

  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveGridIndex(index);
  }, []);

  if (!game) return <View style={styles.container} />;

  const excludeIds = game.guesses.map((g) => g.coaster.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <CoastleHeader
        onClose={handleClose}
        onSettings={handleSettings}
      />

      {/* Puzzle identity */}
      <Text style={styles.puzzleLabel}>
        {game.mode === 'daily'
          ? `Daily #${game.dailyPuzzleNumber}`
          : 'Practice'}
      </Text>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <CoastleSearchBar
          excludeIds={excludeIds}
          gameStatus={game.status}
          targetName={game.target.name}
          onSelect={handleGuess}
          disabled={isRevealing}
        />
      </View>

      {/* Top spacer */}
      <View style={styles.spacer} />

      {/* Grid carousel — auto-height, vertically centered by equal spacers */}
      <CoastleGridCarousel
        guesses={game.guesses}
        revealingIndex={revealingIndex}
        onActiveIndexChange={handleActiveIndexChange}
      />

      {/* Bottom spacer — hint button centered within this gap */}
      <View style={styles.spacer}>
        <CoastleHintButton
          guessCount={game.guesses.length}
          hints={game.hints}
          viewedHintIds={viewedHintIds}
          gameStatus={game.status}
          onViewHints={handleViewHints}
          onShowTooltip={handleShowTooltip}
        />
      </View>

      {/* Page dots */}
      <View style={{ paddingBottom: insets.bottom + spacing.md }}>
        <CoastlePageDots
          guessCount={game.guesses.length}
          activeIndex={activeGridIndex}
          totalSlots={Math.min(game.guesses.length + 1, MAX_GUESSES)}
        />
      </View>

      {/* Hint modal / tooltip overlay */}
      <CoastleHintModal
        visible={showHintModal}
        hints={game.hints}
        isTooltipMode={isHintTooltip}
        onClose={handleCloseHint}
      />

      {/* Stats overlay */}
      <CoastleStatsCard
        visible={showStats}
        stats={stats}
        gameStatus={game.status}
        shareText={generateShareText()}
        onPlayAgain={handlePlayAgain}
        onClose={handleCloseStats}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 50,
  },
  puzzleLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
