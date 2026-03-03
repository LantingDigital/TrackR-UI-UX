import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 24;
const DOT_GAP = spacing.md;

interface OnboardingProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

const Dot: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const width = useSharedValue(isActive ? DOT_ACTIVE_WIDTH : DOT_SIZE);
  const colorProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    width.value = withSpring(isActive ? DOT_ACTIVE_WIDTH : DOT_SIZE, SPRINGS.responsive);
    colorProgress.value = withTiming(isActive ? 1 : 0, { duration: TIMING.fast });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.border.subtle, colors.accent.primary],
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const OnboardingProgressDots: React.FC<OnboardingProgressDotsProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Dot key={i} isActive={i === currentStep} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DOT_GAP,
    paddingVertical: spacing.lg,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
