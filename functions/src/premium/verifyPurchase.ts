/**
 * verifyPurchase — Callable Cloud Function
 *
 * Validates an Apple IAP receipt, creates a purchase record,
 * and updates the user's proStatus.
 *
 * Flow:
 * 1. Authenticate caller
 * 2. Validate receipt with Apple's verifyReceipt endpoint
 * 3. Create purchases/{purchaseId} doc
 * 4. Update users/{uid}.proStatus
 * 5. Send welcome push notification on first Pro subscription
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendNotificationToUser } from '../notifications/sendNotification';

// ============================================
// Types
// ============================================

interface VerifyPurchaseInput {
  receipt: string;
  productId: string;
}

interface AppleReceiptResponse {
  status: number;
  environment: 'Production' | 'Sandbox';
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    expires_date_ms: string;
    is_trial_period: string;
  }>;
}

// Map product IDs to price tiers
const PRODUCT_PRICES: Record<string, { price: number; isAnnual: boolean }> = {
  trackr_pro_monthly_199: { price: 1.99, isAnnual: false },
  trackr_pro_monthly_299: { price: 2.99, isAnnual: false },
  trackr_pro_monthly_399: { price: 3.99, isAnnual: false },
  trackr_pro_monthly_499: { price: 4.99, isAnnual: false },
  trackr_pro_monthly_599: { price: 5.99, isAnnual: false },
  trackr_pro_monthly_699: { price: 6.99, isAnnual: false },
  trackr_pro_monthly_799: { price: 7.99, isAnnual: false },
  trackr_pro_monthly_899: { price: 8.99, isAnnual: false },
  trackr_pro_monthly_999: { price: 9.99, isAnnual: false },
  trackr_pro_monthly_1099: { price: 10.99, isAnnual: false },
  trackr_pro_monthly_1199: { price: 11.99, isAnnual: false },
  trackr_pro_annual_1999: { price: 19.99, isAnnual: true },
  trackr_pro_annual_2999: { price: 29.99, isAnnual: true },
  trackr_pro_annual_3999: { price: 39.99, isAnnual: true },
};

// Tier names based on price
function getTierName(price: number): string {
  if (price <= 2.99) return 'supporter';
  if (price <= 5.99) return 'enthusiast';
  if (price <= 9.99) return 'champion';
  return 'legend';
}

// ============================================
// Apple Receipt Verification
// ============================================

const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

async function verifyWithApple(
  receipt: string,
  useSandbox: boolean,
): Promise<AppleReceiptResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;

  // App-specific shared secret should be in env vars
  const sharedSecret = process.env.APPLE_SHARED_SECRET ?? '';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receipt,
      password: sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  if (!response.ok) {
    throw new HttpsError('internal', 'Apple verification service unavailable.');
  }

  return (await response.json()) as AppleReceiptResponse;
}

// ============================================
// Cloud Function
// ============================================

export const verifyPurchase = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const { receipt, productId } = request.data as VerifyPurchaseInput;

    if (!receipt || typeof receipt !== 'string') {
      throw new HttpsError('invalid-argument', 'receipt is required.');
    }
    if (!productId || typeof productId !== 'string') {
      throw new HttpsError('invalid-argument', 'productId is required.');
    }

    const productInfo = PRODUCT_PRICES[productId];
    if (!productInfo) {
      throw new HttpsError('invalid-argument', `Unknown productId: ${productId}`);
    }

    // Try production first, fall back to sandbox if status 21007
    let appleResponse = await verifyWithApple(receipt, false);

    if (appleResponse.status === 21007) {
      // Receipt is from sandbox environment
      appleResponse = await verifyWithApple(receipt, true);
    }

    if (appleResponse.status !== 0) {
      console.error(
        `[verifyPurchase] Apple returned status ${appleResponse.status} for user ${uid}`,
      );
      throw new HttpsError(
        'failed-precondition',
        `Receipt verification failed (status: ${appleResponse.status}).`,
      );
    }

    // Find the matching transaction
    const transactions = appleResponse.latest_receipt_info ?? [];
    const matchingTx = transactions.find((tx) => tx.product_id === productId);

    if (!matchingTx) {
      throw new HttpsError(
        'failed-precondition',
        'No matching transaction found in receipt.',
      );
    }

    const expiresAtMs = parseInt(matchingTx.expires_date_ms, 10);
    const expiresAt = new Date(expiresAtMs);
    const isExpired = expiresAt.getTime() < Date.now();

    if (isExpired) {
      throw new HttpsError(
        'failed-precondition',
        'Subscription has already expired.',
      );
    }

    const db = getFirestore();
    const environment = appleResponse.environment === 'Sandbox' ? 'sandbox' : 'production';
    const tier = getTierName(productInfo.price);

    // Check if this transaction already exists (idempotency)
    const existingPurchase = await db
      .collection('purchases')
      .where('transactionId', '==', matchingTx.transaction_id)
      .limit(1)
      .get();

    if (!existingPurchase.empty) {
      // Already processed — return current pro status
      const userDoc = await db.doc(`users/${uid}`).get();
      const proStatus = userDoc.data()?.proStatus ?? { active: false, tier: null };
      return { verified: true, proStatus };
    }

    // Check if this is the user's first Pro subscription
    const existingPurchases = await db
      .collection('purchases')
      .where('userId', '==', uid)
      .limit(1)
      .get();
    const isFirstPro = existingPurchases.empty;

    // Create purchase doc
    const purchaseRef = db.collection('purchases').doc();
    await purchaseRef.set({
      id: purchaseRef.id,
      userId: uid,
      productId,
      transactionId: matchingTx.transaction_id,
      originalTransactionId: matchingTx.original_transaction_id,
      receipt,
      verifiedAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(expiresAtMs),
      environment,
      status: 'active',
      tier,
      priceUsd: productInfo.price,
      isAnnual: productInfo.isAnnual,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update user's pro status
    const proStatus = {
      active: true,
      tier,
      expiresAt: new Date(expiresAtMs),
      platform: 'ios' as const,
    };

    await db.doc(`users/${uid}`).update({
      proStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[verifyPurchase] User ${uid} verified as Pro (${tier}, $${productInfo.price}/${productInfo.isAnnual ? 'yr' : 'mo'})`,
    );

    // Send welcome notification on first Pro subscription
    if (isFirstPro) {
      try {
        await sendNotificationToUser(
          uid,
          'Welcome to TrackR Pro!',
          'Thanks for supporting TrackR. Your premium features are now active.',
          { screen: 'settings' },
        );
      } catch (e) {
        console.warn('[verifyPurchase] Welcome notification failed:', e);
      }
    }

    return { verified: true, proStatus };
  },
);
