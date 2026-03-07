import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { TIMING } from '../../constants/animations';
import { colors } from '../../theme/colors';
import {
  setOnboardingComplete,
  setRiderType,
} from '../../stores/settingsStore';
import type { RiderType } from '../../stores/settingsStore';
import {
  WelcomeStep,
  RiderTypeStep,
  CelebrationStep,
  OnboardingProgressDots,
} from './components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 3;

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRiderType, setSelectedRiderType] = useState<RiderType>(null);
  const translateX = useSharedValue(0);

  const advanceStep = useCallback((nextStep: number) => {
    translateX.value = withTiming(-nextStep * SCREEN_WIDTH, { duration: TIMING.slow });
    setCurrentStep(nextStep);
  }, []);

  const handleCelebrationComplete = useCallback(() => {
    setRiderType(selectedRiderType);
    setOnboardingComplete();
  }, [selectedRiderType]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Progress dots — hidden on celebration (step 2) */}
      {currentStep < 2 && (
        <View style={[styles.dotsContainer, { top: insets.top }]}>
          <OnboardingProgressDots currentStep={currentStep} totalSteps={2} />
        </View>
      )}

      {/* Horizontal step strip */}
      <Animated.View style={[styles.stepStrip, slideStyle]}>
        {/* Step 0: Welcome */}
        <View style={styles.step}>
          <WelcomeStep onContinue={() => advanceStep(1)} />
        </View>

        {/* Step 1: Rider Type */}
        <View style={styles.step}>
          <RiderTypeStep
            selectedType={selectedRiderType}
            onSelect={setSelectedRiderType}
            onContinue={() => advanceStep(2)}
          />
        </View>

        {/* Step 2: Celebration */}
        <View style={styles.step}>
          <CelebrationStep
            riderType={selectedRiderType}
            active={currentStep === 2}
            onComplete={handleCelebrationComplete}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    overflow: 'hidden',
  },
  dotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stepStrip: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * TOTAL_STEPS,
    height: SCREEN_HEIGHT,
  },
  step: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
