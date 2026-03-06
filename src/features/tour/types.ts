// ============================================
// Guided Tour v2 — Types
// ============================================

import type { RefObject } from 'react';
import type { View } from 'react-native';
import type { MorphingPillRef } from '../../components/MorphingPill';

// ---- Tabs ----

export type TourTab = 'Home' | 'Parks' | 'Logbook' | 'Community' | 'Profile';

// ---- Target measurement ----

export interface TargetMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ArrowDirection = 'up' | 'down' | 'none';

// ---- Registries ----

export type TargetRegistry = Map<string, RefObject<View | null>>;
export type PillRegistry = Map<string, RefObject<MorphingPillRef | null>>;

// ---- Interactive actions ----

export type InteractAction =
  | { type: 'morphingPill'; pillId: string }
  | { type: 'search'; prefillQuery: string; expectedCoasterId: string }
  | { type: 'segmentedControl'; targetSegment: string }
  | { type: 'coastleRound'; roundCount: number }
  | { type: 'tapNavigate'; expectedScreen: string };

// ---- Step types (discriminated union) ----

interface TourStepBase {
  id: string;
  tab: TourTab;
  targetId: string | null;
  title: string;
  body: string;
  instruction?: string;
}

export interface ObserveStep extends TourStepBase {
  kind: 'observe';
}

export interface InteractStep extends TourStepBase {
  kind: 'interact';
  action: InteractAction;
  timeoutMs?: number;
}

export type TourStep = ObserveStep | InteractStep;

// ---- Tour events (emitted by screens, consumed by tour provider) ----

export type TourEvent =
  | { type: 'morphingPill:opened'; pillId: string }
  | { type: 'morphingPill:closed'; pillId: string }
  | { type: 'search:queryChanged'; query: string }
  | { type: 'coasterSheet:opened' }
  | { type: 'coasterSheet:closed' }
  | { type: 'segmentedControl:changed'; segment: string }
  | { type: 'coastle:guessSubmitted'; guessCount: number }
  | { type: 'navigation:screenFocused'; screenName: string };

// ---- Context ----

export interface TourContextValue {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  registerTarget: (id: string, ref: RefObject<View | null>) => void;
  unregisterTarget: (id: string) => void;
  registerPill: (id: string, ref: RefObject<MorphingPillRef | null>) => void;
  unregisterPill: (id: string) => void;
}
