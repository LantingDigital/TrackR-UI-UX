/**
 * ArticleDetailScreen — Full article reading experience.
 *
 * Parallax banner hero that compresses on scroll.
 * Clean typography, generous whitespace. Premium reading feel.
 * Markdown body rendered as styled Text sections.
 * Source links at the bottom.
 */

import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeIn,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useArticleStore } from '../store/articleStore';
import { Article, ArticleSource } from '../types';
import { formatRelativeTime } from '../data/mockArticles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 260;
const PARALLAX_FACTOR = 0.4;

// ─── Simple Markdown Renderer ────────────────────────────
// Renders a subset of markdown: ## headers, **bold**, > blockquotes, - lists, paragraphs

const MarkdownBody: React.FC<{ content: string }> = React.memo(({ content }) => {
  const blocks = useMemo(() => {
    return content.split('\n\n').map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // ## Heading
      if (trimmed.startsWith('## ')) {
        return (
          <Text key={i} style={mdStyles.heading}>
            {trimmed.replace('## ', '')}
          </Text>
        );
      }

      // > Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <View key={i} style={mdStyles.blockquote}>
            <Text style={mdStyles.blockquoteText}>
              {trimmed.replace(/^> /gm, '')}
            </Text>
          </View>
        );
      }

      // List items (- item)
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(l => l.startsWith('- '));
        return (
          <View key={i} style={mdStyles.list}>
            {items.map((item, j) => (
              <View key={j} style={mdStyles.listItem}>
                <View style={mdStyles.bullet} />
                <Text style={mdStyles.body}>{renderInline(item.replace(/^- /, ''))}</Text>
              </View>
            ))}
          </View>
        );
      }

      // Regular paragraph
      return (
        <Text key={i} style={mdStyles.body}>
          {renderInline(trimmed)}
        </Text>
      );
    });
  }, [content]);

  return <View style={mdStyles.container}>{blocks}</View>;
});

/** Render inline **bold** text */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={mdStyles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

const mdStyles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heading: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.heading * typography.lineHeights.tight,
    marginTop: spacing.md,
  },
  body: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * 1.65,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.sm,
  },
  blockquoteText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * 1.65,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent.primary,
    marginTop: 9,
  },
});

// ─── Source Link ──────────────────────────────────────────

const SourceLink: React.FC<{ source: ArticleSource }> = ({ source }) => (
  <View style={sourceStyles.row}>
    <Ionicons name="link-outline" size={14} color={colors.text.meta} />
    <Text style={sourceStyles.text}>{source.name}</Text>
  </View>
);

const sourceStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
});

// ─── Main Screen ─────────────────────────────────────────

export const ArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const articleId = route.params?.articleId as string;

  const article = useArticleStore(state => state.getArticleById(articleId));
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Parallax banner
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, BANNER_HEIGHT],
          [-100 * PARALLAX_FACTOR, 0, BANNER_HEIGHT * PARALLAX_FACTOR],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.3, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Back button opacity on scroll
  const backBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, BANNER_HEIGHT - 80],
      [1, 0.7],
      Extrapolation.CLAMP,
    ),
  }));

  if (!article) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.meta} />
          <Text style={styles.errorText}>Article not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Parallax Banner */}
      <Animated.View style={[styles.bannerContainer, bannerStyle]}>
        <Image
          source={{ uri: article.bannerImageUrl }}
          style={styles.bannerImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.bannerOverlay} />
      </Animated.View>

      {/* Back Button */}
      <Animated.View style={[styles.backButton, { top: insets.top + spacing.md }, backBgStyle]}>
        <Pressable
          onPress={() => { haptics.tap(); navigation.goBack(); }}
          style={styles.backPressable}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </Pressable>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        {/* Spacer for banner */}
        <View style={styles.bannerSpacer} />

        {/* Article Content Card */}
        <Animated.View entering={FadeIn.duration(250)} style={styles.contentCard}>
          {/* Category + Read Time */}
          <View style={styles.metaRow}>
            <Text style={styles.categoryTag}>
              {article.category.toUpperCase().replace('-', ' ')}
            </Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{article.readTimeMinutes} min read</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{article.subtitle}</Text>

          {/* Author + Date */}
          <View style={styles.authorRow}>
            <Text style={styles.authorText}>{article.authorName}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.dateText}>{formatRelativeTime(article.publishedAt)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <MarkdownBody content={article.body} />

          {/* Sources */}
          {article.sources.length > 0 && (
            <View style={styles.sourcesSection}>
              <View style={styles.divider} />
              <Text style={styles.sourcesTitle}>Sources</Text>
              {article.sources.map((source, i) => (
                <SourceLink key={i} source={source} />
              ))}
            </View>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {article.tags.map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Banner
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    zIndex: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerSpacer: {
    height: BANNER_HEIGHT - 30, // overlap content card slightly over banner
  },

  // Back Button
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  backPressable: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },

  // Scroll
  scrollContent: {
    minHeight: '100%',
  },

  // Content Card
  contentCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    minHeight: 500,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryTag: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    letterSpacing: 0.8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.meta,
    marginHorizontal: spacing.sm,
  },
  metaText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },

  // Title
  title: {
    fontSize: typography.sizes.heroLarge,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.heroLarge * typography.lineHeights.tight,
    letterSpacing: -0.5,
    marginBottom: spacing.base,
  },

  // Subtitle
  subtitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.subtitle * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  authorText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  dateText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.lg,
  },

  // Sources
  sourcesSection: {
    marginTop: spacing.xl,
  },
  sourcesTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  tagPill: {
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  tagText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  errorButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
  },
  errorButtonText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
