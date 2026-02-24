import React, { useState, useCallback, useEffect, useRef } from 'react';
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
} from './components';
import { CoastleHintTooltip } from './components/CoastleHintModal';
import { CoastleDebugPanel, DEFAULT_TUNING, AnimTuning } from './components/CoastleDebugPanel';
import type { CoastleHeaderRef } from './components/CoastleHeader';

const REVEAL_DURATION = 880; // 9 cells × ~80ms stagger + flip time

export const CoastleScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { game, stats, startGame, submitGuess, resetGame, generateShareText } = useCoastleStore();

  const headerRef = useRef<CoastleHeaderRef>(null);
  const [activeGridIndex, setActiveGridIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);

  // Debug tuning
  const [tuning, setTuning] = useState<AnimTuning>(DEFAULT_TUNING);

  // Hint state
  const [viewedHintIds, setViewedHintIds] = useState<number[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

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
      setShowTooltip(false);
    }
  }, [game?.guesses.length]);

  // Auto-open stats after game ends (brief delay for last reveal)
  useEffect(() => {
    if (game && (game.status === 'won' || game.status === 'lost')) {
      const timer = setTimeout(() => {
        headerRef.current?.openStats();
      }, REVEAL_DURATION + 300);
      return () => clearTimeout(timer);
    }
  }, [game?.status]);

  const handleClose = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  const handlePlayAgain = useCallback(() => {
    setActiveGridIndex(0);
    setRevealingIndex(null);
    setViewedHintIds([]);
    setShowTooltip(false);
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
  }, [game]);

  const handleShowTooltip = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveGridIndex(index);
  }, []);

  if (!game) return <View style={styles.container} />;

  const excludeIds = game.guesses.map((g) => g.coaster.id);

  return (
    <View style={styles.container}>
      {/* Header — zIndex ensures MorphingPill backdrop+card overlay all siblings */}
      <View style={styles.headerWrapper}>
        <CoastleHeader
          ref={headerRef}
          onClose={handleClose}
          stats={stats}
          gameStatus={game.status}
          shareText={generateShareText()}
          onPlayAgain={handlePlayAgain}
          tuning={tuning}
        />
      </View>

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

      {/* Equal gap: search → grid */}
      <View style={styles.spacer} />

      {/* Grid carousel */}
      <CoastleGridCarousel
        guesses={game.guesses}
        revealingIndex={revealingIndex}
        onActiveIndexChange={handleActiveIndexChange}
      />

      {/* Equal gap: grid → hint */}
      <View style={styles.spacer} />

      {/* Hint button — zIndex ensures MorphingPill backdrop+card overlay all siblings */}
      <View style={styles.hintWrapper}>
        <CoastleHintButton
          guessCount={game.guesses.length}
          hints={game.hints}
          viewedHintIds={viewedHintIds}
          gameStatus={game.status}
          onViewHints={handleViewHints}
          onShowTooltip={handleShowTooltip}
        />
      </View>

      {/* Equal gap: hint → dots */}
      <View style={styles.spacer} />

      {/* Page dots */}
      <View style={{ paddingBottom: insets.bottom + spacing.md }}>
        <CoastlePageDots
          guessCount={game.guesses.length}
          activeIndex={activeGridIndex}
          totalSlots={Math.min(game.guesses.length + 1, MAX_GUESSES)}
        />
      </View>

      {/* Tooltip overlay (only for "no hints yet" mode) */}
      <CoastleHintTooltip
        visible={showTooltip}
        onClose={handleCloseTooltip}
      />

      {/* Debug tuning panel */}
      <CoastleDebugPanel tuning={tuning} onChange={setTuning} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerWrapper: {
    zIndex: 200,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 50,
  },
  hintWrapper: {
    zIndex: 100,
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
