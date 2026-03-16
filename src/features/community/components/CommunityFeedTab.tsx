import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { SPRINGS } from '../../../constants/animations';
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
}

const keyExtractor = (item: FeedItem) => item.id;

export const CommunityFeedTab = ({ topInset = 0, onShowCompose, onCoasterTap }: CommunityFeedTabProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { feed } = useCommunityStore();

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
    () => [styles.content, { paddingTop: topInset, paddingBottom: insets.bottom + spacing.xxxl }],
    [topInset, insets.bottom],
  );

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
      <FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={7}
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
});
