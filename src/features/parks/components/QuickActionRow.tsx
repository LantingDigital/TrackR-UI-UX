import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCardPress } from '../../../hooks/useSpringPress';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';

// ============================================
// Types
// ============================================

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface QuickActionRowProps {
  onMapPress: () => void;
  onFoodPress: () => void;
  onRidesPress: () => void;
  onPassPress: () => void;
}

// ============================================
// Action definitions
// ============================================

const ACTIONS: QuickAction[] = [
  { key: 'map', label: 'Map', icon: 'map-outline', color: '#5B8DEF' },
  { key: 'food', label: 'Food', icon: 'restaurant-outline', color: '#E8734A' },
  { key: 'rides', label: 'Rides', icon: 'flash-outline', color: '#9B6DD7' },
  { key: 'pass', label: 'Pass', icon: 'ticket-outline', color: colors.accent.primary },
];

// ============================================
// ActionPill (individual pill with stagger)
// ============================================

function ActionPill({
  action,
  index,
  onPress,
}: {
  action: QuickAction;
  index: number;
  onPress: () => void;
}) {
  const { pressHandlers, animatedStyle: pressStyle } = useCardPress();

  // Staggered entry
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * TIMING.stagger,
      withSpring(1, SPRINGS.responsive),
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { translateY: (1 - entryProgress.value) * 12 },
    ],
  }));

  return (
    <Pressable onPress={onPress} {...pressHandlers} style={styles.pillPressable}>
      <Animated.View style={[styles.pill, pressStyle, entryStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: `${action.color}15` }]}>
          <Ionicons name={action.icon} size={20} color={action.color} />
        </View>
        <Text style={styles.pillLabel}>{action.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// QuickActionRow
// ============================================

export function QuickActionRow({
  onMapPress,
  onFoodPress,
  onRidesPress,
  onPassPress,
}: QuickActionRowProps) {
  const handlers = [onMapPress, onFoodPress, onRidesPress, onPassPress];

  return (
    <View style={styles.container}>
      {ACTIONS.map((action, i) => (
        <ActionPill
          key={action.key}
          action={action}
          index={i}
          onPress={handlers[i]}
        />
      ))}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  pillPressable: {
    flex: 1,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pillLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
