// ============================================
// Guided Tour v2 — Provider
//
// Manages tour state machine, tab navigation,
// target measurement, pill ref registry, event bus
// subscription, and renders TourOverlay with
// SharedValue-driven animations (no blink).
// ============================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { InteractionManager, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { runOnJS } from 'react-native-reanimated';
import type { MorphingPillRef } from '../../components/MorphingPill';

import { TOUR_STEPS } from './tourSteps';
import { setTourSeen } from './tourStore';
import { useAnimatedHighlight } from './useAnimatedHighlight';
import { useTourStepMachine } from './useTourStepMachine';
import { haptics } from '../../services/haptics';
import { TourOverlay } from './TourOverlay';
import type {
  TourContextValue,
  TargetRegistry,
  PillRegistry,
  TargetMeasurement,
  TourStep,
  InteractStep,
} from './types';

// ============================================
// Context
// ============================================

const TourContext = createContext<TourContextValue | null>(null);

export function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTourContext must be used within TourProvider');
  return ctx;
}

// ============================================
// Measurement helper
// ============================================

function measureTarget(
  registry: TargetRegistry,
  targetId: string,
): Promise<TargetMeasurement | null> {
  return new Promise((resolve) => {
    const ref = registry.get(targetId);
    if (!ref?.current) {
      resolve(null);
      return;
    }

    let attempts = 0;
    const tryMeasure = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          resolve({ x, y, width, height });
        } else if (attempts < 3) {
          attempts++;
          setTimeout(tryMeasure, 100 * attempts);
        } else {
          resolve(null);
        }
      });
    };
    tryMeasure();
  });
}

// ============================================
// Provider
// ============================================

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const navigation = useNavigation<any>();
  const registryRef = useRef<TargetRegistry>(new Map());
  const pillRegistryRef = useRef<PillRegistry>(new Map());

  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetMeasurement | null>(null);
  const [floatingPillText, setFloatingPillText] = useState('');
  const [floatingPillVisible, setFloatingPillVisible] = useState(false);

  const currentStep: TourStep | null = isActive ? TOUR_STEPS[stepIndex] ?? null : null;

  // Animated highlight controller (SharedValues)
  const highlight = useAnimatedHighlight();

  // ---- Target registration ----
  const registerTarget = useCallback((id: string, ref: React.RefObject<View | null>) => {
    registryRef.current.set(id, ref);
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  // ---- Pill registration ----
  const registerPill = useCallback((id: string, ref: React.RefObject<MorphingPillRef | null>) => {
    pillRegistryRef.current.set(id, ref);
  }, []);

  const unregisterPill = useCallback((id: string) => {
    pillRegistryRef.current.delete(id);
  }, []);

  // ---- Navigate to tab + measure ----
  const navigateAndMeasure = useCallback(
    async (step: TourStep, prevTab?: string): Promise<TargetMeasurement | null> => {
      const needsTabSwitch = prevTab !== undefined && step.tab !== prevTab;

      if (needsTabSwitch) {
        // Fade out cutout before switching
        highlight.fadeOut();
        await new Promise<void>((r) => setTimeout(r, 250));
      }

      // Navigate to correct tab
      if (step.tab === 'Community') {
        navigation.navigate('CommunityOverlay');
      } else {
        navigation.navigate('Tabs', { screen: step.tab });
      }

      // Wait for navigation to settle
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(resolve, 200);
        });
      });

      // Measure target
      let measurement: TargetMeasurement | null = null;
      if (step.targetId) {
        measurement = await measureTarget(registryRef.current, step.targetId);
      }

      // Update highlight
      if (measurement) {
        if (needsTabSwitch) {
          // Set position instantly (invisible), then fade in
          highlight.setInstant(measurement);
          highlight.fadeIn();
        } else {
          // Morph from current position
          highlight.animateTo(measurement);
        }
      } else {
        // No target — hide cutout (full blur)
        highlight.clearCutout();
      }

      setTargetRect(measurement);
      return measurement;
    },
    [navigation, highlight],
  );

  // ---- Advance to next step ----
  const advanceStep = useCallback(async () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= TOUR_STEPS.length) {
      // Tour complete
      setIsActive(false);
      setTourSeen();
      haptics.success();
      setFloatingPillVisible(false);
      navigation.navigate('Tabs', { screen: 'Home' });
      return;
    }

    const currentTab = TOUR_STEPS[stepIndex].tab;
    const nextStepData = TOUR_STEPS[nextIdx];

    haptics.tap();
    if (nextStepData.tab !== currentTab) {
      haptics.select();
    }

    // Handle Coastle return: close pill, navigate back
    if (TOUR_STEPS[stepIndex].id === 'coastle-tease') {
      setFloatingPillText('Nice guess! Continuing tour...');
      await new Promise<void>((r) => setTimeout(r, 1000));
      setFloatingPillVisible(false);
      navigation.goBack(); // Leave Coastle
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(resolve, 300);
        });
      });
    }

    // Handle Settings return
    if (TOUR_STEPS[stepIndex].id === 'profile-settings') {
      navigation.goBack(); // Leave Settings
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(resolve, 300);
        });
      });
    }

    // Close any open MorphingPills before advancing
    const currentStepData = TOUR_STEPS[stepIndex];
    if (currentStepData.kind === 'interact') {
      const action = (currentStepData as InteractStep).action;
      if (action.type === 'morphingPill') {
        const pillRef = pillRegistryRef.current.get(action.pillId);
        if (pillRef?.current?.isOpen) {
          pillRef.current.close();
          await new Promise<void>((r) => setTimeout(r, 500));
        }
      } else if (action.type === 'search') {
        const searchRef = pillRegistryRef.current.get('search');
        if (searchRef?.current?.isOpen) {
          searchRef.current.close();
          await new Promise<void>((r) => setTimeout(r, 500));
        }
      }
    }

    setStepIndex(nextIdx);
    await navigateAndMeasure(nextStepData, currentTab);

    // Coastle: navigate and set up floating pill
    if (nextStepData.id === 'coastle-tease') {
      highlight.clearCutout();
      await new Promise<void>((r) => setTimeout(r, 300));
      navigation.navigate('Coastle');
      stepMachine.setMode('paused');
      setFloatingPillText('Play one round! Tour will resume after.');
      setFloatingPillVisible(true);
    }
  }, [stepIndex, navigateAndMeasure, navigation, highlight]);

  // ---- Step machine ----
  const stepMachine = useTourStepMachine({
    currentStep,
    isActive,
    onComplete: advanceStep,
  });

  // ---- Start tour ----
  const startTour = useCallback(async () => {
    setStepIndex(0);
    setIsActive(true);
    haptics.select();
    await navigateAndMeasure(TOUR_STEPS[0]);
  }, [navigateAndMeasure]);

  // ---- Next step (manual) ----
  const nextStep = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  // ---- Skip tour ----
  const skipTour = useCallback(() => {
    setIsActive(false);
    setTourSeen();
    setFloatingPillVisible(false);
    haptics.tap();
    highlight.clearCutout();
    navigation.navigate('Tabs', { screen: 'Home' });
  }, [navigation, highlight]);

  // ---- Context value ----
  const value = useMemo<TourContextValue>(
    () => ({
      isActive,
      currentStepIndex: stepIndex,
      totalSteps: TOUR_STEPS.length,
      startTour,
      nextStep,
      skipTour,
      registerTarget,
      unregisterTarget,
      registerPill,
      unregisterPill,
    }),
    [isActive, stepIndex, startTour, nextStep, skipTour, registerTarget, unregisterTarget, registerPill, unregisterPill],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && currentStep && (
        <TourOverlay
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={TOUR_STEPS.length}
          targetRect={targetRect}
          stepMode={stepMachine.mode}
          showSkipFallback={stepMachine.showSkipFallback}
          onNext={nextStep}
          onSkip={skipTour}
          windowX={highlight.windowX}
          windowY={highlight.windowY}
          windowW={highlight.windowW}
          windowH={highlight.windowH}
          windowRadius={highlight.windowRadius}
          windowOpacity={highlight.windowOpacity}
          floatingPillText={floatingPillText}
          floatingPillVisible={floatingPillVisible}
        />
      )}
    </TourContext.Provider>
  );
}
