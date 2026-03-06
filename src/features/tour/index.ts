// ============================================
// Guided Tour v2 — Barrel Exports
// ============================================

export { TourProvider, useTourContext } from './TourProvider';
export { useTourTarget } from './useTourTarget';
export { useTourStore, setTourSeen, resetTourSeen } from './tourStore';
export { emitTourEvent, onTourEvent } from './tourEvents';
export { TOUR_STEPS } from './tourSteps';
export type {
  TourStep,
  ObserveStep,
  InteractStep,
  TourContextValue,
  TargetMeasurement,
  ArrowDirection,
  TourTab,
  TourEvent,
  InteractAction,
} from './types';
