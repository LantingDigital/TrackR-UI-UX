/**
 * ImportProgressBanner — Persistent import progress indicator
 *
 * Shows a small banner at the top of the screen during active imports.
 * Persists across navigation. Dismisses with slide-up on completion.
 * Tapping navigates back to the import screen.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { SPRINGS, TIMING } from '../constants/animations';
import { useImportStore } from '../stores/importStore';

export const ImportProgressBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const store = useImportStore();
  const progress = store.progress;

  const isActive = progress.status === 'importing';
  const isComplete = progress.status === 'complete';

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      translateY.value = withSpring(0, SPRINGS.stiff);
      opacity.value = withTiming(1, { duration: TIMING.normal });
    } else if (isComplete) {
      // Slide up and fade out after a brief pause
      translateY.value = withDelay(
        1500,
        withTiming(-60, { duration: TIMING.normal, easing: Easing.in(Easing.ease) }),
      );
      opacity.value = withDelay(
        1500,
        withTiming(0, { duration: TIMING.normal }),
      );
    } else {
      translateY.value = -60;
      opacity.value = 0;
    }
  }, [isActive, isComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isActive && !isComplete) return null;

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={() => navigation.navigate('ImportRideData')}
        style={styles.inner}
      >
        <View style={styles.textRow}>
          <Text style={styles.label}>
            {isComplete
              ? `Import complete! ${progress.completed} rides added`
              : `Importing rides... ${progress.completed}/${progress.total}`}
          </Text>
          {!isComplete && (
            <Text style={styles.percentage}>{percentage}%</Text>
          )}
        </View>
        {!isComplete && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  inner: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  percentage: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.background.input,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 1.5,
  },
});
