/**
 * DifficultySelector — Segmented control for Easy/Hard difficulty
 *
 * Used in Coastle and Parkle game settings.
 * Animated pill highlight slides between segments.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';

interface DifficultySelectorProps {
  value: 'easy' | 'hard';
  onChange: (value: 'easy' | 'hard') => void;
  accentColor?: string;
  easyLabel?: string;
  hardLabel?: string;
  easyDescription?: string;
  hardDescription?: string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  accentColor = colors.accent.primary,
  easyLabel = 'Easy',
  hardLabel = 'Hard',
  easyDescription = 'Well-known picks',
  hardDescription = 'Full database',
}) => {
  const pillX = useSharedValue(value === 'easy' ? 0 : 1);

  const handleSelect = useCallback((newValue: 'easy' | 'hard') => {
    if (newValue === value) return;
    haptics.tap();
    pillX.value = withTiming(newValue === 'easy' ? 0 : 1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    onChange(newValue);
  }, [value, onChange]);

  const pillStyle = useAnimatedStyle(() => ({
    left: `${pillX.value * 50}%` as any,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Ionicons name="speedometer-outline" size={18} color={colors.text.secondary} />
        <Text style={styles.label}>Difficulty</Text>
      </View>

      <View style={styles.segmentedControl}>
        {/* Animated pill background */}
        <Animated.View style={[styles.pill, { backgroundColor: accentColor }, pillStyle]} />

        {/* Easy segment */}
        <Pressable style={styles.segment} onPress={() => handleSelect('easy')}>
          <Text style={[
            styles.segmentText,
            value === 'easy' && styles.segmentTextActive,
          ]}>
            {easyLabel}
          </Text>
        </Pressable>

        {/* Hard segment */}
        <Pressable style={styles.segment} onPress={() => handleSelect('hard')}>
          <Text style={[
            styles.segmentText,
            value === 'hard' && styles.segmentTextActive,
          ]}>
            {hardLabel}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.description}>
        {value === 'easy' ? easyDescription : hardDescription}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    height: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '48%',
    marginHorizontal: '1%',
    borderRadius: radius.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.text.inverse,
  },
  description: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
    marginLeft: 30, // align with label text (icon width + gap)
  },
});
