import React from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Share } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { CoastleStats, GameStatus } from '../types/coastle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoastleStatsContentProps {
  stats: CoastleStats;
  gameStatus: GameStatus;
  shareText: string;
  onPlayAgain: () => void;
  close: () => void;
}

export const CoastleStatsContent: React.FC<CoastleStatsContentProps> = ({
  stats,
  gameStatus,
  shareText,
  onPlayAgain,
  close,
}) => {
  const handleShare = async () => {
    haptics.tap();
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <View style={styles.content}>
      {/* Title */}
      <Text style={styles.title}>
        {gameStatus === 'won' ? 'Congratulations!' : gameStatus === 'lost' ? 'Game Over' : 'Statistics'}
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
          onPress={() => { haptics.tap(); onPlayAgain(); close(); }}
        >
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      </View>
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
  content: {
    padding: spacing.xxl,
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
