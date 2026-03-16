/**
 * ParkFilterPills — Horizontal scrollable park filter chips
 *
 * "All Parks" is always first. Tapping animates the selection indicator.
 * Uses spring animations and haptic feedback.
 */

import React, { useCallback } from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { TIMING } from '../../../constants/animations';

interface ParkFilterPillsProps {
  parks: string[];
  selectedPark: string | null;
  onSelect: (park: string | null) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PillItem: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  const bgOpacity = useSharedValue(isSelected ? 1 : 0);
  const textColorProgress = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    bgOpacity.value = withTiming(isSelected ? 1 : 0, {
      duration: TIMING.normal,
      easing: Easing.out(Easing.cubic),
    });
    textColorProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: TIMING.normal,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected, bgOpacity, textColorProgress]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: bgOpacity.value === 1
      ? colors.accent.primary
      : bgOpacity.value === 0
        ? colors.background.card
        : colors.accent.primary,
    opacity: 0.15 + bgOpacity.value * 0.85,
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[styles.pill, pillStyle]}
    >
      <Text style={[
        styles.pillText,
        isSelected && styles.pillTextSelected,
      ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

export const ParkFilterPills: React.FC<ParkFilterPillsProps> = ({
  parks,
  selectedPark,
  onSelect,
}) => {
  const handleSelect = useCallback((park: string | null) => {
    onSelect(park);
  }, [onSelect]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      <PillItem
        label="All Parks"
        isSelected={selectedPark === null}
        onPress={() => handleSelect(null)}
      />
      {parks.map(park => (
        <PillItem
          key={park}
          label={park}
          isSelected={selectedPark === park}
          onPress={() => handleSelect(park)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  pillTextSelected: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
});
