// ============================================
// Budget Warning Banner — Informational only
//
// Amber banner that warns when the plan exceeds
// the time budget. NEVER removes stops.
// ============================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import type { BudgetEstimate } from '../types';
import { formatDuration } from '../planGenerator';

// ============================================
// Props
// ============================================

interface BudgetWarningBannerProps {
  estimate: BudgetEstimate;
}

// ============================================
// Component
// ============================================

function BudgetWarningBannerInner({ estimate }: BudgetWarningBannerProps) {
  if (!estimate.isOverBudget) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.banner}>
      <Ionicons name="time-outline" size={16} color={colors.banner.warningText} style={styles.icon} />
      <Text style={styles.text}>
        Your plan may run ~{formatDuration(estimate.overByMin)} over your {formatDuration(estimate.budgetMin)} budget
      </Text>
    </Animated.View>
  );
}

export const BudgetWarningBanner = memo(BudgetWarningBannerInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.banner.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.banner.warningBorder,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  icon: {
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.banner.warningText,
  },
});
