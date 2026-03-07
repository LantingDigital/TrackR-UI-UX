/**
 * FriendActivitySection - Shows recent friend activity in a compact card list.
 * "so-and-so rode X" style snippets with avatars and ride info.
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { SPRINGS } from '../../constants/animations';
import { FriendActivityItem, MOCK_FRIEND_ACTIVITY } from '../../data/mockFeed';

// ── Individual Activity Row ──

interface ActivityRowProps {
  item: FriendActivityItem;
  index: number;
  isLast: boolean;
  onPress: (item: FriendActivityItem) => void;
}

const ActivityRow = React.memo<ActivityRowProps>(({ item, index, isLast, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * 80,
      withSpring(1, SPRINGS.responsive)
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [{ translateY: (1 - entryProgress.value) * 16 }],
  }));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={11}
        color={i < rating ? '#F9A825' : colors.text.meta}
      />
    ));
  };

  return (
    <Animated.View style={[entryStyle, animatedStyle]}>
      <Pressable
        onPress={() => { haptics.tap(); onPress(item); }}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={[styles.activityRow, !isLast && styles.activityRowBorder]}
      >
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} cachePolicy="memory-disk" recyclingKey={`avatar-${item.id}`} />
        <View style={styles.activityContent}>
          <Text style={styles.activityText} numberOfLines={2}>
            <Text style={styles.username}>{item.username}</Text>
            {' '}{item.action}{' '}
            <Text style={styles.rideName}>{item.rideName}</Text>
          </Text>
          <View style={styles.activityMeta}>
            <Text style={styles.parkName}>{item.parkName}</Text>
            <Text style={styles.dot}> · </Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          {item.rating && (
            <View style={styles.starsRow}>{renderStars(item.rating)}</View>
          )}
        </View>
        <Image source={{ uri: item.rideImageUrl }} style={styles.rideThumb} cachePolicy="memory-disk" recyclingKey={`ride-${item.id}`} />
      </Pressable>
    </Animated.View>
  );
});

// ── Main Component ──

interface FriendActivitySectionProps {
  onActivityPress?: (item: FriendActivityItem) => void;
  onSeeAll?: () => void;
}

export const FriendActivitySection = React.memo<FriendActivitySectionProps>(({ onActivityPress, onSeeAll }) => {
  const handlePress = useCallback((item: FriendActivityItem) => {
    onActivityPress?.(item);
  }, [onActivityPress]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Friend Activity</Text>
        <Pressable onPress={() => { haptics.tap(); onSeeAll?.(); }} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {MOCK_FRIEND_ACTIVITY.map((activity, index) => (
          <ActivityRow
            key={activity.id}
            item={activity}
            index={index}
            isLast={index === MOCK_FRIEND_ACTIVITY.length - 1}
            onPress={handlePress}
          />
        ))}
      </View>
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.card,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.imagePlaceholder,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 19,
  },
  username: {
    fontWeight: '700',
  },
  rideName: {
    fontWeight: '600',
    color: colors.accent.primary,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  parkName: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
  },
  dot: {
    fontSize: 12,
    color: colors.text.meta,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 3,
  },
  rideThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.background.imagePlaceholder,
  },
});
