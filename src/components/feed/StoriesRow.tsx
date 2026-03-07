/**
 * StoriesRow - Instagram-style circular avatar stories at the top of the feed.
 * Horizontal scroll with spring press feedback on each avatar.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { haptics } from '../../services/haptics';
import { SPRINGS, TIMING } from '../../constants/animations';
import { StoryItem, MOCK_STORIES } from '../../data/mockFeed';

// ── Individual Story Avatar ──

interface StoryAvatarProps {
  item: StoryItem;
  index: number;
  onPress: (item: StoryItem) => void;
}

const StoryAvatar = React.memo<StoryAvatarProps>(({ item, index, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.92, opacity: 0.9 });
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * 60,
      withSpring(1, SPRINGS.bouncy)
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { scale: 0.6 + entryProgress.value * 0.4 },
      { translateY: (1 - entryProgress.value) * 12 },
    ],
  }));

  return (
    <Animated.View style={[styles.storyItem, entryStyle, animatedStyle]}>
      <Pressable
        onPress={() => { haptics.tap(); onPress(item); }}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
      >
        <View style={[
          styles.avatarRing,
          item.hasNewStory ? styles.avatarRingActive : styles.avatarRingInactive,
        ]}>
          <View style={styles.avatarInner}>
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          </View>
          {item.isOwn && (
            <View style={styles.addBadge}>
              <Ionicons name="add" size={12} color={colors.text.inverse} />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>{item.username}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ── Main Component ──

interface StoriesRowProps {
  onStoryPress?: (item: StoryItem) => void;
}

export const StoriesRow = React.memo<StoriesRowProps>(({ onStoryPress }) => {
  const handlePress = (item: StoryItem) => {
    onStoryPress?.(item);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_STORIES.map((story, index) => (
          <StoryAvatar
            key={story.id}
            item={story}
            index={index}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
});

// ── Styles ──

const AVATAR_SIZE = 64;
const RING_SIZE = AVATAR_SIZE + 6;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scrollView: {
    marginHorizontal: -spacing.lg,
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.base,
  },
  storyItem: {
    alignItems: 'center',
    width: RING_SIZE + 4,
  },
  avatarRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarRingActive: {
    borderWidth: 2.5,
    borderColor: colors.accent.primary,
  },
  avatarRingInactive: {
    borderWidth: 2.5,
    borderColor: colors.border.subtle,
  },
  avatarInner: {
    width: AVATAR_SIZE - 2,
    height: AVATAR_SIZE - 2,
    borderRadius: (AVATAR_SIZE - 2) / 2,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  storyUsername: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: RING_SIZE,
  },
});
