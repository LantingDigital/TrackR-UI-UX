// ============================================
// Guided Tour v2 — Tour Overlay
//
// Full-screen overlay compositing:
// 1. TargetHighlight (animated blur panels + soft glow)
// 2. Two-card cross-fade system
// 3. Touch routing: observe = block all, interact = pass-through on cutout
// 4. Floating pill for Coastle pause
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { TargetHighlight } from './TargetHighlight';
import { CoachMarkCard } from './CoachMarkCard';
import { TourFloatingPill } from './TourFloatingPill';
import { SPRINGS, TIMING } from '../../constants/animations';
import type { TourStep, TargetMeasurement } from './types';
import type { StepMode } from './useTourStepMachine';

interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: TargetMeasurement | null;
  stepMode: StepMode;
  showSkipFallback: boolean;
  onNext: () => void;
  onSkip: () => void;
  // Animated highlight SharedValues
  windowX: SharedValue<number>;
  windowY: SharedValue<number>;
  windowW: SharedValue<number>;
  windowH: SharedValue<number>;
  windowRadius: SharedValue<number>;
  windowOpacity: SharedValue<number>;
  // Coastle floating pill
  floatingPillText: string;
  floatingPillVisible: boolean;
}

// Two-card cross-fade system
function useCrossFadeCards() {
  const cardA = {
    opacity: useSharedValue(1),
    translateY: useSharedValue(0),
  };
  const cardB = {
    opacity: useSharedValue(0),
    translateY: useSharedValue(20),
  };
  const activeRef = useRef<'A' | 'B'>('A');

  const transition = () => {
    const outgoing = activeRef.current === 'A' ? cardA : cardB;
    const incoming = activeRef.current === 'A' ? cardB : cardA;

    // Fade out + drift up
    outgoing.opacity.value = withTiming(0, { duration: TIMING.normal });
    outgoing.translateY.value = withTiming(-10, { duration: TIMING.normal });

    // Fade in + slide up from below
    incoming.translateY.value = 20;
    incoming.opacity.value = withTiming(1, { duration: TIMING.normal });
    incoming.translateY.value = withSpring(0, SPRINGS.responsive);

    activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
  };

  const getActive = () => (activeRef.current === 'A' ? cardA : cardB);
  const getInactive = () => (activeRef.current === 'A' ? cardB : cardA);

  return { cardA, cardB, transition, getActive, getInactive, activeRef };
}

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  stepMode,
  showSkipFallback,
  onNext,
  onSkip,
  windowX,
  windowY,
  windowW,
  windowH,
  windowRadius,
  windowOpacity,
  floatingPillText,
  floatingPillVisible,
}: TourOverlayProps) {
  const crossFade = useCrossFadeCards();
  const prevStepIndexRef = useRef(stepIndex);
  const [prevStep, setPrevStep] = useState<TourStep | null>(null);
  const [prevTargetRect, setPrevTargetRect] = useState<TargetMeasurement | null>(null);

  // Trigger cross-fade on step change
  useEffect(() => {
    if (stepIndex !== prevStepIndexRef.current) {
      // Save current as "previous" for the outgoing card
      setPrevStep(step);
      setPrevTargetRect(targetRect);
      crossFade.transition();
      prevStepIndexRef.current = stepIndex;
    }
  }, [stepIndex]);

  const isInteract = step.kind === 'interact';
  const isLastStep = stepIndex === totalSteps - 1;
  const isPaused = stepMode === 'paused';

  const active = crossFade.getActive();
  const inactive = crossFade.getInactive();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blur panels — always present, animated */}
      <TargetHighlight
        windowX={windowX}
        windowY={windowY}
        windowW={windowW}
        windowH={windowH}
        windowRadius={windowRadius}
        windowOpacity={windowOpacity}
        allowTouchThrough={isInteract}
      />

      {/* Touch-blocking overlay for observe steps */}
      {!isInteract && !isPaused && (
        <Pressable style={StyleSheet.absoluteFill} pointerEvents="box-only" />
      )}

      {/* Outgoing card (fading out) */}
      {prevStep && (
        <CoachMarkCard
          title={prevStep.title}
          body={prevStep.body}
          instruction={prevStep.kind === 'interact' ? prevStep.instruction : undefined}
          stepIndex={Math.max(0, stepIndex - 1)}
          totalSteps={totalSteps}
          targetRect={prevTargetRect}
          isInteract={prevStep.kind === 'interact'}
          showSkipFallback={false}
          isLastStep={false}
          onNext={() => {}}
          onSkip={() => {}}
          opacity={inactive.opacity}
          translateY={inactive.translateY}
        />
      )}

      {/* Active card */}
      {!isPaused && (
        <CoachMarkCard
          title={step.title}
          body={step.body}
          instruction={step.kind === 'interact' ? step.instruction : undefined}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          targetRect={targetRect}
          isInteract={isInteract}
          showSkipFallback={showSkipFallback}
          isLastStep={isLastStep}
          onNext={onNext}
          onSkip={onSkip}
          opacity={active.opacity}
          translateY={active.translateY}
        />
      )}

      {/* Floating pill for Coastle pause */}
      <TourFloatingPill visible={floatingPillVisible} text={floatingPillText} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
});
