/**
 * MerchCardTile — Tappable card art tile for the merch store
 *
 * Card art fills the entire tile. Name + park overlaid at the bottom
 * with a gradient scrim. Price pill in the top-right corner.
 * Tap opens the detail view with the clean, unobstructed card.
 */

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { MERCH_PRICING } from '../../../data/mockMerchData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** TCG aspect ratio: 2.5 x 3.5 inches = 5:7 */
const CARD_ASPECT = 7 / 5;

interface MerchCardTileProps {
  artSource: any;
  name: string;
  parkName: string;
  price?: number;
  isNew?: boolean;
  width?: number;
  onPress?: () => void;
}

export const MerchCardTile: React.FC<MerchCardTileProps> = ({
  artSource,
  name,
  parkName,
  price = MERCH_PRICING.cardPrice,
  isNew = false,
  width,
  onPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97 });
  const tileWidth = width ?? (SCREEN_WIDTH - spacing.lg * 2 - spacing.base) / 2;
  const tileHeight = tileWidth * CARD_ASPECT;

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      {...pressHandlers}
    >
      <Animated.View style={[styles.container, { width: tileWidth, height: tileHeight }, animatedStyle]}>
        <Image
          source={artSource}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Price pill — top right */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>${price.toFixed(2)}</Text>
        </View>

        {/* NEW badge — top left */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Name + park overlay — bottom */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          style={styles.gradient}
        >
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.park} numberOfLines={1}>{parkName}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  pricePill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  priceText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  newBadgeText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.base,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
    lineHeight: typography.sizes.label * typography.lineHeights.tight,
  },
  park: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
