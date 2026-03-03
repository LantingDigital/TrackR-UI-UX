import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { MOCK_TOP_LISTS, TopListItem } from '../data/mockCommunityData';

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

const RankingCard = ({ item }: { item: TopListItem }) => {
  const press = useCardPress();
  return (
    <Pressable onPress={() => haptics.tap()} {...press.pressHandlers}>
      <Animated.View style={[styles.card, press.animatedStyle]}>
        <View style={styles.cardTopRow}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.previewList}>
          {item.items.map((name, i) => (
            <View key={name} style={[styles.previewItem, i > 0 && styles.previewItemSpacing]}>
              <Text style={styles.previewRank}>{i + 1}</Text>
              <Text style={styles.previewName}>{name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.authorLine}>Curated by {item.author}</Text>
      </Animated.View>
    </Pressable>
  );
};

interface CommunityRankingsTabProps {
  topInset?: number;
}

export const CommunityRankingsTab = ({ topInset = 0 }: CommunityRankingsTabProps) => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {MOCK_TOP_LISTS.map((list, index) => (
        <StaggeredItem key={list.id} index={index}>
          <RankingCard item={list} />
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
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginLeft: spacing.base,
  },
  categoryPill: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginLeft: spacing.md,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  previewList: {
    marginTop: spacing.base,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewItemSpacing: {
    marginTop: spacing.sm,
  },
  previewRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    width: 24,
  },
  previewName: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  authorLine: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: spacing.base,
  },
});
