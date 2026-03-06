// ============================================
// Guided Tour v2 — Event Bus
//
// Lightweight pub/sub for completion detection.
// Screens emit events at interaction points;
// TourProvider subscribes and decides when to advance.
// ============================================

import type { TourEvent } from './types';

type TourEventListener = (event: TourEvent) => void;

const listeners = new Set<TourEventListener>();

export function emitTourEvent(event: TourEvent): void {
  listeners.forEach((fn) => fn(event));
}

export function onTourEvent(listener: TourEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
