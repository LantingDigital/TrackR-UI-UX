// ============================================
// Upcoming Stop Strip — Horizontal thumbnail row
//
// Shows next 3-5 upcoming stops as small cards
// in a horizontal FlatList below the hero card.
// ============================================

import React, { memo, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { DELAYS } from '../../../../constants/animations';
import { CARD_ART } from '../../../../data/cardArt';
import type { TripStop } from '../types';
import type { ParkPOI } from '../../types';

const MAX_VISIBLE = 5;
const CARD_WIDTH = 88;

// Category icons for non-coaster stops
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ride: 'flash-outline',
  food: 'restaurant-outline',
  shop: 'bag-outline',
  theater: 'film-outline',
  attraction: 'star-outline',
  service: 'information-circle-outline',
  break: 'cafe-outline',
};

interface UpcomingStopStripProps {
  stops: TripStop[];
  poiMap: Map<string, ParkPOI>;
}

function UpcomingStopStripInner({ stops, poiMap }: UpcomingStopStripProps) {
  const upcomingStops = useMemo(
    () => stops.filter((s) => s.state === 'pending').slice(0, MAX_VISIBLE),
    [stops],
  );

  if (upcomingStops.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>UP NEXT</Text>
      <FlatList
        data={upcomingStops}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <UpcomingCard stop={item} poiMap={poiMap} index={index} />
        )}
      />
    </View>
  );
}

export const UpcomingStopStrip = memo(UpcomingStopStripInner);

// ============================================
// Upcoming Card (internal)
// ============================================

function UpcomingCard({
  stop,
  poiMap,
  index,
}: {
  stop: TripStop;
  poiMap: Map<string, ParkPOI>;
  index: number;
}) {
  const poi = poiMap.get(stop.poiId);
  const coasterId = poi?.coasterId;
  const localArt = coasterId ? CARD_ART[coasterId] : null;
  const categoryIcon = CATEGORY_ICONS[stop.category] ?? 'ellipse-outline';

  return (
    <Animated.View
      entering={FadeInRight.delay(DELAYS.cascade * index).duration(200)}
      style={styles.card}
    >
      {localArt ? (
        <Image source={localArt} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardIconContainer}>
          <Ionicons name={categoryIcon} size={24} color={colors.text.meta} />
        </View>
      )}
      <Text style={styles.cardName} numberOfLines={2}>{stop.name}</Text>
      {stop.estimatedWaitMin > 0 && (
        <Text style={styles.cardWait}>~{Math.round(stop.estimatedWaitMin)}m</Text>
      )}
    </Animated.View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: 56,
  },
  cardIconContainer: {
    width: CARD_WIDTH,
    height: 56,
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    lineHeight: typography.sizes.small * typography.lineHeights.tight,
  },
  cardWait: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    paddingHorizontal: spacing.sm,
    paddingTop: 2,
    paddingBottom: spacing.sm,
  },
});
