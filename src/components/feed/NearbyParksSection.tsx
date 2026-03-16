/**
 * NearbyParksSection - Horizontal scroll of nearby parks with distance and status.
 * Each card shows park image, distance, coaster count, and open/closed status.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { onBecomeVisible, offBecomeVisible, hasBeenVisible } from '../../utils/feedAnimations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { NearbyParkItem, MOCK_NEARBY_PARKS } from '../../data/mockFeed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;

// ── Individual Park Card ──

interface NearbyParkCardProps {
  item: NearbyParkItem;
  index: number;
  onPress: (item: NearbyParkItem) => void;
}

const NearbyParkCard = React.memo<NearbyParkCardProps>(({ item, index, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.96, opacity: 0.9 });
  const [imgError, setImgError] = useState(false);
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * 80,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { translateX: interpolate(entryProgress.value, [0, 1], [50, 0]) },
      { scale: interpolate(entryProgress.value, [0, 1], [0.88, 1]) },
    ],
  }));

  return (
    <Reanimated.View style={[entryStyle, animatedStyle]}>
      <Pressable
        onPress={() => { haptics.select(); onPress(item); }}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          {imgError ? (
            <View style={[styles.cardImage, { backgroundColor: colors.background.imagePlaceholder, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="map-outline" size={28} color={colors.text.meta} />
            </View>
          ) : (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" cachePolicy="memory-disk" recyclingKey={item.id} onError={() => setImgError(true)} />
          )}
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={11} color={colors.text.inverse} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.parkName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="train-outline" size={12} color={colors.text.meta} />
              <Text style={styles.infoText}>{item.coasterCount} coasters</Text>
            </View>
            <View style={[styles.statusBadge, item.isOpen ? styles.statusOpen : styles.statusClosed]}>
              <View style={[styles.statusDot, item.isOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={[styles.statusText, item.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                {item.isOpen ? 'Open' : item.nextOpenTime || 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Reanimated.View>
  );
});

// ── Main Component ──

interface NearbySectionProps {
  sectionId?: string;
  onParkPress?: (item: NearbyParkItem) => void;
  onSeeAll?: () => void;
}

export const NearbyParksSection = React.memo<NearbySectionProps>(({ sectionId, onParkPress, onSeeAll }) => {
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

  const handlePress = useCallback((item: NearbyParkItem) => {
    onParkPress?.(item);
  }, [onParkPress]);

  return (
    <Reanimated.View style={[styles.container, entranceStyle]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={16} color={colors.accent.primary} />
          <Text style={styles.sectionTitle}>Nearby Parks</Text>
        </View>
        <Pressable onPress={() => { haptics.tap(); onSeeAll?.(); }} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.base}
      >
        {MOCK_NEARBY_PARKS.map((park, index) => (
          <NearbyParkCard
            key={park.id}
            item={park}
            index={index}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </Reanimated.View>
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
  scrollView: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageWrapper: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  cardContent: {
    padding: spacing.base,
  },
  parkName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: 'rgba(40,167,69,0.1)',
  },
  statusClosed: {
    backgroundColor: 'rgba(220,53,69,0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: colors.status.success,
  },
  dotClosed: {
    backgroundColor: colors.status.error,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: colors.status.success,
  },
  statusTextClosed: {
    color: colors.status.error,
  },
});
