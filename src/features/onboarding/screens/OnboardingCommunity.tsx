/**
 * OnboardingCommunity — Onboarding slide for the community feature.
 * Embeds a stripped-down community feed inside a phone frame.
 * Auto-demos scrolling, post cards, and a like animation on a loop.
 */
import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';
import { OnboardingCommunityEmbed } from './OnboardingCommunityEmbed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Phone frame dimensions (matches OnboardingSearch exactly)
const PHONE_WIDTH = SCREEN_WIDTH * 0.62;
const PHONE_HEIGHT = PHONE_WIDTH * 2.0;
const PHONE_RADIUS = 40;
const PHONE_BORDER = 3;

const PHONE_INNER_W = PHONE_WIDTH - PHONE_BORDER * 2;
const PHONE_INNER_H = PHONE_HEIGHT - PHONE_BORDER * 2;
const SCALE = PHONE_INNER_W / SCREEN_WIDTH;
const FULL_H = PHONE_INNER_H / SCALE;

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingCommunity: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={[styles.textRegion, { paddingTop: insets.top + spacing.xxxl + spacing.lg }]}>
        <Text style={styles.title}>Ride Together</Text>
        <Text style={[styles.desc, { marginTop: spacing.md }]}>
          Trip reports, reviews, and a community{'\n'}of riders who get it.
        </Text>
      </View>

      {/* Phone frame with embedded community feed */}
      <View style={styles.phoneContainer}>
        <View style={styles.phoneFrame}>
          {/* Dynamic Island notch */}
          <View style={styles.dynamicIsland} />

          {/* Clip container */}
          <View style={styles.phoneInner}>
            {/* Full-size content, scaled down to fit phone frame */}
            <View
              style={{
                width: SCREEN_WIDTH,
                height: FULL_H,
                transform: [{ scale: SCALE }],
                transformOrigin: 'top left',
              }}
              pointerEvents="none"
            >
              <OnboardingCommunityEmbed isActive={isActive} />
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
