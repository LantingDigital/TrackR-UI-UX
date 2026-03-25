import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { SPRINGS } from '../../../constants/animations';
import { EmptyState } from '../../../components/EmptyState';
import { GamesStrip } from './GamesStrip';
import { FeedPost } from './FeedPost';
import { FAB } from './FAB';
import { useCommunityStore, toggleLike } from '../stores/communityStore';
import type { FeedItem } from '../types/community';

const MAX_STAGGER = 6;

function StaggeredItem({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = index < MAX_STAGGER ? index * 60 : 0;
    progress.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

interface CommunityFeedTabProps {
  topInset?: number;
  onShowCompose?: () => void;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
  scrollY?: SharedValue<number>;
}

const keyExtractor = (item: FeedItem) => item.id;

export const CommunityFeedTab = ({ topInset = 0, onShowCompose, onCoasterTap, scrollY }: CommunityFeedTabProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { feed } = useCommunityStore();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y;
    },
  });

  const handleLike = useCallback((itemId: string) => {
    toggleLike(itemId);
  }, []);

  const handleCommentTap = useCallback((item: FeedItem) => {
    navigation.navigate('PostDetail', { itemId: item.id });
  }, [navigation]);

  const handleAuthorTap = useCallback((authorId: string) => {
    navigation.navigate('ProfileView', { userId: authorId });
  }, [navigation]);

  const handlePlayCoastle = useCallback(() => navigation.navigate('Coastle'), [navigation]);
  const handlePlaySpeedSorter = useCallback(() => navigation.navigate('SpeedSorter'), [navigation]);
  const handlePlayBlindRanking = useCallback(() => navigation.navigate('BlindRanking'), [navigation]);
  const handlePlayTrivia = useCallback(() => navigation.navigate('Trivia'), [navigation]);

  const listHeader = useMemo(() => (
    <StaggeredItem index={0}>
      <Text style={styles.gamesSectionLabel}>GAMES</Text>
      <View style={styles.gamesStripContainer}>
        <GamesStrip
          onPlayCoastle={handlePlayCoastle}
          onPlaySpeedSorter={handlePlaySpeedSorter}
          onPlayBlindRanking={handlePlayBlindRanking}
          onPlayTrivia={handlePlayTrivia}
        />
      </View>
    </StaggeredItem>
  ), [handlePlayCoastle, handlePlaySpeedSorter, handlePlayBlindRanking, handlePlayTrivia]);

  const contentContainerStyle = useMemo(
    () => [
      styles.content,
      { paddingTop: topInset, paddingBottom: insets.bottom + spacing.xxxl },
      feed.length === 0 ? styles.emptyContentContainer : undefined,
    ],
    [topInset, insets.bottom, feed.length],
  );

  const listEmpty = useMemo(() => (
    <EmptyState
      icon="chatbubbles-outline"
      title="No posts yet"
      subtitle="Share a ride review, trip report, or your top coaster list with the community"
      ctaLabel="Create a Post"
      ctaIcon="create-outline"
      onCtaPress={onShowCompose}
      fillParent
    />
  ), [onShowCompose]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<FeedItem>) => (
    <StaggeredItem index={index + 1}>
      <View style={styles.feedItem}>
        <FeedPost
          item={item}
          onLike={handleLike}
          onCommentTap={handleCommentTap}
          onAuthorTap={handleAuthorTap}
          onCoasterTap={onCoasterTap}
        />
      </View>
    </StaggeredItem>
  ), [handleLike, handleCommentTap, handleAuthorTap, onCoasterTap]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={7}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />

      {/* Floating Action Button */}
      {onShowCompose && <FAB onPress={onShowCompose} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  gamesSectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  gamesStripContainer: {
    marginHorizontal: -spacing.lg,
  },
  feedItem: {
    marginTop: spacing.lg,
  },

  // Empty state
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    textAlign: 'center' as const,
    paddingHorizontal: spacing.xxxl,
  },
});
