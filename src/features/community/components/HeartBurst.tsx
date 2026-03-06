/**
 * HeartBurst — Double-tap heart animation overlay
 *
 * Absolutely positioned over the card. Heart scales up from 0,
 * bounces to 1.3, settles to 1.0, then fades out.
 * Driven by a single trigger callback.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface HeartBurstProps {
  visible: boolean;
  onComplete: () => void;
}

export function HeartBurst({ visible, onComplete }: HeartBurstProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1.0, { damping: 12, stiffness: 200 }),
      );
      // Fade out after a pause
      opacity.value = withDelay(
        600,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            scale.value = 0;
            runOnJS(onComplete)();
          }
        }),
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.heart, animatedStyle]}>
        <Ionicons name="heart" size={64} color={colors.accent.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heart: {
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
