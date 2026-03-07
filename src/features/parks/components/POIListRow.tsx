import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { ParkPOI, MapCategory } from '../types';
import { CARD_ART } from '../../../data/cardArt';
import { getAreaLabel } from '../data/areaLabels';
import { MAP_CATEGORY_COLORS } from '../map/poiGeoJSON';
import { getEnrichedCoaster } from '../data/coasterDetailData';

// ============================================
// Helpers
// ============================================

function getMapCategory(poi: ParkPOI): MapCategory {
  if (poi.type === 'ride' && poi.coasterId) return 'coaster';
  if (poi.type === 'theater' || poi.type === 'attraction') return 'show';
  if (poi.type === 'ride') return 'ride';
  if (poi.type === 'food') return 'food';
  if (poi.type === 'shop') return 'shop';
  return 'service';
}

const CATEGORY_ICONS: Record<MapCategory, keyof typeof Ionicons.glyphMap> = {
  coaster: 'rocket-outline',
  ride: 'flash-outline',
  food: 'restaurant-outline',
  show: 'musical-notes-outline',
  shop: 'bag-outline',
  service: 'information-circle-outline',
};

// ============================================
// Types
// ============================================

interface POIListRowProps {
  poi: ParkPOI;
  onPress: (poiId: string) => void;
  waitMinutes?: number;
  isOpen?: boolean;
  /** Override display mode: 'ride' shows stats/wait, 'food' shows menu info */
  mode?: 'ride' | 'food';
}

// ============================================
// POIListRow
// ============================================

export const POIListRow = memo(function POIListRow({
  poi,
  onPress,
  waitMinutes,
  isOpen,
  mode = 'ride',
}: POIListRowProps) {
  const mapCategory = getMapCategory(poi);
  const categoryColor = MAP_CATEGORY_COLORS[mapCategory];
  const areaLabel = getAreaLabel(poi.area);

  // Card art for rides with coasterId
  const hasCardArt = mode === 'ride' && poi.coasterId && CARD_ART[poi.coasterId];
  const cardArtSource = hasCardArt ? CARD_ART[poi.coasterId!] : null;

  // Stats line for rides
  let statsLine = '';
  if (mode === 'ride' && poi.coasterId) {
    const coaster = getEnrichedCoaster(poi.coasterId);
    if (coaster) {
      const parts: string[] = [];
      if (coaster.heightFt > 0) parts.push(`${coaster.heightFt} ft`);
      if (coaster.speedMph > 0) parts.push(`${coaster.speedMph} mph`);
      if (coaster.inversions > 0) parts.push(`${coaster.inversions} inv`);
      statsLine = parts.join(' \u00B7 ');
    }
  }

  // Food-specific info
  let menuLine = '';
  let showAlcoholBadge = false;
  if (mode === 'food') {
    if (poi.menuDescription) {
      menuLine = poi.menuDescription;
    } else if (poi.menuItems && poi.menuItems.length > 0) {
      menuLine = poi.menuItems.slice(0, 3).join(', ');
    }
    showAlcoholBadge = !!poi.servesAlcohol;
  }

  // Wait time badge color
  const waitColor = waitMinutes != null
    ? waitMinutes <= 15
      ? colors.status.success
      : waitMinutes <= 30
        ? colors.status.warning
        : colors.status.error
    : undefined;

  const handlePress = () => {
    haptics.tap();
    onPress(poi.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      {/* Left: Thumbnail or icon circle */}
      {cardArtSource ? (
        <View style={styles.thumbnailWrap}>
          <Image source={cardArtSource} style={styles.thumbnail} />
        </View>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: categoryColor + '18' }]}>
          <Ionicons
            name={CATEGORY_ICONS[mapCategory]}
            size={20}
            color={categoryColor}
          />
        </View>
      )}

      {/* Center: Name, area, stats */}
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>
          {poi.name}
        </Text>
        <Text style={styles.area} numberOfLines={1}>
          {areaLabel}
        </Text>
        {mode === 'ride' && statsLine.length > 0 && (
          <Text style={styles.stats} numberOfLines={1}>
            {statsLine}
          </Text>
        )}
        {mode === 'food' && menuLine.length > 0 && (
          <Text style={styles.stats} numberOfLines={1}>
            {menuLine}
          </Text>
        )}
      </View>

      {/* Right: Wait time badge, alcohol badge, or chevron */}
      <View style={styles.right}>
        {showAlcoholBadge && (
          <View style={styles.alcoholBadge}>
            <Text style={styles.alcoholText}>21+</Text>
          </View>
        )}
        {mode === 'ride' && waitMinutes != null && isOpen ? (
          <View style={[styles.waitBadge, { backgroundColor: waitColor + '18' }]}>
            <Text style={[styles.waitText, { color: waitColor }]}>
              {waitMinutes}
            </Text>
            <Text style={[styles.waitUnit, { color: waitColor }]}>min</Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.meta}
          />
        )}
      </View>
    </Pressable>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  rowPressed: {
    backgroundColor: colors.interactive.pressed,
  },

  // Left — Thumbnail
  thumbnailWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
  },
  thumbnail: {
    width: 44,
    height: 44,
  },

  // Left — Icon circle fallback
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Center
  center: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  area: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 1,
  },
  stats: {
    fontSize: typography.sizes.small,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Right
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waitBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 48,
  },
  waitText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
  },
  waitUnit: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
  },
  alcoholBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  alcoholText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: '#8B5CF6',
  },
});
