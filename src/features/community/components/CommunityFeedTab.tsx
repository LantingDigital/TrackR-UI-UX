import React, { useEffect } from 'react';
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
import { MOCK_FEED } from '../data/mockCommunityData';

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
}

export const CommunityFeedTab = ({ topInset = 0 }: CommunityFeedTabProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <ScrollView
      style={styles.container}
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
          />
        </View>
      </StaggeredItem>

      {MOCK_FEED.map((item, index) => (
        <StaggeredItem key={item.id} index={index + 1}>
          <View style={styles.feedItem}>
            <FeedPost item={item} />
          </View>
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
  },
  gamesStripContainer: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  feedItem: {
    marginTop: spacing.lg,
  },
});
