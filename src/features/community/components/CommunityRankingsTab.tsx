/**
 * CommunityRankingsTab — Community-aggregated coaster rankings
 *
 * 6 sections: Overall, Airtime, Intensity, Smoothness, Theming, Pacing.
 * Each section shows top 10 entries with criterion-colored score bars.
 * Stagger entrance per section.
 */

import React, { useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
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

export const CommunityRankingsTab = ({ topInset = 0 }: CommunityRankingsTabProps) => {
  const insets = useSafeAreaInsets();
  const { categories } = useRankingsStore();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {categories.map((category, index) => (
        <StaggeredItem key={category.id} index={index}>
          <RankingSection category={category} />
        </StaggeredItem>
      ))}
    </ScrollView>
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
