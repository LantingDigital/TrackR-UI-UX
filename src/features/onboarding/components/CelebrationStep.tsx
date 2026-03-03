import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import type { RiderType } from '../../../stores/settingsStore';

const RIDER_LABELS: Record<NonNullable<RiderType>, string> = {
  thrills: 'Thrill Seeker',
  data: 'Data Nerd',
  planner: 'Trip Planner',
  newbie: 'Fresh Rider',
};

interface CelebrationStepProps {
  riderType: RiderType;
  active: boolean;
  onComplete: () => void;
}

export const CelebrationStep: React.FC<CelebrationStepProps> = ({
  riderType,
  active,
  onComplete,
}) => {
  // Welcome text entrance
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);

  // Badge entrance
  const badgeTranslateY = useSharedValue(30);
  const badgeOpacity = useSharedValue(0);

  // Decorative rings
  const ring1Scale = useSharedValue(0.5);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (!active) return;

    // Title — immediate
    titleOpacity.value = withTiming(1, { duration: TIMING.normal });
    titleScale.value = withSpring(1, SPRINGS.bouncy);

    // Badge — 200ms delay
    badgeOpacity.value = withDelay(200, withTiming(1, { duration: TIMING.normal }));
    badgeTranslateY.value = withDelay(200, withSpring(0, SPRINGS.responsive));

    // Decorative rings — staggered
    ring1Opacity.value = withDelay(100, withTiming(0.15, { duration: TIMING.slow }));
    ring1Scale.value = withDelay(100, withSpring(1, SPRINGS.gentle));
    ring2Opacity.value = withDelay(250, withTiming(0.1, { duration: TIMING.slow }));
    ring2Scale.value = withDelay(250, withSpring(1, SPRINGS.gentle));

    // Auto-advance after animations play
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [active]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ translateY: badgeTranslateY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1Opacity.value,
    transform: [{ scale: ring1Scale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Decorative rings */}
      <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
      <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />

      {/* Content */}
      <Animated.View style={titleStyle}>
        <Text style={styles.title}>Welcome aboard!</Text>
      </Animated.View>

      {riderType && (
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>{RIDER_LABELS[riderType]}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  badge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryLight,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  badgeText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  ring1: {
    width: 280,
    height: 280,
  },
  ring2: {
    width: 400,
    height: 400,
  },
});
