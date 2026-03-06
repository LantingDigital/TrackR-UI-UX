// ============================================
// Guided Tour — Target Registration Hook
//
// Screens wrap their target elements with a View
// and pass the ref from this hook. The tour system
// measures the View's position when its step activates.
// ============================================

import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { useTourContext } from './TourProvider';

export function useTourTarget(targetId: string) {
  const viewRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useTourContext();

  useEffect(() => {
    registerTarget(targetId, viewRef);
    return () => unregisterTarget(targetId);
  }, [targetId, registerTarget, unregisterTarget]);

  return viewRef;
}
