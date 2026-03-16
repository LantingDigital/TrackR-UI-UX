/**
 * OnboardingRate -- Screen 5 of onboarding.
 * Same embedded approach as OnboardingSearch/Log/Scan but demos the Rate flow.
 * Shows the weighted rating system -- user rates a coaster across multiple categories.
 */
import React, { memo } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';
import { OnboardingSearchEmbed } from './OnboardingSearchEmbed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PHONE_WIDTH = SCREEN_WIDTH * 0.62;
const PHONE_HEIGHT = PHONE_WIDTH * 2.0;
const PHONE_RADIUS = 40;
const PHONE_BORDER = 3;
const PHONE_INNER_W = PHONE_WIDTH - PHONE_BORDER * 2;
const PHONE_INNER_H = PHONE_HEIGHT - PHONE_BORDER * 2;
const SCALE = PHONE_INNER_W / SCREEN_WIDTH;
const FULL_H = PHONE_INNER_H / SCALE;
const DYNAMIC_ISLAND_W = 90;
const DYNAMIC_ISLAND_H = 28;
// Height of the notch cover inside the phone frame (clears dynamic island + small gap)
const NOTCH_COVER_H = DYNAMIC_ISLAND_H + spacing.base + 4; // 44px

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingRate: React.FC<OnboardingScreenProps> = memo(({ isActive }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.textRegion, { paddingTop: insets.top + spacing.xxxl + spacing.lg }]}>
        <Text style={styles.title}>Rate What Matters</Text>
        <Text style={[styles.desc, { marginTop: spacing.md }]}>
          Not just a number.{'\n'}Rate every aspect that matters to you.
        </Text>
      </View>

      <View style={styles.phoneContainer}>
        {/* Shadow wrapper — keeps shadow on a static view, not on the content-heavy frame */}
        <View style={styles.phoneShadow}>
          <View style={styles.phoneFrame}>
            <View style={styles.dynamicIsland} />
            {/* Notch cover — solid background behind dynamic island to prevent content bleed-through */}
            <View style={styles.notchCover} />
            <View style={styles.phoneInner}>
              <View
                style={styles.scaledContent}
                pointerEvents="none"
                // Rasterize the scaled content into a single texture for GPU efficiency
                {...(Platform.OS === 'ios'
                  ? { shouldRasterizeIOS: true }
                  : { renderToHardwareTextureAndroid: true })}
              >
                <OnboardingSearchEmbed isActive={isActive} demoMode="rate" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  textRegion: { alignItems: 'center', paddingHorizontal: spacing.xxxl, zIndex: 2 },
  title: { fontSize: typography.sizes.display, fontWeight: typography.weights.bold, color: colors.text.primary, letterSpacing: -1, textAlign: 'center' },
  desc: { fontSize: typography.sizes.body, fontWeight: typography.weights.regular, color: colors.text.secondary, textAlign: 'center', lineHeight: typography.sizes.body * typography.lineHeights.relaxed, letterSpacing: 0.2 },
  phoneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: spacing.xxxl },
  phoneShadow: {
    borderRadius: PHONE_RADIUS,
    ...shadows.section,
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: PHONE_RADIUS,
    borderWidth: PHONE_BORDER,
    borderColor: '#2C2C2E',
    backgroundColor: colors.background.page,
    overflow: 'hidden',
  },
  notchCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: NOTCH_COVER_H,
    backgroundColor: colors.background.page,
    zIndex: 45,
  },
  dynamicIsland: { position: 'absolute', top: spacing.base, alignSelf: 'center', width: DYNAMIC_ISLAND_W, height: DYNAMIC_ISLAND_H, borderRadius: DYNAMIC_ISLAND_H / 2, backgroundColor: '#1A1A1C', zIndex: 50 },
  phoneInner: { width: PHONE_INNER_W, height: PHONE_INNER_H, overflow: 'hidden', borderRadius: PHONE_RADIUS - PHONE_BORDER },
  scaledContent: {
    width: SCREEN_WIDTH,
    height: FULL_H,
    transform: [{ scale: SCALE }],
    transformOrigin: 'top left',
  },
});
