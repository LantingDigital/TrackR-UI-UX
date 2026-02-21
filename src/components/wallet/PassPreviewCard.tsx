/**
 * PassPreviewCard Component
 *
 * Mini preview card for pass carousels:
 * - Cropped hero image background (1:1 aspect ratio)
 * - Clean design - just card art, no text overlay in carousel
 * - Star badge for favorited passes
 * - Gradient fallback when no card art available
 * - Configurable size for different sections
 *
 * Used in ScanModal sections for "Favorites", "All", "Expired"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Ticket } from '../../types/wallet';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { useSpringPress } from '../../hooks';
import { getParkGradientColors, getParkInitials } from '../../utils/parkAssets';

// Default card size for carousel display - 1:1 aspect ratio (matches Log/Search)
const DEFAULT_CARD_SIZE = 120;

// Card sizes per section
export const PREVIEW_CARD_SIZES = {
  favorites: 120, // Same as Log/Search
  all: 120,       // Same as Log/Search
  expired: 100,   // Smaller for expired section
};

interface PassPreviewCardProps {
  ticket: Ticket;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: object;
  /** Card size in pixels (default: 100) */
  size?: number;
  /** Whether to show the star badge for favorites */
  showFavoriteBadge?: boolean;
}

export const PassPreviewCard: React.FC<PassPreviewCardProps> = ({
  ticket,
  onPress,
  onLongPress,
  style,
  size = DEFAULT_CARD_SIZE,
  showFavoriteBadge = true,
}) => {
  const { animatedStyle, pressHandlers } = useSpringPress({
    scale: 0.97,
    opacity: 1,
  });

  const hasHeroImage = ticket.heroImageSource || ticket.heroImageUri;
  const gradientColors = getParkGradientColors(ticket.parkName);
  const initials = getParkInitials(ticket.parkName);

  // Dynamic styles based on size
  const dynamicStyles = {
    container: {
      width: size,
      height: size,
    },
    initials: {
      fontSize: size * 0.35, // Scale initials with card size
    },
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      {...pressHandlers}
      style={style}
    >
      <Animated.View
        style={[
          styles.container,
          dynamicStyles.container,
          animatedStyle,
        ]}
      >
        {/* Hero Image Background or Gradient Fallback */}
        {hasHeroImage ? (
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          // Gradient fallback with park initials
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientPlaceholder}
          >
            <Text style={[styles.placeholderInitial, dynamicStyles.initials]}>
              {initials}
            </Text>
          </LinearGradient>
        )}

        {/* Star Badge for Favorites (top-left) */}
        {showFavoriteBadge && ticket.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}

        {/* Gradient banner at bottom with park name */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientBanner}
        >
          <Text
            style={[styles.parkNameText, { fontSize: size * 0.11 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {ticket.parkName}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  // Hero Image
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  // Gradient Placeholder (fallback when no card art)
  gradientPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Gradient banner at bottom with park name
  gradientBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  parkNameText: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Favorite Star Badge
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PassPreviewCard;
