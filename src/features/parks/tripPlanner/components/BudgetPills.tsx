// ============================================
// Budget Pills — Horizontal time budget selector
// ============================================

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';

// ============================================
// Props
// ============================================

interface BudgetPillsProps {
  value: number; // minutes, 0 = all day
  onChange: (min: number) => void;
}

const OPTIONS: Array<{ label: string; min: number }> = [
  { label: '2h', min: 120 },
  { label: '3h', min: 180 },
  { label: '4h', min: 240 },
  { label: '5h', min: 300 },
  { label: 'All Day', min: 0 },
];

// ============================================
// Component
// ============================================

function BudgetPillsInner({ value, onChange }: BudgetPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.min === value;
        return (
          <Pill
            key={opt.min}
            label={opt.label}
            min={opt.min}
            isActive={isActive}
            onChange={onChange}
          />
        );
      })}
    </ScrollView>
  );
}

export const BudgetPills = memo(BudgetPillsInner);

// ============================================
// Single Pill
// ============================================

const Pill = memo(function Pill({
  label,
  min,
  isActive,
  onChange,
}: {
  label: string;
  min: number;
  isActive: boolean;
  onChange: (min: number) => void;
}) {
  const handlePress = useCallback(() => {
    haptics.tick();
    onChange(min);
  }, [min, onChange]);

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.pill, isActive && styles.pillActive]}>
        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  pillActive: {
    backgroundColor: colors.accent.primary,
  },
  pillText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
});
