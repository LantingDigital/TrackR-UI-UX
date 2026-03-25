/**
 * SpeedSorterScreen — Drag-and-drop sorting game with timer
 *
 * Full-screen modal. 5 rounds of 5 coasters each.
 * Drag cards to reorder, beat the clock.
 *
 * Animation philosophy: Coastle-style controlled motion.
 * withTiming for entrances (no bouncy springs), subtle scales,
 * stiff spring only on drag release for direct snap-back.
 */

import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { PageDots } from '../../../components/PageDots';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import {
  useSpeedSorterStore,
  startGame,
  moveItem,
  submitRound,
  nextRound,
  resetGame,
} from './stores/speedSorterStore';
import { SpeedSorterHeader } from './components/SpeedSorterHeader';

const EASE_OUT = Easing.out(Easing.ease);
const EASE_IN_OUT = Easing.inOut(Easing.ease);

const CARD_HEIGHT = 68;
const CARD_GAP = 10;
const CARD_STEP = CARD_HEIGHT + CARD_GAP;

// Stiff spring for drag release — direct, no overshoot
const DRAG_SETTLE = { damping: 22, stiffness: 220, mass: 0.8 };

// ─── Timer Display ──────────────────────────────────────────
// 100ms interval updates — lightweight for a timer display.

const Timer = React.memo(function Timer({ startTime, active }: { startTime: number; active: boolean }) {
  const [display, setDisplay] = useState('0.0s');

  useEffect(() => {
    if (!active || startTime <= 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const seconds = Math.floor(elapsed / 1000);
      const tenths = Math.floor((elapsed % 1000) / 100);
      setDisplay(`${seconds}.${tenths}s`);
    }, 100);
    return () => clearInterval(interval);
  }, [active, startTime]);

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="timer-outline" size={16} color={colors.accent.primary} />
      <Text style={styles.timerText}>{display}</Text>
      />
    </View>
  );
});

// ─── Draggable Card ─────────────────────────────────────────

const DraggableCard = React.memo(function DraggableCard({ name, park, index, totalCards, isCorrectPos, isChecking, onReorder }: {
  name: string;
  park: string;
  index: number;
  totalCards: number;
  isCorrectPos: boolean | null;
  isChecking: boolean;
  onReorder: (from: number, to: number) => void;
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const entrance = useSharedValue(0);

  // Staggered entrance — controlled withTiming, not bouncy
  useEffect(() => {
    entrance.value = withDelay(
      index * 50,
      withTiming(1, { duration: 200, easing: EASE_OUT }),
    );
  }, []);

  // Checking feedback — subtle opacity transition, no bounce
  const checkOpacity = useSharedValue(1);
  useEffect(() => {
    if (isChecking && isCorrectPos !== null) {
      // Quick subtle pulse — 4% scale up, settle back
      scale.value = withTiming(1.02, { duration: 100 });
      setTimeout(() => {
        scale.value = withTiming(1, { duration: 150 });
      }, 100);
    }
  }, [isChecking, isCorrectPos]);

  const panGesture = Gesture.Pan()
    .enabled(!isChecking)
    .onStart(() => {
      scale.value = withTiming(1.03, { duration: 100 });
      zIndex.value = 100;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      // Stiff spring settle — direct, no jello
      scale.value = withSpring(1, DRAG_SETTLE);
      zIndex.value = 0;

      const movedPositions = Math.round(translateY.value / CARD_STEP);
      const newIndex = Math.max(0, Math.min(totalCards - 1, index + movedPositions));

      // Stiff spring back to origin — direct snap, not bouncy
      translateY.value = withSpring(0, DRAG_SETTLE);

      if (newIndex !== index) {
        runOnJS(onReorder)(index, newIndex);
        runOnJS(haptics.tap)();
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateX: (1 - entrance.value) * 30 },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animStyle}>
        <View style={[
          styles.card,
          isChecking && isCorrectPos && styles.cardCorrect,
          isChecking && isCorrectPos === false && styles.cardWrong,
        ]}>
          <View style={styles.cardDragHandle}>
            <Ionicons name="reorder-three" size={20} color={colors.text.meta} />
          </View>
          <Text style={styles.cardRank}>{index + 1}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
            <Text style={styles.cardPark} numberOfLines={1}>{park}</Text>
          </View>
          {isChecking && isCorrectPos && (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          )}
          {isChecking && isCorrectPos === false && (
            <Ionicons name="close-circle" size={20} color="#E53935" />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Format time ────────────────────────────────────────────

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${seconds}.${tenths}s`;
}

// ─── Main Screen ────────────────────────────────────────────

export function SpeedSorterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { game, stats, settings } = useSpeedSorterStore();

  // Controlled entrance for bottom bar
  const bottomBarOpacity = useSharedValue(0);
  const bottomBarY = useSharedValue(8);

  useEffect(() => {
    startGame();
    return () => { resetGame(); };
  }, []);

  // Bottom bar entrance
  useEffect(() => {
    if (game.status === 'playing' || game.status === 'checking') {
      bottomBarOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
      bottomBarY.value = withDelay(200, withTiming(0, { duration: 200, easing: EASE_OUT }));
    }
  }, [game.status, game.currentRoundIndex]);

  // Must be before any early returns (Rules of Hooks)
  const currentRound = game.rounds[game.currentRoundIndex] ?? game.rounds[0];
  const coasterMap = useMemo(
    () => currentRound ? new Map(currentRound.coasters.map((c) => [c.id, c])) : new Map(),
    [currentRound?.coasters],
  );

  const bottomBarStyle = useAnimatedStyle(() => ({
    opacity: bottomBarOpacity.value,
    transform: [{ translateY: bottomBarY.value }],
  }));

  // Results entrance
  const resultsScale = useSharedValue(0.9);
  const resultsOpacity = useSharedValue(0);

  useEffect(() => {
    if (game.status === 'results') {
      resultsScale.value = withTiming(1, { duration: 220, easing: EASE_OUT });
      resultsOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [game.status]);

  const resultsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultsScale.value }],
    opacity: resultsOpacity.value,
  }));

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    moveItem(fromIndex, toIndex);
  }, []);

  const handleSubmit = useCallback(() => {
    haptics.success();
    submitRound();
  }, []);

  const handleNext = useCallback(() => {
    haptics.tap();
    bottomBarOpacity.value = 0;
    bottomBarY.value = 8;
    nextRound();
  }, []);

  const handleClose = useCallback(() => {
    haptics.tap();
    resetGame();
    navigation.goBack();
  }, [navigation]);

  if (game.status === 'idle' || game.rounds.length === 0) {
    return <View style={styles.container} />;
  }

  // ─── Results Screen ─────────────────────────────────

  if (game.status === 'results') {
    const emoji = game.totalScore >= 80 ? '\u{1F3C6}' : game.totalScore >= 60 ? '\u2B50' : '\u{1F4AA}';
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <SpeedSorterHeader onClose={handleClose} stats={stats} settings={settings} />
        </View>
        <Animated.View style={[styles.resultsContainer, resultsStyle]}>
          <Text style={styles.resultsEmoji}>{emoji}</Text>
          <Text style={styles.resultsScore}>{game.totalScore}%</Text>
          <Text style={styles.resultsSubtitle}>Average Accuracy</Text>

          {/* Total time */}
          <View style={styles.resultsTotalTime}>
            <Ionicons name="timer-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.resultsTotalTimeText}>
              Total time: {formatTime(game.totalTime)}
            </Text>
          </View>

          {/* Round breakdown */}
          <View style={styles.roundBreakdown}>
            {game.roundScores.map((score, i) => (
              <View key={i} style={styles.roundScoreRow}>
                <Text style={styles.roundLabel}>Round {i + 1}</Text>
                <Text style={styles.roundTime}>{formatTime(game.roundTimes[i])}</Text>
                <Text style={[styles.roundScore, score === 100 && styles.roundPerfect]}>
                  {score}%
                </Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.playAgainBtn} onPress={() => { haptics.tap(); startGame(); }}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
          <Pressable style={styles.doneBtn} onPress={handleClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ─── Playing / Checking ─────────────────────────────

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerWrapper}>
        <SpeedSorterHeader onClose={handleClose} stats={stats} settings={settings} />
      </View>

      {/* Round info + timer */}
      <View style={styles.roundInfo}>
        <View style={styles.roundInfoTop}>
          <View>
            <Text style={styles.categoryLabel}>
              Sort by: {currentRound.categoryLabel} {currentRound.unit ? `(${currentRound.unit})` : ''}
            </Text>
          </View>
          {settings.showTimer && (
            <Timer
              startTime={game.roundStartTime}
              active={game.status === 'playing'}
            />
          )}
        </View>
        <Text style={styles.instruction}>
          {game.status === 'playing'
            ? 'Drag cards to sort from highest to lowest'
            : 'Check your answers below'}
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardList}>
        {game.userOrder.map((id, i) => {
          const coaster = coasterMap.get(id)!;
          const isCorrectPos = game.status === 'checking'
            ? currentRound.correctOrder[i] === id
            : null;

          return (
            <DraggableCard
              key={`${game.currentRoundIndex}-${id}`}
              name={coaster.name}
              park={coaster.park}
              index={i}
              totalCards={game.userOrder.length}
              isCorrectPos={isCorrectPos}
              isChecking={game.status === 'checking'}
              onReorder={handleReorder}
            />
          );
        })}

        {/* Correct answer reveal when checking */}
        {game.status === 'checking' && (
          <View style={styles.correctReveal}>
            <Text style={styles.correctTitle}>Correct Order:</Text>
            {currentRound.correctOrder.map((id, i) => {
              const c = coasterMap.get(id)!;
              return (
                <Text key={id} style={styles.correctItem}>
                  {i + 1}. {c.name} — {c.value}{currentRound.unit ? ` ${currentRound.unit}` : ''}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      {/* Round progress dots — bottom-positioned like Coastle */}
      <View style={styles.pageDots}>
        <PageDots
          current={game.currentRoundIndex}
          total={game.rounds.length}
          label={`Round ${game.currentRoundIndex + 1}/${game.rounds.length}`}
        />
      </View>

      {/* Action button */}
      {game.status === 'playing' && (
        <Animated.View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }, bottomBarStyle]}>
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </Pressable>
        </Animated.View>
      )}

      {game.status === 'checking' && (
        <Animated.View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }, bottomBarStyle]}>
          <Text style={styles.accuracyText}>
            {game.roundScores[game.roundScores.length - 1]}% Accurate
            {' · '}
            {formatTime(game.roundTimes[game.roundTimes.length - 1])}
          </Text>
          <Pressable style={styles.submitBtn} onPress={handleNext}>
            <Text style={styles.submitText}>
              {game.currentRoundIndex < game.rounds.length - 1 ? 'Next Round' : 'See Results'}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerWrapper: {
    zIndex: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: { width: 36 },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  timerText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    fontVariant: ['tabular-nums'],
  },

  // Round info
  roundInfo: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  roundInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageDots: {
    paddingTop: spacing.sm,
  },
  categoryLabel: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  instruction: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Cards
  cardList: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: CARD_GAP,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    height: CARD_HEIGHT,
    ...shadows.small,
  },
  cardDragHandle: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  cardCorrect: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardWrong: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#E53935',
  },
  cardRank: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    width: 24,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cardName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  cardPark: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 1,
  },

  // Correct reveal
  correctReveal: {
    marginTop: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  correctTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  correctItem: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    paddingVertical: 2,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background.page,
  },
  submitBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  accuracyText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },

  // Results
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  resultsSubtitle: {
    fontSize: typography.sizes.heading,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  resultsTotalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsTotalTimeText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  roundBreakdown: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  roundScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  roundLabel: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    flex: 1,
  },
  roundTime: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    marginRight: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  roundScore: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  roundPerfect: {
    color: '#4CAF50',
  },
  playAgainBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  playAgainText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingVertical: spacing.base,
  },
  doneText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
