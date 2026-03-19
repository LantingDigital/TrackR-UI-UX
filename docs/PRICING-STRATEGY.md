# TrackR Card Merch — Pricing Strategy

**Date:** 2026-03-19
**Status:** Research complete, ready for Caleb + Josh review
**Depends on:** QPMN account signup (exact per-card pricing), sample order validation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Production Cost Analysis](#2-production-cost-analysis)
3. [Per-Card Cost at Different Volumes](#3-per-card-cost-at-different-volumes)
4. [Holographic / Foil Cost Analysis](#4-holographic--foil-cost-analysis)
5. [Shipping + Packaging Costs](#5-shipping--packaging-costs)
6. [Competitor Pricing Landscape](#6-competitor-pricing-landscape)
7. [Recommended Retail Pricing](#7-recommended-retail-pricing)
8. [Margin Analysis](#8-margin-analysis)
9. [Batch vs Instant Ship Economics](#9-batch-vs-instant-ship-economics)
10. [Kickstarter Tier Recommendations](#10-kickstarter-tier-recommendations)
11. [Break-Even Analysis](#11-break-even-analysis)
12. [Action Items](#12-action-items)

---

## 1. Executive Summary

TrackR sells **individual trading cards** (2.5"x3.5"), not full decks. This is a fundamentally different model than most POD card sellers, which means per-card costs are higher but perceived value is also higher (collectible singles, not bulk decks).

**Key findings:**
- Single-card POD cost: estimated **$2.50-$4.00** per card (standard finish)
- Gold foil adds: **$1.00-$3.00** per card
- Holographic adds: **$2.00-$4.00** per card
- Batch orders (20+ cards pooled) drop costs **20-40%** vs single orders
- Recommended standard retail: **$5.99** (batch) / **$8.99** (instant ship)
- Gold foil retail: **$8.99** (batch) / **$11.99** (instant ship)
- Target margin: **40-55%** on batch orders, **25-40%** on instant ship
- Kickstarter $100 tier (10-pack pick) is viable with healthy margin

**The math works.** Even at worst-case single-unit POD costs, TrackR's pricing lands in the sweet spot: cheaper than custom artisan cards on Etsy ($15-50), comparable to premium Pokemon singles ($5-15 for holos), and far above commodity card pricing ($0.01-$0.50).

---

## 2. Production Cost Analysis

### 2.1 POD Provider Comparison (Per-Deck Pricing)

All prices are for a standard 54-card deck, 2.5"x3.5" TCG size, standard cardstock.

| Provider | 1 deck | 6 decks | 50 decks | 100 decks | 500 decks | 1,000 decks |
|----------|--------|---------|----------|-----------|-----------|-------------|
| **MakePlayingCards (S30)** | $9.35 | $7.85 | $5.25 | $4.25 | $2.80 | $2.10 |
| **MakePlayingCards (S33 Blue Core)** | $9.95 | $8.45 | $5.85 | $4.85 | $3.40 | $2.70 |
| **QPMN (60-card set)** | ~$8.70* | — | — | ~$5.91 (200) | $3.20 (500) | $2.45 (1,000) |
| **NotMPC (US-based)** | $18.75 | — | — | — | — | — |
| **PrinterStudio** | $9.10/card | $7.00/card (10+) | — | — | — | — |
| **Printify** | $9.58-$13.69/deck | — | — | — | — | — |
| **QinPrinting (offset)** | — | — | — | — | $1.68 (500) | $1.13 (1,000) |

*QPMN staging/test price found at $8.70 for a single card set. Actual pricing requires account signup.*

### 2.2 The Single-Card Problem

TrackR doesn't sell decks. We sell **individual cards** — 1 to maybe 10 at a time per order. This is the most expensive way to use POD.

**Estimated per-card costs for SINGLE card orders:**

| Finish | Single order (1 card) | Small batch (5-10) | Medium batch (20-50) | Large batch (100+) |
|--------|----------------------|--------------------|-----------------------|---------------------|
| **Standard** | $3.00-$4.00 | $2.50-$3.50 | $1.50-$2.50 | $0.80-$1.50 |
| **Gold foil** | $4.00-$6.00 | $3.50-$5.00 | $2.50-$4.00 | $1.50-$3.00 |
| **Holographic** | $5.00-$7.00 | $4.00-$6.00 | $3.00-$5.00 | $2.00-$4.00 |

These are estimates based on:
- MPC per-deck pricing (divided by card count, plus single-unit premium)
- QPMN staging data ($8.70 for a test card product)
- Industry POD comparison data from Perplexity research
- PrinterStudio single-card pricing ($9.10 for 1, $7.00 for 10+)

**CRITICAL: These estimates will be replaced with EXACT pricing once Caleb signs up for QPMN and accesses their pricing calculator.**

### 2.3 Why QPMN is the Right Choice

| Factor | QPMN | MakePlayingCards | PrinterStudio |
|--------|------|-----------------|---------------|
| **Single card orders** | Yes (Zero MOQ) | Yes (1 deck min) | Yes |
| **FlexiBulk (pool orders)** | Yes — the key feature | No | No |
| **TCG size (2.5"x3.5")** | Yes | Yes | Yes |
| **Gold foil** | Yes | Yes (exclusive tech) | No |
| **Holographic** | Yes | Yes | No |
| **REST API** | Yes | No (manual upload) | No |
| **Auto-fulfillment** | Yes (Shopify + custom) | No | No |
| **Custom storefront API** | Yes | No | No |
| **Production time** | 3-7 business days | 7-14 business days | 5-10 business days |

QPMN's FlexiBulk is the killer feature for TrackR's batch model: we pool 2 weeks of customer orders into one bulk submission, getting volume pricing without holding inventory.

---

## 3. Per-Card Cost at Different Volumes

### 3.1 QPMN FlexiBulk Batch Scenarios

Based on QPMN's published FlexiBulk data for 60-card sets and tarot decks, extrapolated to single-card equivalents:

| Batch size (total cards across all orders) | Est. cost per card | Savings vs single |
|-------------------------------------------|-------------------|-------------------|
| 1-5 cards | $3.00-$4.00 | Baseline |
| 10-20 cards | $2.50-$3.00 | 15-25% |
| 50-100 cards | $1.50-$2.00 | 40-50% |
| 200-500 cards | $0.80-$1.20 | 65-75% |
| 1,000+ cards | $0.50-$0.80 | 80%+ |

### 3.2 Realistic Early-Stage Volumes

For the first 3-6 months after launch, expect:
- **Optimistic:** 50-100 card orders per 2-week batch window
- **Moderate:** 20-50 card orders per batch
- **Conservative:** 5-20 card orders per batch

At moderate volumes (30-50 cards/batch), the expected per-card cost is **$1.50-$2.50** for standard finish. This is the planning number for pricing.

---

## 4. Holographic / Foil Cost Analysis

### 4.1 Foil Printing Cost Adders

Based on MPC Impressions Foil pricing ($14.95 vs $10.25 per deck = ~46% premium) and industry data:

| Finish | Cost adder per card | When to use |
|--------|-------------------|-------------|
| **Standard (no foil)** | Baseline | Default card finish |
| **Gold foil border** | +$1.00-$2.00 | GPS-verified (free to user) or upcharge for non-verified |
| **Silver foil** | +$1.00-$2.00 | Future option |
| **Rainbow holographic** | +$2.00-$3.00 | Premium/special edition |
| **Textured dot foil** | +$2.00-$3.00 | Premium option |
| **Gilded edges** | +$0.50-$1.50 | Ultra-premium addon |

### 4.2 Foil Cost Sensitivity to Volume

Foil costs drop faster than base card costs at volume because the fixed setup cost (die creation for hot foil: $50-200) gets amortized:

| Volume | Gold foil adder | Holo adder |
|--------|----------------|------------|
| 1-10 cards | +$2.00-$3.00 | +$3.00-$4.00 |
| 50-100 cards | +$1.00-$1.50 | +$1.50-$2.50 |
| 500+ cards | +$0.50-$0.80 | +$0.80-$1.50 |

### 4.3 Gold Foil Pricing Decision

Per the card tier system, GPS-verified users get gold foil **free** (included in standard price). Non-verified users pay an upcharge.

**Recommendation: $2.99 gold foil upcharge** (already in mock data)

This covers the foil cost at moderate volumes ($1.00-$2.00) with margin, and the $2.99 price point is psychologically comfortable — under $3, feels like a small addon, not a gouge.

---

## 5. Shipping + Packaging Costs

### 5.1 Shipping Costs

| Method | Weight range | Cost | Use case |
|--------|-------------|------|----------|
| **USPS First Class (PWE)** | 1-3 cards in toploader | $0.78 (1 stamp) | Low-value singles |
| **USPS First Class (padded)** | 1-10 cards | $3.50-$4.50 | Standard card orders |
| **USPS Ground Advantage** | 10-20 cards | $3.75-$5.00 | Larger orders |
| **USPS Priority Mail** | 20+ cards or high value | $8.00-$12.65 | Premium/insured |
| **QPMN direct-to-customer** | Varies | Included in QPMN pricing | POD fulfillment |

**Note:** If QPMN ships direct to customer (preferred model), shipping is bundled into their fulfillment pricing. We don't handle shipping ourselves.

### 5.2 Packaging Costs Per Card

| Item | Unit cost | Bulk cost (1000+) |
|------|-----------|-------------------|
| Penny sleeve | $0.02 | $0.015 |
| Toploader (35pt) | $0.11-$0.13 | $0.08-$0.10 |
| Custom tuck box (for packs) | $0.90-$2.50 | $0.90 |
| Branded envelope/mailer | $0.50-$1.00 | $0.25-$0.50 |
| Total per single card | $0.63-$1.15 | $0.32-$0.60 |
| Total per 5-pack | $1.70-$2.50 | $0.90-$1.50 |

### 5.3 Simplified Shipping Model (V1 Recommendation)

To keep it simple for V1, charge flat shipping rates:

| Order type | Customer pays | Our actual cost |
|-----------|--------------|-----------------|
| **US standard (batch)** | $3.99 | $3.50-$4.50 (roughly break-even) |
| **US standard (instant)** | $4.99 | $4.00-$5.50 |
| **International** | $8.99 | $7.00-$12.00 (may eat some cost) |
| **Free shipping threshold** | Orders $25+ | Absorb ~$4 into margin |

---

## 6. Competitor Pricing Landscape

### 6.1 Direct Competitors (Collectible Card Singles)

| Product | Price per card | Notes |
|---------|---------------|-------|
| **Pokemon common** | $0.01-$0.10 | Mass-produced, no perceived rarity |
| **Pokemon uncommon** | $0.05-$0.50 | Still commodity |
| **Pokemon holo rare** | $0.50-$15.00 | Perceived value from rarity |
| **Pokemon ultra rare** | $1.00-$50.00 | Chase cards |
| **Sports card common** | $0.05-$0.50 | Similar to Pokemon |
| **Sports card rookie/premium** | $5.00-$100+ | Condition/grade dependent |

### 6.2 Custom/Artisan Cards (Our Actual Competitive Set)

| Product | Price per card | Notes |
|---------|---------------|-------|
| **Etsy custom photo trading card** | $3.00-$8.00 | Photo-based, per-card |
| **Etsy personalized Pokemon-style** | $7.99-$15.00 | Custom art, single card |
| **Etsy holographic custom card** | $15.00 | Holo laminated |
| **Etsy hand-painted/illustrated** | $25.00-$50.00 | True artisan |
| **Etsy custom MTG card** | $9.00-$22.00 | Fan-made, personalized |
| **Custom DJ/artist trading card** | $7.99 | Holo laminated |
| **Custom bulk sets (50-100 cards)** | $0.20-$2.00/card | Game sets, not singles |

### 6.3 Card Game Packs

| Product | Pack price | Cards per pack | Per card |
|---------|-----------|---------------|----------|
| **Pokemon booster pack** | $4.49 | 10-11 | $0.41-$0.45 |
| **Top Trumps deck** | $9.99 | 30 | $0.33 |
| **Custom TCG booster (indie)** | $5.99-$8.99 | 10-15 | $0.40-$0.90 |

### 6.4 Where TrackR Fits

TrackR cards are **not** commodity cards (mass-printed, random pulls). They are:
- AI-generated custom art (NanoBanana) unique to each coaster
- Collectible singles tied to real rides the user has ridden
- A physical extension of a digital collection
- Part of a playable trading card game

This positions them squarely in the **custom artisan card** bracket ($5-$15/card), NOT the commodity bracket ($0.01-$0.50). The closest comparison is a personalized custom card on Etsy at $7.99-$15.00.

---

## 7. Recommended Retail Pricing

### 7.1 Singles Pricing

| Product | Batch price | Instant ship price | Gold foil add-on |
|---------|------------|-------------------|------------------|
| **Standard card** | $5.99 | $8.99 | +$2.99 |
| **Standard + gold foil** | $8.98 | $11.98 | (included) |
| **Holographic card** | $9.99 | $13.99 | N/A (holo replaces gold) |

### 7.2 Pack Pricing (Bundles)

| Pack | Cards | Batch price | Per card | Savings vs singles |
|------|-------|------------|----------|-------------------|
| **3-pack (Starter)** | 3 | $14.99 | $5.00 | 17% off |
| **5-pack** | 5 | $22.99 | $4.60 | 23% off |
| **10-pack** | 10 | $39.99 | $4.00 | 33% off |
| **Park deck** (all coasters at a park) | 10-25 | $3.50/card | $3.50 | 42% off |

### 7.3 Premium Packs

| Pack | Contents | Price | Notes |
|------|----------|-------|-------|
| **Gold 5-pack** | 5 gold foil cards | $34.99 | $7.00/card (22% off $8.98) |
| **Holo 3-pack** | 3 holographic cards | $24.99 | $8.33/card (17% off $9.99) |
| **Collector's 10-pack** | 10 cards, all gold foil | $69.99 | $7.00/card |

### 7.4 Pro Subscriber Discount

Pro subscribers get **10% off all merch orders** (per existing card tier system).

| Product | Standard price | Pro price | Pro savings |
|---------|---------------|-----------|-------------|
| Standard card | $5.99 | $5.39 | $0.60 |
| 10-pack | $39.99 | $35.99 | $4.00 |
| Gold foil card | $8.98 | $8.08 | $0.90 |

### 7.5 Pricing Psychology

- **$5.99** for standard card = under the psychological $6 barrier
- **$8.99** for instant ship = premium feel but under $10
- **$39.99** for 10-pack = the magic "under $40" barrier
- **$2.99** gold foil upcharge = classic addon pricing (impulse buy range)
- **Pack savings** create urgency to buy more ("33% off if I get 10!")

---

## 8. Margin Analysis

### 8.1 Standard Card — Batch Order (Primary Revenue Model)

Assuming moderate batch volume (30-50 cards per 2-week window):

| Line item | Cost | Notes |
|-----------|------|-------|
| QPMN production | $1.75 | Estimated at moderate FlexiBulk volume |
| Packaging (sleeve + toploader) | $0.15 | Bulk pricing |
| QPMN shipping to customer | $0.00 | Included in QPMN fulfillment |
| **Total COGS** | **$1.90** | |
| Retail price | $5.99 | |
| Stripe fee (2.9% + $0.30) | $0.47 | |
| **Net revenue** | **$5.52** | |
| **Gross profit** | **$3.62** | |
| **Gross margin** | **60.4%** | |

### 8.2 Gold Foil Card — Batch Order

| Line item | Cost | Notes |
|-----------|------|-------|
| QPMN production (standard) | $1.75 | |
| Gold foil adder | $1.25 | Estimated at moderate volume |
| Packaging | $0.15 | |
| **Total COGS** | **$3.15** | |
| Retail price | $8.98 | ($5.99 + $2.99 foil) |
| Stripe fee | $0.56 | |
| **Net revenue** | **$8.42** | |
| **Gross profit** | **$5.27** | |
| **Gross margin** | **58.7%** | |

### 8.3 Standard Card — Instant Ship (Premium)

| Line item | Cost | Notes |
|-----------|------|-------|
| QPMN production (single unit) | $3.50 | No FlexiBulk discount |
| Packaging | $0.15 | |
| **Total COGS** | **$3.65** | |
| Retail price | $8.99 | |
| Stripe fee | $0.56 | |
| **Net revenue** | **$8.43** | |
| **Gross profit** | **$4.78** | |
| **Gross margin** | **53.2%** | |

### 8.4 10-Pack — Batch Order (Best Margin)

| Line item | Cost | Notes |
|-----------|------|-------|
| QPMN production (10 cards) | $15.00 | $1.50/card at pack volume |
| Packaging (10 sleeves + 10 toploaders) | $1.30 | |
| **Total COGS** | **$16.30** | |
| Retail price | $39.99 | |
| Stripe fee | $1.46 | |
| **Net revenue** | **$38.53** | |
| **Gross profit** | **$22.23** | |
| **Gross margin** | **55.6%** | |

### 8.5 Margin Summary Table

| Product | COGS | Retail | Stripe | Net Profit | Margin |
|---------|------|--------|--------|------------|--------|
| Standard (batch) | $1.90 | $5.99 | $0.47 | $3.62 | 60% |
| Standard (instant) | $3.65 | $8.99 | $0.56 | $4.78 | 53% |
| Gold foil (batch) | $3.15 | $8.98 | $0.56 | $5.27 | 59% |
| Gold foil (instant) | $5.65 | $11.98 | $0.65 | $5.68 | 47% |
| Holo (batch) | $3.75 | $9.99 | $0.59 | $5.65 | 57% |
| 5-pack (batch) | $8.75 | $22.99 | $0.97 | $13.27 | 58% |
| 10-pack (batch) | $16.30 | $39.99 | $1.46 | $22.23 | 56% |
| Park deck 15 cards (batch) | $20.25 | $52.50 | $1.82 | $30.43 | 58% |

### 8.6 Industry Margin Benchmarks

- **Physical merch (general):** 40-60% gross margin is standard
- **Print-on-demand:** 30-50% typical (higher COGS)
- **Custom/artisan goods:** 50-70% (premium pricing covers it)
- **Pokemon card resale:** 10-20% (commodity, low margin)

TrackR's projected margins (47-60%) are in the sweet spot: sustainable, competitive, and aligned with custom goods benchmarks.

---

## 9. Batch vs Instant Ship Economics

### 9.1 The Batch Advantage

| Factor | Batch (2-week window) | Instant ship |
|--------|----------------------|--------------|
| Per-card COGS | $1.50-$2.00 | $3.00-$4.00 |
| Customer wait time | 2-4 weeks | 1-2 weeks |
| Our margin | 55-60% | 45-53% |
| Customer price | $5.99 | $8.99 |
| Premium factor | — | +$3.00 (50% more) |

### 9.2 Recommendation

- **Default to batch.** Most customers won't care about 1-2 extra weeks wait for trading cards. Position it as "standard shipping."
- **Instant ship as clear upgrade.** Label it "Express" or "Rush Order" — not a hidden upcharge. Make it feel like a premium service.
- **Price gap justification:** The $3.00 premium ($5.99 vs $8.99) covers the higher per-unit POD cost AND provides a psychological nudge toward batch ordering.

### 9.3 Expected Order Mix

| Channel | Batch % | Instant % | Rationale |
|---------|---------|-----------|-----------|
| In-app standard | 70-80% | 20-30% | Most people are patient |
| Kickstarter orders | 100% | 0% | Kickstarter is inherently batch |
| Holiday season | 50% | 50% | Gift buyers want it NOW |
| New user first order | 40% | 60% | Excitement drives instant |

---

## 10. Kickstarter Tier Recommendations

### 10.1 Campaign Goal

Minimum raise to fund first batch print run + cover Kickstarter fees + shipping.

**Target:** $5,000 (conservative) to $15,000 (stretch)

### 10.2 Recommended Tiers (6 tiers, per Kickstarter best practices)

| Tier | Price | What they get | Est. backers | Revenue |
|------|-------|--------------|-------------|---------|
| **Supporter** | $1 | Thank you + name in app credits + early access to app | 50-100 | $50-$100 |
| **Starter Pack** | $15 | 3 cards (your pick) + KS-exclusive card back design | 100-200 | $1,500-$3,000 |
| **Collector** | $29 | 5 cards + gold foil on 1 card + KS-exclusive | 150-300 | $4,350-$8,700 |
| **Super Fan** | $49 | 10 cards (your pick) + 2 gold foil + KS-exclusive holographic card | 80-150 | $3,920-$7,350 |
| **Park Deck** | $99 | Pick any park, get EVERY coaster card from that park (10-25 cards) + all gold foil + KS-exclusive | 30-60 | $2,970-$5,940 |
| **Ultimate Collector** | $199 | 2 park decks of your choice + 5 holographic cards + lifetime 15% merch discount in-app + name on "Founding Riders" wall | 10-25 | $1,990-$4,975 |

### 10.3 Tier Cost Analysis

| Tier | Price | Our COGS | Stripe/KS fees (8-10%) | Net profit | Margin |
|------|-------|---------|----------------------|------------|--------|
| Supporter ($1) | $1 | $0 | $0.10 | $0.90 | 90% |
| Starter ($15) | $15 | $5.25 | $1.50 | $8.25 | 55% |
| Collector ($29) | $29 | $10.50 | $2.90 | $15.60 | 54% |
| Super Fan ($49) | $49 | $20.00 | $4.90 | $24.10 | 49% |
| Park Deck ($99) | $99 | $37.50 | $9.90 | $51.60 | 52% |
| Ultimate ($199) | $199 | $65.00 | $19.90 | $114.10 | 57% |

COGS assumes batch pricing at Kickstarter scale (hundreds of cards total across all backers).

### 10.4 The $100+ Tier Viability (10-Pack Pick)

From the original requirement: "$100+ tier = 10-pack pick."

The Park Deck tier at $99 delivers 10-25 cards (all coasters at a chosen park) with gold foil. COGS for a 15-card park deck with gold foil:
- 15 cards x $1.50 (batch) = $22.50
- Gold foil x 15 x $1.00 = $15.00
- **Total COGS: $37.50**
- **Net after fees: $51.60**
- **Margin: 52%**

This is very healthy. The tier works.

### 10.5 Kickstarter-Exclusive Elements

These create urgency and can't be replicated post-campaign:
- **KS-exclusive card back design** — different from the standard TrackR logo back
- **KS-exclusive holographic card** — a special "Founding Rider" card not available after campaign
- **"Founding Riders" wall** — permanent recognition in the app
- **Early access** — backers get app access 2 weeks before public launch

### 10.6 Stretch Goals

| Goal | Unlock |
|------|--------|
| $5,000 (funded) | All backers get 1 bonus standard card |
| $7,500 | Gold foil upgrade on ALL cards for Collector tier and above |
| $10,000 | Holographic "Founding Rider" exclusive card added to all tiers |
| $15,000 | All Park Deck backers get gilded edges on their cards |
| $25,000 | Enamel pin (coaster-themed) added to Super Fan and above |

---

## 11. Break-Even Analysis

### 11.1 Monthly Fixed Costs (Card Business)

| Cost | Monthly | Notes |
|------|---------|-------|
| QPMN platform | $0 | Free to use (no subscription) |
| Stripe | $0 | Only per-transaction fees |
| App hosting (Firebase) | Already paid | Shared with app |
| Domain (ridetrackr.app) | ~$1.50 | $18/year |
| **Total fixed** | **~$1.50** | Near-zero fixed costs |

### 11.2 Break-Even Volume

With near-zero fixed costs, the question is: how many cards to cover the TIME investment?

If Caleb values his time at $50/hour and spends 5 hours/month managing card operations:
- Monthly time cost: $250
- Profit per batch card (standard): $3.62
- **Break-even: ~69 cards/month** (roughly 35 cards per 2-week batch)
- That's about **1-2 card orders per day**

### 11.3 Revenue Projections

| Scenario | Cards/month | Monthly revenue | Monthly profit | Annual profit |
|----------|------------|----------------|----------------|---------------|
| **Conservative** | 30 | $180 | $109 | $1,305 |
| **Moderate** | 100 | $599 | $362 | $4,344 |
| **Optimistic** | 300 | $1,797 | $1,086 | $13,032 |
| **Scaling** | 1,000 | $5,990 | $3,620 | $43,440 |

These assume standard batch pricing at $5.99. Real revenue will be higher due to:
- Foil/holo upcharges
- Instant ship premiums
- Pack pricing (higher AOV)
- Kickstarter revenue burst

---

## 12. Action Items

### Immediate (Before Kickstarter)

- [ ] **Sign up for QPMN account** — get exact per-card pricing (replaces all estimates in this doc)
- [ ] **Order QPMN sample pack** — test NanoBanana art quality at 2.5"x3.5"
- [ ] **Test gold foil sample** — verify it matches the "premium" feel TrackR needs
- [ ] **Confirm $5.99 / $8.99 retail pricing** — Caleb + Josh gut check
- [ ] **Confirm $2.99 gold foil upcharge** — or adjust based on actual QPMN foil cost
- [ ] **Design KS-exclusive card back** — different from standard TrackR logo back
- [ ] **Create "Founding Rider" holographic card design** — KS exclusive

### Before App Launch

- [ ] **Set up Stripe account** — publishable + secret keys
- [ ] **Configure Apple Pay merchant ID** — `merchant.app.ridetrackr`
- [ ] **Build batch queue Cloud Function** — `processBatchOrders` (scheduled every 2 weeks)
- [ ] **Wire checkout to real Stripe** — replace mock ****4242
- [ ] **Upload card art to Cloud Storage** — QPMN needs URLs

### After Launch (Optimization)

- [ ] **Track actual COGS vs estimates** — adjust pricing if needed
- [ ] **Monitor batch vs instant split** — adjust instant premium if too few/many choose it
- [ ] **Introduce pack bundles gradually** — start with singles, add packs after demand validated
- [ ] **Holiday pricing strategy** — free shipping week, limited edition holo cards
- [ ] **Amazon/Etsy storefronts** — list packs on external marketplaces for discoverability

---

## Sources

### Print-on-Demand Providers
- [QPMN Custom Trading Cards](https://www.qpmarketnetwork.com/custom-trading-cards/) — Zero MOQ, FlexiBulk, REST API
- [QPMN Card Product Cost Calculator](https://www.qpmarketnetwork.com/qpmn-card-product-cost-calculator/) — requires account
- [QPMN FlexiBulk / Booster Packs](https://www.qpmarketnetwork.com/print-on-demand/booster-packs-what-they-are-and-how-to-create-your-own/)
- [MakePlayingCards Bulk Pricing](https://www.makeplayingcards.com/low-price-for-bulk.aspx)
- [MakePlayingCards Holographic Cards](https://www.makeplayingcards.com/custom-hologram-cards.aspx)
- [MakePlayingCards Impressions Foil](https://www.makeplayingcards.com/impressions-foil-playing-cards-gold-and-silver.aspx)
- [PrinterStudio Custom Trading Cards](https://www.printerstudio.com/personalized/custom-trading-card-game-maker.html)
- [NotMPC (US-based POD)](https://notmpc.com)
- [QinPrinting Custom Trading Cards](https://www.qinprinting.com/custom-trading-cards-printing/)
- [QinPrinting Game Card Pricing](https://www.qinprinting.com/game-card-printing/)
- [Printify Custom Playing Cards](https://printify.com/custom-playing-cards/)

### Packaging & Shipping
- [Ultra PRO Penny Sleeves 500ct](https://investedalliance.com/products/500pk-standard-thick-card-penny-sleeves) — $0.02/sleeve
- [Ultra PRO Premium Sleeves 100ct](https://ultrapro.com/products/2-5-inch-x-3-5-inch-premium-card-sleeves-100ct) — $0.04/sleeve
- [BCW Toploaders 100ct](https://www.bcwsupplies.com/3x4-topload-card-holder-standard-100-ct-pack) — $0.11-$0.13/unit
- [USPS January 2026 Price Change](https://pe.usps.com/resources/PriceChange/January%202026%20Price%20Change%20-%20Notice123%20PDF%20Draft.pdf)
- [MPC Custom Tuck Box Pricing](https://www.makeplayingcards.com/design/custom-tuck-box-for-us-game-sized-cards.html)

### Competitor Pricing
- [Pokemon Price Trends March 2026](https://seller.tcgplayer.com/blog/price-trends-pok%C3%A9mon-cards-climbing-in-price-03-03-2026)
- [Pokemon Price Drops Feb 2026](https://seller.tcgplayer.com/blog/price-trends-pok%C3%A9mon-cards-dropping-in-price-02-18-2026)
- [Top Trumps All Packs ($9.99)](https://us.toptrumps.com/collections/top-trumps-all-packs)
- [Etsy Custom Trading Cards Market](https://www.etsy.com/market/custom_trading_cards)
- [Etsy Custom Artist Trading Cards](https://www.etsy.com/market/custom_artist_trading_cards)

### Kickstarter Strategy
- [Kickstarter Pricing Psychology](https://updates.kickstarter.com/the-psychology-of-pricing-your-rewards-7-strategies-every-creator-should-know/)
- [Reward Tier Planning (Prelaunch)](https://prelaunch.marketing/blogs/academy/how-to-plan-reward-tiers-for-kickstarter)
- [Board Game Reward Tiers (LaunchBoom)](https://www.launchboom.com/blog/how-to-structure-reward-tiers-for-your-kickstarter-board-game-campaign/)
- [Stonemaier Games: Reward Levels](https://stonemaiergames.com/kickstarter-lesson-8-reward-levels/)
- [Stonemaier Games: Premium Option](https://stonemaiergames.com/kickstarter-lesson-54-reward-levels-the-premium-option/)
- [BackerKit: Setting Reward Tiers](https://www.backerkit.com/blog/163-setting-reward-tiers-a-guide-for-crowdfunders/)
- [Genius Games: Pricing Rewards](https://www.geniusgames.org/blogs/news/kickstarter-topic-7-how-to-price-your-kickstarter-rewards)
