import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { useSpringPress } from '../../../../hooks/useSpringPress';
import { haptics } from '../../../../services/haptics';
import { BudgetBar } from './BudgetBar';
import { DraggableTimeline } from './DraggableTimeline';
import { ModeSwitch } from './ModeSwitch';
import { ReorderWarning } from './ReorderWarning';
import type { TripStop, TripMode } from '../types';

// ============================================
// Props
// ============================================

interface PlanPreviewProps {
  stops: TripStop[];
  timeBudgetMin: number;
  onBudgetChange: (min: number) => void;
  onReorder: (newOrder: string[]) => void;
  onStart: () => void;
  onEditStops: () => void;
  totalMin: number;
  budgetWarning?: string | null;
  mode: TripMode;
  onModeToggle: () => void;
}

// ============================================
// Helpers
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ============================================
// Component
// ============================================

export function PlanPreview({
  stops,
  timeBudgetMin,
  onBudgetChange,
  onReorder,
  onStart,
  onEditStops,
  totalMin,
  budgetWarning,
  mode,
  onModeToggle,
}: PlanPreviewProps) {
  const { pressHandlers, animatedStyle } = useSpringPress();

  const summaryText = useMemo(
    () => `${stops.length} stops \u00B7 ~${formatDuration(totalMin)}`,
    [stops.length, totalMin],
  );

  const handleStart = () => {
    haptics.success();
    onStart();
  };

  return (
    <View style={styles.container}>
      {/* Budget picker */}
      <BudgetBar value={timeBudgetMin} onChange={onBudgetChange} />

      {/* Mode switch */}
      <View style={styles.modeSwitchRow}>
        <ModeSwitch mode={mode} onToggle={onModeToggle} />
      </View>

      {/* Summary line */}
      <Text style={styles.summary}>{summaryText}</Text>

      {/* Budget warning banner */}
      {budgetWarning != null && budgetWarning.length > 0 && (
        <ReorderWarning message={budgetWarning} visible />
      )}

      {/* Draggable timeline */}
      <View style={styles.timelineContainer}>
        <DraggableTimeline stops={stops} onReorder={onReorder} />
      </View>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={handleStart} {...pressHandlers} style={styles.startPressable}>
          <Animated.View style={[styles.startButton, animatedStyle]}>
            <Text style={styles.startButtonText}>Start Trip</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeSwitchRow: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
  },
  summary: {
    textAlign: 'center',
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    paddingVertical: spacing.md,
  },
  timelineContainer: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  startPressable: {
    width: '100%',
  },
  startButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
