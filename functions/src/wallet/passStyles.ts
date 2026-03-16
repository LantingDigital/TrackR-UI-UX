/**
 * Apple Wallet PKPass — Visual Styles
 *
 * 5 pass styles the user can choose from when generating a PKPass.
 * Each style defines colors and layout preferences.
 */

import { PassStyle, PassStyleConfig } from './types';

// ============================================
// Style Configurations
// ============================================

export const PASS_STYLE_CONFIGS: Record<PassStyle, PassStyleConfig> = {
  clean: {
    backgroundColor: 'rgb(255, 255, 255)',
    foregroundColor: 'rgb(0, 0, 0)',
    labelColor: 'rgb(102, 102, 102)',
    logoText: 'TrackR',
    useStripImage: false,
  },
  nanobanana: {
    backgroundColor: 'rgb(247, 247, 247)',
    foregroundColor: 'rgb(0, 0, 0)',
    labelColor: 'rgb(102, 102, 102)',
    logoText: 'TrackR',
    useStripImage: true, // Uses coaster card art as strip image
  },
  'park-color': {
    // Background overridden dynamically per park chain
    backgroundColor: 'rgb(207, 103, 105)', // Default: TrackR rose accent
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(230, 230, 230)',
    logoText: 'TrackR',
    useStripImage: false,
  },
  dark: {
    backgroundColor: 'rgb(30, 30, 30)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(180, 180, 180)',
    logoText: 'TrackR',
    useStripImage: false,
  },
  light: {
    backgroundColor: 'rgb(245, 240, 235)',
    foregroundColor: 'rgb(60, 60, 60)',
    labelColor: 'rgb(140, 130, 120)',
    logoText: 'TrackR',
    useStripImage: false,
  },
};

// ============================================
// Park Brand Colors (for park-color style)
// ============================================

/**
 * Maps park chain identifiers to rgb() color strings.
 * These match the PARK_BRAND_COLORS in the client app (types/wallet.ts),
 * converted to rgb() format for PKPass compatibility.
 */
export const PARK_BRAND_COLORS: Record<string, string> = {
  disney: 'rgb(146, 172, 192)',
  universal: 'rgb(214, 196, 138)',
  'cedar-fair': 'rgb(207, 103, 105)',
  cedar_fair: 'rgb(207, 103, 105)', // Handle both delimiter styles
  'six-flags': 'rgb(212, 169, 138)',
  six_flags: 'rgb(212, 169, 138)',
  seaworld: 'rgb(143, 191, 184)',
  'busch-gardens': 'rgb(157, 192, 160)',
  busch_gardens: 'rgb(157, 192, 160)',
  other: 'rgb(184, 163, 196)',
};

/**
 * Get the park brand color for a given park chain.
 * Falls back to the generic "other" color.
 */
export function getParkBrandColor(parkChain: string): string {
  const normalized = parkChain.toLowerCase().trim();
  return PARK_BRAND_COLORS[normalized] ?? PARK_BRAND_COLORS.other;
}

// ============================================
// Pass Type Labels
// ============================================

/**
 * Human-readable labels for pass types shown on the pass.
 */
export const PASS_TYPE_LABELS: Record<string, string> = {
  day_pass: 'Day Pass',
  multi_day: 'Multi-Day Pass',
  annual_pass: 'Annual Pass',
  season_pass: 'Season Pass',
  vip: 'VIP Pass',
  parking: 'Parking Pass',
  express: 'Express Pass',
  membership: 'Membership',
  event: 'Event Ticket',
  unknown: 'Pass',
};

export function getPassTypeLabel(passType: string): string {
  return PASS_TYPE_LABELS[passType] ?? PASS_TYPE_LABELS.unknown;
}
