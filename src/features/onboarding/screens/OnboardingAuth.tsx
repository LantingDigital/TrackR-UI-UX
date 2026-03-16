/**
 * OnboardingAuth — Screen 9 (final) of the design sampler.
 *
 * Full-screen auth experience — NOT in a phone frame.
 * This is the real interaction point where users create their account.
 * Feels like a premium conclusion to the onboarding showcase.
 */

import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { OnboardingAuthEmbed } from './OnboardingAuthEmbed';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  isActive: boolean;
}

export const OnboardingAuth: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  return (
    <View style={styles.container}>
      <OnboardingAuthEmbed isActive={isActive} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
