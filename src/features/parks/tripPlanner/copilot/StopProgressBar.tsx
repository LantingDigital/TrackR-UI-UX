// ============================================
// Stop Progress Bar — Thin progress strip
//
// Full-width 3px bar at screen top showing
// trip completion progress. Width animates
// with spring physics as stops complete.
// ============================================

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { SPRINGS } from '../../../../constants/animations';

interface StopProgressBarProps {
  completedCount: number;
  totalStops: number;
}

function StopProgressBarInner({ completedCount, totalStops }: StopProgressBarProps) {
  const progress = totalStops > 0 ? completedCount / totalStops : 0;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${withSpring(progress * 100, SPRINGS.stiff)}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export const StopProgressBar = memo(StopProgressBarInner);

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 3,
    backgroundColor: colors.border.subtle,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
});
