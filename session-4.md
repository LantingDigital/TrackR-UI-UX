# Session 4 — 2026-03-16

## What We Did

### Onboarding Slides: Planned, Built, Broke, Rebuilt

**Phase 1 — Planning new slides:**
- Identified 3 missing features from v1 scope: Parks, Rankings/Criteria, Community
- Also discussed Apple Wallet (combined into existing Scan slide) and Merch Store (deferred until store is built)
- Caleb wanted all phone-frame pattern with haptic feedback + color pulse differentiators

**Phase 2 — v1 build (all three WRONG):**
Spawned a 3-agent team in worktrees. Each built a slide but missed the mark:
- **Parks** showed ParkDetailScreen (park detail page) instead of the full ParksScreen hub (wait times, quick actions, park switcher morph, etc.)
- **Rankings** showed CommunityRankingsTab (the community leaderboard) instead of CriteriaWeightEditorScreen (the settings screen where you adjust rating criteria weights with sliders)
- **Community** added a fake "Community" title header that doesn't exist, missed the real top bar (Feed|Friends|Rankings|Play tabs with animated rose indicator), missed the games strip, missed Friends/Rankings/Play tabs entirely

**Phase 3 — Caleb's corrections:**
- Parks: "the parks page has SO much more. Wait times, the change park modal, the food, the rides, the weather, park guides"
- Rankings: "was supposed to be a view in settings of the weighted criteria... show that the criteria can be modified to fit the user, and also show the sliding of each of the criterion for the weights"
- Community: "you totally miss the different markers on top, and you're missing the entirety of the screen that you actually see when you land on it. Like the games, the friends tab, the stories"

**Phase 4 — v2 rebuild (all three correct):**
Spawned new 3-agent team with much more detailed specs. Deep research into each real screen first.

Results:
- **Parks v2 (OnboardingParksEmbed.tsx, 30KB):** Full hub walkthrough — ParkHubHeader (Cedar Point, hours, "Change" pill), QuickActionRow (Stats/Food/Rides/Pass), WaitTimesCard (8 coasters with color-coded times + LIVE indicator), MyPassCard (season pass state), ParkGuidesSection (3 guide cards), park switcher morph animation. ~20.5s demo loop.
- **Criteria v2 (OnboardingRankingsEmbed.tsx, 29KB):** CriteriaWeightEditor — DistributionBar (animated flex segments), Template chips (Thrill Seeker/Theme Fan/Balanced), 7 criteria rows with color-coded icons + animated weight sliders (scaleX+translateX fill, matching real 60fps pattern), real proportional redistribution math (total always = 100), "Add Criteria" button at bottom. ~18s demo loop.
- **Community v2 (OnboardingCommunityEmbed.tsx, 47KB):** Real top bar (back arrow + Feed|Friends|Rankings|Play) with animated rose indicator sliding between tabs. 4-tab cycle: Feed (games strip with 5 game circles + 3 post cards + heart burst like), Friends (stories row + activity feed), Rankings (category chips + ranked entries with score bars), Play (featured Coastle hero card + more games carousel). ~19s demo loop.

All integrated into LandingDesignSampler.tsx with new pulse colors (teal, purple, amber). Zero TypeScript errors.

### Scan Slide Update
- Title: "Your Wallet" → "Your Passes"
- Description now mentions Apple Wallet: "Scan, store, and flip to your QR code at the gate. Add to Apple Wallet too."

### Product Decisions

1. **Rating criteria gating model:**
   - 7 total criteria (Airtime, Intensity, Smoothness, Theming, Pacing, Inversions, Launch)
   - Free users start with 2 enabled
   - Unlock/enable more over time
   - 6th criterion triggers Pro subscription prompt
   - Onboarding demo shows "paid user" view (all 7)
   - Saved to: memory/project_trackr-criteria-gating.md

2. **Merch store onboarding slide:** Deferred until store UI is further along (being built in parallel). Reminder saved to memory/project_trackr-merch-onboarding.md

### Merch Store Build (Started, In Progress)

Caleb provided a detailed 7-screen spec for an in-app card shop. Spawned merch-store agent (still running at session end):

1. **MerchStoreScreen** — Hero + browse sections ("New Arrivals", "Popular", "By Park", "Build Your Pack"), park filter pills
2. **MerchCardDetailSheet** — Large card art, coaster stats, gold foil toggle (free if GPS-verified, +$2.99 if not), quantity selector, Add to Cart + Buy Now
3. **CartScreen** — Item list, quantity adjust, Pro discount (-10%), shipping, total, Checkout button
4. **CustomPackBuilderScreen** — Pick 5/10/20 cards, grid with checkmark overlay, running total with savings
5. **CheckoutScreen** — Shipping address form, mock payment (••••4242), order summary, Place Order
6. **OrderConfirmationScreen** — Success animation, order number, estimated delivery
7. **OrderHistoryScreen** — Past orders with status badges (Processing/Shipped/Delivered)

Pricing: $7.99/card, $2.99 gold foil upcharge, pack discounts (5-pack 10%, 10-pack 20%, 20-pack 30%), Pro 10% off all orders. Lives in Collection tab (LogbookScreen). Mock data file at src/data/mockMerchData.ts. Uses real NanoBanana card art.

---

## Where We Left Off

**Merch-store agent was still building at session end.** Check Task #10 status.

**Onboarding v2 rebuilds (Parks, Criteria, Community) are integrated but Caleb has NOT previewed them on device yet.** That's the first thing to do next.

**After preview:** iterate one screen at a time until perfect, then build Auth/Login as the final slide.

---

## Files Created/Modified This Session

**New files:**
- `src/features/onboarding/screens/OnboardingParks.tsx` (wrapper, v2)
- `src/features/onboarding/screens/OnboardingParksEmbed.tsx` (30KB, v2)
- `src/features/onboarding/screens/OnboardingRankings.tsx` (wrapper, v2)
- `src/features/onboarding/screens/OnboardingRankingsEmbed.tsx` (29KB, v2)
- `src/features/onboarding/screens/OnboardingCommunity.tsx` (wrapper, v2)
- `src/features/onboarding/screens/OnboardingCommunityEmbed.tsx` (47KB, v2)
- Merch store files (TBD — agent still building)

**Modified files:**
- `src/features/onboarding/screens/OnboardingScan.tsx` — title/desc update
- `src/features/onboarding/LandingDesignSampler.tsx` — 3 new imports, SCREENS array, pulse colors

**Memory files created:**
- `memory/project_trackr-criteria-gating.md`
- `memory/project_trackr-merch-onboarding.md`

---
*— Session 4*
