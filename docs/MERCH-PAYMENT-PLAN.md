# TrackR Merch + Payment Architecture Plan

**Date:** 2026-03-19
**Status:** Research complete, awaiting implementation
**Owner:** Merch agent (Task #6)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [QPMN Integration (Print-on-Demand)](#2-qpmn-integration)
3. [Payment Architecture](#3-payment-architecture)
4. [Stripe React Native SDK](#4-stripe-react-native-sdk)
5. [Cloud Functions (New)](#5-cloud-functions-new)
6. [Firestore Schema](#6-firestore-schema)
7. [Implementation Order](#7-implementation-order)
8. [Action Items](#8-action-items)

---

## 1. Executive Summary

TrackR's merch store has two revenue streams with different payment rails:

| Revenue Stream | Payment Processor | Apple Commission | Why |
|---------------|-------------------|-----------------|-----|
| **Physical card purchases** | Stripe | 0% | Physical goods — Apple allows any payment processor |
| **TrackR Pro subscription** | Apple IAP (StoreKit 2) | 15% (Small Business Program) | Digital goods — Apple requires IAP |

The physical card fulfillment uses QPMN (QP Market Network) as a print-on-demand provider. Two order models:

1. **Bulk batch** (primary): 2-week collection windows, batch print, pocket margin on volume discount
2. **Instant ship** (premium): single-order API call to QPMN at higher per-card cost, premium price to customer

Pro subscription Cloud Functions already exist (`verifyPurchase`, `handleSubscriptionEvent`). This plan focuses on the NEW work needed for physical card sales.

---

## 2. QPMN Integration

### 2.1 What QPMN Offers

QPMN is a B2B2C print-on-demand platform by QP Group (40+ years printing experience). Key facts:

- **No minimum order quantity** — print 1 card or 50,000
- **REST API** for custom storefront integration (not just Shopify/WooCommerce/Etsy)
- **Standard TCG size:** 2.5" x 3.5" (confirmed available)
- **9 cardstock options:** 270gsm to 350gsm (European mills)
  - Blue Core and Black Core (tournament-legal opacity)
  - Linen-textured finishes
  - Ultra-smooth stocks
  - Eco-friendly plant-based
  - Waterproof plastic
- **Premium finishes:** Gold foil, silver foil, rainbow holographic, textured dot foil, shards foil, gilded edges (7 colors)
- **Production time:** 3-7 business days (foil/special finishes +1-2 days)
- **FlexiBulk discounts:** Combine multiple designs into one order for volume pricing, starting at 2+ units. Mix-and-match designs and shipping addresses.

### 2.2 Pricing (REQUIRES ACCOUNT SIGNUP)

QPMN does not publish per-card pricing publicly. Their website mentions custom playing card decks starting at **$1.05/deck** (likely for high-volume bulk orders of standard decks, not individual TCG cards). Per-card pricing for individual TCG prints depends on:
- Card size (2.5"x3.5" standard TCG)
- Cardstock selection (9 options, 270-350gsm)
- Finish (standard, gold foil, holographic, gilded edges)
- Quantity (FlexiBulk discounts starting at 2+ units)

**ACTION REQUIRED:** Caleb or Josh must sign up for a QPMN account at qpmarketnetwork.com to:
1. Access the pricing calculator (interactive, per-product)
2. Order a sample pack (verify NanoBanana art print quality at 2.5"x3.5")
3. Get API credentials and full developer docs
4. Request a dedicated growth manager (QPMN assigns one to walk through setup)
5. Negotiate bulk pricing for the 2-week batch model

**Pricing estimation for margin planning:**
- Based on industry POD comparisons, expect $2-5 per single TCG card (standard finish)
- Holographic/foil finishes likely $1-3 additional per card
- Bulk orders (20+ cards via FlexiBulk) likely 20-40% cheaper per unit
- Current retail price: $7.99/card — margin should be healthy even at single-unit POD
- QPMN supports USD only (confirmed via FAQ)

### 2.3 QPMN API Technical Details

**What we know from Perplexity research (qpmarketnetwork.com + developer center):**

- **REST API** available for custom storefronts (React Native app qualifies)
- **Integration flow:**
  1. Register as a partner on QPMN dashboard
  2. Activate account, create a store
  3. Select products and configure them (match QPMN **SKU IDs** for each card product)
  4. Integrate API to sync orders: customer details (name, address, contact) sent automatically on purchase
  5. QPMN dashboard shows order status (pending/completed) — can also review/combine orders manually
- **Card art submission:** Use QPMN's POD Design Tool (embeddable) to upload designs, then sync via API using SKUs
- **API docs are NOT public** — must request from QPMN after partner registration via their Developer Center (`qpmarketnetwork.com/app/company/developer-center/integration-with-api/`)
- **Growth manager assigned** — QPMN provides a dedicated contact to walk through API setup
- **Authentication:** Likely API key or OAuth (not publicly documented, provided after registration)
- **Webhooks:** Not confirmed in public docs — may need to poll dashboard or negotiate webhook access
- **Contact:** customerservice@qpmarketnetwork.com for API access

**What we DON'T know yet (need account):**
- Exact API endpoints and request/response formats
- Webhook callback system (if any — may be dashboard-only)
- How card art files are referenced (URL? upload? SKU-linked?)
- Rate limits and order submission format
- Sandbox/test environment availability

### 2.4 API Integration Architecture

```
Customer places order in app
        |
        v
Cloud Function: createCardOrder
  - Validates cart items
  - Creates Stripe PaymentIntent
  - Stores order in Firestore (status: pending)
  - Returns clientSecret to app
        |
        v
App presents Stripe PaymentSheet
  - User pays with card / Apple Pay
  - Stripe confirms payment
        |
        v
Stripe webhook -> Cloud Function: confirmCardOrder
  - Updates order status to "paid"
  - Determines order type (instant vs batch)
        |
        v
  [INSTANT SHIP]              [BATCH ORDER]
        |                           |
  submitToQPMN()           Add to batch queue
  immediately               (Firestore collection)
        |                           |
        v                     Every 2 weeks:
  QPMN prints + ships      Scheduled CF collects
        |                   all queued orders
        v                           |
  QPMN webhook ->                   v
  handleQPMNWebhook()        submitBatchToQPMN()
  updates tracking               (bulk API call)
                                    |
                                    v
                              Same webhook flow
```

### 2.4 Bulk Order Model (2-Week Windows)

Per the Josh meeting decision (2026-03-18):

1. **Collection window:** Orders accumulate for 2 weeks in a Firestore queue
2. **Batch submission:** Scheduled Cloud Function fires every 2 weeks, collects all paid orders, submits as one bulk order to QPMN
3. **Margin pocket:** Bulk pricing from QPMN is cheaper than single-unit. Customer pays the same retail price. The difference is margin.
4. **Customer expectation:** "Cards ship within 2-3 weeks" (2-week window + 3-7 day production + shipping)
5. **Batch tracking:** Each batch gets a batch ID. Individual orders within the batch get separate tracking when QPMN ships.

### 2.5 Instant Ship (Premium)

For customers who want cards NOW:

1. **Premium price:** Higher retail price (e.g., $9.99-$11.99 vs $7.99 standard)
2. **Immediate QPMN API call:** Order submitted to QPMN right after payment confirms
3. **Faster delivery:** 3-7 day production + shipping (no 2-week window wait)
4. **Lower margin:** Single-unit POD cost is higher, but premium price compensates

### 2.6 Holographic / Gold Foil Options

QPMN confirmed options (from their custom trading cards page):
- **Gold foil** — for GPS-verified cards (free) or upcharge ($2.99 in current mock data)
- **Silver foil** — potential future option
- **Rainbow holographic** — premium finish
- **Textured dot foil** — premium finish
- **Shards foil** — premium finish
- **Gilded edges** (7 colors) — ultra-premium

For V1, focus on:
- **Standard** (no foil) — base price
- **Gold foil** — free if GPS-verified, +$2.99 if not (per existing card tier system)
- **Holographic** — premium finish, price TBD after QPMN account setup

---

## 3. Payment Architecture

### 3.1 Physical Cards: Stripe (REQUIRED by Apple, Not IAP)

**Apple App Store Guideline 3.1.3(e) (verified via Perplexity, sourced from developer.apple.com):**

> "If your app enables people to purchase physical goods or services that will be consumed outside of the app, you must use purchase methods other than in-app purchase to collect those payments, such as Apple Pay or traditional credit card entry."

This means Apple **requires** Stripe (or similar) for physical card purchases. Using IAP for physical goods would violate the guidelines. This is the same model Amazon, DoorDash, and every e-commerce app uses.

**Why Stripe is the right choice:**
- Apple REQUIRES non-IAP payment for physical goods (Guideline 3.1.3(e))
- 0% Apple commission (Stripe only: 2.9% + $0.30 per transaction)
- Full control over payment flow, refunds, and disputes
- Apple Pay works through Stripe (native iOS feel, still no Apple commission)
- Shipping address collection built into PaymentSheet
- Stripe handles PCI compliance

**Why NOT Apple IAP for physical cards:**
- Apple explicitly prohibits IAP for physical goods
- IAP has no shipping address collection
- No direct fulfillment integration
- Apple takes 15-30% commission on IAP (unnecessary for physical goods)
- Refund process goes through Apple, not you

### 3.2 Pro Subscription: Apple IAP (Already Built)

**Current state:** Two Cloud Functions already handle Pro subscriptions:
- `verifyPurchase` — validates Apple IAP receipt, creates purchase record, updates user proStatus
- `handleSubscriptionEvent` — Apple S2S webhook for renewals, cancellations, refunds

**PWYW implementation via Apple IAP:**

Apple doesn't support true custom-amount IAP. The PWYW slider works by mapping to preset Apple IAP product IDs:

| Slider Position | Product ID | Monthly | Annual |
|----------------|-----------|---------|--------|
| $1.99 | `trackr_pro_monthly_199` | $1.99 | $19.99 |
| $2.99 | `trackr_pro_monthly_299` | $2.99 | $29.99 |
| $3.99 | `trackr_pro_monthly_399` | $3.99 | $39.99 |
| $4.99 | `trackr_pro_monthly_499` | $4.99 | — |
| $5.99 | `trackr_pro_monthly_599` | $5.99 | — |
| $6.99 | `trackr_pro_monthly_699` | $6.99 | — |
| $7.99 | `trackr_pro_monthly_799` | $7.99 | — |
| $8.99 | `trackr_pro_monthly_899` | $8.99 | — |
| $9.99 | `trackr_pro_monthly_999` | $9.99 | — |
| $10.99 | `trackr_pro_monthly_1099` | $10.99 | — |
| $11.99 | `trackr_pro_monthly_1199` | $11.99 | — |

These product IDs already exist in `verifyPurchase.ts` (line 41-56). All 14 products need to be created in App Store Connect.

**Slider UX:** User drags slider, sees price update in real-time. Preset "bumps" at $1.99 / $2.99 / $3.99 (the three main presets from STATE.md). Slider snaps to nearest dollar amount. All tiers get identical features.

**Apple commission:** 15% under Small Business Program (TrackR will be well under $1M revenue). After first year of a subscriber, drops to 15% regardless. Caleb already has Apple Developer account active (Team ID: Q9H59NQ25W).

### 3.3 Payment Flow Summary

```
PHYSICAL CARDS                    PRO SUBSCRIPTION
─────────────                     ────────────────
Stripe PaymentSheet               Apple IAP (StoreKit 2)
  |                                 |
  v                                 v
Cloud Function:                   iOS native purchase
createCardOrder                   dialog
  |                                 |
  v                                 v
Stripe webhook                    Cloud Function:
  |                               verifyPurchase
  v                                 |
confirmCardOrder                    v
  |                               Update user
  v                               proStatus in
Submit to QPMN                    Firestore
  |
  v
Fulfillment +
shipping tracking
```

---

## 4. Stripe React Native SDK

### 4.1 Installation

```bash
npx expo install @stripe/stripe-react-native
```

The library has a built-in Expo config plugin. Add to `app.json` (or `app.config.js`):

```json
{
  "plugins": [
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.app.ridetrackr",
        "enableApplePay": true
      }
    ]
  ]
}
```

**Requires dev client rebuild:**
```bash
npx expo prebuild --clean
# Re-apply Firebase iOS Podfile fixes (see .claude/rules/firebase-ios-build.md)
cd ios && pod install
npx expo run:ios --device 00008140-00044DA42E00401C
```

Not compatible with Expo Go (already fine — TrackR is always dev client).

### 4.2 Apple Pay Setup

1. **Apple Developer Portal:** Create Merchant ID `merchant.app.ridetrackr`
2. **Stripe Dashboard:** Payments > Apple Pay > Add domain, download certificate
3. **Expo config plugin:** Set `"enableApplePay": true` and `merchantIdentifier`
4. Apple Pay appears automatically in PaymentSheet on iOS when configured

Apple Pay for physical goods goes through Stripe — **zero Apple commission**. Native iOS payment experience.

### 4.3 Client-Side Flow

```typescript
// App.tsx — wrap entire app
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>
```

```typescript
// CheckoutScreen.tsx — payment flow
import { useStripe } from '@stripe/stripe-react-native';

const CheckoutScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleCheckout = async () => {
    // 1. Call Cloud Function to create PaymentIntent
    const { clientSecret, orderId } = await createCardOrder({
      items: cartItems,
      shippingAddress,
      isInstantShip,
    });

    // 2. Initialize PaymentSheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'TrackR',
      applePay: { merchantCountryCode: 'US' },
      style: 'alwaysLight', // matches TrackR light mode
    });

    if (initError) {
      // Handle error
      return;
    }

    // 3. Present PaymentSheet (user pays with card or Apple Pay)
    const { error: payError } = await presentPaymentSheet();

    if (payError) {
      // Payment cancelled or failed
      return;
    }

    // 4. Payment confirmed — navigate to confirmation
    navigation.navigate('MerchOrderConfirmation', {
      orderId,
      estimatedDelivery: isInstantShip ? '1-2 weeks' : '2-4 weeks',
    });
  };
};
```

### 4.4 Backend Flow (Cloud Function)

```typescript
// functions/src/merch/createCardOrder.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCardOrder = onCall(
  { region: 'us-central1', memory: '256MiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');

    const { items, shippingAddress, isInstantShip } = request.data;
    const uid = request.auth.uid;
    const db = getFirestore();

    // 1. Validate items + calculate total SERVER-SIDE (never trust client)
    const subtotal = calculateSubtotal(items); // server price lookup
    const proDiscount = await getProDiscount(uid, subtotal);
    const shipping = shippingAddress.country === 'US' ? 399 : 899; // cents
    const total = subtotal - proDiscount + shipping;

    // 2. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: uid, orderId: '' }, // updated below
    });

    // 3. Store order in Firestore
    const orderRef = db.collection('orders').doc();
    await orderRef.set({
      id: orderRef.id,
      userId: uid,
      items,
      shippingAddress,
      pricing: { subtotal, proDiscount, shipping, total },
      payment: { stripePaymentIntentId: paymentIntent.id, stripeStatus: 'pending' },
      fulfillment: { type: isInstantShip ? 'instant' : 'batch' },
      status: 'pending',
      isInstantShip,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Update PaymentIntent metadata with orderId
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { userId: uid, orderId: orderRef.id },
    });

    return { clientSecret: paymentIntent.client_secret, orderId: orderRef.id };
  }
);
```

```typescript
// functions/src/merch/confirmCardOrder.ts (Stripe webhook)
import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const confirmCardOrder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.orderId;

      // Update order status, trigger fulfillment...
      // (see Cloud Functions section for full flow)
    }

    res.json({ received: true });
  }
);
```

**Stripe webhook URL:** Register in Stripe Dashboard > Developers > Webhooks:
`https://us-central1-trackr-coaster-app.cloudfunctions.net/confirmCardOrder`

---

## 5. Cloud Functions (New)

These Cloud Functions need to be built for the merch payment flow:

### 5.1 `createCardOrder` (callable)

**Purpose:** Client calls this to start checkout. Creates a Stripe PaymentIntent and order record.

**Input:** `{ items: CartItem[], shippingAddress: ShippingAddress, isInstantShip: boolean }`

**Flow:**
1. Authenticate caller (require auth)
2. Validate cart items exist in product catalog
3. Calculate prices server-side (base price, gold foil, pack discounts)
4. Check user's proStatus for 10% discount
5. Add shipping cost ($3.99 US / $8.99 international)
6. Create Stripe PaymentIntent with calculated total
7. Create `orders/{orderId}` doc in Firestore (status: "pending")
8. Return `{ clientSecret, orderId }`

### 5.2 `confirmCardOrder` (Stripe webhook)

**Purpose:** Receives Stripe `payment_intent.succeeded` webhook. Triggers fulfillment.

**Flow:**
1. Verify Stripe webhook signature
2. Find order by PaymentIntent ID
3. Update order status to "paid"
4. If instant ship: call `submitToQPMN()` immediately
5. If batch: add to `batchQueue/{batchWindowId}/items/{orderId}`
6. Send push notification: "Your order is confirmed!"

### 5.3 `submitToQPMN` (internal helper)

**Purpose:** Submits a print job to QPMN via their REST API.

**Flow:**
1. Prepare QPMN order payload (card art files, finish, quantity, shipping address)
2. Call QPMN API to create order
3. Store QPMN order ID in Firestore order doc
4. Update status to "printing"

**Note:** Exact API payload depends on QPMN API docs (need account access first).

### 5.4 `processBatchOrders` (scheduled)

**Purpose:** Runs every 2 weeks. Collects all queued orders and submits as bulk to QPMN.

**Flow:**
1. Query `batchQueue/{currentWindowId}/items` for all paid orders
2. Combine into single QPMN bulk order (FlexiBulk pricing)
3. Call QPMN API with combined order
4. Update each individual order with QPMN batch reference
5. Update all order statuses to "printing"
6. Send push notifications to all customers in batch

### 5.5 `handleQPMNWebhook` (HTTP endpoint)

**Purpose:** Receives fulfillment/shipping updates from QPMN.

**Flow:**
1. Receive webhook from QPMN (shipping confirmation, tracking number)
2. Find order(s) by QPMN order reference
3. Update status to "shipped" with tracking info
4. Send push notification: "Your cards have shipped! Tracking: {number}"

### 5.6 `getOrderStatus` (callable)

**Purpose:** Client fetches current order status + tracking.

**Input:** `{ orderId: string }`

**Returns:** `{ status, trackingNumber?, estimatedDelivery?, items }`

---

## 6. Firestore Schema

### 6.1 Orders Collection

```
orders/{orderId}
  id: string
  userId: string
  items: [
    {
      productId: string
      coasterId: string
      name: string
      parkName: string
      quantity: number
      goldFoil: boolean
      holographic: boolean
      unitPrice: number          // server-calculated
      artUrl: string             // card art storage URL for QPMN
    }
  ]
  shippingAddress: {
    fullName: string
    line1: string
    line2: string
    city: string
    state: string
    zip: string
    country: string
  }
  pricing: {
    subtotal: number
    proDiscount: number
    packDiscount: number
    shipping: number
    total: number
  }
  payment: {
    stripePaymentIntentId: string
    stripeStatus: string         // "succeeded", "failed", etc.
    paidAt: timestamp
  }
  fulfillment: {
    type: "instant" | "batch"
    qpmnOrderId: string | null
    batchWindowId: string | null  // e.g., "2026-W14"
    trackingNumber: string | null
    carrier: string | null
    shippedAt: timestamp | null
    deliveredAt: timestamp | null
  }
  status: "pending" | "paid" | "printing" | "shipped" | "delivered" | "cancelled" | "refunded"
  isInstantShip: boolean
  estimatedDelivery: string
  createdAt: timestamp
  updatedAt: timestamp
```

### 6.2 Batch Queue

```
batchQueue/{batchWindowId}
  windowStart: timestamp
  windowEnd: timestamp
  status: "collecting" | "submitted" | "fulfilled"
  qpmnBulkOrderId: string | null
  orderCount: number

batchQueue/{batchWindowId}/items/{orderId}
  orderId: string                // reference to orders/{orderId}
  addedAt: timestamp
```

### 6.3 Stripe Config (Secrets)

Store in Firebase environment config (NOT Firestore):
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — for verifying webhook signatures
- `STRIPE_PUBLISHABLE_KEY` — for client (can also go in app config)
- `QPMN_API_KEY` — QPMN API credentials
- `QPMN_WEBHOOK_SECRET` — for verifying QPMN webhooks

---

## 7. Implementation Order

### Phase 1: Stripe Setup (can start NOW)
1. Create Stripe account (or use existing if Caleb has one)
2. Install `@stripe/stripe-react-native` in TrackR
3. Add Expo config plugin
4. Dev client rebuild
5. Build `createCardOrder` Cloud Function (Stripe PaymentIntent creation)
6. Build `confirmCardOrder` Cloud Function (Stripe webhook handler)
7. Wire CheckoutScreen to real Stripe PaymentSheet (replace mock ****4242)
8. Test end-to-end: add to cart -> checkout -> pay -> order confirmed

### Phase 2: QPMN Integration (needs account)
1. Sign up for QPMN account
2. Get API credentials
3. Order sample pack (verify NanoBanana art print quality at 2.5"x3.5")
4. Study API docs (get real endpoint specs)
5. Build `submitToQPMN` Cloud Function
6. Build `handleQPMNWebhook` Cloud Function
7. Test: place order -> payment -> QPMN receives order -> prints -> ships

### Phase 3: Batch Order System
1. Build `processBatchOrders` scheduled Cloud Function
2. Set up Firestore batch queue structure
3. Build batch window management (open/close every 2 weeks)
4. Test batch flow end-to-end
5. Add batch vs instant ship toggle to checkout UI

### Phase 4: Apple Pay + Polish
1. Create Apple Merchant ID in Developer portal
2. Configure Apple Pay in Stripe Dashboard
3. Enable Apple Pay in PaymentSheet config
4. Test Apple Pay flow on physical device
5. Wire OrderHistoryScreen to real Firestore orders
6. Wire order status tracking and push notifications

---

## 8. Action Items

### Caleb (Required)

- [ ] **Sign up for QPMN account** at qpmarketnetwork.com — needed for API access, pricing, and sample orders
- [ ] **Order QPMN sample pack** — test NanoBanana card art print quality at TCG 2.5"x3.5"
- [ ] **Confirm or create Stripe account** — need publishable key + secret key
- [ ] **Set Stripe secret as Firebase env var** — `firebase functions:secrets:set STRIPE_SECRET_KEY`
- [ ] **Create Apple Merchant ID** — `merchant.app.ridetrackr` in Apple Developer portal (for Apple Pay)
- [ ] **Enroll in Apple Small Business Program** — confirms 15% commission rate for Pro subscriptions
- [ ] **Create all 14 IAP products in App Store Connect** — the product IDs from verifyPurchase.ts (already coded, just need App Store Connect entries)
- [ ] **Decide gold foil upcharge** — currently $2.99 in mock data. Confirm after seeing QPMN foil pricing.
- [ ] **Decide instant ship premium** — how much more for immediate fulfillment vs batch?
- [ ] **Decide holographic pricing** — offer in V1 or defer?

### Dev (Implementation)

- [ ] Install @stripe/stripe-react-native + Expo config plugin
- [ ] Dev client rebuild (new native dependency)
- [ ] Build 5 new Cloud Functions (createCardOrder, confirmCardOrder, submitToQPMN, processBatchOrders, handleQPMNWebhook, getOrderStatus)
- [ ] Wire CheckoutScreen to real Stripe PaymentSheet
- [ ] Wire OrderHistoryScreen to real Firestore orders collection
- [ ] Build PWYW Pro subscription UI (slider -> IAP product selection)
- [ ] Upload NanoBanana card art to Cloud Storage (QPMN needs URLs to print from)

---

## Sources

### QPMN (Print-on-Demand)
- [QPMN Custom Trading Cards](https://www.qpmarketnetwork.com/custom-trading-cards/)
- [QPMN API Page](https://www.qpmarketnetwork.com/qpmn-api/)
- [QPMN Integrations](https://www.qpmarketnetwork.com/qpmn-integrations/)
- [QPMN Developer Center / API Integration](https://www.qpmarketnetwork.com/app/company/developer-center/integration-with-api/)
- [QPMN Holographic Cards](https://www.qpmarketnetwork.com/custom-holographic-trading-cards/)
- [QPMN Custom Playing Cards (deck pricing)](https://www.qpmarketnetwork.com/custom-playing-cards/)
- [QPMN FAQ (USD only, order flow)](https://www.qpmarketnetwork.com/faq/)

### Stripe
- [Stripe React Native SDK (Expo docs)](https://docs.expo.dev/versions/latest/sdk/stripe/)
- [Stripe React Native SDK (GitHub)](https://github.com/stripe/stripe-react-native)
- [Stripe Accept a Payment (React Native)](https://docs.stripe.com/payments/accept-a-payment?platform=react-native)
- [Stripe Digital Goods / In-App Purchases](https://docs.stripe.com/mobile/digital-goods)
- [Stripe PaymentSheet in React Native (LogRocket)](https://blog.logrocket.com/mastering-stripe-paymentsheet-react-native-expo/)
- [Stripe PWYW / Customer Chooses Price](https://docs.stripe.com/payments/checkout/pay-what-you-want)

### Apple
- [Apple App Store Review Guidelines (Guideline 3.1.3(e) — physical goods)](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Small Business Program (15% commission)](https://developer.apple.com/app-store/small-business-program/)
- [Apple IAP Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Apple StoreKit 2](https://developer.apple.com/storekit/)
- [App Store Small Business Program Guide 2026 (Adapty)](https://adapty.io/blog/app-store-small-business-program/)
- [Can You Use Stripe for In-App Purchases 2026 (Adapty)](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/)
- [Apple Small Business Program (Qonversion)](https://qonversion.io/blog/apple-reduces-app-store-commission-to-15)

### Research Method
All research conducted via Perplexity AI (perplexity_ask, Tier 2) with domain-filtered queries against developer.apple.com, qpmarketnetwork.com, docs.stripe.com, and docs.expo.dev. Key finding on Apple Guideline 3.1.3(e) verified with Apple-domain-restricted Perplexity query.
