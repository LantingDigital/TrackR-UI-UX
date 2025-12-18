/**
 * PassHeroCard Component
 *
 * Full-width expanded pass card with:
 * - Hero image background (park artwork) with gradient fallback
 * - Centered logo overlay (prioritized over text)
 * - Pass type badge
 * - White footer with QR/barcode and pass details
 *
 * Visual hierarchy:
 * 1. Logo image (if available) - centered on hero
 * 2. Park name text (fallback when no logo)
 * 3. Gradient placeholder (when no hero image)
 *
 * Used in the expanded detail view when user taps a preview card.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket } from '../../types/wallet';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { getParkGradientColors, getParkInitials } from '../../utils/parkAssets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card dimensions - nearly full width with padding
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_ASPECT_RATIO = 1.35; // Taller to properly fit QR in footer
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO;
const HERO_HEIGHT_RATIO = 0.58; // Hero image takes 58% of card
const FOOTER_HEIGHT_RATIO = 0.42; // Footer takes 42% for comfortable QR display

// QR code size - sized to fit footer with breathing room
const QR_SIZE = 120;

interface PassHeroCardProps {
  ticket: Ticket;
  onPress?: () => void;
  showBarcode?: boolean; // true = barcode, false = QR code
  /** When true, disables touch handling so parent can handle touches */
  disableTouch?: boolean;
}

export const PassHeroCard: React.FC<PassHeroCardProps> = ({
  ticket,
  onPress,
  showBarcode = false,
  disableTouch = false,
}) => {
  const heroHeight = CARD_HEIGHT * HERO_HEIGHT_RATIO;
  const footerHeight = CARD_HEIGHT * FOOTER_HEIGHT_RATIO;

  // Check for available images
  const hasHeroImage = ticket.heroImageSource || ticket.heroImageUri;
  const hasLogo = ticket.logoImageSource || ticket.logoImageUri;

  // Gradient fallback colors based on park name
  const gradientColors = getParkGradientColors(ticket.parkName);
  const parkInitials = getParkInitials(ticket.parkName);

  // Extract pass number from QR data (last segment or full string)
  const passNumber = ticket.qrData.split('-').pop() || ticket.qrData;

  // Use View when touch is disabled (for parent PanResponder), Pressable otherwise
  const Container = disableTouch ? View : Pressable;
  const containerProps = disableTouch
    ? { style: styles.container }
    : {
        onPress,
        style: ({ pressed }: { pressed: boolean }) => [
          styles.container,
          pressed && styles.pressed,
        ],
      };

  return (
    <Container {...containerProps}>
      {/* Hero Image Section */}
      <View style={[styles.heroSection, { height: heroHeight }]}>
        {hasHeroImage ? (
          // Hero image background
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          // Gradient placeholder when no hero image
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroPlaceholder}
          >
            {/* Show initials only if no logo will be shown */}
            {!hasLogo && (
              <Text style={styles.placeholderInitials}>{parkInitials}</Text>
            )}
          </LinearGradient>
        )}

        {/* Subtle darkening gradient for text readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.2)']}
          locations={[0, 0.4, 1]}
          style={styles.heroOverlay}
        />

        {/* Logo Overlay - Top position with light gradient background for dark logos */}
        {hasLogo && (
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.7)', 'transparent']}
              style={styles.logoGradientBg}
            />
            <Image
              source={ticket.logoImageSource || { uri: ticket.logoImageUri }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Park Name (shown only if no logo) - at top with light gradient background */}
        {!hasLogo && (
          <View style={styles.parkNameWrapper}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)', 'transparent']}
              style={styles.parkNameGradientBg}
            />
            <Text style={styles.parkNameText}>{ticket.parkName}</Text>
          </View>
        )}

        {/* Passholder name (if available) - at bottom */}
        {ticket.passholder && (
          <View style={styles.passholderContainer}>
            <Text style={styles.passholderText}>{ticket.passholder}</Text>
          </View>
        )}
      </View>

      {/* White Footer Section */}
      <View style={[styles.footerSection, { height: footerHeight }]}>
        {/* QR Code or Barcode */}
        <View style={styles.codeContainer}>
          {showBarcode ? (
            // Barcode display (simplified representation)
            <View style={styles.barcodeContainer}>
              <View style={styles.barcodePlaceholder}>
                {/* Barcode lines - simplified visual */}
                {Array.from({ length: 40 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeLine,
                      { width: Math.random() > 0.5 ? 2 : 1 },
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <QRCodeDisplay data={ticket.qrData} size={QR_SIZE} />
          )}
        </View>

        {/* Pass Number */}
        <Text style={styles.passNumberText}>
          PASS #: {passNumber}
        </Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  // Hero Section
  heroSection: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitials: {
    fontSize: 72,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.25)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Logo - Top position with gradient background
  logoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  logoGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  logoImage: {
    width: '65%',
    height: 60,
    maxWidth: 180,
  },

  // Park Name (when no logo) - at top with gradient background
  parkNameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  parkNameGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  parkNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },

  // Passholder name
  passholderContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  passholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Footer Section
  footerSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  // Code Container
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // Barcode styles
  barcodeContainer: {
    height: 60,
    justifyContent: 'center',
  },
  barcodePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    gap: 1,
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#000000',
  },

  // Pass Number
  passNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.5,
  },
});

export default PassHeroCard;
