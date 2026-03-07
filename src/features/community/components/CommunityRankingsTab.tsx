/**
 * CommunityRankingsTab — Community-aggregated coaster rankings
 *
 * 6 sections: Overall, Airtime, Intensity, Smoothness, Theming, Pacing.
 * Each section shows top 10 entries with criterion-colored score bars.
 * Stagger entrance per section.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { spacing } from '../../../theme/spacing';
import { SPRINGS } from '../../../constants/animations';
import { useRankingsStore } from '../stores/rankingsStore';
import { RankingSection } from './RankingSection';
import type { RankingCategory } from '../types/community';

// ─── Stagger helper ─────────────────────────────────────────

function StaggeredItem({ index, children }: { index: number; children: React.ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(index * 80, withSpring(1, SPRINGS.responsive));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Main Component ─────────────────────────────────────────

interface CommunityRankingsTabProps {
  topInset?: number;
}

const keyExtractor = (item: RankingCategory) => item.id;

export const CommunityRankingsTab = ({ topInset = 0 }: CommunityRankingsTabProps) => {
  const insets = useSafeAreaInsets();
  const { categories } = useRankingsStore();

  const contentContainerStyle = useMemo(
    () => [styles.content, { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }],
    [topInset, insets.bottom],
  );

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<RankingCategory>) => (
    <StaggeredItem index={index}>
      <RankingSection category={item} />
    </StaggeredItem>
  ), []);

  return (
    <FlatList
      data={categories}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.container}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
});
