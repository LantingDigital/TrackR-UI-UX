import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';

// ============================================
// Constants
// ============================================

const OPTIONS = [
  { label: '2 hrs', value: 120 },
  { label: '3 hrs', value: 180 },
  { label: '4 hrs', value: 240 },
  { label: 'All Day', value: 0 },
] as const;

// ============================================
// Props
// ============================================

interface BudgetBarProps {
  value: number;
  onChange: (min: number) => void;
}

// ============================================
// Component
// ============================================

function BudgetBarInner({ value, onChange }: BudgetBarProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt, idx) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.pill,
              active && styles.pillActive,
              idx < OPTIONS.length - 1 && { marginRight: spacing.sm },
            ]}
            onPress={() => {
              haptics.tick();
              onChange(opt.value);
            }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const BudgetBar = memo(BudgetBarInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  pillActive: {
    backgroundColor: colors.accent.primary,
  },
  pillText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
