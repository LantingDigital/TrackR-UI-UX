import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
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
}

export const CommunityFeedTab = ({ topInset = 0, onShowCompose }: CommunityFeedTabProps) => {
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StaggeredItem index={0}>
          <View style={styles.gamesStripContainer}>
            <GamesStrip
              onPlayCoastle={() => navigation.navigate('Coastle')}
              onPlaySpeedSorter={() => navigation.navigate('SpeedSorter')}
              onPlayBlindRanking={() => navigation.navigate('BlindRanking')}
              onPlayTrivia={() => navigation.navigate('Trivia')}
            />
          </View>
        </StaggeredItem>

        {feed.map((item, index) => (
          <StaggeredItem key={item.id} index={index + 1}>
            <View style={styles.feedItem}>
              <FeedPost
                item={item}
                onLike={handleLike}
                onCommentTap={handleCommentTap}
                onAuthorTap={handleAuthorTap}
              />
            </View>
          </StaggeredItem>
        ))}
      </ScrollView>

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
  gamesStripContainer: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  feedItem: {
    marginTop: spacing.lg,
  },
});
