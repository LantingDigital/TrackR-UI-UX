import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  setOnboardingComplete,
  setRiderType,
  setHomeParkName,
  getDisplayName,
  hideDesignSampler,
  useSettingsStore,
} from '../../stores/settingsStore';
import type { RiderType } from '../../stores/settingsStore';
import { LandingDesignSampler } from './LandingDesignSampler';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ShowcaseScreen } from './screens/ShowcaseScreen';
import { HomeParkScreen } from './screens/HomeParkScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileReadyScreen } from './screens/ProfileReadyScreen';
import { colors } from '../../theme/colors';

type OnboardingStep = 'welcome' | 'showcase' | 'homePark' | 'auth' | 'profileReady';
const STEPS: OnboardingStep[] = ['welcome', 'showcase', 'homePark', 'auth', 'profileReady'];

// All onboarding steps stay dark — ProfileReadyScreen handles its own dark-to-light transition
const DARK_BG = '#0A0A0C';

export const OnboardingScreen: React.FC = () => {
  const { designSamplerMode } = useSettingsStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRiderType, setSelectedRiderType] = useState<RiderType>(null);
  const [selectedPark, setSelectedPark] = useState<string | null>(null);
  const isTransitioning = useRef(false);

  // Opacity shared value — starts at 1 for initial screen.
  // During transitions: fade to 0, swap content (still at 0), then fade to 1.
  // The key anti-flicker mechanism: screenOpacity is already 0 when React
  // commits the new step, so the new content is invisible from its first frame.
  const screenOpacity = useSharedValue(1);
  const pendingFadeIn = useRef(false);
  // Exit crossfade (dark onboarding fading out to reveal light app)
  const exitOpacity = useSharedValue(1);

  const clearTransitionLock = useCallback(() => {
    isTransitioning.current = false;
  }, []);

  const finishTransition = useCallback((targetIndex: number) => {
    // screenOpacity is 0 on the UI thread — set React state while invisible
    pendingFadeIn.current = true;
    setStepIndex(targetIndex);
  }, []);

  // useLayoutEffect fires synchronously after React commits but BEFORE the
  // browser paints. This guarantees the new content never appears at opacity > 0
  // for even a single frame. The rAF inside ensures the Reanimated UI thread
  // has the new view tree before we kick off the fade-in.
  useLayoutEffect(() => {
    if (pendingFadeIn.current) {
      pendingFadeIn.current = false;
      requestAnimationFrame(() => {
        screenOpacity.value = withTiming(1, {
          duration: 280,
          easing: Easing.out(Easing.ease),
        }, () => {
          runOnJS(clearTransitionLock)();
        });
      });
    }
  }, [stepIndex]);

  const goToStep = useCallback((targetIndex: number) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // Fade out current content, then swap
    screenOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    }, () => {
      runOnJS(finishTransition)(targetIndex);
    });
  }, [finishTransition]);

  // Commit onboarding after exit crossfade finishes
  const commitOnboarding = useCallback(() => {
    if (selectedRiderType) setRiderType(selectedRiderType);
    if (selectedPark) setHomeParkName(selectedPark);
    setOnboardingComplete();
  }, [selectedRiderType, selectedPark]);

  // Start the dark-to-light exit crossfade, then complete
  const completeOnboarding = useCallback(() => {
    StatusBar.setBarStyle('dark-content', true);
    exitOpacity.value = withTiming(0, {
      duration: 400,
      easing: Easing.in(Easing.ease),
    }, () => {
      runOnJS(commitOnboarding)();
    });
  }, [commitOnboarding]);

  // After auth, transition to profile-ready loading screen
  const handleAuthComplete = useCallback(() => {
    goToStep(4); // profileReady step
  }, [goToStep]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
  }));

  const renderStep = () => {
    switch (STEPS[stepIndex]) {
      case 'welcome':
        return <WelcomeScreen onContinue={() => goToStep(1)} />;
      case 'showcase':
        return <ShowcaseScreen onContinue={() => goToStep(2)} />;
      case 'homePark':
        return (
          <HomeParkScreen
            selectedPark={selectedPark}
            onSelect={setSelectedPark}
            onContinue={() => goToStep(3)}
            onSkip={() => goToStep(3)}
          />
        );
      case 'auth':
        return (
          <AuthScreen
            onComplete={handleAuthComplete}
            onSkip={handleAuthComplete}
          />
        );
      case 'profileReady':
        return (
          <ProfileReadyScreen onComplete={completeOnboarding} displayName={getDisplayName()} />
        );
      default:
        return null;
    }
  };

  // Design sampler mode — show landing page variants instead of onboarding
  if (designSamplerMode) {
    return <LandingDesignSampler onDismiss={hideDesignSampler} />;
  }

  return (
    <Animated.View style={[styles.wrapper, exitStyle]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Animated.View style={[styles.screen, screenStyle]}>
          {renderStep()}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  screen: {
    flex: 1,
  },
});
