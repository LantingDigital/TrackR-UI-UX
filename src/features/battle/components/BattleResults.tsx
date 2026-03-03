import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  useSharedValue,
  FadeIn,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING, PRESS_SCALES } from '../../../constants/animations';
import { useSpringPress, useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import type { BattleCoasterStats, BattleInsight } from '../types/battle';

interface BattleResultsProps {
  topCoasters: BattleCoasterStats[];
  insights: BattleInsight[];
  onPlayAgain: () => void;
  onDone: () => void;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const RankedCoaster: React.FC<{
  stat: BattleCoasterStats;
  rank: number;
  index: number;
}> = React.memo(({ stat, rank, index }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = 200 + index * 120;
    scale.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : colors.text.meta;

  return (
    <Animated.View style={[styles.rankedItem, animatedStyle]}>
      <View style={[styles.rankBadge, { backgroundColor: medalColor + '20' }]}>
        <Text style={[styles.rankNumber, { color: medalColor }]}>
          {rank}
        </Text>
      </View>
      <View style={styles.rankedInfo}>
        <Text style={styles.rankedName} numberOfLines={1}>
          {stat.name}
        </Text>
        <Text style={styles.rankedPark} numberOfLines={1}>
          {stat.park}
        </Text>
      </View>
      <View style={styles.winRateContainer}>
        <Text style={styles.winRate}>
          {Math.round(stat.winRate * 100)}%
        </Text>
        <Text style={styles.winRateLabel}>wins</Text>
      </View>
    </Animated.View>
  );
});

export const BattleResults: React.FC<BattleResultsProps> = ({
  topCoasters,
  insights,
  onPlayAgain,
  onDone,
}) => {
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const playAgainPress = useStrongPress();
  const donePress = useSpringPress({ scale: PRESS_SCALES.normal });

  React.useEffect(() => {
    haptics.success();
    headerScale.value = withSpring(1, SPRINGS.responsive);
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const handlePlayAgain = () => {
    haptics.select();
    onPlayAgain();
  };

  const handleDone = () => {
    haptics.tap();
    onDone();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>Your Taste Profile</Text>
        <Text style={styles.subheading}>Based on {topCoasters.reduce((sum, c) => sum + c.battles, 0)} comparisons</Text>
      </Animated.View>

      {topCoasters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Coasters</Text>
          <View style={styles.rankedList}>
            {topCoasters.map((stat, index) => (
              <RankedCoaster
                key={stat.id}
                stat={stat}
                rank={index + 1}
                index={index}
              />
            ))}
          </View>
        </View>
      )}

      {insights.length > 0 && (
        <Animated.View
          entering={FadeIn.delay(600).duration(TIMING.normal)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightLabel}>{insight.label}</Text>
              <Text style={styles.insightValue}>{insight.value}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      <Animated.View
        entering={FadeIn.delay(800).duration(TIMING.normal)}
        style={styles.actions}
      >
        <Pressable
          {...playAgainPress.pressHandlers}
          onPress={handlePlayAgain}
          style={styles.primaryButton}
        >
          <Animated.View style={[styles.primaryButtonInner, playAgainPress.animatedStyle]}>
            <Text style={styles.primaryButtonText}>Battle Again</Text>
          </Animated.View>
        </Pressable>

        <Pressable
          {...donePress.pressHandlers}
          onPress={handleDone}
          style={styles.secondaryButton}
        >
          <Animated.View style={donePress.animatedStyle}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  heading: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.heroLarge,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  rankedList: {
    gap: spacing.base,
  },
  rankedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
    gap: spacing.base,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
  },
  rankedInfo: {
    flex: 1,
  },
  rankedName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  rankedPark: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  winRateContainer: {
    alignItems: 'center',
  },
  winRate: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  winRateLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
  insightCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  insightLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing.base,
    marginTop: spacing.lg,
  },
  primaryButton: {
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
});
