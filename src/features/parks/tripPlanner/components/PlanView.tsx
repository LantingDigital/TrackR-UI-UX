// ============================================
// Plan View — Phase 2
//
// Budget pills + mode switch + draggable stop
// cards + budget warning banner + "Start Trip".
// ============================================

import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { DELAYS } from '../../../../constants/animations';
import { haptics } from '../../../../services/haptics';

import { BudgetPills } from './BudgetPills';
import { BudgetWarningBanner } from './BudgetWarningBanner';
import { ModeSwitch } from './ModeSwitch';
import { PlanStopCard } from './PlanStopCard';
import { ActionButton } from './ActionButton';
import { estimateTotalMin, formatDuration } from '../planGenerator';
import type { TripStop, TripMode, BudgetEstimate } from '../types';

// ============================================
// Props
// ============================================

interface PlanViewProps {
  stops: TripStop[];
  timeBudgetMin: number;
  estimate: BudgetEstimate;
  mode: TripMode;
  onBudgetChange: (min: number) => void;
  onModeToggle: () => void;
  onReorder: (newOrder: string[]) => void;
  onRemoveStop: (stopId: string) => void;
  onStart: () => void;
}

// ============================================
// Component
// ============================================

function PlanViewInner({
  stops,
  timeBudgetMin,
  estimate,
  mode,
  onBudgetChange,
  onModeToggle,
  onReorder,
  onRemoveStop,
  onStart,
}: PlanViewProps) {
  const totalMin = useMemo(() => estimateTotalMin(stops), [stops]);

  const summaryText = useMemo(
    () => `${stops.length} stop${stops.length !== 1 ? 's' : ''} \u00B7 ~${formatDuration(totalMin)}`,
    [stops.length, totalMin],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: TripStop[] }) => {
      haptics.tick();
      onReorder(data.map((s) => s.id));
    },
    [onReorder],
  );

  const handleStart = useCallback(() => {
    haptics.success();
    onStart();
  }, [onStart]);

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<TripStop>) => {
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <PlanStopCard
            stop={item}
            index={index}
            drag={drag}
            isActive={isActive}
            onRemove={onRemoveStop}
          />
        </ScaleDecorator>
      );
    },
    [onRemoveStop],
  );

  const keyExtractor = useCallback((item: TripStop) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <Text style={styles.title}>Your Plan</Text>
      </Animated.View>

      {/* Budget pills */}
      <Animated.View entering={FadeInUp.delay(DELAYS.cascade).duration(200)}>
        <BudgetPills value={timeBudgetMin} onChange={onBudgetChange} />
      </Animated.View>

      {/* Mode switch */}
      <Animated.View entering={FadeInUp.delay(DELAYS.cascade * 2).duration(200)} style={styles.modeSwitchRow}>
        <ModeSwitch mode={mode} onToggle={onModeToggle} />
      </Animated.View>

      {/* Budget warning */}
      <BudgetWarningBanner estimate={estimate} />

      {/* Summary */}
      <Text style={styles.summary}>{summaryText}</Text>

      {/* Draggable stop list */}
      <View style={styles.listContainer}>
        <DraggableFlatList
          data={stops}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onDragEnd={handleDragEnd}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ActionButton
          label="Start Trip"
          onPress={handleStart}
          disabled={stops.length === 0}
        />
      </View>
    </View>
  );
}

export const PlanView = memo(PlanViewInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modeSwitchRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  summary: {
    textAlign: 'center',
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    paddingVertical: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
});
