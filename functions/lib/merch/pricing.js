"use strict";
/**
 * Merch Pricing — Server-side source of truth
 *
 * All prices in cents (USD). Never trust client-side price calculations.
 * This file mirrors the pricing logic from src/data/mockMerchData.ts
 * but runs server-side to prevent price manipulation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACK_DISCOUNTS = exports.MERCH_PRICING = void 0;
exports.calculateCardPriceCents = calculateCardPriceCents;
exports.calculateSubtotalCents = calculateSubtotalCents;
exports.calculatePackDiscountCents = calculatePackDiscountCents;
exports.calculateProDiscountCents = calculateProDiscountCents;
exports.calculateShippingCents = calculateShippingCents;
exports.calculateOrderTotalCents = calculateOrderTotalCents;
// ============================================
// Constants (cents)
// ============================================
exports.MERCH_PRICING = {
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
};
exports.PACK_DISCOUNTS = {
    5: 0.10, // 10% off
    10: 0.20, // 20% off
    20: 0.30, // 30% off
};
// ============================================
// Price Calculation (server-side)
// ============================================
/**
 * Calculate price per card in cents.
 */
function calculateCardPriceCents(goldFoil, hasGoldVerified, isInstantShip) {
    let price = exports.MERCH_PRICING.cardPriceCents;
    // Gold foil is free if GPS-verified, upcharge otherwise
    if (goldFoil && !hasGoldVerified) {
        price += exports.MERCH_PRICING.goldFoilUpchargeCents;
    }
    // Instant ship premium
    if (isInstantShip) {
        price += exports.MERCH_PRICING.instantShipUpchargeCents;
    }
    return price;
}
/**
 * Calculate subtotal for a list of items in cents.
 */
function calculateSubtotalCents(items, isInstantShip) {
    return items.reduce((sum, item) => {
        const unitPrice = calculateCardPriceCents(item.goldFoil, item.hasGoldVerified, isInstantShip);
        return sum + unitPrice * item.quantity;
    }, 0);
}
/**
 * Calculate pack discount in cents (if applicable).
 * Only applies when all items in a single order match a pack size.
 */
function calculatePackDiscountCents(subtotalCents, totalCards) {
    const discountFraction = exports.PACK_DISCOUNTS[totalCards];
    if (!discountFraction)
        return 0;
    return Math.round(subtotalCents * discountFraction);
}
/**
 * Calculate Pro subscriber discount in cents.
 */
function calculateProDiscountCents(subtotalCents, isPro) {
    if (!isPro)
        return 0;
    return Math.round(subtotalCents * exports.MERCH_PRICING.proDiscountFraction);
}
/**
 * Calculate shipping cost in cents.
 */
function calculateShippingCents(country) {
    return country === 'US'
        ? exports.MERCH_PRICING.shippingUSCents
        : exports.MERCH_PRICING.shippingInternationalCents;
}
/**
 * Calculate complete order total in cents.
 */
function calculateOrderTotalCents(items, shippingCountry, isPro, isInstantShip) {
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
//# sourceMappingURL=pricing.js.map