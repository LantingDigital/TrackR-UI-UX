// ============================================
// Guided Tour v2 — Floating Pill
//
// Small floating pill shown during the Coastle
// pause state. Spring entrance/exit with morphing text.
// ============================================

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SPRINGS, TIMING } from '../../constants/animations';

interface TourFloatingPillProps {
  visible: boolean;
  text: string;
}

export function TourFloatingPill({ visible, text }: TourFloatingPillProps) {
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRINGS.bouncy);
      opacity.value = withTiming(1, { duration: TIMING.normal });
      scale.value = withSpring(1, SPRINGS.responsive);
    } else {
      translateY.value = withSpring(60, SPRINGS.responsive);
      opacity.value = withTiming(0, { duration: TIMING.fast });
      scale.value = withSpring(0.9, SPRINGS.responsive);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.pill, animStyle]} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.pill,
    ...shadows.card,
    zIndex: 10002,
  },
  text: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
