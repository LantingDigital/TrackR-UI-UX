# Pro & Merch Store -- v1 Backend Audit (Cross-Cutting)

## Decisions Made (2026-03-11)

All pricing, features, and architecture decisions confirmed during deep audit Q&A session.

---

## TrackR Pro (PWYW Model)

### Current State

- ProfileScreen has a "Pro" upgrade card with an empty `handleProUpgrade` handler
- PerksScreen has a "Go Pro" button that shows a "Coming soon" toast
- No IAP integration exists
- No features are currently gated behind Pro

### v1 Pro Scope (M3)

**Pay What You Want (PWYW):**
- One unlock level. Any paid amount unlocks all Pro features. Tiers are identity, not feature gates.
- Three main cards: $2/mo, $3/mo (default, pre-selected), $4/mo. Displayed as clean whole dollar amounts ($2, $3, $4). Actual Apple IAP prices: $1.99, $2.99, $3.99. Consistent $1 staggering.
- Custom slider: $1 to $12 range, snapping to Apple IAP tiers. Coaster-themed tier names. Lighthearted messages as you slide.
- Annual option: Same tiers x10 with "Save X%" badge.
- Positioned as "support the developer" with benefits, not as a paywall
- Apple takes 15% of subscriptions (Small Business Program). No cut on physical merch.

**Pro Features (confirmed, all tiers):**
- Advanced stats and analytics (detailed ride history charts, park visit patterns)
- Export ride log (CSV/JSON) — currently stubbed
- Pro badge/checkmark on profile (colored by tier — like Instagram verification but different colors)
- Custom rating criteria beyond default 7
- Pro badge visible on leaderboards (Clash Royale gold name style — prominent but not gating)
- Early access to new features
- 10% off ALL merch orders (every time, not just first)
- One free NanoBanana card on first Pro subscription (welcome gift)
- Article contributor eligibility (when content system is built)

### Implementation Requirements

| Component | Details |
|-----------|---------|
| IAP Library | `react-native-iap` or `expo-in-app-purchases` (Expo SDK 54 compatible) |
| Products | Auto-renewable subscription with multiple price tiers ($1.99-$11.99 monthly, annual equivalents) |
| Receipt validation | Cloud Function: validate Apple receipt server-side |
| Pro status | `users/{userId}.proStatus: { active, tier, expiresAt, purchaseToken }` |
| Restore purchases | Required by App Store — "Restore Purchases" button in Settings |
| Sandbox testing | TestFlight sandbox for IAP testing (M4) |

### Firestore Collections

| Collection | Doc Structure |
|------------|--------------|
| `users/{userId}` (pro fields) | `{ proStatus: { active: boolean, tier: string, expiresAt: timestamp, platform: 'ios' } }` |
| `purchases/{purchaseId}` | `{ userId, productId, transactionId, receipt, verifiedAt, environment: 'production'\|'sandbox' }` |

### Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `verifyPurchase` | Callable | Validate Apple receipt, update pro status |
| `handleSubscriptionEvent` | Apple Server Notification (webhook) | Handle renewals, cancellations, refunds |
| `checkProStatus` | Callable | Check if subscription is still active |

### Screens to Modify

- ProfileScreen: Pro card → navigate to Pro upgrade flow
- PerksScreen: "Go Pro" → navigate to Pro upgrade flow
- SettingsScreen: Add "Manage Subscription" row (Pro users), "Go Pro" row (free users), "Restore Purchases" row
- New: ProUpgradeScreen — PWYW picker with three main cards + slider, benefits list, purchase button
- Gate screens: add soft Pro prompts on gated features (not hard blocks)

---

## Merch Store (Physical Card Art)

### Concept

NanoBanana card art as physical trading cards. Print-on-demand via custom store (Next.js + Stripe + Printful API). Zero monthly cost. Lives on TrackR domain.

### v1 Merch Scope (M3 — can follow in v1.1)

- 10+ NanoBanana designs available at launch (pipeline has 50+ already)
- Flat pricing per card — no pricing by coaster popularity. All individual cards same price.
- Bundle options: Single card, 5-pack, 10-pack, mystery pack, full park collection
- Card size: Standard poker/trading card (2.5" x 3.5"). Current art is 1696x2528 (1:1.49 ratio). Needs minor top/bottom crop (~77px each side) to match poker ratio (1:1.4). Test with sample batch before full crop.
- Premium card stock (300gsm+, semi-gloss or matte finish)

### In-App Integration

| Element | Location | Behavior |
|---------|----------|----------|
| "Order Card" button | CoasterDetailScreen or card art view | In-app checkout via Stripe React Native SDK |
| "Merch Store" row | ProfileScreen or SettingsScreen | Opens in-app store view |
| Collection view | LogbookScreen Collection tab | "Order physical card" option on owned cards |
| Pro perk | ProUpgradeScreen | 10% off ALL merch orders + one free card on first subscription |

### Backend Requirements

| Service | Purpose | Notes |
|---------|---------|-------|
| Next.js store | Custom storefront on TrackR domain | Zero monthly cost (vs Shopify $5-39/mo) |
| Stripe | Payment processing | React Native SDK for in-app checkout (supports Apple Pay) |
| Printful API | Print-on-demand fulfillment | Direct API integration, no Shopify middleman |

### Architecture

Custom store built with Next.js + Stripe + Printful API. No Shopify. In-app checkout using Stripe React Native SDK (supports Apple Pay). No Safari redirect needed. This eliminates monthly Shopify fees entirely.

### Setup Steps

1. Build Next.js storefront on TrackR domain
2. Integrate Printful API for product catalog and fulfillment
3. Set up Stripe for payment processing
4. Upload card art designs as products (one per coaster)
5. Set up product variants (single card, 5-pack, 10-pack, mystery pack, full collection)
6. Integrate Stripe React Native SDK for in-app checkout
7. Test card crop (77px top/bottom) with sample Printful batch before full production

---

## Remaining Open Questions

1. **Merch fulfillment region:** US-only for v1, or international? Printful supports international but shipping costs vary.
2. **App Store review risk:** PWYW is unusual. Apple may flag it during review. Should have a fallback to standard fixed pricing if Apple rejects PWYW.
