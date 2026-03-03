// ============================================
// Trip Planner v2 — Types
// ============================================

export type POICategory = 'ride' | 'food' | 'shop' | 'theater' | 'attraction' | 'service' | 'break';
export type StopState = 'pending' | 'walking' | 'in_line' | 'done' | 'skipped';
export type TripMode = 'concierge' | 'speed_run';
export type TripStatus = 'planning' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface TripStop {
  id: string;                   // uuid
  poiId: string;                // ParkPOI.id or coaster ID
  name: string;
  category: POICategory;
  order: number;
  state: StopState;

  // Estimates (minutes)
  estimatedWalkMin: number;
  estimatedWaitMin: number;
  estimatedRideMin: number;     // 0 for non-rides

  // Actual tracked times
  walkStartedAt?: number;
  lineStartedAt?: number;
  completedAt?: number;
  skippedAt?: number;
  actualWaitMin?: number;       // lineStartedAt → completedAt
  actualWalkMin?: number;       // walkStartedAt → lineStartedAt

  // Metadata
  thrillLevel?: string;
  area?: string;
  isBreak?: boolean;
  breakDurationMin?: number;
}

export interface PaceSnapshot {
  timestamp: number;
  stopsCompleted: number;
  totalStops: number;
  elapsedMin: number;
  deltaMin: number;             // positive=behind, negative=ahead
}

export interface TradeOffSuggestion {
  type: 'add' | 'skip';
  message: string;              // "You're 12 min ahead — you could add Silver Bullet."
  stopId?: string;
  poiId?: string;
  deltaMin: number;
  dismissed: boolean;
}

export interface TripPlan {
  id: string;
  parkId: string;
  parkName: string;
  stops: TripStop[];
  mode: TripMode;
  timeBudgetMin: number;        // 0 = all day
  status: TripStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  paceSnapshots: PaceSnapshot[];
  currentSuggestion: TradeOffSuggestion | null;
  targetTimeMin?: number;       // Speed Run goal
  waitTimeLog: Array<{
    poiId: string;
    estimatedMin: number;
    actualMin: number;
    timestamp: number;
  }>;
}

export interface TripPlannerState {
  currentPlan: TripPlan | null;
  pastPlans: TripPlan[];        // capped at 30
  globalWaitLog: Array<{        // persists across trips for better estimates
    poiId: string;
    actualMin: number;
    dayOfWeek: number;
    hourOfDay: number;
    timestamp: number;
  }>;
}

// ---- Convenience type for POI selection ----

export interface SelectablePOI {
  id: string;
  name: string;
  category: POICategory;
  thrillLevel?: string;
  area?: string;
  coasterId?: string;
  menuDescription?: string;
  description?: string;
  estimatedWaitMin?: number;
  estimatedRideMin?: number;
}
