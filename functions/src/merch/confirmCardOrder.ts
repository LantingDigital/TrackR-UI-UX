/**
 * confirmCardOrder — Stripe webhook handler
 *
 * Receives Stripe payment_intent.succeeded webhook and updates
 * the order status from "pending" to "paid". For batch orders,
 * adds to the batch queue. For instant ship, marks ready for
 * QPMN submission (future: submitToQPMN).
 *
 * Stripe webhook URL (register in Stripe Dashboard > Developers > Webhooks):
 *   https://us-central1-trackr-coaster-app.cloudfunctions.net/confirmCardOrder
 *
 * Events to subscribe to:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 */

import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { sendNotificationToUser } from '../notifications/sendNotification';

// ============================================
// Batch Window Helpers
// ============================================

/**
 * Get the current batch window ID (ISO week-based, 2-week windows).
 * Format: "2026-B07" (year + biweekly period number)
 */
function getCurrentBatchWindowId(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Get ISO week number
  const jan1 = new Date(year, 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000),
  );
  const weekNumber = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
  // Biweekly period (week 1-2 = B01, week 3-4 = B02, etc.)
  const biweeklyPeriod = Math.ceil(weekNumber / 2);
  return `${year}-B${biweeklyPeriod.toString().padStart(2, '0')}`;
}

/**
 * Get the end date for the current batch window.
 */
function getBatchWindowEnd(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000),
  );
  const weekNumber = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
  const biweeklyPeriod = Math.ceil(weekNumber / 2);
  // End of the biweekly window = end of the 2nd week in the period
  const endWeek = biweeklyPeriod * 2;
  const endDayOfYear = endWeek * 7 - jan1.getDay();
  const end = new Date(year, 0, endDayOfYear);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ============================================
// Cloud Function
// ============================================

export const confirmCardOrder = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  },
  async (req, res) => {
    // Stripe only sends POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('[confirmCardOrder] Stripe secrets not configured');
      res.status(500).send('Server configuration error');
      return;
    }

    const stripe = new Stripe(stripeSecretKey);
    const sig = req.headers['stripe-signature'] as string;

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('[confirmCardOrder] Webhook signature verification failed:', err);
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    const db = getFirestore();

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      const userId = paymentIntent.metadata.userId;

      if (!orderId) {
        console.warn('[confirmCardOrder] No orderId in PaymentIntent metadata');
        res.status(200).json({ received: true });
        return;
      }

      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        console.error(`[confirmCardOrder] Order ${orderId} not found`);
        res.status(200).json({ received: true });
        return;
      }

      const orderData = orderSnap.data()!;

      // Idempotency: skip if already processed
      if (orderData.status !== 'pending') {
        console.log(
          `[confirmCardOrder] Order ${orderId} already in status "${orderData.status}", skipping`,
        );
        res.status(200).json({ received: true });
        return;
      }

      const isInstantShip = orderData.isInstantShip === true;

      // Update order to paid
      const updateData: Record<string, unknown> = {
        status: 'paid',
        'payment.stripeStatus': 'succeeded',
        'payment.paidAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!isInstantShip) {
        // Batch order: add to batch queue
        const batchWindowId = getCurrentBatchWindowId();
        updateData['fulfillment.batchWindowId'] = batchWindowId;

        // Ensure batch window doc exists
        const batchRef = db.collection('batchQueue').doc(batchWindowId);
        const batchSnap = await batchRef.get();

        if (!batchSnap.exists) {
          await batchRef.set({
            windowId: batchWindowId,
            windowEnd: getBatchWindowEnd(),
            status: 'collecting',
            qpmnBulkOrderId: null,
            orderCount: 0,
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        // Add order to batch items
        await batchRef.collection('items').doc(orderId).set({
          orderId,
          userId: userId || orderData.userId,
          addedAt: FieldValue.serverTimestamp(),
        });

        // Increment order count
        await batchRef.update({
          orderCount: FieldValue.increment(1),
        });
      }

      // For instant ship: status stays "paid" until QPMN integration is built.
      // Future: submitToQPMN() will be called here and status set to "printing".

      await orderRef.update(updateData);

      console.log(
        `[confirmCardOrder] Order ${orderId} confirmed (${isInstantShip ? 'instant' : 'batch'})`,
      );

      // Send push notification
      const notifyUserId = userId || orderData.userId;
      if (notifyUserId) {
        const totalCards = orderData.totalCards || 0;
        const totalDollars = ((orderData.pricing?.totalCents || 0) / 100).toFixed(2);
        try {
          await sendNotificationToUser(
            notifyUserId,
            'Order Confirmed!',
            isInstantShip
              ? `Your ${totalCards} card${totalCards > 1 ? 's' : ''} ($${totalDollars}) will ship within 1-2 weeks.`
              : `Your ${totalCards} card${totalCards > 1 ? 's' : ''} ($${totalDollars}) will ship in the next batch (2-4 weeks).`,
            { screen: 'orderHistory', orderId },
          );
        } catch (e) {
          console.warn('[confirmCardOrder] Push notification failed:', e);
        }
      }
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const orderRef = db.collection('orders').doc(orderId);
        await orderRef.update({
          'payment.stripeStatus': 'failed',
          'payment.failureMessage':
            paymentIntent.last_payment_error?.message || 'Payment failed',
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(
          `[confirmCardOrder] Payment failed for order ${orderId}: ${paymentIntent.last_payment_error?.message}`,
        );
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  },
);
