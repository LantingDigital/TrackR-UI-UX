/**
 * QRCodeDisplay Component
 *
 * Renders a QR code as SVG from decoded data.
 * Supports gate mode with larger size and enhanced visibility.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme';

interface QRCodeDisplayProps {
  /** The data to encode in the QR code */
  data: string;
  /** Size of the QR code in pixels */
  size?: number;
  /** Whether gate mode is active (larger, high contrast) */
  gateMode?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Foreground (code) color */
  color?: string;
  /** Quiet zone size around the code */
  quietZone?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  size = 200,
  gateMode = false,
  backgroundColor,
  color = '#000000',
  quietZone,
}) => {
  // In gate mode, scale up the QR code
  const displaySize = gateMode ? Math.min(size * 1.5, 350) : size;

  // Quiet zone (white space around code) - larger in gate mode for better scanning
  const displayQuietZone = quietZone ?? (gateMode ? 24 : 12);

  // Background color
  const bgColor = backgroundColor ?? (gateMode ? '#FFFFFF' : colors.background.card);

  return (
    <View
      style={[
        styles.container,
        gateMode && styles.gateModeContainer,
        { backgroundColor: bgColor },
      ]}
    >
      <QRCode
        value={data}
        size={displaySize}
        backgroundColor={bgColor}
        color={color}
        quietZone={displayQuietZone}
        ecl="H" // High error correction for better reliability
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  gateModeContainer: {
    padding: 24,
    borderRadius: 0,
  },
});
