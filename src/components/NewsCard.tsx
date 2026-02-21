import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../hooks/useSpringPress';

interface NewsCardProps {
  source: string;
  title: string;
  subtitle: string;
  timestamp: string;
  imageUrl: ImageSourcePropType;
  isUnread?: boolean;
  isBookmarked?: boolean;
  onPress?: () => void;
  onBookmarkPress?: () => void;
}

export const NewsCard = React.memo<NewsCardProps>(({
  source,
  title,
  subtitle,
  timestamp,
  imageUrl,
  isUnread = false,
  isBookmarked = false,
  onPress,
  onBookmarkPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.96,
    opacity: 0.9,
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
      >
        <View style={styles.imageContainer}>
          <Image source={imageUrl} style={styles.image} resizeMode="cover" />
          {isUnread && <View style={styles.unreadDot} />}
          <Pressable
            style={styles.bookmarkButton}
            onPress={(e) => {
              e.stopPropagation();
              onBookmarkPress?.();
            }}
            hitSlop={8}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.source}>{source}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.618,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CF6769',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 21,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999999',
  },
});
