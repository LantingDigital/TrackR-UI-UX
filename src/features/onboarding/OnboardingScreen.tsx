/**
 * OnboardingScreen — Entry point and state machine for all onboarding.
 *
 * Flow:
 *   showcase (LandingDesignSampler with auth) →
 *   [emailVerification] (email sign-up only) →
 *   profileSetup (name + username + avatar) →
 *   celebration (ProfileReadyScreen) →
 *   app (setOnboardingComplete)
 *
 * "Browse without account" skips everything after showcase.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { setOnboardingComplete } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { LandingDesignSampler } from './LandingDesignSampler';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { ProfileReadyScreen } from './screens/ProfileReadyScreen';
import { EmailVerificationScreen } from './screens/EmailVerificationScreen';

type OnboardingPhase = 'showcase' | 'emailVerification' | 'profileSetup' | 'celebration';

export const OnboardingScreen: React.FC = () => {
  const [phase, setPhase] = useState<OnboardingPhase>('showcase');
  const [completedName, setCompletedName] = useState<string>('');
  const crossfadeOpacity = useSharedValue(1);

  const crossfadeStyle = useAnimatedStyle(() => ({
    opacity: crossfadeOpacity.value,
  }));

  // Crossfade transition between phases
  const transitionTo = useCallback((nextPhase: OnboardingPhase) => {
    crossfadeOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    }, () => {
      runOnJS(setPhase)(nextPhase);
      crossfadeOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.ease),
      });
    });
  }, []);

  // Auth succeeded → go to email verification or profile setup
  const handleAuthComplete = useCallback((needsEmailVerification: boolean) => {
    if (needsEmailVerification) {
      transitionTo('emailVerification');
    } else {
      transitionTo('profileSetup');
    }
  }, [transitionTo]);

  // Browse without account → skip everything, go to app
  const handleBrowseWithoutAccount = useCallback(() => {
    setOnboardingComplete();
  }, []);

  // Email verified → go to profile setup
  const handleEmailVerified = useCallback(() => {
    transitionTo('profileSetup');
  }, [transitionTo]);

  // Profile setup done → go to celebration
  const handleProfileComplete = useCallback((displayName: string) => {
    setCompletedName(displayName);
    transitionTo('celebration');
  }, [transitionTo]);

  // Celebration done → go to app
  const handleCelebrationComplete = useCallback(() => {
    setOnboardingComplete();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.phaseContainer, crossfadeStyle]}>
        {phase === 'showcase' && (
          <LandingDesignSampler
            onDismiss={handleAuthComplete}
            onBrowseWithoutAccount={handleBrowseWithoutAccount}
          />
        )}
        {phase === 'emailVerification' && (
          <EmailVerificationScreen onVerified={handleEmailVerified} />
        )}
        {phase === 'profileSetup' && (
          <ProfileSetupScreen onComplete={handleProfileComplete} />
        )}
        {phase === 'celebration' && (
          <ProfileReadyScreen
            onComplete={handleCelebrationComplete}
            displayName={completedName}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  phaseContainer: {
    flex: 1,
  },
});
