# TrackR v1 — Master Implementation Plan

Compiled 2026-03-16. All decisions locked unless explicitly reopened.
Source: planning session + DATABASE_SCHEMA_V1 + v1-audit docs + strategy doc.

**App Store Target: June 22, 2026** (worst case July 20 if Micah overlap)

---

## Table of Contents

1. [Merch Store (Physical Card Art)](#1-merch-store)
2. [TrackR Pro (PWYW)](#2-trackr-pro)
3. [Apple Wallet (PKPass)](#3-apple-wallet)
4. [Gold Border Verification](#4-gold-border-verification)
5. [Backend (Auth + Firestore + Functions)](#5-backend)
6. [Wait Times (Queue-Times API)](#6-wait-times)
7. [HealthKit Step Counting](#7-healthkit)
8. [News Feed / Articles](#8-news-feed)
9. [Frontend Gaps + Polish](#9-frontend-gaps)
10. [Implementation Tracks](#10-implementation-tracks)
11. [New Firestore Collections (from today)](#11-new-firestore-collections)
12. [Open Items (need resolution before build)](#12-open-items)

---

## 1. Merch Store

### Architecture Decision: NATIVE IN-APP (not Shopify, not Next.js)

The merch store is a fully native React Native experience built into TrackR. No external storefront. No webviews. Payment via Stripe React Native SDK (Apple Pay supported). Physical goods are **exempt from Apple's 30% cut**.

### Navigation
- Lives inside the **Collection tab** (Logbook screen)
- "Order Physical" option on individual card views
- "Shop" or "Merch Store" entry point within the Collection section

### Browse UX: Featured + Browse
- Hero section with featured/new card art
- Scrollable sections: "New Arrivals", "Popular", "By Park", "Build Your Pack"
- Each card shows NanoBanana art, coaster name, park name, price
- Filter by park, sort by popularity/newest

### Products
| Type | Description |
|------|-------------|
| Single card | Any individual NanoBanana card. Flat pricing (all same price). |
| Curated collection | Pre-built park collections (e.g., "Cedar Point Collection"). **Only available when ALL coasters at that park have card art.** |
| Custom pack | User picks any 5/10/20 cards. Discounted vs buying singles. |
| Mystery pack | Weighted random: higher chance of popular coasters + user's logged rides, with surprise pulls from full catalog. |

### Eligibility
- **Anyone can buy any card** — logged or not, ridden or not
- Gold foil border is available on ALL physical cards:
  - **GPS-verified in-app (gold earned):** Gold foil is **FREE** (included at standard card price)
  - **Not verified in-app:** Gold foil is an **upcharge** per card
- This creates incentive to verify in-app AND revenue from premium physical orders

### Card Specs
- Size: Standard TCG (2.5" x 3.5")
- Current art: 1696x2528 (1:1.49 ratio). Needs **~77px top/bottom crop** to match poker ratio (1:1.4)
- Card stock: 310-350gsm, semi-gloss or matte (per QPMN options)
- Card back: **Coaster stats + TrackR branding** (baseball card model — stats on top half, TrackR brand on bottom half)

### Checkout Flow: Hybrid
- **Single card:** Quick buy — tap card → confirm (with gold foil toggle) → pay → done
- **Multi-card / packs:** Cart system — add cards to cart → cart badge on store icon → checkout when ready
- **Custom pack builder:** Pick cards → add to builder → checkout as a pack (discounted)
- Payment: Stripe React Native SDK (Apple Pay + card)
- Shipping address collected at checkout (saved for future orders)

### Pricing
- **TBD** — depends on QPMN production costs. Need to run their cost calculator first.
- Strategy doc range: $5-15/card, $25-40/collection
- Pro subscribers: **10% off ALL merch orders** (every time)
- Gold foil upcharge: TBD after QPMN pricing

### Free Card (Pro Perk)
- First-time Pro subscribers get **1 free NanoBanana card**
- In-app claim flow: prompt after subscribing → pick any card → enter shipping → ships via QPMN
- **Gold foil option included** on the free card (user's choice)
- If user skips the claim, it persists as "1 free card remaining" — appears naturally in checkout later
- NOT presented as a "coupon" or "100% off" — just a seamless perk

### Fulfillment: QPMN (QP Market Network)
- REST API for automated order fulfillment
- Gold foil, silver foil, holographic, gilded edges available
- Single-card POD (no minimums)
- 310-350gsm card stock options (blue core, black core)
- Ships worldwide, 3-7 business day production
- [Cost calculator](https://www.qpmarketnetwork.com/qpmn-card-product-cost-calculator/)
- [API docs](https://www.qpmarketnetwork.com/qpmn-api/)

### Shipping
- US + international from day one (QPMN handles international fulfillment)
- Packaging: TBD based on QPMN capabilities

### Screens to Build
| Screen | Purpose |
|--------|---------|
| MerchStoreScreen | Featured + browse. Hero section, scrollable sections. |
| MerchCardDetailSheet | Card art preview, gold foil toggle, price, "Add to Cart" / "Buy Now" |
| CartScreen | Cart items, quantity, subtotals, Pro discount, checkout button |
| CheckoutScreen | Shipping address form, payment (Stripe), order summary, confirm |
| OrderConfirmationScreen | Order placed! Tracking info when available. |
| OrderHistoryScreen | Past orders, statuses, tracking links |
| CustomPackBuilderScreen | Pick N cards for a custom pack, running total, checkout |

---

## 2. TrackR Pro

### PWYW (Pay What You Want)
- One unlock level — **any paid amount unlocks ALL Pro features**
- Tiers are **identity only** (badge color/style), not feature gates

### Pricing
| Display | Actual Apple IAP | Notes |
|---------|-----------------|-------|
| $2/mo | $1.99/mo | Low tier |
| **$3/mo** | **$2.99/mo** | **Default (pre-selected)** |
| $4/mo | $3.99/mo | High tier |
| Custom slider | $0.99 - $11.99 | Snaps to Apple IAP tiers. Coaster-themed tier names (TBD). |
| Annual | Monthly × 10 | "Save X%" badge |

- Apple Small Business Program: **15% commission** (already applied)

### Pro Features (all tiers, confirmed)
1. Advanced stats and analytics (detailed ride history charts, park visit patterns)
2. Export ride log (CSV/JSON)
3. Pro badge/checkmark on profile (colored by tier)
4. Custom rating criteria beyond default 7
5. Pro badge visible on leaderboards (Clash Royale gold name style)
6. Early access to new features
7. 10% off ALL merch orders (every time)
8. One free NanoBanana card on first subscription
9. Article contributor eligibility (future)

### Paywall UX: Bottom Sheet Nudge
- When a free user taps a Pro-gated feature → **bottom sheet** slides up
- Gentle, on-brand (matches TrackR's bottom sheet design language)
- Shows what the feature does + "Unlock with TrackR Pro" + button to Pro upgrade screen
- **Not blocking** — sheet is dismissible, user can close and continue using the app

### Pro Badge
- Subtle identity marker: checkmark or avatar border treatment
- NOT different features per tier — just visual identity
- Visible on profile, leaderboards, community posts

### Implementation
| Component | Details |
|-----------|---------|
| IAP library | `react-native-iap` (Expo SDK 54 compatible) |
| Products | Auto-renewable subscriptions: ~12 monthly + ~12 annual IAP products |
| Receipt validation | `verifyPurchase` Cloud Function |
| Apple webhook | `handleSubscriptionEvent` Cloud Function |
| Restore purchases | Required by App Store — button in Settings |
| Sandbox testing | TestFlight sandbox in M4 |

### Screens to Build/Modify
| Screen | Work |
|--------|------|
| ProUpgradeScreen (NEW) | PWYW picker: 3 main cards + custom slider, benefits list, purchase button |
| ProPaywallSheet (NEW) | Bottom sheet nudge for gated features |
| ProfileScreen | Pro card → navigate to ProUpgradeScreen |
| PerksScreen | "Go Pro" → navigate to ProUpgradeScreen |
| SettingsScreen | "Manage Subscription" (Pro), "Go Pro" (free), "Restore Purchases" |

---

## 3. Apple Wallet

### Overview
All wallet items in TrackR can be exported to Apple Wallet as PKPass passes. Passes auto-surface on the lock screen when approaching a park.

### Eligible Items
- **All wallet items:** season passes, day tickets, membership cards, parking passes — everything

### Pass Styles (User Picks)
| Style | Description |
|-------|-------------|
| Clean | Minimal white/light design with park name and barcode |
| NanoBanana | Card art as strip image (uses relevant coaster's NanoBanana art) |
| Park Color | Park's brand colors as background |
| Dark | Dark mode variant |
| Light | Light/airy variant |

User selects from a **style picker with previews** when generating a pass.

### Geo-fencing
- **~1km radius** (approaching) triggers pass auto-surface on lock screen
- Practical: pass appears as you're driving up to the park, before reaching the gate
- Uses Apple's built-in PKPass `locations` field with park lat/lng

### Pass Updates
- **Auto-update via APNs push** when ticket details change in TrackR
- Requires the `appleWalletWebService` Cloud Function (5 REST endpoints per Apple's PassKit spec)
- Devices register for updates, get push notifications when pass data changes

### Implementation
| Component | Details |
|-----------|---------|
| Pass Type ID cert | Create in Apple Developer portal (Team ID: Q9H59NQ25W) |
| `generatePKPass` CF | Callable. Builds pass.json, signs with cert, returns .pkpass download URL |
| `appleWalletWebService` CF | HTTPS Express router, 5 endpoints per Apple spec |
| `updatePassOnChange` CF | Firestore trigger on ticket update → push update to registered devices |
| Client library | `react-native-wallet-manager` for adding passes to Wallet |
| Server library | `passkit-generator` npm for PKPass signing |

### Screens to Build/Modify
| Screen | Work |
|--------|------|
| PassDetailView | Add "Add to Apple Wallet" button + style picker |
| WalletStylePickerSheet (NEW) | 5 style options with live previews |

---

## 4. Gold Border Verification

### In-App Gold Border (cannot be purchased)
- Earned by logging a ride while **GPS confirms you're within ~200m of the ride**
- Uses existing POI lat/lng data across 28 parks (ride-level coordinates)
- Creates Pokemon Go-style discovery moments at parks

### GPS Flow
1. User taps "Log Ride" while at the park
2. App checks GPS against ride's POI coordinates
3. If within ~200m: ride is logged as **Verified Gold**
4. Gold border appears on the card in their collection
5. Status stored in Firestore on the ride log document

### Photo Fallback (when GPS fails)
- For indoor rides, poor signal, or GPS drift
- User takes a photo **in-app** (camera capture only — no photo library access)
- Photo of the ride, entrance, or station proves physical presence
- Photo is NOT uploaded — just captured locally as proof
- User submits verification request → manual review (Caleb reviews)
- If approved: gold border applied retroactively

### Physical Merch Gold
- **GPS-verified in-app:** Gold foil on physical card = FREE (standard price)
- **Not verified:** Gold foil = upcharge per card
- Anyone can ORDER gold foil — it's just cheaper if earned

### New Backend Needs
| Item | Details |
|------|---------|
| `rideLogs` field | Add `verified: boolean` and `verificationMethod: 'gps' \| 'photo-review' \| null` |
| `verificationRequests/{requestId}` | Photo review requests: userId, logId, photoLocalUri, status (pending/approved/denied) |
| `verifyGoldBorder` CF | Callable: check GPS proximity to ride POI, mark log as verified |
| Admin review tool | Simple way for Caleb to approve/deny photo verification requests |

---

## 5. Backend

### Architecture (Locked)
- **Offline-first** with Firestore persistence
- **@react-native-firebase** (native SDK)
- **Zustand** replaces module-level stores
- **Algolia** for universal search (coasters, users, wallet)
- **Mutual friends** model (request → accept → friends)

### Existing Schema
- **22 Firestore paths** (8 top-level + 10 subcollections + 4 single docs)
- **39 Cloud Functions** (17 M1-M2 critical, 12 M2 community, 10 M3 premium)
- Full TypeScript interfaces in `docs/DATABASE_SCHEMA_V1/collections-m1.md`, `m2.md`, `m3.md`
- Security rules in `docs/DATABASE_SCHEMA_V1/security-rules.md`
- Composite indexes in `docs/DATABASE_SCHEMA_V1/indexes.md`
- Cloud Function specs in `docs/DATABASE_SCHEMA_V1/cloud-functions.md`

### Sprint Plan (from schema doc)
| Sprint | Scope | Milestone |
|--------|-------|-----------|
| 1 | Zustand + Firebase setup | M1 week 1 |
| 2 | Auth + User Docs | M1 week 1-2 |
| 3 | Core Persistence (ride logs, ratings, profile) | M1 week 2-3 |
| 4 | Community + Social (posts, friends, feed) | M2 week 3-4 |
| 5 | Wallet + Parks + Notifications | M2 week 4-5 |
| 6 | Premium (Apple Wallet, Pro IAP, games) | M3 week 5-7 |

---

## 6. Wait Times

- **API:** Queue-Times.com (API signup still needed)
- **Cloud Function:** `proxyWaitTimes` — caches responses for 5 min in `parkWaitTimes/{parkSlug}`
- **UI:** Already built with mock data, needs wiring to real API
- **Coverage:** 10+ major parks at launch

---

## 7. HealthKit

- **v1 scope** (confirmed — include at launch)
- Step counting at parks (integrated with park visit experience)
- Library: `expo-health` or `react-native-health`
- Geo-fence trigger: ~1km from park (same as Apple Wallet, starts counting at approach)
- Display: park visit summary screen, profile stats

---

## 8. News Feed

- **Pipeline documented:** `docs/article-content-workflow.md`
- 5-step process: Discover (Perplexity) → Research (deep tool) → Humanize (voice pass) → Format → Store (Firestore)
- **Pre-launch target:** 15-20 articles ready before TestFlight beta
- Firestore: `articles/{articleId}` collection
- NanoBanana card art as article banner images
- Will become `/article` skill for ongoing content production
- Content calendar: 2-3 articles/week March-April

---

## 9. Frontend Gaps + Polish

### Activity Screen: SCRAPPED
- Remove `ActivityScreen.tsx` from codebase and navigator
- Friend activity → Community tab
- Pending/unrated rides → Logbook pending tab (if applicable)

### Onboarding (5 more screens)
| Screen | Feature |
|--------|---------|
| 6 | Customize Criteria (adjust weights, enable/disable) |
| 7 | Your Collection (logbook grid, cards flip gray → color) |
| 8 | Community (feed, rankings, friend activity) |
| 9 | Parks (park page, change parks, guides) |
| 10 | Coastle (daily guessing game demo) |

### CommunityFriends — 6 Missing UI Elements
- Add friend button
- Remove friend button
- Search users
- Friend requests list
- Pull-to-refresh
- (Flagged as "biggest UI gap in the app" by v1 audit)

### Punch List (from Sprint 8)
- [ ] ProfileReady: particle animation janky, name wrapping, timing too slow, subtitle visibility
- [ ] HomePark screen: redesign to match app's design language
- [ ] Community fog gradient: starts too low, hard edge
- [ ] Profile: scroll-to-top too aggressive, rankings medal colors
- [ ] AddTicketFlow: redesign barcode entry + extra info screens
- [ ] Trivia: Next Question transition sometimes misses

### Card Art Production
- 77px top/bottom crop needs testing with QPMN sample batch
- Card back design needs to be created (stats layout + TrackR branding)
- Pipeline has 50+ cards, more in QUEUE.md

---

## 10. Implementation Tracks

Three parallel workstreams. Backend is the critical path.

### Track A: Backend (CRITICAL PATH)
**Owner: Claude + Caleb**
**Timeline: M1-M3 (March 17 – April 27)**

| Week | Sprint | Deliverable | Status |
|------|--------|-------------|--------|
| ~~Done~~ | Sprint 1 | Zustand migration (8 stores), Firebase app + auth setup | **DONE** |
| ~~Partial~~ | Sprint 2a | Email auth service (sign-in/up/out, password reset, delete, state listener) | **DONE** |
| Mar 17-23 | Sprint 2b | Google Sign-In, Apple Sign-In, Firestore service, user doc creation, username validation CF | **NEXT** |
| Mar 24-30 | Sprint 3 | Ride log persistence, ratings, profile sync, criteria config |  |
| Mar 31 - Apr 6 | Sprint 4 | Community posts, comments, likes, friend system, feed |  |
| Apr 7-13 | Sprint 5 | Wallet sync, Queue-Times API, FCM notifications |  |
| Apr 14-20 | Sprint 6 | Apple Wallet PKPass, Pro IAP, game stats |  |

### Track B: Merch Store (PARALLEL)
**Timeline: March – April (overlaps with backend)**

| Step | Task | Dependency |
|------|------|------------|
| 1 | QPMN: API signup + pricing confirmation | None |
| 2 | Card art crop: test 77px with QPMN sample batch | QPMN account |
| 3 | Card back design: stats + TrackR branding graphic | None |
| 4 | Set final pricing based on QPMN costs + margins | Steps 1-2 |
| 5 | MerchStoreScreen UI (Featured + browse) | None (can use mock data) |
| 6 | MerchCardDetailSheet (card preview, gold toggle, pricing) | None |
| 7 | CartScreen + CustomPackBuilderScreen | None |
| 8 | CheckoutScreen (Stripe RN SDK, shipping address) | Stripe setup |
| 9 | Merch backend: orders collection, QPMN API integration | Backend Sprint 2+ |
| 10 | Order tracking + history | Step 9 |
| 11 | Gold foil verification pricing logic | Gold verification system |
| 12 | Pro discount integration (10% off) | Pro IAP system |

### Track C: Content + Polish (ONGOING)
**Timeline: March – May (continuous)**

| Priority | Task |
|----------|------|
| High | Article pipeline: start generating 15-20 articles |
| High | CommunityFriends: build 6 missing UI elements |
| High | Onboarding screens 6-10 |
| Medium | Frontend punch list (ProfileReady, HomePark, fog, etc.) |
| Medium | Activity screen removal |
| Medium | HealthKit step counting integration |
| Medium | Gold verification frontend (GPS check + photo fallback) |
| Low | Algolia search setup (pre-TestFlight) |
| Low | Card art: continue NanoBanana pipeline for remaining coasters |

---

## 11. New Firestore Collections (from today's decisions)

These need to be added to the DATABASE_SCHEMA_V1 docs:

### Merch Store
```
orders/{orderId}                    — Order record (userId, items, total, shipping, status, qpmnOrderId)
orders/{orderId}/items/{itemId}     — Individual items in an order
users/{userId}/cart/{itemId}        — Cart items (cleared on checkout)
users/{userId}/addresses/{addrId}   — Saved shipping addresses
users/{userId}/merchPerks           — Single doc: freeCardClaimed, freeCardUsed, proDiscountActive
```

### Gold Verification
```
rideLogs/{userId}/logs/{logId}      — ADD fields: verified (boolean), verificationMethod ('gps' | 'photo-review' | null)
verificationRequests/{requestId}    — Photo review: userId, logId, status, submittedAt, reviewedAt
```

### Articles (already designed)
```
articles/{articleId}                — News articles for home feed
```

### New Cloud Functions
| Function | Type | Purpose |
|----------|------|---------|
| `verifyGoldBorder` | Callable | Check GPS vs ride POI, mark log as verified |
| `createMerchOrder` | Callable | Validate cart, calculate pricing (gold upcharge, Pro discount), create QPMN order via API |
| `handleQPMNWebhook` | HTTPS | Receive order status updates from QPMN |
| `getMerchProducts` | Callable | Return available card art products with pricing |
| `applyFreeCardPerk` | Callable | Apply first-Pro free card to an order |

---

## 12. Open Items (need resolution before build)

| Item | Blocker for | How to resolve |
|------|-------------|---------------|
| QPMN API signup + pricing | Merch store pricing, margins | Run cost calculator, create account, verify API docs |
| Queue-Times API signup | Wait times feature | Sign up at queue-times.com |
| Pass Type ID certificate | Apple Wallet | Create in Apple Developer portal |
| Card back graphic design | Physical card production | Design stats layout + TrackR branding |
| 77px crop test | Physical card quality | Order QPMN sample batch with cropped art |
| QPMN packaging options | Packaging decision | Review QPMN's packaging capabilities |
| Coaster-themed tier names | Pro upgrade screen | Decide on fun names for PWYW slider tiers |
| Gold foil upcharge amount | Merch checkout pricing | Calculate after QPMN costs are known |
| TrackR article voice file | Article humanization | Create editorial voice guidelines based on voice.md |
| Algolia account setup | Universal search | Create Algolia account, define indexes |

---

## Reference Docs

| Doc | Location |
|-----|----------|
| Product strategy | `context/projects/trackr-strategy.md` |
| V1 SMART goals | `context/projects/trackr-v1-goals.md` |
| Card tier system | `context/projects/trackr-card-tiers.md` |
| Database schema | `docs/DATABASE_SCHEMA_V1/` (6 files) |
| V1 audit (20 docs) | `docs/v1-audit/` |
| Article workflow | `docs/article-content-workflow.md` |
| Competitive landscape | `context/projects/trackr-competitive-landscape.md` |
| Design system | `DESIGN_SYSTEM/` |
| App blueprint | `.claude/plans/app-blueprint/` |
