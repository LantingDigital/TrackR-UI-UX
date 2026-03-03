import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
} from 'react-native-draggable-flatlist';

import { spacing } from '../../../../theme/spacing';
import { haptics } from '../../../../services/haptics';
import { TimelineCard } from './TimelineCard';
import type { TripStop } from '../types';

// ============================================
// Props
// ============================================

interface DraggableTimelineProps {
  stops: TripStop[];
  onReorder: (newOrder: string[]) => void;
  onWarning?: (message: string) => void;
}

// ============================================
// Component
// ============================================

export function DraggableTimeline({ stops, onReorder, onWarning }: DraggableTimelineProps) {
  const totalStops = stops.length;

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<TripStop>) => {
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <TimelineCard
            stop={item}
            index={index}
            total={totalStops}
            mode="preview"
            isActive={isActive}
          />
        </ScaleDecorator>
      );
    },
    [totalStops],
  );

  const handleDragBegin = useCallback(() => {
    haptics.select();
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: DragEndParams<TripStop>) => {
      haptics.tap();
      const newOrder = data.map((stop) => stop.id);
      onReorder(newOrder);
    },
    [onReorder],
  );

  const keyExtractor = useCallback((item: TripStop) => item.id, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <DraggableFlatList
        data={stops}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        activationDistance={10}
        contentContainerStyle={styles.contentContainer}
      />
    </GestureHandlerRootView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
