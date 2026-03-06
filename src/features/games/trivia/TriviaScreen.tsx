/**
 * TriviaScreen — Coaster Trivia game
 *
 * Full-screen modal. 10 questions per round.
 * Animation philosophy follows Coastle: controlled withTiming entrances,
 * subtle scales, no bouncy/jello overshoot. Springs only for press feedback.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
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
  useTriviaStore,
  startGame,
  selectAnswer,
  nextQuestion,
  resetGame,
} from './stores/triviaStore';
import { TriviaHeader } from './components/TriviaHeader';

const EASE_OUT = Easing.out(Easing.ease);
const EASE_IN_OUT = Easing.inOut(Easing.ease);

// ─── Animated Progress Bar ──────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = (current + 1) / total;
    progress.value = withTiming(target, { duration: 250, easing: EASE_IN_OUT });
  }, [current, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
      <Text style={styles.progressText}>{current + 1} / {total}</Text>
    </View>
  );
}

// ─── Score Display ──────────────────────────────────────────

function ScoreDisplay({ score, streak }: { score: number; streak: number }) {
  const scoreScale = useSharedValue(1);
  const streakOpacity = useSharedValue(0);
  const prevScore = useRef(score);
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (score > prevScore.current) {
      // Subtle pop — 4% scale, no overshoot
      scoreScale.value = withTiming(1.04, { duration: 100 });
      setTimeout(() => {
        scoreScale.value = withTiming(1, { duration: 150 });
      }, 100);
    }
    prevScore.current = score;
  }, [score]);

  useEffect(() => {
    streakOpacity.value = withTiming(streak > 1 ? 1 : 0, { duration: 200 });
    prevStreak.current = streak;
  }, [streak]);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: streakOpacity.value,
  }));

  return (
    <View style={styles.scoreRow}>
      <Animated.Text style={[styles.scoreText, scoreStyle]}>
        Score: {score}
      </Animated.Text>
      <Animated.Text style={[styles.streakText, streakStyle]}>
        {'\u{1F525}'} {streak} streak
      </Animated.Text>
    </View>
  );
}

// ─── Answer Button ──────────────────────────────────────────

function AnswerButton({ text, index, correctIndex, selectedIndex, isRevealed, onPress }: {
  text: string;
  index: number;
  correctIndex: number;
  selectedIndex: number | null;
  isRevealed: boolean;
  onPress: () => void;
}) {
  const entrance = useSharedValue(0);
  const feedbackOpacity = useSharedValue(1);

  // Stagger entrance — withTiming, not spring
  useEffect(() => {
    entrance.value = 0;
    entrance.value = withDelay(
      index * 50,
      withTiming(1, { duration: 200, easing: EASE_OUT }),
    );
  }, []);

  // Dim non-relevant answers on reveal
  useEffect(() => {
    if (!isRevealed) {
      feedbackOpacity.value = 1;
      return;
    }
    const isCorrect = index === correctIndex;
    const isSelected = index === selectedIndex;
    if (!isCorrect && !isSelected) {
      feedbackOpacity.value = withTiming(0.4, { duration: 200 });
    }
  }, [isRevealed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - entrance.value) * 12 },
      { scale: 0.96 + entrance.value * 0.04 },
    ],
    opacity: entrance.value * feedbackOpacity.value,
  }));

  const isCorrect = index === correctIndex;
  const isSelected = index === selectedIndex;
  const showCorrect = isRevealed && isCorrect;
  const showWrong = isRevealed && isSelected && !isCorrect;

  return (
    <Pressable onPress={onPress} disabled={isRevealed}>
      <Animated.View style={[
        styles.answerBtn,
        showCorrect && styles.answerCorrect,
        showWrong && styles.answerWrong,
        animStyle,
      ]}>
        <Text style={[
          styles.answerText,
          showCorrect && styles.answerTextCorrect,
          showWrong && styles.answerTextWrong,
        ]}>
          {text}
        </Text>
        {showCorrect && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
        {showWrong && <Ionicons name="close-circle" size={20} color="#E53935" />}
      </Animated.View>
    </Pressable>
  );
}

// ─── Results Screen ─────────────────────────────────────────

function ResultsView({ score, total, onPlayAgain, onClose }: {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onClose: () => void;
}) {
  const percentage = Math.round((score / total) * 100);
  const emoji = percentage >= 80 ? '\u{1F3C6}' : percentage >= 60 ? '\u2B50' : percentage >= 40 ? '\u{1F44D}' : '\u{1F4AA}';

  // Controlled entrance — scale from 0.9, not bouncy
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withTiming(1, { duration: 220, easing: EASE_OUT });
    cardOpacity.value = withTiming(1, { duration: 200 });
    actionsOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  return (
    <View style={styles.resultsContainer}>
      <Animated.View style={[styles.resultsCard, cardStyle]}>
        <Text style={styles.resultsEmoji}>{emoji}</Text>
        <Text style={styles.resultsScore}>{score} / {total}</Text>
        <Text style={styles.resultsPercent}>{percentage}% Correct</Text>
      </Animated.View>

      <Animated.View style={actionsStyle}>
        <Pressable style={styles.playAgainBtn} onPress={onPlayAgain}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>

        <Pressable style={styles.closeResultsBtn} onPress={onClose}>
          <Text style={styles.closeResultsText}>Done</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export function TriviaScreen() {
  const navigation = useNavigation();
  const { game, stats, settings } = useTriviaStore();

  // Question transition — controlled fade + slide
  const questionOpacity = useSharedValue(0);
  const questionY = useSharedValue(10);
  const nextBtnOpacity = useSharedValue(0);
  const nextBtnY = useSharedValue(8);

  useEffect(() => {
    startGame();
    return () => { resetGame(); };
  }, []);

  // Animate question entrance on index change
  useEffect(() => {
    if (game.status !== 'playing') return;
    questionOpacity.value = 0;
    questionY.value = 10;
    nextBtnOpacity.value = 0;
    nextBtnY.value = 8;

    questionOpacity.value = withTiming(1, { duration: 220, easing: EASE_OUT });
    questionY.value = withTiming(0, { duration: 220, easing: EASE_OUT });
  }, [game.currentIndex, game.status]);

  // Animate next button when answer revealed
  useEffect(() => {
    if (game.isRevealed) {
      nextBtnOpacity.value = withDelay(350, withTiming(1, { duration: 200 }));
      nextBtnY.value = withDelay(350, withTiming(0, { duration: 200, easing: EASE_OUT }));
    }
  }, [game.isRevealed]);

  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateY: questionY.value }],
  }));

  const nextBtnStyle = useAnimatedStyle(() => ({
    opacity: nextBtnOpacity.value,
    transform: [{ translateY: nextBtnY.value }],
  }));

  const handleAnswer = useCallback((index: number) => {
    const question = game.questions[game.currentIndex];
    if (index === question?.correctIndex) {
      haptics.success();
    } else {
      haptics.error();
    }
    selectAnswer(index);
  }, [game.currentIndex, game.questions]);

  const handleNext = useCallback(() => {
    haptics.tap();
    nextQuestion();
  }, []);

  const handlePlayAgain = useCallback(() => {
    haptics.tap();
    startGame();
  }, []);

  const handleClose = useCallback(() => {
    haptics.tap();
    resetGame();
    navigation.goBack();
  }, [navigation]);

  if (game.status === 'idle' || game.questions.length === 0) {
    return <View style={styles.container} />;
  }

  if (game.status === 'results') {
    return (
      <View style={styles.container}>
        <TriviaHeader onClose={handleClose} stats={stats} settings={settings} />
        <ResultsView
          score={game.score}
          total={game.questions.length}
          onPlayAgain={handlePlayAgain}
          onClose={handleClose}
        />
      </View>
    );
  }

  const question = game.questions[game.currentIndex];
  const categoryIcon = question.category === 'parks' ? 'location-outline'
    : question.category === 'coasters' ? 'flash-outline'
    : question.category === 'manufacturers' ? 'construct-outline'
    : 'time-outline';

  return (
    <View style={styles.container}>
      <TriviaHeader onClose={handleClose} stats={stats} settings={settings} />

      {/* Progress */}
      <View style={styles.progressSection}>
        <ProgressBar current={game.currentIndex} total={game.questions.length} />
        <ScoreDisplay score={game.score} streak={game.streak} />
      </View>

      {/* Question */}
      <Animated.View style={[styles.questionSection, questionStyle]}>
        <View style={styles.categoryBadge}>
          <Ionicons name={categoryIcon as any} size={14} color={colors.accent.primary} />
          <Text style={styles.categoryText}>{question.category}</Text>
        </View>
        <Text style={styles.questionText}>{question.question}</Text>
      </Animated.View>

      {/* Answers */}
      <View key={`a-${game.currentIndex}`} style={styles.answersSection}>
        {question.answers.map((answer, i) => (
          <AnswerButton
            key={`${game.currentIndex}-${i}`}
            text={answer}
            index={i}
            correctIndex={question.correctIndex}
            selectedIndex={game.selectedAnswer}
            isRevealed={game.isRevealed}
            onPress={() => handleAnswer(i)}
          />
        ))}
      </View>

      {/* Correct answer callout when wrong */}
      {game.isRevealed && game.selectedAnswer !== question.correctIndex && (
        <View style={styles.correctCallout}>
          <Ionicons name="information-circle" size={16} color={colors.accent.primary} />
          <Text style={styles.correctCalloutText}>
            Correct: {question.answers[question.correctIndex]}
          </Text>
        </View>
      )}

      {/* Next button */}
      {game.isRevealed && (
        <Animated.View style={nextBtnStyle}>
          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {game.currentIndex < game.questions.length - 1 ? 'Next' : 'See Results'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
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

  // Progress
  progressSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.base,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
  },
  progressText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    minWidth: 36,
    textAlign: 'right',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scoreText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  streakText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Question
  questionSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  categoryText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 28,
  },

  // Answers
  answersSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    gap: spacing.base,
  },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  answerCorrect: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  answerWrong: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#E53935',
  },
  answerText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  answerTextCorrect: {
    color: '#2E7D32',
  },
  answerTextWrong: {
    color: '#C62828',
  },

  // Correct callout
  correctCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.base,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.md,
    padding: spacing.base,
  },
  correctCalloutText: {
    fontSize: typography.sizes.body,
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },

  // Next
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  nextBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },

  // Results
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  resultsCard: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  resultsPercent: {
    fontSize: typography.sizes.heading,
    color: colors.text.secondary,
    marginTop: spacing.sm,
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
  closeResultsBtn: {
    paddingVertical: spacing.base,
  },
  closeResultsText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
