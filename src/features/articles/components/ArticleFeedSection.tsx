/**
 * ArticleFeedSection — "Latest" horizontal scroll strip for the home feed.
 *
 * Shows latest published articles as compact cards in a horizontal ScrollView.
 * Shadow-safe: overflow visible + padding for shadow room.
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useArticleStore } from '../store/articleStore';
import { Article } from '../types';
import { formatRelativeTime } from '../data/mockArticles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ─── Compact Article Card (for horizontal strip) ────────

const CompactArticleCard: React.FC<{
  article: Article;
  onPress: (article: Article) => void;
}> = React.memo(({ article, onPress }) => {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, SPRINGS.responsive);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRINGS.responsive);
  }, [scale]);

  return (
    <Animated.View style={[compactStyles.wrapper, cardStyle]}>
      <Pressable
        style={compactStyles.card}
        onPress={() => { haptics.tap(); onPress(article); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image
          source={{ uri: article.bannerImageUrl }}
          style={compactStyles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={compactStyles.content}>
          <Text style={compactStyles.category}>
            {article.category.toUpperCase().replace('-', ' ')}
          </Text>
          <Text style={compactStyles.title} numberOfLines={2}>{article.title}</Text>
          <View style={compactStyles.footer}>
            <Text style={compactStyles.meta}>
              {article.readTimeMinutes} min
            </Text>
            <View style={compactStyles.dot} />
            <Text style={compactStyles.meta}>
              {formatRelativeTime(article.publishedAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const compactStyles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.small,
  },
  image: {
    width: '100%',
    aspectRatio: 2.2,
  },
  content: {
    padding: spacing.base,
  },
  category: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: typography.sizes.label * typography.lineHeights.tight,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.meta,
    marginHorizontal: spacing.xs,
  },
});

// ─── Section Component ──────────────────────────────────

interface ArticleFeedSectionProps {
  onArticlePress: (article: Article) => void;
  onSeeAllPress?: () => void;
}

export const ArticleFeedSection: React.FC<ArticleFeedSectionProps> = ({
  onArticlePress,
  onSeeAllPress,
}) => {
  const articles = useArticleStore(state => state.articles);
  const fetchArticles = useArticleStore(state => state.fetchArticles);

  useEffect(() => {
    if (articles.length === 0) {
      fetchArticles();
    }
  }, [articles.length, fetchArticles]);

  if (articles.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(100)} style={sectionStyles.container}>
      {/* Section Header */}
      <View style={sectionStyles.header}>
        <View style={sectionStyles.headerLeft}>
          <Ionicons name="newspaper-outline" size={18} color={colors.accent.primary} />
          <Text style={sectionStyles.headerTitle}>Latest</Text>
        </View>
        {onSeeAllPress && (
          <Pressable onPress={() => { haptics.tap(); onSeeAllPress(); }}>
            <Text style={sectionStyles.seeAll}>See All</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal scroll of compact cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sectionStyles.scrollView}
        contentContainerStyle={sectionStyles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.base}
        snapToAlignment="start"
      >
        {articles.map(article => (
          <CompactArticleCard
            key={article.id}
            article={article}
            onPress={onArticlePress}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.accent.primary,
  },
  scrollView: {
    overflow: 'visible',
    marginVertical: -spacing.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.base,
  },
});
