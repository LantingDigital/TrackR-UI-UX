/**
 * GateModeOverlay Component
 *
 * Full-screen immersive gate mode for easy pass scanning:
 * - Blurred hero image background
 * - Large centered QR code on white card
 * - Pass number and park name prominently displayed
 * - Auto-brightness boost
 * - Tap anywhere to dismiss
 */

import React, { useEffect, useRef, useCallback } from 'react';
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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Brightness from 'expo-brightness';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Large QR for easy scanning
const GATE_QR_SIZE = 200;

// Scan card dimensions
const SCAN_CARD_WIDTH = SCREEN_WIDTH - 48;
const SCAN_CARD_HEIGHT = 320;

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

  // Extract pass number from QR data
  const passNumber = ticket?.qrData.split('-').pop() || ticket?.qrData || '';

  // Manage brightness
  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (visible) {
          // Save and maximize brightness
          if (originalBrightness.current === null) {
            const current = await Brightness.getBrightnessAsync();
            originalBrightness.current = current;
          }
          await Brightness.setBrightnessAsync(1);
        } else {
          // Restore brightness
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

  // Animate in/out
  useEffect(() => {
    if (visible) {
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
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!visible || !ticket) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />

      {/* Background with hero image blur */}
      <View style={StyleSheet.absoluteFill}>
        {/* Hero image as blurred background */}
        {(ticket.heroImageSource || ticket.heroImageUri) && (
          <Image
            source={ticket.heroImageSource || { uri: ticket.heroImageUri }}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={20}
          />
        )}
        {/* Dark overlay for contrast */}
        <View style={styles.darkOverlay} />
        {/* Blur effect */}
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* Tap to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
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
            {/* Park Name */}
            <Text style={styles.parkName}>{ticket.parkName}</Text>

            {/* Pass Type */}
            <Text style={styles.passType}>
              {PASS_TYPE_LABELS[ticket.passType] || 'Pass'}
            </Text>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <QRCodeDisplay data={ticket.qrData} size={GATE_QR_SIZE} />
            </View>

            {/* Pass Number */}
            <Text style={styles.passNumber}>PASS #: {passNumber}</Text>
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
  parkName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  passType: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  passNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
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
