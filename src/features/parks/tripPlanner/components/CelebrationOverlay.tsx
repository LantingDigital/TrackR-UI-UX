// ============================================
// Celebration Overlay
//
// Full-screen overlay: bouncy check + "done!" +
// wait stats. Auto-dismisses after 1.2 seconds.
// ============================================

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { SPRINGS } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';
import type { TripStop } from '../types';

// ============================================
// Props
// ============================================

interface CelebrationOverlayProps {
  stop: TripStop;
  onDismiss: () => void;
}

// ============================================
// Component
// ============================================

function CelebrationOverlayInner({ stop, onDismiss }: CelebrationOverlayProps) {
  const checkScale = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    checkScale.value = withSpring(1, SPRINGS.bouncy);

    const timer = setTimeout(onDismiss, 1200);
    return () => clearTimeout(timer);
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const actualWait = stop.actualWaitMin ?? 0;
  const estimatedWait = stop.estimatedWaitMin;
  const isBetter = actualWait < estimatedWait;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Animated.View style={[styles.checkCircle, checkStyle]}>
        <Ionicons name="checkmark" size={36} color={colors.text.inverse} />
      </Animated.View>

      <Text style={styles.name}>{stop.name}</Text>
      <Text style={styles.done}>done!</Text>

      {actualWait > 0 && (
        <Text style={[styles.waitStat, isBetter && styles.waitStatGood]}>
          Waited {Math.round(actualWait)}m (est. {Math.round(estimatedWait)}m)
        </Text>
      )}
    </Animated.View>
  );
}

export const CelebrationOverlay = memo(CelebrationOverlayInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  done: {
    fontSize: typography.sizes.label,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  waitStat: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  waitStatGood: {
    color: colors.status.success,
  },
});
