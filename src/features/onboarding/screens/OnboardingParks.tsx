/**
 * OnboardingParks — "Your Park Day" onboarding slide.
 * Embeds a stripped-down Parks Hub demo inside a phone frame.
 * Auto-demos the full hub experience on a loop. Nothing is tappable.
 */
import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';
import { OnboardingParksEmbed } from './OnboardingParksEmbed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Phone frame dimensions
const PHONE_WIDTH = SCREEN_WIDTH * 0.62;
const PHONE_HEIGHT = PHONE_WIDTH * 2.0;
const PHONE_RADIUS = 40;
const PHONE_BORDER = 3;

// Scale factor: phone interior maps to full screen dimensions
const PHONE_INNER_W = PHONE_WIDTH - PHONE_BORDER * 2;
const PHONE_INNER_H = PHONE_HEIGHT - PHONE_BORDER * 2;
const SCALE = PHONE_INNER_W / SCREEN_WIDTH;
// Full-size height that maps to the phone interior when scaled
const FULL_H = PHONE_INNER_H / SCALE;

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingParks: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={[styles.textRegion, { paddingTop: insets.top + spacing.xxxl + spacing.lg }]}>
        <Text style={styles.title}>Your Park Day</Text>
        <Text style={[styles.desc, { marginTop: spacing.md }]}>
          Wait times, food, rides, passes, and{'\n'}everything you need — all in one place.
        </Text>
      </View>

      {/* Phone frame with embedded parks hub demo */}
      <View style={styles.phoneContainer}>
        <View style={styles.phoneFrame}>
          {/* Dynamic Island notch */}
          <View style={styles.dynamicIsland} />

          {/* Clip container — hides overflow from the scaled content */}
          <View style={styles.phoneInner}>
            {/* Full-size parks hub content, scaled down to fit phone frame */}
            <View
              style={{
                width: SCREEN_WIDTH,
                height: FULL_H,
                transform: [{ scale: SCALE }],
                transformOrigin: 'top left',
              }}
              pointerEvents="none"
            >
              <OnboardingParksEmbed isActive={isActive} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  textRegion: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    zIndex: 2,
  },
  title: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
    textAlign: 'center',
  },
  desc: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    letterSpacing: 0.2,
  },
  phoneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: PHONE_RADIUS,
    borderWidth: PHONE_BORDER,
    borderColor: '#2C2C2E',
    backgroundColor: colors.background.page,
    overflow: 'hidden',
    ...shadows.section,
  },
  dynamicIsland: {
    position: 'absolute',
    top: spacing.base,
    alignSelf: 'center',
    width: 90,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1C',
    zIndex: 50,
  },
  phoneInner: {
    width: PHONE_INNER_W,
    height: PHONE_INNER_H,
    overflow: 'hidden',
    borderRadius: PHONE_RADIUS - PHONE_BORDER,
  },
});
