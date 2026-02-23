import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Share } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { CoastleStats, GameStatus, MAX_GUESSES } from '../types/coastle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoastleStatsCardProps {
  visible: boolean;
  stats: CoastleStats;
  gameStatus: GameStatus;
  shareText: string;
  onPlayAgain: () => void;
  onClose: () => void;
}

export const CoastleStatsCard: React.FC<CoastleStatsCardProps> = ({
  visible,
  stats,
  gameStatus,
  shareText,
  onPlayAgain,
  onClose,
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (gameStatus === 'won') haptics.success();
      else if (gameStatus === 'lost') haptics.error();

      scale.value = withTiming(1, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = 0.85;
      opacity.value = 0;
      backdropOpacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleShare = async () => {
    haptics.tap();
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  if (!visible) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Reanimated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Reanimated.View>

      {/* Card */}
      <Reanimated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>
            {gameStatus === 'won' ? 'Congratulations!' : 'Game Over'}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatItem label="Played" value={stats.gamesPlayed} />
            <StatItem label="Win %" value={winRate} />
            <StatItem label="Streak" value={stats.currentStreak} />
            <StatItem label="Max" value={stats.maxStreak} />
          </View>

          {/* Distribution */}
          <Text style={styles.distributionTitle}>Guess Distribution</Text>
          <View style={styles.distribution}>
            {stats.guessDistribution.map((count, i) => (
              <View key={i} style={styles.distRow}>
                <Text style={styles.distLabel}>{i + 1}</Text>
                <View style={styles.distBarContainer}>
                  <View
                    style={[
                      styles.distBar,
                      {
                        width: `${Math.max((count / maxDistribution) * 100, 8)}%`,
                        backgroundColor: count > 0 ? colors.coastle.correct : colors.coastle.wrong,
                      },
                    ]}
                  >
                    <Text style={styles.distCount}>{count}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
            <Pressable
              style={styles.playAgainButton}
              onPress={() => { haptics.tap(); onPlayAgain(); }}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      </Reanimated.View>
    </View>
  );
};

const StatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
    zIndex: 200,
  },
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  card: {
    width: SCREEN_WIDTH - spacing.lg * 4,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xxl,
    ...shadows.modal,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
  distributionTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  distribution: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  distLabel: {
    width: 16,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  distBarContainer: {
    flex: 1,
  },
  distBar: {
    minWidth: 24,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
  },
  distCount: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  shareButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  playAgainButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
});
