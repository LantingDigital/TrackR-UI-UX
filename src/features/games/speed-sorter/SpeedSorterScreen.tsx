/**
 * SpeedSorterScreen — Drag-and-drop sorting game with timer
 *
 * Full-screen modal. 5 rounds of 5 coasters each.
 * Rebuilt drag-and-drop using reanimated + gesture handler.
 * Cards move fluidly with finger, others reflow smoothly in real-time.
 *
 * Animation philosophy: Coastle-style controlled motion.
 * withTiming for entrances, stiff spring on drag release (no jello).
 */

import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Dimensions } from 'react-native';
import { PageDots } from '../../../components/PageDots';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  useFrameCallback,
  Easing,
  SharedValue,
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

const CARD_HEIGHT = 68;
const CARD_GAP = 10;
const CARD_STEP = CARD_HEIGHT + CARD_GAP;

// Stiff spring for drag release — direct, no overshoot
const DRAG_SETTLE = { damping: 22, stiffness: 220, mass: 0.8 };

// ─── Timer Display ──────────────────────────────────────────

const Timer = React.memo(function Timer({ startTime, active }: { startTime: number; active: boolean }) {
  const textRef = useRef<TextInput>(null);

  useFrameCallback(() => {
    if (!active || startTime <= 0) return;
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const tenths = Math.floor((elapsed % 1000) / 100);
    textRef.current?.setNativeProps({ text: `${seconds}.${tenths}s` });
  });

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="timer-outline" size={16} color={colors.accent.primary} />
      <TextInput
        ref={textRef}
        style={styles.timerText}
        defaultValue="0.0s"
        editable={false}
        pointerEvents="none"
      />
    </View>
  );
});

// ─── Sortable List ──────────────────────────────────────────

interface SortableItem {
  id: string;
  name: string;
  park: string;
}

interface SortableListProps {
  items: SortableItem[];
  isChecking: boolean;
  correctOrder: string[];
  onReorder: (from: number, to: number) => void;
  roundKey: number;
}

function SortableList({ items, isChecking, correctOrder, onReorder, roundKey }: SortableListProps) {
  // Positions array: positions[i] = visual slot index for item at data index i
  const positions = useSharedValue<number[]>(items.map((_, i) => i));

  // Reset positions when items change (new round)
  useEffect(() => {
    positions.value = items.map((_, i) => i);
  }, [roundKey]);

  return (
    <View style={[styles.cardList, { height: items.length * CARD_STEP }]}>
      {items.map((item, index) => {
        const correctPos = isChecking
          ? correctOrder.indexOf(item.id) === index
          : null;

        return (
          <SortableCard
            key={`${roundKey}-${item.id}`}
            item={item}
            index={index}
            positions={positions}
            totalCards={items.length}
            isCorrectPos={correctPos}
            isChecking={isChecking}
            onReorder={onReorder}
          />
        );
      })}
    </View>
  );
}

// ─── Sortable Card ──────────────────────────────────────────

interface SortableCardProps {
  item: SortableItem;
  index: number;
  positions: SharedValue<number[]>;
  totalCards: number;
  isCorrectPos: boolean | null;
  isChecking: boolean;
  onReorder: (from: number, to: number) => void;
}

function SortableCard({
  item,
  index,
  positions,
  totalCards,
  isCorrectPos,
  isChecking,
  onReorder,
}: SortableCardProps) {
  const isDragging = useSharedValue(false);
  const dragY = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const scale = useSharedValue(1);
  const entrance = useSharedValue(0);

  // Staggered entrance
  useEffect(() => {
    entrance.value = withDelay(
      index * 50,
      withTiming(1, { duration: 200, easing: EASE_OUT }),
    );
  }, []);

  // Checking feedback
  useEffect(() => {
    if (isChecking && isCorrectPos !== null) {
      scale.value = withTiming(1.02, { duration: 100 });
      setTimeout(() => {
        scale.value = withTiming(1, { duration: 150 });
      }, 100);
    }
  }, [isChecking, isCorrectPos]);

  const panGesture = Gesture.Pan()
    .enabled(!isChecking)
    .onStart(() => {
      isDragging.value = true;
      zIndex.value = 100;
      scale.value = withTiming(1.04, { duration: 100 });
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;

      // Calculate how many positions the card has moved
      const currentPos = positions.value[index];
      const movedPositions = Math.round(dragY.value / CARD_STEP);
      const newPos = Math.max(0, Math.min(totalCards - 1, currentPos + movedPositions));

      if (newPos !== currentPos) {
        // Update positions for all affected cards
        const newPositions = [...positions.value];
        const direction = newPos > currentPos ? 1 : -1;

        for (let i = 0; i < newPositions.length; i++) {
          if (i === index) continue;
          const pos = newPositions[i];
          if (direction > 0 && pos > currentPos && pos <= newPos) {
            newPositions[i] = pos - 1;
          } else if (direction < 0 && pos < currentPos && pos >= newPos) {
            newPositions[i] = pos + 1;
          }
        }
        newPositions[index] = newPos;
        positions.value = newPositions;

        // Adjust dragY so the card feels like it's in the right position
        dragY.value = dragY.value - (movedPositions * CARD_STEP);

        // Haptic on each swap
        runOnJS(haptics.tick)();
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      dragY.value = withSpring(0, DRAG_SETTLE);
      scale.value = withSpring(1, DRAG_SETTLE);
      zIndex.value = 0;

      // Commit the final order to the store
      const finalPositions = [...positions.value];
      // Build the reorder mapping: find items that moved
      const orderPairs: [number, number][] = [];
      for (let i = 0; i < finalPositions.length; i++) {
        if (finalPositions[i] !== i) {
          orderPairs.push([i, finalPositions[i]]);
        }
      }
      // Apply the new order to the store
      if (orderPairs.length > 0) {
        // Build new order array from positions
        const newOrder = new Array(totalCards);
        for (let i = 0; i < finalPositions.length; i++) {
          newOrder[finalPositions[i]] = i;
        }
        // Apply moves sequentially — the store's moveItem does splice
        // Instead, apply the complete reorder at once
        runOnJS(applyFullReorder)(newOrder, onReorder);
      }
    });

  const animStyle = useAnimatedStyle(() => {
    const pos = positions.value[index];
    const baseY = pos * CARD_STEP;

    return {
      opacity: entrance.value,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: isDragging.value ? 100 : zIndex.value,
      transform: [
        { translateX: (1 - entrance.value) * 30 },
        {
          translateY: isDragging.value
            ? baseY + dragY.value
            : withTiming(baseY, { duration: 180, easing: EASE_OUT }),
        },
        { scale: scale.value },
      ],
    };
  });

  // Get the visual rank based on position
  const rankStyle = useAnimatedStyle(() => {
    return {};
  });

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
          <PositionLabel positions={positions} index={index} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardPark} numberOfLines={1}>{item.park}</Text>
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
}

// ─── Position Label (reactive to position changes) ──────────

function PositionLabel({ positions, index }: { positions: SharedValue<number[]>; index: number }) {
  const [rank, setRank] = useState(index + 1);

  useAnimatedReaction(
    () => positions.value[index],
    (pos) => {
      runOnJS(setRank)(pos + 1);
    },
    [index],
  );

  return <Text style={styles.cardRank}>{rank}</Text>;
}

// ─── Apply reorder to store ─────────────────────────────────

function applyFullReorder(newOrder: number[], onReorder: (from: number, to: number) => void) {
  // newOrder[position] = dataIndex — we need to convert to move operations
  // Build target: for each current data index, what position should it be in?
  // The store uses splice-based moves, so we rebuild the order
  const total = newOrder.length;
  const current = Array.from({ length: total }, (_, i) => i);

  for (let targetPos = 0; targetPos < total; targetPos++) {
    const dataIdx = newOrder[targetPos];
    const currentPos = current.indexOf(dataIdx);
    if (currentPos !== targetPos) {
      // Move from currentPos to targetPos
      onReorder(currentPos, targetPos);
      // Update our tracking of current
      current.splice(currentPos, 1);
      current.splice(targetPos, 0, dataIdx);
    }
  }
}

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

          <View style={styles.resultsTotalTime}>
            <Ionicons name="timer-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.resultsTotalTimeText}>
              Total time: {formatTime(game.totalTime)}
            </Text>
          </View>

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

  const round = game.rounds[game.currentRoundIndex];
  const sortableItems: SortableItem[] = game.userOrder.map((id) => {
    const coaster = round.coasters.find((c) => c.id === id)!;
    return { id: coaster.id, name: coaster.name, park: coaster.park };
  });

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
              Sort by: {round.categoryLabel} {round.unit ? `(${round.unit})` : ''}
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

      {/* Sortable card list */}
      <View style={styles.cardListWrapper}>
        <SortableList
          items={sortableItems}
          isChecking={game.status === 'checking'}
          correctOrder={round.correctOrder}
          onReorder={handleReorder}
          roundKey={game.currentRoundIndex}
        />

        {/* Correct answer reveal when checking */}
        {game.status === 'checking' && (
          <View style={[styles.correctReveal, { marginTop: sortableItems.length * CARD_STEP + spacing.lg }]}>
            <Text style={styles.correctTitle}>Correct Order:</Text>
            {round.correctOrder.map((id, i) => {
              const c = round.coasters.find((co) => co.id === id)!;
              return (
                <Text key={id} style={styles.correctItem}>
                  {i + 1}. {c.name} — {c.value}{round.unit ? ` ${round.unit}` : ''}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      {/* Round progress dots */}
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
            {' \u00B7 '}
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
  cardListWrapper: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  cardList: {
    position: 'relative',
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
