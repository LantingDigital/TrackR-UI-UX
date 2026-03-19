"use strict";
/**
 * createCardOrder — Callable Cloud Function
 *
 * Creates a Stripe PaymentIntent for physical card purchases and
 * stores the order in Firestore with status "pending".
 *
 * Flow:
 * 1. Authenticate caller
 * 2. Validate cart items and shipping address
 * 3. Calculate prices server-side (never trust client)
 * 4. Check user's proStatus for 10% discount
 * 5. Create Stripe PaymentIntent
 * 6. Store order in Firestore
 * 7. Return { clientSecret, orderId }
 *
 * Apple Guideline 3.1.3(e): Physical goods MUST use non-IAP payment.
 * Stripe is the correct processor here — zero Apple commission.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCardOrder = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = __importDefault(require("stripe"));
const pricing_1 = require("./pricing");
// ============================================
// Validation
// ============================================
function validateItems(items) {
    if (!Array.isArray(items) || items.length === 0)
        return false;
    return items.every((item) => typeof item === 'object' &&
        item !== null &&
        typeof item.productId === 'string' &&
        typeof item.coasterId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.parkName === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        item.quantity <= 50 &&
        Number.isInteger(item.quantity) &&
        typeof item.goldFoil === 'boolean' &&
        typeof item.holographic === 'boolean' &&
        typeof item.hasGoldVerified === 'boolean');
}
function validateShippingAddress(addr) {
    if (typeof addr !== 'object' || addr === null)
        return false;
    const a = addr;
    return (typeof a.fullName === 'string' &&
        a.fullName.length > 0 &&
        typeof a.line1 === 'string' &&
        a.line1.length > 0 &&
        typeof a.city === 'string' &&
        a.city.length > 0 &&
        typeof a.state === 'string' &&
        typeof a.zip === 'string' &&
        a.zip.length > 0 &&
        typeof a.country === 'string' &&
        a.country.length >= 2);
}
// ============================================
// Cloud Function
// ============================================
exports.createCardOrder = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['STRIPE_SECRET_KEY'],
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    // Validate input
    if (!validateItems(data.items)) {
        throw new https_1.HttpsError('invalid-argument', 'items must be a non-empty array of valid cart items (max 50 per item).');
    }
    if (!validateShippingAddress(data.shippingAddress)) {
        throw new https_1.HttpsError('invalid-argument', 'Valid shipping address is required (fullName, line1, city, zip, country).');
    }
    const isInstantShip = data.isInstantShip === true;
    // Cap total items per order
    const totalCards = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalCards > 100) {
        throw new https_1.HttpsError('invalid-argument', 'Maximum 100 cards per order.');
    }
    const db = (0, firestore_1.getFirestore)();
    // Check user's Pro status for discount
    const userDoc = await db.doc(`users/${uid}`).get();
    const isPro = userDoc.exists && userDoc.data()?.proStatus?.active === true;
    // Calculate prices server-side
    const pricing = (0, pricing_1.calculateOrderTotalCents)(data.items, data.shippingAddress.country, isPro, isInstantShip);
    if (pricing.totalCents < 50) {
        // Stripe minimum charge is $0.50
        throw new https_1.HttpsError('invalid-argument', 'Order total is below the minimum charge amount.');
    }
    // Initialize Stripe with secret from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        console.error('[createCardOrder] STRIPE_SECRET_KEY not configured');
        throw new https_1.HttpsError('internal', 'Payment system not configured.');
    }
    const stripe = new stripe_1.default(stripeSecretKey);
    // Create order doc first to get orderId
    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    // Create Stripe PaymentIntent
    let paymentIntent;
    try {
        paymentIntent = await stripe.paymentIntents.create({
            amount: pricing.totalCents,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: uid,
                orderId,
                isInstantShip: isInstantShip ? 'true' : 'false',
                totalCards: totalCards.toString(),
            },
            description: `TrackR Cards - ${totalCards} card${totalCards > 1 ? 's' : ''}`,
        });
    }
    catch (err) {
        console.error('[createCardOrder] Stripe PaymentIntent creation failed:', err);
        throw new https_1.HttpsError('internal', 'Failed to create payment.');
    }
    // Store order in Firestore
    await orderRef.set({
        id: orderId,
        userId: uid,
        items: data.items.map((item) => ({
            productId: item.productId,
            coasterId: item.coasterId,
            name: item.name,
            parkName: item.parkName,
            quantity: item.quantity,
            goldFoil: item.goldFoil,
            holographic: item.holographic,
            hasGoldVerified: item.hasGoldVerified,
        })),
        shippingAddress: {
            fullName: data.shippingAddress.fullName,
            line1: data.shippingAddress.line1,
            line2: data.shippingAddress.line2 || '',
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            zip: data.shippingAddress.zip,
            country: data.shippingAddress.country,
        },
        pricing: {
            subtotalCents: pricing.subtotalCents,
            packDiscountCents: pricing.packDiscountCents,
            proDiscountCents: pricing.proDiscountCents,
            shippingCents: pricing.shippingCents,
            totalCents: pricing.totalCents,
        },
        payment: {
            stripePaymentIntentId: paymentIntent.id,
            stripeStatus: 'pending',
            paidAt: null,
        },
        fulfillment: {
            type: isInstantShip ? 'instant' : 'batch',
            qpmnOrderId: null,
            batchWindowId: null,
            trackingNumber: null,
            carrier: null,
            shippedAt: null,
            deliveredAt: null,
        },
        status: 'pending',
        isInstantShip,
        isPro,
        totalCards,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log(`[createCardOrder] Order ${orderId} created for user ${uid}: ${totalCards} cards, $${(pricing.totalCents / 100).toFixed(2)}${isPro ? ' (Pro discount applied)' : ''}${isInstantShip ? ' (instant ship)' : ''}`);
    return {
        clientSecret: paymentIntent.client_secret,
        orderId,
        totalCents: pricing.totalCents,
    };
});
//# sourceMappingURL=createCardOrder.js.map