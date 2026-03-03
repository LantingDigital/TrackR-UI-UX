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
import type { NotificationPrefs } from './components/NotificationPrefsStep';
import {
  WelcomeStep,
  RiderTypeStep,
  HomeParksStep,
  ProfileSetupStep,
  NotificationPrefsStep,
  CelebrationStep,
  OnboardingProgressDots,
} from './components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 6;

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRiderType, setSelectedRiderType] = useState<RiderType>(null);
  const [selectedParks, setSelectedParks] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    newRides: true,
    news: true,
    community: true,
    atPark: true,
  });
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
      {/* Progress dots — hidden on celebration (step 5) */}
      {currentStep < 5 && (
        <View style={[styles.dotsContainer, { top: insets.top }]}>
          <OnboardingProgressDots currentStep={currentStep} totalSteps={5} />
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

        {/* Step 2: Home Parks */}
        <View style={styles.step}>
          <HomeParksStep
            selectedParks={selectedParks}
            onParksChange={setSelectedParks}
            onContinue={() => advanceStep(3)}
          />
        </View>

        {/* Step 3: Profile Setup */}
        <View style={styles.step}>
          <ProfileSetupStep
            displayName={displayName}
            bio={bio}
            onDisplayNameChange={setDisplayName}
            onBioChange={setBio}
            onContinue={() => advanceStep(4)}
          />
        </View>

        {/* Step 4: Notification Preferences */}
        <View style={styles.step}>
          <NotificationPrefsStep
            prefs={notificationPrefs}
            onPrefsChange={setNotificationPrefs}
            onContinue={() => advanceStep(5)}
          />
        </View>

        {/* Step 5: Celebration */}
        <View style={styles.step}>
          <CelebrationStep
            riderType={selectedRiderType}
            active={currentStep === 5}
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
