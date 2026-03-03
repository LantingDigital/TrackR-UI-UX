import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { SPRINGS } from '../../../constants/animations';

interface BattleProgressProps {
  currentRound: number;
  totalRounds: number;
}

export const BattleProgress: React.FC<BattleProgressProps> = React.memo(({
  currentRound,
  totalRounds,
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(
      totalRounds > 0 ? currentRound / totalRounds : 0,
      SPRINGS.responsive,
    );
  }, [currentRound, totalRounds]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Battle {Math.min(currentRound + 1, totalRounds)} of {totalRounds}
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  track: {
    height: 6,
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
  },
});
