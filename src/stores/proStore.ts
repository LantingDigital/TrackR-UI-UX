/**
 * Pro Store — TrackR Pro subscription state
 *
 * Manages subscription status, tier, and mock purchase flow.
 * In production, this will integrate with react-native-iap.
 * For now, uses mock state for UI development.
 *
 * All tiers unlock the SAME features. Tier is identity/badge only.
 */

import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────

export type ProTier = 'explorer' | 'enthusiast' | 'legend' | 'custom';
export type BillingPeriod = 'monthly' | 'annual';

export interface ProPriceOption {
  id: string;
  displayPrice: string;
  priceMonthly: number;
  priceAnnual: number;
  tier: ProTier;
  isDefault: boolean;
}

interface ProState {
  isPro: boolean;
  tier: ProTier | null;
  billingPeriod: BillingPeriod;
  monthlyPrice: number;

  // Actions
  subscribe: (tier: ProTier, price: number) => void;
  cancel: () => void;
  restore: () => void;
  setBillingPeriod: (period: BillingPeriod) => void;
}

// ─── Price Options ──────────────────────────────────────

export const PRO_PRICE_OPTIONS: ProPriceOption[] = [
  {
    id: 'pro_monthly_199',
    displayPrice: '$2',
    priceMonthly: 1.99,
    priceAnnual: 19.99,
    tier: 'explorer',
    isDefault: false,
  },
  {
    id: 'pro_monthly_299',
    displayPrice: '$3',
    priceMonthly: 2.99,
    priceAnnual: 29.99,
    tier: 'enthusiast',
    isDefault: true,
  },
  {
    id: 'pro_monthly_399',
    displayPrice: '$4',
    priceMonthly: 3.99,
    priceAnnual: 39.99,
    tier: 'legend',
    isDefault: false,
  },
];

// Full IAP product range for slider ($0.99 - $11.99)
export const PRO_SLIDER_PRICES = [
  0.99, 1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99,
] as const;

export function getTierForPrice(price: number): ProTier {
  if (price <= 1.99) return 'explorer';
  if (price <= 3.99) return 'enthusiast';
  if (price <= 7.99) return 'legend';
  return 'legend';
}

export function getTierDisplayName(tier: ProTier): string {
  switch (tier) {
    case 'explorer': return 'Explorer';
    case 'enthusiast': return 'Enthusiast';
    case 'legend': return 'Legend';
    case 'custom': return 'Custom';
  }
}

export function getTierColor(tier: ProTier): string {
  switch (tier) {
    case 'explorer': return '#CD7F32'; // bronze
    case 'enthusiast': return '#C0C0C0'; // silver
    case 'legend': return '#FFD700'; // gold
    case 'custom': return '#CF6769'; // accent
  }
}

// ─── Pro Features ───────────────────────────────────────

export const PRO_FEATURES = [
  { label: 'Advanced stats & analytics', icon: 'bar-chart-outline' as const },
  { label: 'Export ride log (CSV/JSON)', icon: 'download-outline' as const },
  { label: 'Pro badge on profile & leaderboards', icon: 'shield-checkmark-outline' as const },
  { label: 'Custom rating criteria', icon: 'options-outline' as const },
  { label: 'Early access to new features', icon: 'flash-outline' as const },
  { label: '10% off all merch orders', icon: 'pricetag-outline' as const },
  { label: '1 free NanoBanana card', icon: 'card-outline' as const },
];

// ─── Store ──────────────────────────────────────────────

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  tier: null,
  billingPeriod: 'monthly',
  monthlyPrice: 2.99,

  subscribe: (tier, price) => {
    set({ isPro: true, tier, monthlyPrice: price });
  },

  cancel: () => {
    set({ isPro: false, tier: null });
  },

  restore: () => {
    // Mock restore — in production, checks Apple receipt
    set({ isPro: false, tier: null });
  },

  setBillingPeriod: (period) => {
    set({ billingPeriod: period });
  },
}));
