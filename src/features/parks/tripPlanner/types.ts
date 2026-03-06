// ============================================
// Trip Planner v4 — Types
// ============================================

export type POICategory = 'ride' | 'food' | 'shop' | 'theater' | 'attraction' | 'service' | 'break';
export type StopState = 'pending' | 'walking' | 'in_line' | 'done' | 'skipped';
export type TripMode = 'concierge' | 'speed_run';
export type TripStatus = 'planning' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface TripStop {
  id: string;
  poiId: string;
  name: string;
  category: POICategory;
  order: number;
  state: StopState;

  // Estimates (minutes)
  estimatedWalkMin: number;
  estimatedWaitMin: number;
  estimatedRideMin: number;

  // Actual tracked times
  walkStartedAt?: number;
  lineStartedAt?: number;
  completedAt?: number;
  skippedAt?: number;
  actualWaitMin?: number;
  actualWalkMin?: number;

  // Metadata
  thrillLevel?: string;
  area?: string;
  isBreak?: boolean;
  breakDurationMin?: number;
}

export interface BudgetEstimate {
  totalMin: number;
  budgetMin: number;
  overByMin: number;
  isOverBudget: boolean;
}

export interface PaceSnapshot {
  timestamp: number;
  stopsCompleted: number;
  totalStops: number;
  elapsedMin: number;
  deltaMin: number; // positive = behind, negative = ahead
}

export interface TripPlan {
  id: string;
  parkId: string;
  parkName: string;
  stops: TripStop[];
  mode: TripMode;
  timeBudgetMin: number; // 0 = all day
  status: TripStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  paceSnapshots: PaceSnapshot[];
  waitTimeLog: Array<{
    poiId: string;
    estimatedMin: number;
    actualMin: number;
    timestamp: number;
  }>;
}

export interface TripPlannerState {
  currentPlan: TripPlan | null;
  pastPlans: TripPlan[];
  globalWaitLog: Array<{
    poiId: string;
    actualMin: number;
    dayOfWeek: number;
    hourOfDay: number;
    timestamp: number;
  }>;
}

export interface TradeOffSuggestion {
  type: 'add' | 'skip';
  message: string;
  stopId?: string;
  poiId?: string;
  deltaMin: number;
  dismissed: boolean;
}

export interface SelectablePOI {
  id: string;
  name: string;
  category: POICategory;
  thrillLevel?: string;
  area?: string;
  coasterId?: string;
  description?: string;
  estimatedWaitMin?: number;
  estimatedRideMin?: number;
}
