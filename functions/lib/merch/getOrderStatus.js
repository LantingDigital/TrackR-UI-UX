"use strict";
/**
 * getOrderStatus — Callable Cloud Function
 *
 * Returns the current status of a card order, including tracking
 * info and estimated delivery. Users can only query their own orders.
 *
 * Also supports listing all orders for the authenticated user
 * when called without an orderId.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
// ============================================
// Cloud Function
// ============================================
exports.getOrderStatus = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 15,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    const db = (0, firestore_1.getFirestore)();
    // Single order lookup
    if (data.orderId && typeof data.orderId === 'string') {
        const orderDoc = await db.collection('orders').doc(data.orderId).get();
        if (!orderDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Order not found.');
        }
        const orderData = orderDoc.data();
        // Users can only see their own orders
        if (orderData.userId !== uid) {
            throw new https_1.HttpsError('permission-denied', 'You can only view your own orders.');
        }
        return formatOrderResponse(orderData);
    }
    // List all orders for user (most recent first, max 50)
    const ordersSnap = await db
        .collection('orders')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    const orders = ordersSnap.docs.map((doc) => formatOrderResponse(doc.data()));
    return { orders };
});
// ============================================
// Helpers
// ============================================
function formatOrderResponse(data) {
    return {
        id: data.id,
        status: data.status,
        items: (data.items || []).map((item) => ({
            name: item.name,
            parkName: item.parkName,
            quantity: item.quantity,
            goldFoil: item.goldFoil,
        })),
        pricing: {
            subtotalCents: data.pricing?.subtotalCents ?? 0,
            packDiscountCents: data.pricing?.packDiscountCents ?? 0,
            proDiscountCents: data.pricing?.proDiscountCents ?? 0,
            shippingCents: data.pricing?.shippingCents ?? 0,
            totalCents: data.pricing?.totalCents ?? 0,
        },
        fulfillment: {
            type: data.fulfillment?.type ?? 'batch',
            trackingNumber: data.fulfillment?.trackingNumber ?? null,
            carrier: data.fulfillment?.carrier ?? null,
            shippedAt: data.fulfillment?.shippedAt?.toDate?.()?.toISOString?.() ?? null,
            deliveredAt: data.fulfillment?.deliveredAt?.toDate?.()?.toISOString?.() ?? null,
            batchWindowId: data.fulfillment?.batchWindowId ?? null,
        },
        isInstantShip: data.isInstantShip ?? false,
        totalCards: data.totalCards ?? 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
    };
}
//# sourceMappingURL=getOrderStatus.js.map