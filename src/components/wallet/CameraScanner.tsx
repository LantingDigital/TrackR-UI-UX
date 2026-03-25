/**
 * CameraScanner Component
 *
 * QR/barcode scanner using expo-camera:
 * - Live camera preview with barcode detection (QR, Aztec, DataMatrix, Code128, PDF417)
 * - Photo library import with Camera.scanFromURLAsync extraction
 * - Haptic feedback on scan success
 * - Reanimated spring animations on all interactions
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { CameraView, Camera, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../../services/haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { BarcodeFormat } from '../../types/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH * 0.75;

// Spring config for button presses
const PRESS_SPRING = { damping: 16, stiffness: 180, mass: 0.8 };

/**
 * Map expo-camera barcode type strings to our BarcodeFormat
 */
const mapExpoFormat = (expoType: string): BarcodeFormat => {
  const map: Record<string, BarcodeFormat> = {
    qr: 'QR_CODE',
    aztec: 'AZTEC',
    pdf417: 'PDF417',
    datamatrix: 'DATA_MATRIX',
    code128: 'CODE_128',
    code39: 'CODE_39',
    ean13: 'EAN_13',
    upc_a: 'UPC_A',
  };
  return map[expoType] || 'QR_CODE';
};

interface CameraScannerProps {
  /** Called when a barcode is successfully scanned */
  onScan: (data: string, format: BarcodeFormat) => void;
  /** Called when user cancels scanning */
  onCancel: () => void;
  /** Whether to show the photo library option */
  showLibraryOption?: boolean;
  /** Called when an image is picked but no barcode found (passes the image URI) */
  onImageOnlyFallback?: (imageUri: string) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  onCancel,
  showLibraryOption = true,
  onImageOnlyFallback,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Reanimated shared values
  const cancelScale = useSharedValue(1);
  const flashScale = useSharedValue(1);
  const libraryScale = useSharedValue(1);

  // Button animated styles
  const cancelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));
  const flashAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));
  const libraryAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: libraryScale.value }],
  }));

  // Handle barcode scan from live camera
  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (isScanned) return;

    setIsScanned(true);
    haptics.success();

    const format = mapExpoFormat(result.type);
    onScan(result.data, format);
  }, [isScanned, onScan]);

  // Handle photo library import — scan barcode from image
  const handlePickImage = useCallback(async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets[0]) return;

      const imageUri = pickerResult.assets[0].uri;
      setIsProcessingImage(true);

      try {
        // Scan the image for barcodes using expo-camera
        const scanResults = await Camera.scanFromURLAsync(imageUri, [
          'qr',
          'aztec',
          'pdf417',
          'datamatrix',
          'code128',
          'code39',
          'ean13',
          'upc_a',
        ]);

        if (scanResults && scanResults.length > 0) {
          // Found a barcode — use the first result
          const firstResult = scanResults[0];
          haptics.success();
          setIsScanned(true);

          const format = mapExpoFormat(firstResult.type);
          onScan(firstResult.data, format);
        } else {
          // No barcode found in the image
          haptics.warning();

          if (onImageOnlyFallback) {
            Alert.alert(
              'No Barcode Found',
              'We could not detect a barcode in this image. Would you like to save it as an image-only pass?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save as Image',
                  onPress: () => onImageOnlyFallback(imageUri),
                },
              ],
            );
          } else {
            Alert.alert(
              'No Barcode Found',
              'We could not detect a barcode in this image. Try a clearer photo or scan directly with the camera.',
              [{ text: 'OK' }],
            );
          }
        }
      } catch (scanError) {
        console.error('Error scanning image for barcodes:', scanError);
        haptics.error();

        if (onImageOnlyFallback) {
          Alert.alert(
            'Scan Failed',
            'Could not process this image. Would you like to save it as an image-only pass?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Save as Image',
                onPress: () => onImageOnlyFallback(imageUri),
              },
            ],
          );
        } else {
          Alert.alert('Scan Failed', 'Could not process this image. Try a different photo.');
        }
      } finally {
        setIsProcessingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsProcessingImage(false);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  }, [onScan, onImageOnlyFallback]);

  // Press handlers with spring physics
  const createPressIn = (sv: SharedValue<number>) => () => {
    sv.value = withSpring(0.92, PRESS_SPRING);
  };
  const createPressOut = (sv: SharedValue<number>) => () => {
    sv.value = withSpring(1, PRESS_SPRING);
  };

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
            TrackR needs camera access to scan barcodes on your tickets and passes.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.cancelLink} onPress={onCancel}>
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
          barcodeTypes: ['qr', 'aztec', 'datamatrix', 'pdf417', 'code128', 'code39', 'ean13'],
        }}
        onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with scanner cutout */}
      <View style={styles.overlay}>
        {/* Top section — flex 1 for equal centering */}
        <View style={[styles.overlaySection, styles.topSection, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.instructionText}>
            Position the barcode within the frame
          </Text>
        </View>

        {/* Middle section with scanner — centered */}
        <View style={styles.middleSection}>
          <View style={styles.sideOverlay} />

          {/* Scanner frame — clean, no gimmicky corner brackets or scan line */}
          <View style={styles.scannerFrame}>
            {/* Subtle white border */}
            <View style={styles.scannerBorder} />
          </View>

          <View style={styles.sideOverlay} />
        </View>

        {/* Bottom section with controls — flex 1 for equal centering */}
        <View style={[styles.overlaySection, styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.controlsRow}>
            {/* Cancel button */}
            <Pressable
              onPress={onCancel}
              onPressIn={createPressIn(cancelScale)}
              onPressOut={createPressOut(cancelScale)}
            >
              <Animated.View style={[styles.controlButton, cancelAnimStyle]}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Cancel</Text>
              </Animated.View>
            </Pressable>

            {/* Flash toggle */}
            <Pressable
              onPress={() => {
                haptics.tap();
                setFlashEnabled(!flashEnabled);
              }}
              onPressIn={createPressIn(flashScale)}
              onPressOut={createPressOut(flashScale)}
            >
              <Animated.View
                style={[
                  styles.controlButton,
                  styles.flashButton,
                  flashEnabled && styles.flashButtonActive,
                  flashAnimStyle,
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
                onPressIn={createPressIn(libraryScale)}
                onPressOut={createPressOut(libraryScale)}
                disabled={isProcessingImage}
              >
                <Animated.View style={[styles.controlButton, libraryAnimStyle]}>
                  {isProcessingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                  )}
                  <Text style={styles.controlButtonText}>
                    {isProcessingImage ? 'Scanning...' : 'Library'}
                  </Text>
                </Animated.View>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Processing overlay when scanning from image */}
      {isProcessingImage && (
        <View style={styles.processingOverlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Scanning image for barcodes...</Text>
          </View>
        </View>
      )}

      {/* Success overlay when scanned */}
      {isScanned && !isProcessingImage && (
        <View style={styles.successOverlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
            <Text style={styles.successText}>Barcode Scanned!</Text>
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
  topSection: {
    flex: 1,
    justifyContent: 'flex-end',
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
    marginBottom: spacing.lg,
  },

  // Scanner frame — clean border, no corners or scan line
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scannerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
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

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
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
