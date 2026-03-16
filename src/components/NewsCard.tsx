import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SPRINGS, TIMING } from '../constants/animations';
import { colors } from '../theme/colors';
import { haptics } from '../services/haptics';

interface NewsCardProps {
  source: string;
  title: string;
  subtitle: string;
  timestamp: string;
  imageUrl: ImageSource;
  isUnread?: boolean;
  isBookmarked?: boolean;
  isActionSheetOpen?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
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
  isActionSheetOpen = false,
  onPress,
  onLongPress,
  onBookmarkPress,
}) => {
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  const [imageError, setImageError] = useState(false);
  const handleImageError = useCallback(() => setImageError(true), []);

  // Keep card in pressed state while action sheet is open
  useEffect(() => {
    if (isActionSheetOpen) {
      scaleValue.value = withSpring(0.96, SPRINGS.responsive);
      opacityValue.value = withTiming(0.9, { duration: TIMING.instant });
    } else {
      scaleValue.value = withSpring(1, SPRINGS.responsive);
      opacityValue.value = withTiming(1, { duration: TIMING.instant });
    }
  }, [isActionSheetOpen]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  const handlePressIn = useCallback(() => {
    scaleValue.value = withSpring(0.96, SPRINGS.responsive);
    opacityValue.value = withTiming(0.9, { duration: TIMING.instant });
  }, [scaleValue, opacityValue]);

  const handlePressOut = useCallback(() => {
    // Only spring back if action sheet is NOT open
    if (!isActionSheetOpen) {
      scaleValue.value = withSpring(1, SPRINGS.responsive);
      opacityValue.value = withTiming(1, { duration: TIMING.instant });
    }
  }, [isActionSheetOpen, scaleValue, opacityValue]);

  // Bookmark icon scale animation
  const bookmarkScale = useSharedValue(1);
  const bookmarkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const handleBookmarkPress = useCallback(() => {
    haptics.select();
    bookmarkScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
    onBookmarkPress?.();
  }, [onBookmarkPress, bookmarkScale]);

  return (
    <Animated.View style={cardAnimStyle}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.imageContainer}>
          {imageError ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="newspaper-outline" size={36} color={colors.text.meta} />
              <Text style={styles.placeholderText}>Image unavailable</Text>
            </View>
          ) : (
            <Image source={imageUrl} style={styles.image} contentFit="cover" cachePolicy="memory-disk" onError={handleImageError} />
          )}
          {isUnread && <View style={styles.unreadDot} />}
          <Animated.View style={[styles.bookmarkButton, bookmarkAnimStyle]}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleBookmarkPress();
              }}
              hitSlop={8}
              style={styles.bookmarkPressable}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? colors.accent.primary : colors.text.primary}
              />
            </Pressable>
          </Animated.View>
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
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999999',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkPressable: {
    flex: 1,
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
