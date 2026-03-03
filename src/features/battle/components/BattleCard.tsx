import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import type { CoastleCoaster } from '../../coastle/types/coastle';

interface BattleCardProps {
  coaster: CoastleCoaster;
  side: 'left' | 'right';
  animationKey: number; // changes trigger re-entrance
  label: string; // "A" or "B"
}

export const BattleCard: React.FC<BattleCardProps> = React.memo(({
  coaster,
  side,
  animationKey,
  label,
}) => {
  const translateX = useSharedValue(side === 'left' ? -300 : 300);
  const cardOpacity = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = side === 'left' ? -300 : 300;
    cardOpacity.value = 0;

    const delay = side === 'left' ? 0 : 80;
    translateX.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
    cardOpacity.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
  }, [animationKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
  }));

  const statPills = [
    { label: `${coaster.heightFt} ft`, icon: 'height' },
    { label: `${coaster.speedMph} mph`, icon: 'speed' },
    { label: `${coaster.inversions} inv`, icon: 'inversions' },
  ];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.card}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
        <Text style={styles.coasterName} numberOfLines={2}>
          {coaster.name}
        </Text>
        <Text style={styles.parkName} numberOfLines={1}>
          {coaster.park}
        </Text>

        <View style={styles.statsRow}>
          {statPills.map((stat, i) => (
            <View key={i} style={styles.statPill}>
              <Text style={styles.statText}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{coaster.material}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{coaster.type}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{coaster.yearOpened}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {},
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  labelBadge: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  coasterName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.heading * typography.lineHeights.tight,
    marginBottom: spacing.xs,
    paddingRight: spacing.xxxl,
  },
  parkName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  statPill: {
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.meta,
  },
});
