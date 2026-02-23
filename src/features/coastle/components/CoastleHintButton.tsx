import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { HintReveal, HINT_GUESSES, GameStatus } from '../types/coastle';

interface CoastleHintButtonProps {
  guessCount: number;
  hints: HintReveal[];
  viewedHintIds: number[];
  gameStatus: GameStatus;
  onViewHints: () => void;
  onShowTooltip: () => void;
}

export const CoastleHintButton: React.FC<CoastleHintButtonProps> = ({
  guessCount,
  hints,
  viewedHintIds,
  gameStatus,
  onViewHints,
  onShowTooltip,
}) => {
  const hasHints = hints.length > 0;
  const hasUnviewed = hints.some((h) => !viewedHintIds.includes(h.afterGuess));

  // Ping animation for unviewed hint
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0);

  useEffect(() => {
    if (hasUnviewed) {
      pingScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8, { duration: 800, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      );
      pingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pingScale);
      cancelAnimation(pingOpacity);
      pingScale.value = 1;
      pingOpacity.value = 0;
    }
  }, [hasUnviewed]);

  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: pingOpacity.value,
  }));

  const handlePress = useCallback(() => {
    if (hasHints) {
      haptics.tap();
      onViewHints();
    } else {
      haptics.tick();
      onShowTooltip();
    }
  }, [hasHints, onViewHints, onShowTooltip]);

  if (gameStatus !== 'playing') return null;

  // Label text
  const nextHintGuess = HINT_GUESSES.find((g) => g > guessCount);
  let labelText: string;
  if (hasUnviewed) {
    labelText = 'Hint available!';
  } else if (hasHints && nextHintGuess) {
    labelText = `View hint · Next at guess ${nextHintGuess}`;
  } else if (hasHints) {
    labelText = `View hint${hints.length > 1 ? 's' : ''}`;
  } else if (nextHintGuess) {
    labelText = `Hints at guesses ${HINT_GUESSES.join(' & ')}`;
  } else {
    labelText = 'No hints available';
  }

  const isActive = hasUnviewed;
  const isTappable = hasHints;

  return (
    <Pressable
      style={styles.button}
      onPress={handlePress}
    >
      <View style={styles.iconWrapper}>
        {isActive && (
          <Reanimated.View style={[styles.pingRing, pingStyle]} />
        )}
        <Ionicons
          name={isTappable ? 'bulb' : 'bulb-outline'}
          size={16}
          color={isActive ? colors.accent.primary : colors.text.meta}
        />
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {labelText}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  label: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  labelActive: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
});
