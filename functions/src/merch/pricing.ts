/**
 * Merch Pricing — Server-side source of truth
 *
 * All prices in cents (USD). Never trust client-side price calculations.
 * This file mirrors the pricing logic from src/data/mockMerchData.ts
 * but runs server-side to prevent price manipulation.
 */

// ============================================
// Constants (cents)
// ============================================

export const MERCH_PRICING = {
  /** Base price per card (cents) */
  cardPriceCents: 799,
  /** Gold foil upcharge when NOT GPS-verified (cents) */
  goldFoilUpchargeCents: 299,
  /** US shipping flat rate (cents) */
  shippingUSCents: 399,
  /** International shipping flat rate (cents) */
  shippingInternationalCents: 899,
  /** Pro subscriber discount (fraction, e.g. 0.10 = 10%) */
  proDiscountFraction: 0.10,
  /** Instant ship premium upcharge per card (cents) */
  instantShipUpchargeCents: 200,
} as const;

export const PACK_DISCOUNTS: Record<number, number> = {
  5: 0.10,  // 10% off
  10: 0.20, // 20% off
  20: 0.30, // 30% off
};

// ============================================
// Types
// ============================================

export interface OrderItem {
  productId: string;
  coasterId: string;
  name: string;
  parkName: string;
  quantity: number;
  goldFoil: boolean;
  holographic: boolean;
  hasGoldVerified: boolean;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'printing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// ============================================
// Price Calculation (server-side)
// ============================================

/**
 * Calculate price per card in cents.
 */
export function calculateCardPriceCents(
  goldFoil: boolean,
  hasGoldVerified: boolean,
  isInstantShip: boolean,
): number {
  let price = MERCH_PRICING.cardPriceCents;

  // Gold foil is free if GPS-verified, upcharge otherwise
  if (goldFoil && !hasGoldVerified) {
    price += MERCH_PRICING.goldFoilUpchargeCents;
  }

  // Instant ship premium
  if (isInstantShip) {
    price += MERCH_PRICING.instantShipUpchargeCents;
  }

  return price;
}

/**
 * Calculate subtotal for a list of items in cents.
 */
export function calculateSubtotalCents(
  items: OrderItem[],
  isInstantShip: boolean,
): number {
  return items.reduce((sum, item) => {
    const unitPrice = calculateCardPriceCents(
      item.goldFoil,
      item.hasGoldVerified,
      isInstantShip,
    );
    return sum + unitPrice * item.quantity;
  }, 0);
}

/**
 * Calculate pack discount in cents (if applicable).
 * Only applies when all items in a single order match a pack size.
 */
export function calculatePackDiscountCents(
  subtotalCents: number,
  totalCards: number,
): number {
  const discountFraction = PACK_DISCOUNTS[totalCards];
  if (!discountFraction) return 0;
  return Math.round(subtotalCents * discountFraction);
}

/**
 * Calculate Pro subscriber discount in cents.
 */
export function calculateProDiscountCents(
  subtotalCents: number,
  isPro: boolean,
): number {
  if (!isPro) return 0;
  return Math.round(subtotalCents * MERCH_PRICING.proDiscountFraction);
}

/**
 * Calculate shipping cost in cents.
 */
export function calculateShippingCents(country: string): number {
  return country === 'US'
    ? MERCH_PRICING.shippingUSCents
    : MERCH_PRICING.shippingInternationalCents;
}

/**
 * Calculate complete order total in cents.
 */
export function calculateOrderTotalCents(
  items: OrderItem[],
  shippingCountry: string,
  isPro: boolean,
  isInstantShip: boolean,
): {
  subtotalCents: number;
  packDiscountCents: number;
  proDiscountCents: number;
  shippingCents: number;
  totalCents: number;
} {
  const totalCards = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = calculateSubtotalCents(items, isInstantShip);
  const packDiscountCents = calculatePackDiscountCents(subtotalCents, totalCards);
  const afterPackDiscount = subtotalCents - packDiscountCents;
  const proDiscountCents = calculateProDiscountCents(afterPackDiscount, isPro);
  const shippingCents = calculateShippingCents(shippingCountry);
  const totalCents = afterPackDiscount - proDiscountCents + shippingCents;

  return {
    subtotalCents,
    packDiscountCents,
    proDiscountCents,
    shippingCents,
    totalCents,
  };
}
