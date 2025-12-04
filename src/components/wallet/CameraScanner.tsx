/**
 * CameraScanner Component
 *
 * QR code scanner using expo-camera.
 * - Live camera preview with QR detection
 * - Photo library import option
 * - Matches app's animation and styling patterns
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH * 0.75;

// Animation constants - match app patterns
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

const PRESS_SCALE = 0.96;
const PRESS_OPACITY = 0.7;

interface CameraScannerProps {
  /** Called when a QR code is successfully scanned */
  onScan: (data: string, format: string) => void;
  /** Called when user cancels scanning */
  onCancel: () => void;
  /** Whether to show the photo library option */
  showLibraryOption?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  onCancel,
  showLibraryOption = true,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Animation values for buttons
  const cancelScaleAnim = useRef(new Animated.Value(1)).current;
  const cancelOpacityAnim = useRef(new Animated.Value(1)).current;
  const flashScaleAnim = useRef(new Animated.Value(1)).current;
  const flashOpacityAnim = useRef(new Animated.Value(1)).current;
  const libraryScaleAnim = useRef(new Animated.Value(1)).current;
  const libraryOpacityAnim = useRef(new Animated.Value(1)).current;

  // Scanning line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Start scan line animation
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  // Handle barcode scan
  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (isScanned) return;

    setIsScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Pass the scanned data and format to parent
    onScan(result.data, result.type);
  }, [isScanned, onScan]);

  // Handle photo library import
  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // For now, we'll show an alert that image QR scanning requires additional processing
        // In production, you'd use jsQR or similar to decode the QR from the image
        Alert.alert(
          'Image Selected',
          'QR code decoding from images will be implemented in the next phase.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  }, []);

  // Press handlers for buttons
  const createPressHandlers = (scaleAnim: Animated.Value, opacityAnim: Animated.Value) => ({
    onPressIn: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: PRESS_SCALE,
          ...RESPONSIVE_SPRING,
        }),
        Animated.timing(opacityAnim, {
          toValue: PRESS_OPACITY,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onPressOut: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...RESPONSIVE_SPRING,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    },
  });

  // Permission not yet determined
  if (permission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={48} color={colors.accent.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            TrackR needs camera access to scan QR codes on your tickets.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={styles.cancelLink}
            onPress={onCancel}
          >
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Camera view with scanner overlay
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'aztec', 'datamatrix'],
        }}
        onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with scanner cutout */}
      <View style={styles.overlay}>
        {/* Top section */}
        <View style={[styles.overlaySection, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>

        {/* Middle section with scanner */}
        <View style={styles.middleSection}>
          <View style={styles.sideOverlay} />

          {/* Scanner frame */}
          <View style={styles.scannerFrame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCANNER_SIZE - 4],
                    }),
                  }],
                },
              ]}
            />
          </View>

          <View style={styles.sideOverlay} />
        </View>

        {/* Bottom section with controls */}
        <View style={[styles.overlaySection, styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.controlsRow}>
            {/* Cancel button */}
            <Pressable
              onPress={onCancel}
              {...createPressHandlers(cancelScaleAnim, cancelOpacityAnim)}
            >
              <Animated.View
                style={[
                  styles.controlButton,
                  {
                    transform: [{ scale: cancelScaleAnim }],
                    opacity: cancelOpacityAnim,
                  },
                ]}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Cancel</Text>
              </Animated.View>
            </Pressable>

            {/* Flash toggle */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFlashEnabled(!flashEnabled);
              }}
              {...createPressHandlers(flashScaleAnim, flashOpacityAnim)}
            >
              <Animated.View
                style={[
                  styles.controlButton,
                  styles.flashButton,
                  flashEnabled && styles.flashButtonActive,
                  {
                    transform: [{ scale: flashScaleAnim }],
                    opacity: flashOpacityAnim,
                  },
                ]}
              >
                <Ionicons
                  name={flashEnabled ? 'flash' : 'flash-outline'}
                  size={28}
                  color="#FFFFFF"
                />
              </Animated.View>
            </Pressable>

            {/* Photo library button */}
            {showLibraryOption && (
              <Pressable
                onPress={handlePickImage}
                {...createPressHandlers(libraryScaleAnim, libraryOpacityAnim)}
              >
                <Animated.View
                  style={[
                    styles.controlButton,
                    {
                      transform: [{ scale: libraryScaleAnim }],
                      opacity: libraryOpacityAnim,
                    },
                  ]}
                >
                  <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Library</Text>
                </Animated.View>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Success overlay when scanned */}
      {isScanned && (
        <View style={styles.successOverlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
            <Text style={styles.successText}>QR Code Scanned!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.actionPill,
    marginBottom: spacing.base,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelLink: {
    padding: spacing.sm,
  },
  cancelLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  middleSection: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Scanner frame
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.accent.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: colors.accent.primary,
    opacity: 0.8,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    minWidth: 70,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  flashButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  flashButtonActive: {
    backgroundColor: colors.accent.primary,
  },

  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: spacing.base,
  },
});
