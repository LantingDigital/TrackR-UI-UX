# TrackR — Current State

Last updated: 2026-03-19 (end of V1 sprint session)

---

## WHAT JUST HAPPENED (Session 2026-03-19)

Massive sprint session with 6-8 agents across 6 tracks. Key outcomes:

### Deployed to Firebase (LIVE)
- 29 Cloud Functions on trackr-coaster-app (us-central1)
- Firestore security rules (253 lines) + 11 composite indexes
- Firebase Auth: Email + Google + Apple providers enabled
- webClientId: `416798662915-eli7jkfng016hsm2a303ahrntum498du.apps.googleusercontent.com`

### Built (in repo, committed)
- **Admin dashboard** — Full Next.js 14 app at `admin/` (11 pages, Tiptap editor, article CRUD, reports queue, user management)
- **Landing page** — Premium landing page at `admin/src/app/page.tsx` with real card art fan, mobile-responsive, zero JS
- **3 Stripe Cloud Functions** — createCardOrder, confirmCardOrder, getOrderStatus (NOT yet deployed — need Stripe secrets)
- **Queue-Times mapping** — 35-park parkId mapping in `src/data/queueTimesParkIds.ts`, wired into wait times service
- **Auth screen** — Redesigned onboarding auth with Apple + Google sign-in, dark theme
- **Fog overhaul** — Global reduction from 200px→60px extensions, 15 micro-stop gradients
- **7 NanoBanana Pro card art** — pteranodon-flyers, gulf-coaster, little-dipper, loop-dee-doop-dee, flight-of-the-hippogriff, mine-cart-madness, miner-mike
- **Pricing strategy** — QPMN real pricing verified: 78% margins on batch, `docs/PRICING-STRATEGY.md`
- **Apple Wallet cert guide** — `docs/APPLE-WALLET-CERT-SETUP.md`
- **Playwright agent isolation** — SOLVED: `.claude/agents/card-art-browser.md`, `firebase-browser.md`, `merch-browser.md` with inline mcpServers

### Agent Rules for Next Session
- ALWAYS use `mode: "bypassPermissions"` on every Agent tool call
- For browser tasks, use `subagent_type` matching agent files: `card-art-browser`, `firebase-browser`, `merch-browser`
- NEVER shut down agents until Caleb explicitly says to
- NEVER ask for permission — execute and report

---

## ACTIVE WORK: Frontend Fog Fixes (in progress when session ended)

Frontend agent was working through Caleb's device review feedback. Here's what's done vs remaining:

### FOG DONE
- [x] Removed fog from RateRidesScreen, LogbookLogSheet, CoasterSheet
- [x] Global overhaul: 200px→60px, 15 micro-stops
- [x] Articles screen: multiple iterations (Caleb decided to deprioritize this screen)

### FOG REMAINING (Caleb's device review feedback)
- [ ] **SettingsScreen** — good fade level but extends too far down
- [ ] **ProfileView** (community) — bleeds onto content
- [ ] **MerchStoreScreen** — goes onto dark background, looks bad
- [ ] **MerchCardDetailSheet** — inconsistent fading levels, too far down
- [ ] **EmailScreen** — fog covers content before scrolling on non-scrollable page
- [ ] **CreditsScreen** — same as EmailScreen
- [ ] **BlockedUsersScreen** — check fog distance
- [ ] **PasswordScreen** — not scrollable but fog covers content
- [ ] **TermsScreen + PrivacyPolicyScreen** — gradient too abrupt, needs smoother ratio
- [ ] **GuideModal** — fog at wrong place, hard cutoff. Should match ArticleSheet exactly.
- [ ] **CartScreen** — button off-screen in wrong section. Needs #F7F7F7 bg, proper shadow.

### FOG KEY PRINCIPLE (from Caleb)
"Fog should NOT affect content until user has scrolled. On non-scrollable pages, fog basically shouldn't touch content at all."

### APPROVED FOG SCREENS (don't touch)
LogbookScreen, CriteriaWeightEditorScreen, CommunityScreen, PerksScreen, ArticleDetailScreen, ArticleSheet, CheckoutScreen, CustomPackBuilderScreen

---

## WHAT'S NEXT FOR V1

### Priority 1: Finish Fog Fixes
Frontend agent picks up the remaining fog fixes from device review above.

### Priority 2: E2E Auth Test (Task #3 — Caleb hands-on)
Auth is fully wired. Test on device:
1. Go through onboarding → tap "Continue with Apple" or "Continue with Google"
2. Should create Firebase user + Firestore doc + start syncing
3. Log a coaster → verify data in Firestore
4. Kill app → reopen → data should persist
5. Sign out → stores reset

### Priority 3: Non-Fog UI Issues (from device review)
- Bottom sheets with text inputs don't go above keyboard (can't see what typing)
- CustomPackBuilderScreen: fraction counter position wrong, 5/10/20 pack selector takes too much screen
- Community post creation doesn't work (no backend for community posts)

### Priority 4: Deploy Remaining
- 3 Stripe merch CFs (need `firebase functions:secrets:set STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`)
- Admin dashboard to Firebase Hosting

### Priority 5: External Signups / Manual Steps
- Purchase ridetrackr.app domain
- Apple Developer: register Pass Type ID, create cert (guide at `docs/APPLE-WALLET-CERT-SETUP.md`)
- App Store Connect: create 14 IAP products for PWYW Pro ($1-$12)
- QPMN: order sample cards in DS33 and CL31 to compare material

---

## Key Decisions (All Sessions)

### Product
- Auth required. Auth screen is final onboarding page. Skip = local-only mode.
- Rating criteria gating: 7 total, free users start with 2, unlock over time, 6th triggers Pro prompt
- Activity screen: SCRAPPED
- HealthKit step counting: v1 scope
- Articles: v1 feature but dedicated Articles screen deprioritized. Articles show on HomeScreen feed.

### Merch Store
- Native in-app. Lives in Collection tab. ALL 7 SCREENS BUILT.
- QPMN as POD provider. Standard TCG 2.5"x3.5".
- **Material: DS33 (Deluxe Smooth, 330gsm) or CL31 (Casino Linen, 310gsm, black core)**. Same price. Order samples to compare.
- Gold foil: free if GPS-verified, upcharge if not.
- Pro users: 10% off all orders + 1 free card on first sub
- **Verified margins: 78% batch, 74% instant ship, 80% Kickstarter**

### TrackR Pro
- PWYW $1-$12 slider. Presets: $1.99/$2.99/$3.99. Annual: x10.
- Bottom sheet nudge (not blocking). All tiers = same features.
- CONFIRMED in V1.

### Card Game
- TRADING CARD GAME (Top Trumps-style + One Night Werewolf voice narration)
- Card back: TrackR logo only. Front: art + stats.
- Kickstarter before/alongside app launch. $100+ tier = 10-pack pick.

### Apple Wallet
- PKPass CF BUILT + DEPLOYED. Needs real certs.

### Domain
- ridetrackr.app CONFIRMED. Landing page built, ready for domain attachment.

---

## Build Environment
- Dev client build. NEVER Expo Go.
- Device: iPhone, UDID `00008140-00044DA42E00401C`, name "Calabbbb"
- Apple Developer: ACTIVE (Team ID: Q9H59NQ25W)
- Firebase project: `trackr-coaster-app`
- QPMN account: caleb@lantingdigital.com (Google OAuth), active

## Strategy
- Identity: "The premium home for your coaster life"
- Target: Thoosies first. GP in v2.
- App Store target: END OF APRIL 2026
- Full strategy: `context/projects/trackr-strategy.md`
