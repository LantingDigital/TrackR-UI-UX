import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { haptics } from '../../../services/haptics';
import { CellComparison, ComparisonResult, Direction } from '../types/coastle';
import { CheckIcon, CrossIcon, ArrowUpIcon, ArrowDownIcon } from './CoastleIcons';

interface CoastleCellProps {
  cell: CellComparison;
  cellIndex: number; // 0-8, for stagger
  size: number;
  shouldReveal: boolean;
}

const STAGGER_DELAY = 80;
const FLIP_HALF_DURATION = 120;

// Watermark icon color per result
function getIconColor(result: ComparisonResult): string {
  switch (result) {
    case 'correct': return colors.coastle.correct;
    case 'close': return colors.coastle.close;
    case 'wrong': return colors.accent.primary;
  }
}

export const CoastleCell: React.FC<CoastleCellProps> = ({
  cell,
  cellIndex,
  size,
  shouldReveal,
}) => {
  const flipProgress = useSharedValue(0);
  const hasRevealed = useSharedValue(false);

  useEffect(() => {
    if (shouldReveal && !hasRevealed.value) {
      hasRevealed.value = true;
      const delay = cellIndex * STAGGER_DELAY;

      flipProgress.value = withDelay(
        delay,
        withTiming(1, { duration: FLIP_HALF_DURATION * 2, easing: Easing.inOut(Easing.ease) }),
      );

      setTimeout(() => {
        haptics.tick();
      }, delay + FLIP_HALF_DURATION);
    }
  }, [shouldReveal]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = flipProgress.value * 180;
    const opacity = flipProgress.value < 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = 180 + flipProgress.value * 180;
    const opacity = flipProgress.value >= 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  const iconColor = getIconColor(cell.result);

  // Choose watermark icon based on result + direction
  const iconSize = size;
  const WatermarkIcon = getWatermarkIcon(cell.result, cell.direction);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Front (unrevealed) */}
      <Reanimated.View
        style={[
          styles.cell,
          styles.cellFront,
          { width: size, height: size },
          frontStyle,
        ]}
      >
        <Text style={styles.frontLabel}>{cell.label}</Text>
        <Text style={styles.frontQuestion}>?</Text>
      </Reanimated.View>

      {/* Back (revealed) — neutral background with watermark icon */}
      <Reanimated.View
        style={[
          styles.cell,
          styles.cellBack,
          { width: size, height: size },
          backStyle,
        ]}
      >
        {/* Watermark icon — centered, behind text */}
        <View style={styles.watermark} pointerEvents="none">
          <WatermarkIcon size={iconSize} color={iconColor} />
        </View>

        {/* Text content — on top of watermark */}
        <Text style={styles.label} numberOfLines={1}>{cell.label}</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{cell.displayValue}</Text>
      </Reanimated.View>
    </View>
  );
};

function getWatermarkIcon(
  result: ComparisonResult,
  direction: Direction,
): React.FC<{ size: number; color: string }> {
  if (result === 'correct') return CheckIcon;
  if (direction === 'higher') return ArrowUpIcon;
  if (direction === 'lower') return ArrowDownIcon;
  if (result === 'wrong') return CrossIcon;
  // Close without direction — use a subtle check-like or no watermark
  // For now use ArrowUpIcon as a placeholder; close non-directional is rare
  return CrossIcon;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  cellFront: {
    backgroundColor: colors.coastle.empty,
    borderWidth: 1,
    borderColor: colors.coastle.cellBorder,
  },
  cellBack: {
    backgroundColor: colors.coastle.wrong, // neutral for all results
    borderWidth: 1,
    borderColor: colors.coastle.cellBorder,
  },
  watermark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.coastle.emptyText,
    marginBottom: 2,
  },
  frontQuestion: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.coastle.emptyText,
  },
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.coastle.wrongText,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});
