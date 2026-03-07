/**
 * QRCodeDisplay Component
 *
 * Unified barcode/QR code renderer supporting:
 * - QR codes via react-native-qrcode-svg
 * - 1D barcodes (Code128, PDF417, Aztec, EAN13, UPCA) via react-native-barcode-creator
 * - Image-only fallback for passes where extraction failed
 *
 * Gate mode: larger code, max contrast, generous quiet zone for reliable scanning.
 */

import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BarcodeCreatorView, BarcodeFormat as CreatorFormat } from 'react-native-barcode-creator';
import { BarcodeFormat } from '../../types/wallet';
import { colors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

interface QRCodeDisplayProps {
  /** The data to encode */
  data: string;
  /** Barcode format -- determines which renderer to use */
  format?: BarcodeFormat;
  /** Size of the code in pixels (width for 1D barcodes, side length for 2D) */
  size?: number;
  /** Whether gate mode is active (larger, high contrast) */
  gateMode?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Foreground (code) color */
  color?: string;
  /** Quiet zone size around the code */
  quietZone?: number;
  /** URI to the original image (fallback for IMAGE_ONLY format) */
  originalPhotoUri?: string;
}

/**
 * Map our BarcodeFormat to react-native-barcode-creator format constants
 */
const CREATOR_FORMAT_MAP: Partial<Record<BarcodeFormat, string>> = {
  CODE_128: CreatorFormat.CODE128,
  PDF417: CreatorFormat.PDF417,
  AZTEC: CreatorFormat.AZTEC,
  EAN_13: CreatorFormat.EAN13,
  UPC_A: CreatorFormat.UPCA,
};

/**
 * Formats that should use react-native-barcode-creator (1D and specific 2D)
 */
const CREATOR_FORMATS: BarcodeFormat[] = ['CODE_128', 'CODE_39', 'PDF417', 'AZTEC', 'EAN_13', 'UPC_A'];

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  format = 'QR_CODE',
  size = 200,
  gateMode = false,
  backgroundColor,
  color = '#000000',
  quietZone,
  originalPhotoUri,
}) => {
  // In gate mode, scale up the code
  const displaySize = gateMode ? Math.min(size * 1.5, 350) : size;

  // Quiet zone (white space around code) -- larger in gate mode for reliable scanning
  const displayQuietZone = quietZone ?? (gateMode ? 24 : 12);

  // Background color
  const bgColor = backgroundColor ?? (gateMode ? '#FFFFFF' : colors.background.card);

  // === IMAGE-ONLY FALLBACK ===
  if (format === 'IMAGE_ONLY') {
    if (originalPhotoUri) {
      return (
        <View
          style={[
            styles.container,
            gateMode && styles.gateModeContainer,
            { backgroundColor: bgColor },
          ]}
        >
          <Image
            source={{ uri: originalPhotoUri }}
            style={{
              width: displaySize,
              height: displaySize,
            }}
            resizeMode="contain"
          />
        </View>
      );
    }
    // No image available either -- show placeholder
    return (
      <View
        style={[
          styles.container,
          styles.placeholderContainer,
          { backgroundColor: bgColor },
        ]}
      >
        <Text style={styles.placeholderText}>No barcode available</Text>
      </View>
    );
  }

  // === 1D / OTHER 2D BARCODES (react-native-barcode-creator) ===
  const creatorFormat = CREATOR_FORMAT_MAP[format];
  if (creatorFormat && CREATOR_FORMATS.includes(format)) {
    // Format-specific aspect ratios matching real-world barcode proportions
    const barcodeHeight = (() => {
      switch (format) {
        case 'CODE_128':
        case 'CODE_39':
          // Typical ticket barcodes: wide and short (~5:1)
          return Math.round(displaySize * 0.2);
        case 'EAN_13':
        case 'UPC_A':
          // Retail barcodes: slightly taller (~2.5:1)
          return Math.round(displaySize * 0.4);
        case 'PDF417':
          // Stacked barcode: taller than 1D (~3:1)
          return Math.round(displaySize * 0.33);
        default:
          return displaySize; // 2D codes (Aztec) are square
      }
    })();
    // Scale up slightly in gate mode for easier scanning
    const gateScaledHeight = gateMode ? Math.round(barcodeHeight * 1.3) : barcodeHeight;

    return (
      <View
        style={[
          styles.container,
          gateMode && styles.gateModeContainer,
          { backgroundColor: bgColor, padding: displayQuietZone },
        ]}
      >
        <BarcodeCreatorView
          value={data}
          format={creatorFormat}
          style={{
            width: displaySize,
            height: gateScaledHeight,
          }}
          background={bgColor}
          foregroundColor={color}
        />
      </View>
    );
  }

  // === QR CODE (default -- react-native-qrcode-svg) ===
  return (
    <View
      style={[
        styles.container,
        gateMode && styles.gateModeContainer,
        { backgroundColor: bgColor },
      ]}
    >
      <QRCode
        value={data || ' '} // QRCode crashes on empty string
        size={displaySize}
        backgroundColor={bgColor}
        color={color}
        quietZone={displayQuietZone}
        ecl="H" // High error correction for reliable gate scanning
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  gateModeContainer: {
    padding: spacing.xxl,
    borderRadius: 0,
  },
  placeholderContainer: {
    padding: spacing.xl,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.text.meta,
    fontWeight: '500',
  },
});
