// ============================================
// Celebration Toast — Ride completion overlay
//
// Brief 1.5s overlay with bouncy checkmark,
// coaster name, and credit count. Auto-dismisses
// or dismisses on tap. Frosted blur background.
// ============================================

import React, { memo, useEffect } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { SPRINGS } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';
import type { TripStop } from '../types';

interface CelebrationToastProps {
  stop: TripStop;
  creditNumber?: number;
  onDismiss: () => void;
}

function CelebrationToastInner({ stop, creditNumber, onDismiss }: CelebrationToastProps) {
  const checkScale = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    checkScale.value = withSpring(1, SPRINGS.bouncy);

    const timer = setTimeout(onDismiss, 1500);
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
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <BlurView intensity={40} tint="light" style={styles.blur}>
          <Animated.View style={[styles.checkCircle, checkStyle]}>
            <Ionicons name="checkmark" size={40} color={colors.text.inverse} />
          </Animated.View>

          <Text style={styles.name}>{stop.name}</Text>

          {creditNumber != null && creditNumber > 0 && (
            <Text style={styles.credit}>Credit #{creditNumber}</Text>
          )}

          {actualWait > 0 && (
            <Text style={[styles.waitStat, isBetter && styles.waitStatGood]}>
              Waited {Math.round(actualWait)}m (est. {Math.round(estimatedWait)}m)
            </Text>
          )}
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export const CelebrationToast = memo(CelebrationToastInner);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  credit: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
    marginTop: spacing.md,
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
