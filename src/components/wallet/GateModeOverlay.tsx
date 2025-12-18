/**
 * GateModeOverlay Component
 *
 * Full-screen immersive gate mode for easy pass scanning:
 * - Blurred hero image background (or gradient fallback)
 * - Large centered QR code on white card
 * - Logo image (preferred) or park name
 * - Pass number prominently displayed
 * - Slight brightness boost (~30% increase)
 * - Tap anywhere to dismiss
 *
 * Gate mode is designed for quick, easy scanning at park entrances.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Brightness from 'expo-brightness';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { getParkGradientColors } from '../../utils/parkAssets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Large QR for easy scanning
const GATE_QR_SIZE = 200;

// Scan card dimensions
const SCAN_CARD_WIDTH = SCREEN_WIDTH - 48;

// Brightness boost amount (0.3 = 30% increase from current level)
const BRIGHTNESS_BOOST = 0.3;

interface GateModeOverlayProps {
  /** The ticket to display */
  ticket: Ticket | null;
  /** Whether gate mode is visible */
  visible: boolean;
  /** Called when user dismisses gate mode */
  onClose: () => void;
}

export const GateModeOverlay: React.FC<GateModeOverlayProps> = ({
  ticket,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const originalBrightness = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Internal visibility state to delay modal close until animation completes
  const [internalVisible, setInternalVisible] = useState(false);

  // Extract pass number from QR data
  const passNumber = ticket?.qrData.split('-').pop() || ticket?.qrData || '';

  // Check for available images
  const hasHeroImage = ticket?.heroImageSource || ticket?.heroImageUri;
  const hasLogo = ticket?.logoImageSource || ticket?.logoImageUri;

  // Gradient fallback colors
  const gradientColors: [string, string] = ticket ? getParkGradientColors(ticket.parkName) : ['#333', '#666'];

  // Manage brightness - boost by 30%, not max
  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (visible) {
          // Save current brightness and boost by 30%
          if (originalBrightness.current === null) {
            const current = await Brightness.getBrightnessAsync();
            originalBrightness.current = current;
            // Boost brightness but cap at 1.0
            const boosted = Math.min(current + BRIGHTNESS_BOOST, 1.0);
            await Brightness.setBrightnessAsync(boosted);
          }
        } else {
          // Restore original brightness
          if (originalBrightness.current !== null) {
            await Brightness.setBrightnessAsync(originalBrightness.current);
            originalBrightness.current = null;
          }
        }
      } catch (error) {
        // Brightness API may fail in simulator
        console.warn('Brightness control unavailable:', error);
      }
    };

    manageBrightness();

    return () => {
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
      }
    };
  }, [visible]);

  // Animate in/out with proper modal lifecycle
  useEffect(() => {
    if (visible) {
      // Show modal immediately, then animate in
      setInternalVisible(true);
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (internalVisible) {
      // Animate out, then hide modal
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.85,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!internalVisible || !ticket) return null;

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />

      {/* Background with hero image blur or gradient fallback - animated */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        {hasHeroImage ? (
          // Hero image as blurred background
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={20}
          />
        ) : (
          // Gradient fallback
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundImage}
          />
        )}
        {/* Dark overlay for contrast */}
        <View style={styles.darkOverlay} />
        {/* Blur effect */}
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Tap to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerText}>Ready to Scan</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Scan Card */}
          <Animated.View
            style={[
              styles.scanCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo or Park Name */}
            {hasLogo ? (
              <View style={styles.logoContainer}>
                <Image
                  source={ticket.logoImageSource || { uri: ticket.logoImageUri }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Text style={styles.parkName}>{ticket.parkName}</Text>
            )}

            {/* Pass Type */}
            <View style={styles.passTypeBadge}>
              <Text style={styles.passTypeText}>
                {PASS_TYPE_LABELS[ticket.passType] || 'Pass'}
              </Text>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <QRCodeDisplay data={ticket.qrData} size={GATE_QR_SIZE} />
            </View>

            {/* Pass Number */}
            <Text style={styles.passNumber}>PASS #: {passNumber}</Text>

            {/* Passholder name if available */}
            {ticket.passholder && (
              <Text style={styles.passholder}>{ticket.passholder}</Text>
            )}
          </Animated.View>

          {/* Hint */}
          <View style={[styles.hintContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.hintText}>Tap anywhere to close</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Scan Card
  scanCard: {
    alignSelf: 'center',
    width: SCAN_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },

  // Logo
  logoContainer: {
    height: 50,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 50,
  },

  // Park Name (fallback when no logo)
  parkName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Pass Type Badge
  passTypeBadge: {
    backgroundColor: `${colors.accent.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  passTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // QR Code
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },

  // Pass Details
  passNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  passholder: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
    marginTop: 8,
  },

  // Hint
  hintContainer: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default GateModeOverlay;
