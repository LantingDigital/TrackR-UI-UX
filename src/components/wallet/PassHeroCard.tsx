/**
 * PassHeroCard Component
 *
 * Full-width expanded pass card with:
 * - Hero image background (park artwork)
 * - Optional logo overlay
 * - Pass type label
 * - White footer with QR/barcode and pass number
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
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card dimensions - nearly full width with padding
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_ASPECT_RATIO = 1.35; // Taller to properly fit QR in footer
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO;
const HERO_HEIGHT_RATIO = 0.58; // Hero image takes 58% of card
const FOOTER_HEIGHT_RATIO = 0.42; // Footer takes 42% for comfortable QR display

// QR code size - sized to fit footer with breathing room
// Footer height ≈ 200px, need space for QR + pass number + padding
const QR_SIZE = 120;

interface PassHeroCardProps {
  ticket: Ticket;
  onPress?: () => void;
  showBarcode?: boolean; // true = barcode, false = QR code
}

export const PassHeroCard: React.FC<PassHeroCardProps> = ({
  ticket,
  onPress,
  showBarcode = false,
}) => {
  const heroHeight = CARD_HEIGHT * HERO_HEIGHT_RATIO;
  const footerHeight = CARD_HEIGHT * FOOTER_HEIGHT_RATIO;

  // Extract pass number from QR data (last segment or full string)
  const passNumber = ticket.qrData.split('-').pop() || ticket.qrData;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Hero Image Section */}
      <View style={[styles.heroSection, { height: heroHeight }]}>
        {(ticket.heroImageSource || ticket.heroImageUri) ? (
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          // Placeholder gradient when no hero image
          <View style={styles.heroPlaceholder}>
            <Text style={styles.placeholderText}>{ticket.parkName}</Text>
          </View>
        )}

        {/* Logo Overlay (if provided) */}
        {ticket.logoImageUri && (
          <Image
            source={{ uri: ticket.logoImageUri }}
            style={styles.logoOverlay}
            resizeMode="contain"
          />
        )}

        {/* Pass Type Label */}
        <View style={styles.passTypeContainer}>
          <Text style={styles.passTypeText}>
            {PASS_TYPE_LABELS[ticket.passType] || 'Pass'}
          </Text>
        </View>

        {/* Park Name (shown if no logo) */}
        {!ticket.logoImageUri && (
          <View style={styles.parkNameContainer}>
            <Text style={styles.parkNameText}>{ticket.parkName}</Text>
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
    </Pressable>
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
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#999999',
  },

  // Logo Overlay
  logoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 120,
    height: 40,
  },

  // Park Name (when no logo)
  parkNameContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  parkNameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Pass Type Label
  passTypeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  passTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
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
