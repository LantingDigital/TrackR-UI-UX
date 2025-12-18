/**
 * Wallet Types - Theme Park Ticket Storage System
 *
 * This file contains all TypeScript interfaces for the mobile wallet feature.
 * The wallet stores theme park tickets locally with QR code regeneration support.
 */

import { ImageSourcePropType } from 'react-native';

/**
 * Supported theme park chains for ticket identification and branding
 */
export type ParkChain =
  | 'disney'
  | 'universal'
  | 'cedar_fair'
  | 'six_flags'
  | 'seaworld'
  | 'busch_gardens'
  | 'other';

/**
 * Pass types supported by the wallet
 */
export type PassType =
  | 'day_pass'
  | 'multi_day'
  | 'annual_pass'
  | 'season_pass'
  | 'vip'
  | 'parking'
  | 'express'
  | 'unknown';

/**
 * Status of a ticket
 */
export type TicketStatus = 'active' | 'expired' | 'used';

/**
 * Supported barcode formats
 */
export type BarcodeFormat = 'QR_CODE' | 'AZTEC' | 'PDF417' | 'DATA_MATRIX';

/**
 * Core ticket data model
 */
export interface Ticket {
  /** Unique identifier (UUID) */
  id: string;

  /** Display name of the park */
  parkName: string;

  /** Identified park chain for branding */
  parkChain: ParkChain;

  /** Type of pass/ticket */
  passType: PassType;

  /** Guest name if available from ticket */
  passholder?: string;

  /** Start of validity period (ISO 8601 date) */
  validFrom: string;

  /** End of validity period (ISO 8601 date) */
  validUntil: string;

  /** Raw decoded QR/barcode content for SVG regeneration */
  qrData: string;

  /** Format of the original barcode */
  qrFormat: BarcodeFormat;

  /** Hero image URI for the pass card (park-specific artwork) - remote URL */
  heroImageUri?: string;

  /** Hero image source for bundled/local images (alternative to heroImageUri) */
  heroImageSource?: ImageSourcePropType;

  /** Park logo image URI (optional, for expanded view overlay) - remote URL */
  logoImageUri?: string;

  /** Park logo image source for bundled/local images (alternative to logoImageUri) */
  logoImageSource?: ImageSourcePropType;

  /** Whether this pass is pinned as a favorite (up to 3 allowed) */
  isFavorite: boolean;

  /** Local file path to backup photo of original ticket */
  originalPhotoUri?: string;

  /** Current status of the ticket */
  status: TicketStatus;

  /** Whether this is the default ticket shown first */
  isDefault: boolean;

  /** When the ticket was added (ISO 8601 timestamp) */
  addedAt: string;

  /** Last time this ticket was displayed at a gate */
  lastUsedAt?: string;

  /** User notes about the ticket */
  notes?: string;

  /** Whether info was auto-detected from QR */
  autoDetected: boolean;

  /** Fields that user manually corrected */
  manualOverrides?: string[];
}

/**
 * Wallet state for context and storage
 */
export interface WalletState {
  /** All stored tickets */
  tickets: Ticket[];

  /** ID of the default ticket (shown first in card stack) */
  defaultTicketId: string | null;

  /** User's filter preferences */
  filterPreferences: FilterPreferences;

  /** When wallet was last modified */
  lastModifiedAt: string | null;
}

/**
 * Filter options for ticket list in Profile
 */
export interface FilterPreferences {
  /** Filter by park chains (empty = show all) */
  parkChains: ParkChain[];

  /** Filter by pass types (empty = show all) */
  passTypes: PassType[];

  /** Whether to show expired tickets */
  showExpired: boolean;

  /** Date range filter */
  dateRange: {
    from: string | null;
    to: string | null;
  } | null;
}

/**
 * Result from QR code scanning/detection
 */
export interface QRScanResult {
  success: boolean;
  rawData?: string;
  format?: BarcodeFormat;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  error?: string;
}

/**
 * Result from smart park detection service
 */
export interface DetectionResult {
  /** Detected park name */
  parkName: string | null;

  /** Detected park chain */
  parkChain: ParkChain | null;

  /** Detected pass type */
  passType: PassType | null;

  /** Detected validity start date */
  validFrom: string | null;

  /** Detected validity end date */
  validUntil: string | null;

  /** Detected passholder name */
  passholder: string | null;

  /** Confidence level of detection */
  confidence: 'high' | 'medium' | 'low';

  /** Fields that need manual entry */
  missingFields: (keyof Ticket)[];
}

/**
 * Steps in the add ticket flow wizard
 */
export type AddTicketStep =
  | 'choose_method'      // Camera or Photo Library
  | 'scanning'           // Camera active
  | 'processing'         // Decoding QR
  | 'detection_result'   // Show auto-detected info
  | 'manual_entry'       // Form for missing fields
  | 'confirmation'       // Review before save
  | 'success';           // Done

/**
 * Park brand colors for card styling
 */
export const PARK_BRAND_COLORS: Record<ParkChain, string> = {
  disney: '#1A3C6E',        // Disney blue
  universal: '#F5C518',     // Universal yellow
  cedar_fair: '#C41230',    // Cedar Fair red
  six_flags: '#E31837',     // Six Flags red
  seaworld: '#0072CE',      // SeaWorld blue
  busch_gardens: '#006747', // Busch Gardens green
  other: '#CF6769',         // App accent (fallback)
};

/**
 * Human-readable labels for park chains
 */
export const PARK_CHAIN_LABELS: Record<ParkChain, string> = {
  disney: 'Disney Parks',
  universal: 'Universal',
  cedar_fair: 'Cedar Fair',
  six_flags: 'Six Flags',
  seaworld: 'SeaWorld',
  busch_gardens: 'Busch Gardens',
  other: 'Other',
};

/**
 * Human-readable labels for pass types
 */
export const PASS_TYPE_LABELS: Record<PassType, string> = {
  day_pass: 'Day Pass',
  multi_day: 'Multi-Day',
  annual_pass: 'Annual Pass',
  season_pass: 'Season Pass',
  vip: 'VIP',
  parking: 'Parking',
  express: 'Express Pass',
  unknown: 'Unknown',
};

/**
 * Default filter preferences
 */
export const DEFAULT_FILTER_PREFERENCES: FilterPreferences = {
  parkChains: [],
  passTypes: [],
  showExpired: false,
  dateRange: null,
};

/**
 * Default wallet state
 */
export const DEFAULT_WALLET_STATE: WalletState = {
  tickets: [],
  defaultTicketId: null,
  filterPreferences: DEFAULT_FILTER_PREFERENCES,
  lastModifiedAt: null,
};
