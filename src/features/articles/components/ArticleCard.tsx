/**
 * ArticleCard — Premium card for articles in the home feed.
 *
 * Golden ratio banner image, category tag, title, subtitle,
 * read time + publish date footer. Spring press feedback.
 * Matches the existing NewsCard aesthetic.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
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
import { Article, ArticleCategory } from '../types';
import { formatRelativeTime } from '../data/mockArticles';

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  news: 'NEWS',
  'news-digest': 'WEEKLY DIGEST',
  'ride-review': 'RIDE REVIEW',
  'park-guide': 'PARK GUIDE',
  industry: 'INDUSTRY',
  seasonal: 'SEASONAL',
  opinion: 'OPINION',
  culture: 'CULTURE',
  history: 'HISTORY',
  guide: 'GUIDE',
};

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = React.memo(({ article, onPress }) => {
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  const [imageError, setImageError] = useState(false);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  const handlePressIn = useCallback(() => {
    scaleValue.value = withSpring(0.96, SPRINGS.responsive);
    opacityValue.value = withTiming(0.9, { duration: TIMING.instant });
  }, [scaleValue, opacityValue]);

  const handlePressOut = useCallback(() => {
    scaleValue.value = withSpring(1, SPRINGS.responsive);
    opacityValue.value = withTiming(1, { duration: TIMING.instant });
  }, [scaleValue, opacityValue]);

  const handlePress = useCallback(() => {
    haptics.tap();
    onPress(article);
  }, [article, onPress]);

  return (
    <Animated.View style={cardAnimStyle}>
      <Pressable
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Banner Image */}
        <View style={styles.imageContainer}>
          {imageError ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="newspaper-outline" size={36} color={colors.text.meta} />
            </View>
          ) : (
            <Image
              source={typeof article.bannerImage === 'number' ? article.bannerImage : { uri: article.bannerImage }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
            />
          )}
          {/* Category pill overlay */}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>
              {CATEGORY_LABELS[article.category]}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{article.subtitle}</Text>
          <View style={styles.footer}>
            <Text style={styles.readTime}>{article.readTimeMinutes} min read</Text>
            <View style={styles.footerDot} />
            <Text style={styles.timestamp}>{formatRelativeTime(article.publishedAt)}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.618, // golden ratio
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  categoryText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    letterSpacing: 0.8,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.title * typography.lineHeights.tight,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.base,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.meta,
    marginHorizontal: spacing.sm,
  },
  timestamp: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});
