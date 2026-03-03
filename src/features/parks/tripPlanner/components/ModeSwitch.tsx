// ============================================
// Mode Switch — Concierge / Speed Run toggle
// ============================================

import React, { memo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';
import type { TripMode } from '../types';

// ============================================
// Props
// ============================================

interface ModeSwitchProps {
  mode: TripMode;
  onToggle: () => void;
}

// ============================================
// Component
// ============================================

function ModeSwitchInner({ mode, onToggle }: ModeSwitchProps) {
  const activeIndex = mode === 'concierge' ? 0 : 1;
  const segmentWidth = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * segmentWidth.value, SPRINGS.stiff);
  }, [activeIndex]);

  const handleToggle = useCallback(() => {
    haptics.select();
    onToggle();
  }, [onToggle]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const padding = spacing.xs * 2;
    const sw = (containerWidth - padding) / 2;
    segmentWidth.value = sw;
    // Set position immediately on first layout (no spring)
    translateX.value = activeIndex * sw;
  }, [activeIndex]);

  const highlightStyle = useAnimatedStyle(() => ({
    width: segmentWidth.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View style={[styles.highlight, highlightStyle]} />

      <Pressable style={styles.segment} onPress={activeIndex === 1 ? handleToggle : undefined}>
        <Ionicons
          name="compass-outline"
          size={14}
          color={activeIndex === 0 ? colors.text.primary : colors.text.meta}
          style={styles.icon}
        />
        <Text style={[styles.segmentText, activeIndex === 0 && styles.segmentTextActive]}>
          Concierge
        </Text>
      </Pressable>

      <Pressable style={styles.segment} onPress={activeIndex === 0 ? handleToggle : undefined}>
        <Ionicons
          name="flash-outline"
          size={14}
          color={activeIndex === 1 ? colors.text.primary : colors.text.meta}
          style={styles.icon}
        />
        <Text style={[styles.segmentText, activeIndex === 1 && styles.segmentTextActive]}>
          Speed Run
        </Text>
      </Pressable>
    </View>
  );
}

export const ModeSwitch = memo(ModeSwitchInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  highlight: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    height: '100%',
    backgroundColor: colors.background.card,
    borderRadius: radius.pill,
    ...shadows.small,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  icon: {
    marginRight: spacing.xs,
  },
  segmentText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  segmentTextActive: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
