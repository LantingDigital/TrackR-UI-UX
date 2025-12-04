/**
 * GateModeOverlay Component
 *
 * Wrapper component that manages screen brightness for gate mode.
 * - Sets brightness to maximum when active
 * - Restores original brightness when deactivated
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Brightness from 'expo-brightness';

interface GateModeOverlayProps {
  /** Whether gate mode is active */
  active: boolean;
  /** Content to wrap */
  children: ReactNode;
}

export const GateModeOverlay: React.FC<GateModeOverlayProps> = ({
  active,
  children,
}) => {
  // Store original brightness to restore later
  const originalBrightness = useRef<number | null>(null);

  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (active) {
          // Save current brightness before changing
          if (originalBrightness.current === null) {
            const current = await Brightness.getBrightnessAsync();
            originalBrightness.current = current;
          }

          // Set to maximum brightness
          await Brightness.setBrightnessAsync(1);
        } else {
          // Restore original brightness
          if (originalBrightness.current !== null) {
            await Brightness.setBrightnessAsync(originalBrightness.current);
            originalBrightness.current = null;
          }
        }
      } catch (error) {
        console.warn('Failed to manage brightness:', error);
        // Brightness APIs may fail on some devices or in simulator
        // Fail silently - gate mode will still work, just without brightness boost
      }
    };

    manageBrightness();

    // Cleanup: restore brightness when component unmounts
    return () => {
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [active]);

  return (
    <View style={[styles.container, active && styles.gateModeActive]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateModeActive: {
    backgroundColor: '#FFFFFF',
  },
});
