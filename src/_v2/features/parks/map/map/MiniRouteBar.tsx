import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ParkPOI } from '../types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';

export const MINI_ROUTE_BAR_HEIGHT = 50;
const OFFSCREEN_Y = MINI_ROUTE_BAR_HEIGHT + 40;

interface MiniRouteBarProps {
  poi: ParkPOI | null;
  visible: boolean;
  onTap: () => void;
  onDismiss: () => void;
}

export function MiniRouteBar({ poi, visible, onTap, onDismiss }: MiniRouteBarProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(OFFSCREEN_Y);
  const currentPoi = useRef<ParkPOI | null>(null);

  // Keep the last POI name visible during slide-out
  if (poi) currentPoi.current = poi;

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: TIMING.normal,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(OFFSCREEN_Y, {
        duration: TIMING.fast,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const displayPoi = poi ?? currentPoi.current;
  if (!displayPoi) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing.md },
        animatedStyle,
      ]}
    >
      <Pressable
        style={styles.bar}
        onPress={() => {
          haptics.tap();
          onTap();
        }}
      >
        <Ionicons name="navigate" size={16} color={colors.accent.primary} style={styles.icon} />
        <Text style={styles.label} numberOfLines={1}>
          {displayPoi.name}
        </Text>
        <Pressable
          onPress={() => {
            haptics.tap();
            onDismiss();
          }}
          style={styles.closeButton}
          hitSlop={12}
        >
          <Ionicons name="close" size={16} color={colors.text.secondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  bar: {
    height: MINI_ROUTE_BAR_HEIGHT,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.closeButton,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
