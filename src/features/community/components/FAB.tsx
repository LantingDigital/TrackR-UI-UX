/**
 * FAB — Floating Action Button for post creation
 *
 * Circular button in bottom-right corner of the feed.
 * Spring press feedback, accent-colored.
 */

import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  const insets = useSafeAreaInsets();
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.9 });

  return (
    <Pressable
      {...pressHandlers}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[styles.fab, { bottom: insets.bottom + 80 }]}
    >
      <Animated.View style={[styles.fabInner, animatedStyle]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 20,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
