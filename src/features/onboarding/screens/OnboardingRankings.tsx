/**
 * OnboardingRankings — "Rate Your Way" onboarding slide.
 * Full-width Slider Symphony demo (no phone frame).
 * Auto-demos: slider adjustment, lock mechanic, redistribute, seamless loop.
 * Nothing is tappable.
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { OnboardingCriteriaDemo } from './OnboardingCriteriaDemo';

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingRankings: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={[styles.textRegion, { paddingTop: insets.top + spacing.xxxl + spacing.lg }]}>
        <Text style={styles.title}>Rate Your Way</Text>
        <Text style={[styles.desc, { marginTop: spacing.md }]}>
          Customize what matters to you.{'\n'}Your criteria, your weights, your rankings.
        </Text>
      </View>

      {/* Full-width criteria demo */}
      <OnboardingCriteriaDemo isActive={isActive} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
});
