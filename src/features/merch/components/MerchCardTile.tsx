/**
 * MerchCardTile — Tappable card art tile for the merch store
 *
 * Shows NanoBanana art in standard TCG aspect ratio (2.5:3.5 = 5:7).
 * Spring press feedback, soft shadow, coaster name + park + price below.
 */

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
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
  const imageHeight = tileWidth * CARD_ASPECT;

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      {...pressHandlers}
    >
      <Animated.View style={[styles.container, { width: tileWidth }, animatedStyle]}>
        <View style={[styles.imageWrapper, { height: imageHeight }]}>
          <Image
            source={artSource}
            style={styles.image}
            resizeMode="cover"
          />
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.park} numberOfLines={1}>{parkName}</Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.card,
  },
  imageWrapper: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
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
  info: {
    padding: spacing.base,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: typography.sizes.label * typography.lineHeights.tight,
  },
  park: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  price: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
});
