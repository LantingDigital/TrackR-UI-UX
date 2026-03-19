/**
 * ArticlesListScreen — Temporary full-screen list of all articles.
 *
 * Scrollable list using ArticleCard components with staggered entrance.
 * Tapping an article navigates to ArticleDetail. FogHeader on top.
 *
 * This screen is a temporary bridge so articles can be reviewed in-app
 * before the home feed is wired to the backend. The FAB that opens
 * this screen will be removed when articles integrate into the dynamic
 * home feed.
 */

import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { FogHeader } from '../../../components/FogHeader';
import { useArticleStore } from '../store/articleStore';
import { ArticleCard } from '../components/ArticleCard';
import type { Article } from '../types';

const HEADER_ROW_HEIGHT = 52;

export const ArticlesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;
  const backPress = useSpringPress();

  const { articles, fetchArticles, isLoading } = useArticleStore();

  useEffect(() => {
    if (articles.length === 0) {
      fetchArticles();
    }
  }, []);

  const handleArticlePress = useCallback((article: Article) => {
    navigation.navigate('ArticleDetail', { articleId: article.id });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => { haptics.tap(); navigation.goBack(); }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backBtn, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>ARTICLES</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Article list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerTotalHeight + spacing.base,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
      >
        {articles.map((article, index) => (
          <Animated.View
            key={article.id}
            entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 60)}
            style={styles.cardWrapper}
          >
            <ArticleCard article={article} onPress={handleArticlePress} />
          </Animated.View>
        ))}

        {articles.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color={colors.text.meta} />
            <Text style={styles.emptyText}>No articles yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_ROW_HEIGHT,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    letterSpacing: 4,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.base,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
