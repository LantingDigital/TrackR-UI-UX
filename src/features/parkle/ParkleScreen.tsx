import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { haptics } from '../../services/haptics';
import { useParkleStore } from './stores/parkleStore';
import { ParklePark, MAX_GUESSES, ParkleGuess, CellComparison } from './types/parkle';
import { ParkleHeader } from './components/ParkleHeader';
import { ParkleSearchBar } from './components/ParkleSearchBar';
import { ParkleHintButton, HINT_MORPH_DURATION } from './components/ParkleHintButton';
import { ParkleResultCard } from './components/ParkleResultCard';
import type { ParkleHintButtonRef } from './components/ParkleHintButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HINT_BACKDROP_CLOSE_DURATION = 470;
const EASE_OUT = Easing.out(Easing.ease);

// ─── Guess Row ──────────────────────────────────────────
const GuessRow = React.memo(function GuessRow({
  guess,
  index,
}: {
  guess: ParkleGuess;
  index: number;
}) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      index * 40,
      withTiming(1, { duration: 220, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 12 }],
  }));

  return (
    <Animated.View style={entranceStyle}>
      <View style={styles.guessRow}>
        <View style={styles.guessHeader}>
          <Text style={styles.guessNumber}>#{index + 1}</Text>
          <Text style={styles.guessName} numberOfLines={1}>{guess.park.name}</Text>
          {guess.isCorrect && (
            <Ionicons name="checkmark-circle" size={18} color={colors.parkle.correct} />
          )}
        </View>
        <View style={styles.cellsRow}>
          {guess.cells.map((cell) => (
            <CellBadge key={cell.key} cell={cell} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Cell Badge ──────────────────────────────────────────
function CellBadge({ cell }: { cell: CellComparison }) {
  const bgColor = cell.result === 'correct'
    ? colors.parkle.correct
    : cell.result === 'close'
    ? colors.parkle.close
    : colors.parkle.wrong;
  const textColor = cell.result === 'correct'
    ? colors.parkle.correctText
    : cell.result === 'close'
    ? colors.parkle.closeText
    : colors.parkle.wrongText;

  const directionIcon = cell.direction === 'higher'
    ? 'arrow-up'
    : cell.direction === 'lower'
    ? 'arrow-down'
    : null;

  return (
    <View style={[styles.cellBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.cellLabel, { color: textColor }]} numberOfLines={1}>
        {cell.label}
      </Text>
      <View style={styles.cellValueRow}>
        <Text style={[styles.cellValue, { color: textColor }]} numberOfLines={1}>
          {cell.displayValue}
        </Text>
        {directionIcon && (
          <Ionicons name={directionIcon} size={10} color={textColor} />
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export const ParkleScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { game, stats, difficulty, startGame, submitGuess, resetGame, generateShareText, setDifficulty } = useParkleStore();

  const hintButtonRef = useRef<ParkleHintButtonRef>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  // Hint state
  const [viewedHintIds, setViewedHintIds] = useState<number[]>([]);
  const [isHintMorphOpen, setIsHintMorphOpen] = useState(false);

  // Result card state
  const [resultMounted, setResultMounted] = useState(false);
  const isResultShowingRef = useRef(false);
  const [resultSnapshot, setResultSnapshot] = useState<{
    parkName: string;
    gameStatus: 'won' | 'lost';
    guessCount: number;
    shareText: string;
  } | null>(null);
  const gridScale = useSharedValue(1);
  const gridOpacity = useSharedValue(1);
  const resultOpacity = useSharedValue(0);
  const resultCardScale = useSharedValue(0.88);

  // Start daily game on mount
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
      setResultSnapshot({
        parkName: game.target.name,
        gameStatus: game.status,
        guessCount: game.guesses.length,
        shareText: generateShareText(),
      });
      const timer = setTimeout(showResult, 600);
      return () => clearTimeout(timer);
    }
  }, [game?.status]);

  // ── Result card animations ──────────────────────────────
  const onDismissComplete = useCallback(() => {
    isResultShowingRef.current = false;
    setResultMounted(false);
  }, []);

  const showResult = useCallback(() => {
    if (isResultShowingRef.current) return;
    isResultShowingRef.current = true;
    setResultMounted(true);
    gridScale.value = withTiming(0.88, { duration: 220 });
    gridOpacity.value = withTiming(0, { duration: 200 });
    resultOpacity.value = withTiming(1, { duration: 160 });
    resultCardScale.value = withTiming(1, { duration: 200 });
  }, []);

  const dismissResult = useCallback(() => {
    resultOpacity.value = withTiming(0, { duration: 160 });
    resultCardScale.value = withTiming(0.88, { duration: 160 });
    gridScale.value = withTiming(1, { duration: 220 });
    gridOpacity.value = withTiming(1, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onDismissComplete)();
    });
  }, []);

  const handleClose = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  const handlePlayAgainFromResult = useCallback(() => {
    gridScale.value = 1;
    gridOpacity.value = 1;
    resultCardScale.value = 0.88;
    isResultShowingRef.current = false;

    setViewedHintIds([]);
    resetGame();
    startGame('practice');

    setTimeout(() => {
      resultOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(setResultMounted)(false);
      });
    }, 60);
  }, [resetGame, startGame]);

  const handleGuess = useCallback(
    (park: ParklePark) => {
      if (!game || game.status !== 'playing' || isRevealing) return;

      haptics.select();
      setIsRevealing(true);
      submitGuess(park);

      setTimeout(() => {
        setIsRevealing(false);
      }, 300);
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

  if (!game) return <View style={styles.container} />;

  const excludeIds = game.guesses.map((g) => g.park.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <ParkleHeader
          onClose={handleClose}
          stats={stats}
          gameStatus={game.status}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
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
          <ParkleSearchBar
            excludeIds={excludeIds}
            onSelect={handleGuess}
            disabled={isRevealing}
          />
        </View>
      )}

      {/* Guesses list */}
      <Animated.View style={[styles.guessesContainer, gridAnimStyle]}>
        <ScrollView
          contentContainerStyle={styles.guessesList}
          showsVerticalScrollIndicator={false}
        >
          {game.guesses.map((guess, i) => (
            <GuessRow key={guess.park.id} guess={guess} index={i} />
          ))}
          {game.guesses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={32} color={colors.text.meta} />
              <Text style={styles.emptyText}>Guess the park</Text>
              <Text style={styles.emptySubtext}>
                {MAX_GUESSES} guesses to find today's park
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Hint button */}
      <View style={[styles.hintWrapper, isHintMorphOpen && styles.hintWrapperElevated]}>
        <ParkleHintButton
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

      {/* Guess counter */}
      <View style={{ paddingBottom: insets.bottom + spacing.md }}>
        <Text style={styles.guessCounter}>
          {game.guesses.length} / {MAX_GUESSES}
        </Text>
      </View>

      {/* Result overlay */}
      {resultMounted && resultSnapshot && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.resultOverlay, resultOverlayStyle]}
          pointerEvents="box-none"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissResult} />
          <Animated.View style={[styles.resultCardWrapper, resultCardStyle]} pointerEvents="box-none">
            <ParkleResultCard
              parkName={resultSnapshot.parkName}
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
    paddingTop: spacing.sm,
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
  guessesContainer: {
    flex: 1,
  },
  guessesList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  guessRow: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    ...shadows.small,
  },
  guessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  guessNumber: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.parkle.accent,
  },
  guessName: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  cellsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cellBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minWidth: 56,
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  cellValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cellValue: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptySubtext: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  hintWrapper: {
    zIndex: 100,
    paddingVertical: spacing.sm,
  },
  hintWrapperElevated: {
    zIndex: 300,
  },
  guessCounter: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textAlign: 'center',
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
  hintBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250,
  },
});
