// ============================================
// Guided Tour v2 — Step Machine
//
// Manages observe vs interact mode, event
// subscriptions, timeouts, and auto-advance.
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';

import { onTourEvent } from './tourEvents';
import type { TourStep, InteractStep, TourEvent } from './types';

export type StepMode = 'idle' | 'observe' | 'interact' | 'paused';

interface StepMachineConfig {
  currentStep: TourStep | null;
  isActive: boolean;
  onComplete: () => void;
}

export function useTourStepMachine({ currentStep, isActive, onComplete }: StepMachineConfig) {
  const [mode, setMode] = useState<StepMode>('idle');
  const [showSkipFallback, setShowSkipFallback] = useState(false);
  const [interactPhase, setInteractPhase] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // When step changes, reset machine state
  useEffect(() => {
    clearTimer();
    setShowSkipFallback(false);
    setInteractPhase(0);
    completedRef.current = false;

    if (!isActive || !currentStep) {
      setMode('idle');
      return;
    }

    if (currentStep.kind === 'observe') {
      setMode('observe');
    } else {
      setMode('interact');

      // Start timeout for interact steps
      const step = currentStep as InteractStep;
      const timeout = step.timeoutMs ?? 8000;
      timeoutRef.current = setTimeout(() => {
        if (!completedRef.current) {
          setShowSkipFallback(true);
        }
      }, timeout);
    }

    return clearTimer;
  }, [currentStep?.id, isActive, clearTimer]);

  // Listen to tour events for interact step completion
  useEffect(() => {
    if (!isActive || !currentStep || currentStep.kind !== 'interact') return;

    const step = currentStep as InteractStep;
    const { action } = step;

    const unsubscribe = onTourEvent((event: TourEvent) => {
      if (completedRef.current) return;

      switch (action.type) {
        case 'morphingPill':
          if (event.type === 'morphingPill:opened' && event.pillId === action.pillId) {
            completedRef.current = true;
            clearTimer();
            // Wait for user to see the pill open, then advance
            setTimeout(onComplete, 2000);
          }
          break;

        case 'search':
          // Multi-phase: 0 = waiting for search open, 1 = waiting for query, 2 = waiting for sheet
          if (interactPhase === 0 && event.type === 'morphingPill:opened' && event.pillId === 'search') {
            setInteractPhase(1);
          } else if (interactPhase === 1 && event.type === 'search:queryChanged') {
            const q = event.query.toLowerCase();
            if (q.includes('steel') || q.length >= 3) {
              setInteractPhase(2);
            }
          } else if (interactPhase === 2 && event.type === 'coasterSheet:opened') {
            completedRef.current = true;
            clearTimer();
            setTimeout(onComplete, 2500);
          }
          break;

        case 'segmentedControl':
          if (event.type === 'segmentedControl:changed') {
            completedRef.current = true;
            clearTimer();
            setTimeout(onComplete, 800);
          }
          break;

        case 'coastleRound':
          if (event.type === 'coastle:guessSubmitted' && event.guessCount >= action.roundCount) {
            completedRef.current = true;
            clearTimer();
            setTimeout(onComplete, 1500);
          }
          break;

        case 'tapNavigate':
          if (event.type === 'navigation:screenFocused' && event.screenName === action.expectedScreen) {
            completedRef.current = true;
            clearTimer();
            setTimeout(onComplete, 2000);
          }
          break;
      }
    });

    return unsubscribe;
  }, [currentStep?.id, isActive, interactPhase, onComplete, clearTimer]);

  return {
    mode,
    setMode,
    showSkipFallback,
    interactPhase,
  };
}
