import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { SimulatedLocation, SIMULATION_ENABLED } from './useSimulatedLocation';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { TIMING } from '../../../constants/animations';

// ============================================
// Dev Location Banner
//
// Shows a semi-transparent banner at the top of the map
// when in dev/simulation mode. Two states:
//
// 1. No simulated location: "DEV: Tap & hold to place yourself"
// 2. Simulating: "DEV: Simulating GPS" with coordinates + reset button
//
// Hidden entirely when SIMULATION_ENABLED is false.
// ============================================

interface DevLocationBannerProps {
  simulatedLocation: SimulatedLocation | null;
  onReset: () => void;
  /** Top inset (safe area) so banner sits below the notch/status bar */
  insetTop: number;
}

export function DevLocationBanner({ simulatedLocation, onReset, insetTop }: DevLocationBannerProps) {
  if (!SIMULATION_ENABLED) return null;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: TIMING.normal, easing: Easing.out(Easing.ease) }),
  }));

  const isSimulating = simulatedLocation !== null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insetTop + spacing.md + 40 + spacing.md + 30 + spacing.md },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        <Ionicons
          name={isSimulating ? 'locate' : 'finger-print-outline'}
          size={14}
          color="#FFFFFF"
          style={styles.icon}
        />
        {isSimulating ? (
          <>
            <Text style={styles.text}>
              DEV: Simulating GPS ({simulatedLocation.latitude.toFixed(5)}, {simulatedLocation.longitude.toFixed(5)})
            </Text>
            <Pressable onPress={onReset} style={styles.resetButton} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </>
        ) : (
          <Text style={styles.text}>DEV: Tap & hold to place yourself</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    flexShrink: 1,
  },
  resetButton: {
    marginLeft: spacing.md,
    padding: 2,
  },
});
