/**
 * FeaturedParkCard - Spotlight card for a featured park of the week.
 * Full-width card with hero image, overlay text, and park stats.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { onBecomeVisible, offBecomeVisible, hasBeenVisible } from '../../utils/feedAnimations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { FeaturedParkData, MOCK_FEATURED_PARK } from '../../data/mockFeed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Main Component ──

interface FeaturedParkCardProps {
  sectionId?: string;
  data?: FeaturedParkData;
  onPress?: (park: FeaturedParkData) => void;
}

export const FeaturedParkCard = React.memo<FeaturedParkCardProps>(({
  sectionId,
  data = MOCK_FEATURED_PARK,
  onPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97, opacity: 0.95 });
  const [imageError, setImageError] = useState(false);
  const handleImageError = useCallback(() => setImageError(true), []);
  const entrance = useSharedValue(sectionId ? (hasBeenVisible(sectionId) ? 1 : 0) : 1);

  useEffect(() => {
    if (!sectionId) return;
    onBecomeVisible(sectionId, () => {
      entrance.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => offBecomeVisible(sectionId);
  }, [sectionId]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [20, 0]) }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="star" size={16} color={colors.accent.primary} />
          <Text style={styles.sectionLabel}>Featured Park</Text>
        </View>
        <Text style={styles.weekLabel}>This Week</Text>
      </View>
      <Reanimated.View style={[entranceStyle, animatedStyle]}>
        <Pressable
          onPress={() => { haptics.select(); onPress?.(data); }}
          onPressIn={pressHandlers.onPressIn}
          onPressOut={pressHandlers.onPressOut}
          style={styles.card}
        >
          <View style={styles.imageWrapper}>
            {imageError ? (
              <View style={[styles.heroImage, { backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="images-outline" size={40} color="rgba(255,255,255,0.6)" />
              </View>
            ) : (
              <Image source={{ uri: data.imageUrl }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" onError={handleImageError} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gradient}
            />
            <View style={styles.overlayContent}>
              <Text style={styles.parkName}>{data.name}</Text>
              <Text style={styles.parkLocation}>{data.location}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.description} numberOfLines={2}>{data.description}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="train-outline" size={14} color={colors.text.meta} />
                <Text style={styles.statText}>{data.coasterCount} coasters</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="trophy-outline" size={14} color={colors.text.meta} />
                <Text style={styles.statText}>{data.topRide}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="star" size={14} color="#F9A825" />
                <Text style={styles.statText}>{data.rating}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Reanimated.View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.meta,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  parkName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  parkLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cardBody: {
    padding: spacing.lg,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
