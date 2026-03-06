import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emitTourEvent } from '../tour';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
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
} from './components';
import { CoastleHintButton, HINT_MORPH_DURATION } from './components/CoastleHintButton';
import { CoastleResultCard } from './components/CoastleResultCard';
import { DEFAULT_TUNING } from './components/CoastleDebugPanel';
import type { CoastleHintButtonRef } from './components/CoastleHintButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REVEAL_DURATION = 880; // 9 cells × ~80ms stagger + flip time
const HINT_BACKDROP_CLOSE_DURATION = 470;

export const CoastleScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { game, stats, startGame, submitGuess, resetGame, generateShareText } = useCoastleStore();

  const hintButtonRef = useRef<CoastleHintButtonRef>(null);
  const activeGridIndex = useSharedValue(0);
  const slideX = useSharedValue(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);

  // Hint state
  const [viewedHintIds, setViewedHintIds] = useState<number[]>([]);
  const [isHintMorphOpen, setIsHintMorphOpen] = useState(false);

  // Result card state
  const [resultMounted, setResultMounted] = useState(false);
  const isResultShowingRef = useRef(false); // ref-based guard — keeps showResult stable
  // Frozen snapshot of game data at the moment the result card appears.
  // This prevents the card content from changing when resetGame() fires during Play Again.
  const [resultSnapshot, setResultSnapshot] = useState<{
    coasterName: string;
    gameStatus: 'won' | 'lost';
    guessCount: number;
    shareText: string;
  } | null>(null);
  const gridScale = useSharedValue(1);
  const gridOpacity = useSharedValue(1);
  const resultOpacity = useSharedValue(0);
  const resultCardScale = useSharedValue(0.88);

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
    }
  }, [game?.guesses.length]);

  // Auto-show result card after game ends
  useEffect(() => {
    if (game && (game.status === 'won' || game.status === 'lost')) {
      // Freeze game data now — stays correct even after resetGame() fires during Play Again
      setResultSnapshot({
        coasterName: game.target.name,
        gameStatus: game.status,
        guessCount: game.guesses.length,
        shareText: generateShareText(),
      });
      const timer = setTimeout(showResult, REVEAL_DURATION + 300);
      return () => clearTimeout(timer);
    }
  }, [game?.status]);

  // ── Result card animations ──────────────────────────────

  // Runs on the JS thread (via runOnJS from animation callback) so the ref is correctly updated.
  // Setting isResultShowingRef.current inside a worklet only updates the UI-thread copy — not JS.
  const onDismissComplete = useCallback(() => {
    isResultShowingRef.current = false;
    setResultMounted(false);
  }, []);

  // showResult has stable empty deps. The ref guard (on JS thread) prevents double-calls.
  // Keeping it stable means onGridTap never changes reference → carousel never re-renders.
  const showResult = useCallback(() => {
    if (isResultShowingRef.current) return;
    isResultShowingRef.current = true;
    setResultMounted(true);
    gridScale.value = withTiming(0.88, { duration: 220 });
    gridOpacity.value = withTiming(0, { duration: 200 });
    resultOpacity.value = withTiming(1, { duration: 160 });
    resultCardScale.value = withTiming(1, { duration: 200 });
  }, []); // intentionally empty — ref guard on JS thread

  const dismissResult = useCallback(() => {
    resultOpacity.value = withTiming(0, { duration: 160 });
    resultCardScale.value = withTiming(0.88, { duration: 160 });
    gridScale.value = withTiming(1, { duration: 220 });
    // runOnJS ensures the ref and state are reset on the JS thread, not the UI thread
    gridOpacity.value = withTiming(1, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onDismissComplete)();
    });
  }, []); // intentionally empty — onDismissComplete is stable

  const handleClose = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  // Play Again transition — blink-free:
  // The result overlay (frosted white) stays visible the entire time — it IS the "white screen."
  // We reset the game behind it, then fade the overlay out to reveal the new board.
  // The overlay never moves off-screen, so the navigation background is never exposed.
  const handlePlayAgainFromResult = useCallback(() => {
    // Reset shared values (board invisible behind overlay — no flash)
    gridScale.value = 1;
    gridOpacity.value = 1;
    resultCardScale.value = 0.88;
    isResultShowingRef.current = false;

    // Reset React state + game — overlay still fully opaque so this is invisible
    setRevealingIndex(null);
    setViewedHintIds([]);
    activeGridIndex.value = 0;
    resetGame();
    startGame('practice');

    // After React commits: fade the overlay out to reveal the new board.
    // No slideX involved = nothing ever goes off-screen = zero blink.
    setTimeout(() => {
      resultOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(setResultMounted)(false);
      });
    }, 60);
  }, [resetGame, startGame]);

  const handleGuess = useCallback(
    (coaster: CoastleCoaster) => {
      if (!game || game.status !== 'playing' || isRevealing) return;

      haptics.select();
      setIsRevealing(true);

      const guessIndex = game.guesses.length;
      submitGuess(coaster);
      emitTourEvent({ type: 'coastle:guessSubmitted', guessCount: guessIndex + 1 });
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
    setViewedHintIds(game.hints.map((h) => h.afterGuess));
  }, [game]);

  // Screen-level backdrop for hint morph
  const hintBackdropOpacity = useSharedValue(0);
  const [hintBackdropMounted, setHintBackdropMounted] = useState(false);

  const hintBackdropStyle = useAnimatedStyle(() => ({
    opacity: hintBackdropOpacity.value,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const gridAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gridScale.value }],
    opacity: gridOpacity.value,
  }));

  const resultOverlayStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  const resultCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultCardScale.value }],
    opacity: resultOpacity.value,
  }));

  const handleHintMorphOpen = useCallback(() => {
    setIsHintMorphOpen(true);
    setHintBackdropMounted(true);
    hintBackdropOpacity.value = withTiming(1, { duration: HINT_MORPH_DURATION });
  }, []);

  const handleHintMorphCloseStart = useCallback(() => {
    hintBackdropOpacity.value = withTiming(0, { duration: HINT_BACKDROP_CLOSE_DURATION });
  }, []);

  const handleHintMorphCloseComplete = useCallback(() => {
    setIsHintMorphOpen(false);
    setHintBackdropMounted(false);
  }, []);

  const shareText = useMemo(() => generateShareText(), [game?.guesses.length, game?.status]);

  if (!game) return <Animated.View style={[styles.container, slideStyle]} />;

  const excludeIds = game.guesses.map((g) => g.coaster.id);

  return (
    <Animated.View style={[styles.container, slideStyle]}>
      {/* Header — zIndex ensures MorphingPill backdrop+card overlay all siblings */}
      <View style={styles.headerWrapper}>
        <CoastleHeader
          onClose={handleClose}
          stats={stats}
          gameStatus={game.status}
          tuning={DEFAULT_TUNING}
        />
      </View>

      {/* Puzzle identity */}
      <Text style={styles.puzzleLabel}>
        {game.mode === 'daily'
          ? `Daily #${game.dailyPuzzleNumber}`
          : 'Practice'}
      </Text>

      {/* Search bar — hidden once game ends */}
      {game.status === 'playing' && (
        <View style={styles.searchContainer}>
          <CoastleSearchBar
            excludeIds={excludeIds}
            onSelect={handleGuess}
            disabled={isRevealing}
          />
        </View>
      )}

      {/* Equal gap: search → grid */}
      <View style={styles.spacer} />

      {/* Game zone — grid carousel */}
      <View style={styles.gameZone}>
        <Animated.View style={gridAnimStyle}>
          <CoastleGridCarousel
            guesses={game.guesses}
            revealingIndex={revealingIndex}
            activeIndex={activeGridIndex}
            onGridTap={
              (game.status === 'won' || game.status === 'lost') ? showResult : undefined
            }
          />
        </Animated.View>
      </View>

      {/* Equal gap: grid → hint */}
      <View style={styles.spacer} />

      {/* Hint button — zIndex boosted above all siblings when morph is open */}
      <View style={[styles.hintWrapper, isHintMorphOpen && styles.hintWrapperElevated]}>
        <CoastleHintButton
          ref={hintButtonRef}
          guessCount={game.guesses.length}
          hints={game.hints}
          viewedHintIds={viewedHintIds}
          gameStatus={game.status}
          onViewHints={handleViewHints}
          onMorphOpen={handleHintMorphOpen}
          onMorphCloseStart={handleHintMorphCloseStart}
          onMorphCloseComplete={handleHintMorphCloseComplete}
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

      {/* Screen-level result overlay — sits above everything except the header */}
      {resultMounted && resultSnapshot && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.resultOverlay, resultOverlayStyle]}
          pointerEvents="box-none"
        >
          {/* Backdrop — tappable to dismiss */}
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissResult} />
          {/* Card — centered */}
          <Animated.View style={[styles.resultCardWrapper, resultCardStyle]} pointerEvents="box-none">
            <CoastleResultCard
              coasterName={resultSnapshot.coasterName}
              gameStatus={resultSnapshot.gameStatus}
              guessCount={resultSnapshot.guessCount}
              shareText={resultSnapshot.shareText}
              onPlayAgain={handlePlayAgainFromResult}
              onDismiss={dismissResult}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Screen-level blur backdrop for hint morph */}
      {hintBackdropMounted && (
        <Animated.View
          style={[styles.hintBackdrop, hintBackdropStyle]}
          pointerEvents={isHintMorphOpen ? 'auto' : 'none'}
        >
          <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => hintButtonRef.current?.closeMorph()}
            />
          </BlurView>
        </Animated.View>
      )}

    </Animated.View>
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
  gameZone: {
    flex: 0,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(247,247,247,0.88)',
  },
  resultCardWrapper: {
    width: SCREEN_WIDTH - 80,
  },
  hintWrapper: {
    zIndex: 100,
  },
  hintWrapperElevated: {
    zIndex: 300,
  },
  hintBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250,
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
