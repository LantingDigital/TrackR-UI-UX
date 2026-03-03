import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { MAX_GUESSES } from '../types/coastle';

interface CoastleResultCardProps {
  coasterName: string;
  gameStatus: 'won' | 'lost';
  guessCount: number;
  shareText: string;
  onPlayAgain: () => void;
  onDismiss: () => void;
}

export const CoastleResultCard: React.FC<CoastleResultCardProps> = ({
  coasterName,
  gameStatus,
  guessCount,
  shareText,
  onPlayAgain,
  onDismiss,
}) => {
  const won = gameStatus === 'won';

  const handleShare = useCallback(async () => {
    haptics.tap();
    try { await Share.share({ message: shareText }); } catch {}
  }, [shareText]);

  const handlePlayAgain = useCallback(() => {
    haptics.select();
    onPlayAgain();
  }, [onPlayAgain]);

  const handleDismiss = useCallback(() => {
    haptics.tap();
    onDismiss();
  }, [onDismiss]);

  const guessLabel = won
    ? `Solved in ${guessCount} / ${MAX_GUESSES}`
    : `0 / ${MAX_GUESSES}`;

  return (
    <View style={styles.card}>
      {/* Dismiss X — absolute top-right */}
      <Pressable
        style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
        onPress={handleDismiss}
        hitSlop={8}
      >
        <Ionicons name="close" size={18} color={colors.text.secondary} />
      </Pressable>

      {/* Status icon */}
      <View style={[styles.iconCircle, won ? styles.iconCircleWin : styles.iconCircleLoss]}>
        <Ionicons
          name={won ? 'checkmark' : 'close'}
          size={22}
          color={won ? colors.coastle.correct : colors.text.secondary}
        />
      </View>

      {/* Coaster name */}
      <Text style={[styles.coasterName, won ? styles.coasterNameWin : styles.coasterNameLoss]}>
        {coasterName}
      </Text>

      {/* Message */}
      <Text style={styles.message}>
        {won ? 'Solved it!' : 'So close!'}
      </Text>

      {/* Guess count */}
      <Text style={styles.guessCount}>{guessLabel}</Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnShare, pressed && styles.btnSharePressed]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={16} color={colors.text.inverse} />
          <Text style={styles.btnShareText}>Share</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPlay, pressed && styles.btnPlayPressed]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPlayText}>Play Again</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  dismissBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconCircleWin: {
    backgroundColor: `${colors.coastle.correct}22`,
  },
  iconCircleLoss: {
    backgroundColor: colors.background.input,
  },
  coasterName: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    lineHeight: typography.sizes.display * 1.2,
  },
  coasterNameWin: {
    color: colors.accent.primary,
  },
  coasterNameLoss: {
    color: colors.text.primary,
  },
  message: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  guessCount: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    marginBottom: spacing.base,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    height: 44,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnShare: {
    backgroundColor: colors.accent.primary,
  },
  btnSharePressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  btnShareText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  btnPlay: {
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
  },
  btnPlayPressed: {
    backgroundColor: colors.accent.primaryLight,
  },
  btnPlayText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
});
