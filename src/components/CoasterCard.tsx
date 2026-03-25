/**
 * CoasterCard — Collectible card with flip animation
 *
 * Front: AI-generated art (or rarity-gradient placeholder) with coaster info overlay.
 * Back: Stats grid + user rating if rated.
 * Locked: Dark overlay + lock icon for unridden coasters.
 *
 * Flip uses rotateY interpolation with opacity cross-fade at the 50% mark,
 * matching the PassDetailView pattern.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';
import { FadeInImage } from './FadeInImage';
import { CardRarity, RARITY_GRADIENTS } from '../data/cardArt';
import type { CoasterRating } from '../types/rideLog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Card aspect ratio — standard TCG (2.5×3.5 inches = 5:7) */
const ASPECT_RATIO = 7 / 5;

/** Size presets */
const CARD_SIZES = {
  small: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2,   // 2-column grid
  medium: SCREEN_WIDTH - spacing.xl * 2,                       // single column
  large: SCREEN_WIDTH - spacing.lg * 2,                        // full-bleed
} as const;

/** Stats displayed on the card back */
export interface CoasterStats {
  heightFt?: number;
  speedMph?: number;
  lengthFt?: number;
  inversions?: number;
  yearOpened?: number;
  manufacturer?: string;
  material?: string;
}

interface CoasterCardProps {
  coasterId: string;
  coasterName: string;
  parkName: string;
  /** AI-generated art — require() result or URI */
  artSource?: any;
  isUnlocked: boolean;
  rarity: CardRarity;
  rating?: CoasterRating;
  stats?: CoasterStats;
  onPress?: () => void;
  onLongPress?: () => void;
  onFlip?: () => void;
  /** When true, programmatically flip to back */
  triggerFlip?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/** Material icon mapping for placeholder cards */
const MATERIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Steel: 'construct-outline',
  Wood: 'leaf-outline',
  Hybrid: 'git-merge-outline',
};

export const CoasterCard: React.FC<CoasterCardProps> = ({
  coasterId,
  coasterName,
  parkName,
  artSource,
  isUnlocked,
  rarity,
  rating,
  stats,
  onPress,
  onLongPress,
  onFlip,
  triggerFlip,
  size = 'small',
}) => {
  const cardWidth = CARD_SIZES[size];
  const cardHeight = cardWidth * ASPECT_RATIO;

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  // Front rotates 0° → 90° (hidden at 50%)
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  // Back rotates -90° → 0° (visible at 50%)
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.51, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const handleFlip = useCallback(() => {
    if (!isUnlocked) return;

    haptics.tap();
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);
    onFlip?.();

    Animated.timing(flipAnim, {
      toValue,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isUnlocked, onFlip]);

  const handlePressIn = useCallback(() => {
    Animated.timing(pressScale, {
      toValue: 0.97,
      duration: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (!isUnlocked) {
      haptics.tap();
      onPress?.();
      return;
    }
    // Unlocked: tap = flip only
    handleFlip();
  }, [isUnlocked, handleFlip, onPress]);

  const handleLongPress = useCallback(() => {
    if (!isUnlocked) return;
    haptics.select();
    onLongPress?.();
  }, [isUnlocked, onLongPress]);

  // Programmatic flip from parent (e.g. "View Details" action)
  useEffect(() => {
    if (triggerFlip && isUnlocked && !isFlipped) {
      handleFlip();
    }
  }, [triggerFlip]);

  const [gradStart, gradEnd] = RARITY_GRADIENTS[rarity];
  const materialIcon = MATERIAL_ICONS[stats?.material ?? ''] ?? 'train-outline';

  // ─── Front Face ───────────────────────────────────────────
  const renderFront = () => (
    <Animated.View
      style={[
        styles.cardFace,
        {
          width: cardWidth,
          height: cardHeight,
          opacity: frontOpacity,
          transform: [
            { perspective: 1000 },
            { rotateY: frontRotateY },
            { scale: pressScale },
          ],
        },
      ]}
    >
      {/* Art or placeholder */}
      {artSource ? (
        <FadeInImage
          source={typeof artSource === 'string' ? { uri: artSource } : artSource}
          style={[styles.artImage, { width: cardWidth, height: cardHeight }]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholderGradient}
        >
          <Ionicons
            name={materialIcon}
            size={size === 'small' ? 40 : 56}
            color="rgba(255,255,255,0.5)"
          />
        </LinearGradient>
      )}

      {/* Bottom gradient overlay for text */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
        style={styles.textGradient}
      >
        <Text
          style={[styles.frontName, size === 'small' && styles.frontNameSmall]}
          numberOfLines={2}
        >
          {coasterName}
        </Text>
        <Text
          style={[styles.frontPark, size === 'small' && styles.frontParkSmall]}
          numberOfLines={1}
        >
          {parkName}
        </Text>
      </LinearGradient>

      {/* Locked overlay */}
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Ionicons
            name="lock-closed"
            size={size === 'small' ? 28 : 36}
            color="rgba(255,255,255,0.5)"
          />
        </View>
      )}
    </Animated.View>
  );

  // ─── Back Face ────────────────────────────────────────────
  const renderBack = () => (
    <Animated.View
      style={[
        styles.cardFace,
        styles.cardBack,
        {
          width: cardWidth,
          height: cardHeight,
          opacity: backOpacity,
          transform: [
            { perspective: 1000 },
            { rotateY: backRotateY },
          ],
        },
      ]}
    >
      {/* Background art */}
      {artSource ? (
        <FadeInImage
          source={typeof artSource === 'string' ? { uri: artSource } : artSource}
          style={styles.artImage}
          resizeMode="cover"
          blurRadius={2}
        />
      ) : (
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholderGradient}
        />
      )}

      {/* Dark overlay for readability */}
      <View style={styles.backOverlay} />

      {/* Content */}
      <View style={styles.backContent}>
        {/* Header */}
        <View style={styles.backHeader}>
          <Text
            style={[styles.backName, size === 'small' && styles.backNameSmall]}
            numberOfLines={2}
          >
            {coasterName}
          </Text>
          <Text style={styles.backPark} numberOfLines={1}>
            {parkName}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats?.heightFt != null && stats.heightFt > 0 && (
            <StatItem label="Height" value={`${stats.heightFt} ft`} />
          )}
          {stats?.speedMph != null && stats.speedMph > 0 && (
            <StatItem label="Speed" value={`${stats.speedMph} mph`} />
          )}
          {stats?.lengthFt != null && stats.lengthFt > 0 && (
            <StatItem label="Length" value={`${stats.lengthFt.toLocaleString()} ft`} />
          )}
          {stats?.inversions != null && stats.inversions > 0 && (
            <StatItem label="Inversions" value={String(stats.inversions)} />
          )}
          {stats?.yearOpened != null && stats.yearOpened > 0 && (
            <StatItem label="Opened" value={String(stats.yearOpened)} />
          )}
          {stats?.manufacturer && (
            <StatItem label="Builder" value={stats.manufacturer} />
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          {rating ? (
            <>
              <Text style={styles.ratingScore}>
                {(rating.weightedScore / 10).toFixed(1)}
              </Text>
              <Text style={styles.ratingLabel}>Your Rating</Text>
            </>
          ) : (
            <>
              <Ionicons name="star-outline" size={22} color="rgba(255,255,255,0.5)" />
              <Text style={styles.unratedLabel}>Not Rated</Text>
            </>
          )}
        </View>
      </View>

    </Animated.View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={250}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: cardWidth, height: cardHeight }}
    >
      {renderFront()}
      {renderBack()}
    </Pressable>
  );
};

// ─── StatItem sub-component ───────────────────────────────
const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardFace: {
    borderRadius: 20,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    ...shadows.card,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backContent: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  // ── Front ──
  artImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 48,
  },
  frontName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  frontNameSmall: {
    fontSize: 14,
    lineHeight: 18,
  },
  frontPark: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  frontParkSmall: {
    fontSize: 11,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Back ──
  backHeader: {
    marginBottom: spacing.base,
  },
  backName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  backNameSmall: {
    fontSize: 15,
    lineHeight: 19,
  },
  backPark: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  statItem: {
    width: '46%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  unratedLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
});
