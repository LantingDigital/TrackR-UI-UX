/**
 * Ride Log Types - Coaster Credit Tracking System
 *
 * This file contains all TypeScript interfaces for the ride logging feature.
 * Supports Quick Logs (fast check-ins) and Detailed Logs (criteria-weighted ratings).
 */

/**
 * Seat position on a coaster
 */
export interface SeatPosition {
  /** Row number (1-indexed) */
  row: number;
  /** Column/seat number (1-indexed) */
  col: number;
}

/**
 * User-defined rating criteria with personal weighting
 */
export interface RatingCriteria {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Airtime", "Theming", "Intensity") */
  name: string;
  /** User's weight for this criteria (0-100, should sum to 100 across all criteria) */
  weight: number;
  /** Optional description/hint for this criteria */
  description?: string;
  /** Icon name from Ionicons */
  icon?: string;
}

/**
 * Core ride log data model
 */
export interface RideLog {
  /** Unique identifier (UUID) */
  id: string;

  /** Coaster identifier from the database */
  coasterId: string;

  /** Display name of the coaster */
  coasterName: string;

  /** Display name of the park */
  parkName: string;

  /** When the ride was logged (ISO 8601 timestamp) */
  timestamp: string;

  /** Seat position if provided */
  seat?: SeatPosition;

  /** True if this log hasn't received a full criteria rating yet */
  isPendingRating: boolean;

  /** Individual criteria ratings (criteria id -> 1-10 rating) */
  criteriaRatings?: Record<string, number>;

  /** Calculated weighted score (0-100) after full rating */
  weightedScore?: number;

  /** User notes about this ride */
  notes?: string;

  /** Which re-ride this is for the same coaster on same day (1, 2, 3...) */
  rideCount: number;
}

/**
 * User's criteria configuration (set once during onboarding)
 */
export interface UserCriteriaConfig {
  /** User's custom criteria list */
  criteria: RatingCriteria[];
  /** When criteria were last modified (ISO 8601 timestamp) */
  lastModifiedAt: string;
  /** Whether user has completed criteria setup */
  hasCompletedSetup: boolean;
}

/**
 * Ride log store state
 */
export interface RideLogState {
  /** All ride logs */
  logs: RideLog[];
  /** User's criteria configuration */
  criteriaConfig: UserCriteriaConfig;
  /** Total credit count (unique coasters) */
  creditCount: number;
  /** Total ride count (including re-rides) */
  totalRideCount: number;
}

/**
 * Default rating criteria for new users
 */
export const DEFAULT_CRITERIA: RatingCriteria[] = [
  {
    id: 'airtime',
    name: 'Airtime',
    weight: 25,
    description: 'Moments of weightlessness',
    icon: 'airplane-outline',
  },
  {
    id: 'intensity',
    name: 'Intensity',
    weight: 25,
    description: 'Forces and thrill level',
    icon: 'flash-outline',
  },
  {
    id: 'smoothness',
    name: 'Smoothness',
    weight: 20,
    description: 'Ride comfort and lack of roughness',
    icon: 'water-outline',
  },
  {
    id: 'theming',
    name: 'Theming',
    weight: 15,
    description: 'Visual design and atmosphere',
    icon: 'color-palette-outline',
  },
  {
    id: 'pacing',
    name: 'Pacing',
    weight: 15,
    description: 'Flow and element variety',
    icon: 'speedometer-outline',
  },
];

/**
 * Default user criteria configuration
 */
export const DEFAULT_CRITERIA_CONFIG: UserCriteriaConfig = {
  criteria: DEFAULT_CRITERIA,
  lastModifiedAt: new Date().toISOString(),
  hasCompletedSetup: false,
};

/**
 * Default ride log state
 */
export const DEFAULT_RIDE_LOG_STATE: RideLogState = {
  logs: [],
  criteriaConfig: DEFAULT_CRITERIA_CONFIG,
  creditCount: 0,
  totalRideCount: 0,
};

/**
 * Helper to calculate weighted score from criteria ratings
 * @param ratings - Map of criteria id to rating (1-10)
 * @param criteria - User's criteria configuration
 * @returns Weighted score (0-100)
 */
export function calculateWeightedScore(
  ratings: Record<string, number>,
  criteria: RatingCriteria[]
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const criterion of criteria) {
    const rating = ratings[criterion.id];
    if (rating !== undefined) {
      // Convert 1-10 rating to 0-100 scale, then apply weight
      const normalizedRating = (rating / 10) * 100;
      weightedSum += normalizedRating * (criterion.weight / 100);
      totalWeight += criterion.weight;
    }
  }

  // If not all criteria are rated, normalize by actual weights used
  if (totalWeight > 0 && totalWeight < 100) {
    return Math.round((weightedSum / totalWeight) * 100);
  }

  return Math.round(weightedSum);
}

/**
 * Generate a UUID v4
 */
export function generateLogId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
