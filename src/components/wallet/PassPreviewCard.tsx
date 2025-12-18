/**
 * PassPreviewCard Component
 *
 * Mini preview card for pass carousels:
 * - Cropped hero image background (1:1 aspect ratio)
 * - Park name text overlay with gradient fade
 * - No QR/barcode - that's only in expanded view
 * - Consistent sizing for carousel display
 *
 * Used in ScanModal sections for "Most Popular", "All Passes", etc.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { useSpringPress } from '../../hooks';

// Card dimensions for carousel display - 1:1 aspect ratio
const CARD_SIZE = 140;

interface PassPreviewCardProps {
  ticket: Ticket;
  onPress?: () => void;
  style?: object;
}

export const PassPreviewCard: React.FC<PassPreviewCardProps> = ({
  ticket,
  onPress,
  style,
}) => {
  const { scaleValue, pressHandlers } = useSpringPress({
    scale: 0.97,
    opacity: 1,
  });

  return (
    <Pressable
      onPress={onPress}
      {...pressHandlers}
      style={style}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        {/* Hero Image Background */}
        {(ticket.heroImageSource || ticket.heroImageUri) ? (
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          // Placeholder when no hero image
          <View style={styles.heroPlaceholder}>
            <Text style={styles.placeholderInitial}>
              {ticket.parkName.charAt(0)}
            </Text>
          </View>
        )}

        {/* Pass Type Badge (top-right) */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {PASS_TYPE_LABELS[ticket.passType]?.split(' ')[0] || 'Pass'}
          </Text>
        </View>

        {/* Gradient overlay for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />

        {/* Park Name (bottom) */}
        <View style={styles.labelContainer}>
          <Text style={styles.parkNameText} numberOfLines={2}>
            {ticket.parkName}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
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
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#999999',
  },

  // Gradient overlay for feathered text background
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  // Pass Type Badge
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Park Name Label
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  parkNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PassPreviewCard;
