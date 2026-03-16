# TrackR — Current State

Last updated: 2026-03-16 (Session 6 — Team Sprint)

---

## CRITICAL NEXT STEP: Big Merge + Native Rebuild

All work from Session 6 is in **agent worktrees** (isolated git branches). Nothing is on main yet.

### Merge order:
1. Merge each agent's worktree branch into main (resolve conflicts)
2. `expo prebuild --clean` (new native deps: HealthKit, Google Sign-In, Apple Sign-In)
3. `npx expo run:ios --device 00008140-00044DA42E00401C`
4. Test everything on device

### Also do next session:
- Perplexity Pro headed login (config ready at `.mcp.json` in EA hub)
- Queue-Times API signup via Playwright
- NanoBanana generation (23 verified sources ready, start at corkscrew #48)
- Install `blader/humanizer` Claude Code skill for article pipeline

---

## What Was Built This Session (Session 6)

### Backend (7 tasks, ALL DONE)
**Agent: `backend` — worktree**

1. **Google Sign-In** — `signInWithGoogle()` in auth.ts. Package: `@react-native-google-signin/google-signin`
   - TODO: Set real webClientId from Firebase Console
   - TODO: Enable Google Sign-In in Firebase Console > Auth
2. **Apple Sign-In** — `signInWithApple()` in auth.ts. Package: `@invertase/react-native-apple-authentication`
   - TODO: Enable "Sign in with Apple" in Apple Developer portal
   - TODO: Enable Apple Sign-In in Firebase Console > Auth
3. **Firestore user docs + username validation** — createUserDoc, isUsernameAvailable, validateUsername CF (atomic Firestore transaction)
4. **Firestore sync layer** — syncController.ts orchestrator + 4 sync modules:
   - rideLogSync (logs + meta), ratingsSync, criteriaSync, userProfileSync
   - All with optimistic updates, onSnapshot listeners, offline support
   - Activate with `initSync()` in App.tsx
5. **Community backend** — friendsSync (batched writes), feedSync (4 post types, likes, comments), rankingsSync (read-only), userSearch (prefix queries)
   - Community stores now start EMPTY (no mock data). Firestore populates them.
   - Rankings need `computeRankings` scheduled CF (not yet built)
6. **Apple Wallet PKPass** — Cloud Function using passkit-generator. 5 visual styles, 40+ park geo-fence coords, barcode format mapping
   - TODO: Register Pass Type ID, upload certs to Cloud Storage, replace placeholder images

### Merch Store (5 tasks, ALL DONE + 1 in progress)
**Agent: `merch-store` — worktree**

1. **7 screens built:** MerchStore, CardDetail, Cart, PackBuilder, Checkout, Confirmation, OrderHistory
2. **Mock data** from real card art + CoasterIndex
3. **Zustand cart store** (cartStore.ts)
4. **Wired into navigation** — "Card Shop" entry in LogbookScreen Collection tab, 7 screens registered in RootNavigator
5. **TrackR Pro PWYW paywall** — ProPaywallSheet (bottom sheet, 3 price cards, billing toggle, feature list), ProBadge, ProLabel, proStore (Zustand), registered as transparentModal
6. **Auth/Login screen** — OnboardingAuth.tsx + OnboardingAuthEmbed.tsx (card art collage bg, Apple/Google/Email buttons, staggered entrance). Also integrated into LandingDesignSampler (Screen 9, skip wiring, pulse color)
7. **Article feed display** (#21) — IN PROGRESS at shutdown, check worktree for partial work

### Onboarding (10 tasks, ALL DONE)
**Agents: `onboarding-polish`, `onboarding-rate`, `onboarding-screens` — separate worktrees**

1. **Screen 3 (Log)** — Verified clean, no changes needed
2. **Screen 4 (Wallet)** — PassDetail swipe mechanics rework
3. **Screen 5 (Rate)** — Notch clipping fixed (44px cover), performance optimized (React.memo, conditional mounting, memoized grid cards, hardware texture rasterization)
4. **Screen 6 (Parks)** — Complete rewrite (~750 lines). Removed scroll animation, tightened layout, rebuilt morph animation, added modal demos, wait time carousel auto-scroll
5. **Screen 7 (Rankings)** — Eliminated ALL polling re-renders (280/sec -> 0 via useAnimatedProps). Two rows of pills (6 templates), notch spacing fixed (paddingTop 60->74), title upgraded
6. **Screen 8 (Community)** — Tab indicator position fixed (moved inside tabRow), fog gradient added, heart tap ring animation, nav z-index fixed
7. **Screen 9 (Auth)** — Built by merch-store agent. Card art collage, "Join TrackR", Apple/Google/Email buttons, integrated into sampler
8. **Chevron bounce** — Fixed snap-back to smooth continuous bounce (withRepeat + withSequence)
9. **Card shadows (Screen 1)** — Separated shadow/clip layers on tiers 3-4, removed invisible shadows on tiers 0-2 (net perf improvement)
10. **Auth screen verification** — onboarding-polish confirmed integration

### New Features (ALL DONE)
1. **HealthKit integration** (#22) — `@kingstinct/react-native-healthkit`, permission flow, DailyActivityCard, healthStore (Zustand), AppState auto-refresh. Needs native rebuild for HealthKit entitlement.
2. **Wait times UI** (#23) — WaitTimesHeader (pulsing LIVE badge), WaitTimesCard (color-coded, historical avg comparison), WaitTimesFavorites (horizontal top 3), WaitTimesList, WaitTimesSection. Integrated into ParksScreen. Mock data for Cedar Point.
3. **Article feed** (#21) — ArticleCard (golden ratio, spring press), ArticleFeedSection (horizontal snap scroll), ArticleDetailScreen (parallax banner, markdown renderer). 4 mock articles. Wired into RootNavigator. Ready to drop into HomeScreen.

### Card Art Pipeline
**Agent: `nanobanana` — no worktree (Playwright died)**

- Full audit of ALL 64 remaining sources (#48-#111)
- **23 confirmed good**, 16 borderline, 7 uncertain, **18 wrong sources documented**
- QUEUE.md updated with categorized sections
- First batch of 10 strongest sources identified and ready
- **NO cards generated** (Playwright MCP killed mid-session)
- Next session: open Gemini, submit 23 verified sources immediately

### Infrastructure
- **Playwright isolation configured** — TrackR `.mcp.json` has `nanobanana` and `article` servers with separate `--user-data-dir`
- **Perplexity Pro web config** — EA hub `.mcp.json` has `perplexity-web` (headed, persistent cookies at `mcp-data/perplexity/`)
- **First article drafted** — `content/articles/six-flags-cedar-fair-merger-season-passes.md` (~1,100 words)
- **Humanizer identified** — `blader/humanizer` Claude Code skill (not yet installed)

---

## Key Decisions (All Sessions)

### Product
- Auth required. Auth screen is final onboarding page. Skip button navigates to auth, disappears when you reach it.
- Rating criteria gating: 7 total, free users start with 2, unlock over time, 6th triggers Pro prompt
- Activity screen: SCRAPPED
- HealthKit step counting: v1 scope (built this session)
- heroImageSource on ticket objects = source of truth for pass detail hero images

### Merch Store
- Native in-app (not Shopify/Next.js). Lives in Collection tab. ALL 7 SCREENS BUILT.
- QPMN as POD provider. Standard TCG 2.5"x3.5".
- Gold foil: free if GPS-verified, upcharge if not.
- Pro users: 10% off all orders + 1 free card on first sub

### TrackR Pro
- PWYW $1-$12 slider. Main: $1.99/$2.99/$3.99. Annual: x10.
- Bottom sheet nudge (not blocking). All tiers = same features. BUILT THIS SESSION.

### Apple Wallet
- PKPass CF BUILT (5 styles, 40+ park geo-fences). Needs real certs.

### Stripe (planned, not started)
- Merch: Stripe PaymentSheet for card checkout
- Pro: Stripe + RevenueCat (or direct StoreKit) for IAP
- Backend: Stripe webhooks CF for order fulfillment

---

## Open Blockers

- [ ] **Big merge** — all worktrees into main (NEXT SESSION FIRST THING)
- [ ] **Native rebuild** — new deps need `expo prebuild --clean`
- [ ] QPMN API signup + pricing
- [ ] Queue-Times API signup (do via Playwright next session)
- [ ] Pass Type ID certificate (Apple Developer portal)
- [ ] Google Sign-In webClientId from Firebase Console
- [ ] Enable Google + Apple providers in Firebase Console > Auth
- [ ] Enable "Sign in with Apple" in Apple Developer portal
- [ ] Card back graphic design
- [ ] 77px card art crop test with QPMN sample batch
- [ ] Coaster-themed PWYW tier names
- [ ] Deploy Cloud Functions: `cd functions && npm run deploy`
- [ ] Install `blader/humanizer` skill

---

## Build Environment
- Dev client build. NEVER Expo Go.
- Device: iPhone, UDID `00008140-00044DA42E00401C`, name "Calabbbb"
- Apple Developer: ACTIVE (Team ID: Q9H59NQ25W, Individual, Small Business 15%)
- Firebase project: `trackr-coaster-app`
- Build: `npx expo prebuild --clean && npx expo run:ios --device 00008140-00044DA42E00401C`

## Strategy (locked 2026-03-11)
- Identity: "The premium home for your coaster life"
- Target: Thoosies first. GP in v2.
- App Store target: June 22, 2026
- Full strategy: `context/projects/trackr-strategy.md`
- V1 master plan: `docs/V1-IMPLEMENTATION-PLAN.md`

---

## Session Archive
- Sessions 1-5: all 2026-03-16 (pre-team sprint, individual sessions)
- **Session 6: 2026-03-16 (Team Sprint)** — 6 agents, 23 tasks, **22 completed**, 1 blocked (NanoBanana — Playwright down). Backend: auth + sync + community + Apple Wallet CF. Merch: 7 screens + nav + Pro paywall. Onboarding: 9 screens polished + auth screen. New features: HealthKit, wait times UI, article feed, first article drafted. Infra: Playwright isolation, Perplexity Pro config.
