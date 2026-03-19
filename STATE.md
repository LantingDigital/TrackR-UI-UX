# TrackR — Current State

Last updated: 2026-03-19

---

## TODAY'S EXECUTION PLAN (2026-03-19)

**Goal:** Start the V1 sprint. Backend is critical path. End of April 2026 App Store target.

**Frontend freeze is ON** — no new UI work until backend ships. See `.claude/rules/frontend-freeze.md`.

### STEP 1: Inventory + Merge Worktrees (DO THIS FIRST)
All code from Sessions 6-8 lives in **agent worktrees** (isolated git branches). Nothing is merged to main yet.

1. Run `git branch --all` and `git worktree list` to inventory all worktree branches
2. Identify which branches have changes (some may be empty/abandoned)
3. Plan merge order to minimize conflicts (backend branches first, then UI)
4. Merge each branch into main, resolving conflicts
5. After all merges: `git log --oneline -20` to verify clean history

### STEP 2: Native Rebuild
After merge, new native dependencies need a clean build:
```bash
cd /Users/Lanting-Digital-LLC/Documents/ExecutiveAssistant/projects/trackr
npx expo prebuild --clean
```
**CRITICAL:** After prebuild, must re-apply Firebase iOS Podfile fixes. See `.claude/rules/firebase-ios-build.md`:
- `use_frameworks! :linkage => :static` via Podfile.properties.json
- 15 Firebase pods with `:modular_headers => true`
- Post-install hook: RNFB module map removal
- `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES`

Then: `cd ios && pod install`

### STEP 3: Deploy Cloud Functions
```bash
cd /Users/Lanting-Digital-LLC/Documents/ExecutiveAssistant/projects/trackr
firebase deploy --only functions --project trackr-coaster-app
```
29 Cloud Functions ready to deploy. All TypeScript clean. Client wrappers in `src/services/firebase/functions.ts`.

### STEP 4: Firebase Auth Setup (requires Caleb for console access)
- Enable Google + Apple sign-in providers in Firebase Console > Auth
- Get `webClientId` from Firebase Console for Google Sign-In
- Enable "Sign in with Apple" in Apple Developer portal
- Caleb may need to do these manually or via Playwright

### STEP 5: Build + Test on Device
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.2.1 npx expo run:ios --device "00008140-00044DA42E00401C"
```
Note: Caleb is on public WiFi with USB. Use `192.168.2.1` for Metro hostname. macOS Internet Sharing must be on.

Test: sign up, log a coaster, verify data persists in Firestore, sign out, sign back in, data still there.

### AFTER BACKEND SHIPS — Parallel Tracks
Once Steps 1-5 are done, these tracks can run as parallel agent teams in worktrees:

| Track | What | Agent Type |
|-------|------|-----------|
| Track 2 | Frontend UI (fog approval, onboarding, card game UI, card back, headers, articles) | UI agent |
| Track 3 | NanoBanana card art pipeline (resume batches, RCDB verification) | NanoBanana agent |
| Track 4 | Merch + Payments (QPMN, Stripe, Pro subscription) | Backend agent |
| Track 5 | Admin web app + ridetrackr.app domain + landing page | Web agent |
| Track 6 | Apple Wallet certs + Queue-Times API | Backend agent |

---

## V1 SPRINT PLAN — Full Track Details

### TRACK 1: Backend (CRITICAL PATH)
- [ ] **Big merge** — all worktrees from Sessions 6-8 into main (resolve conflicts)
- [ ] **Native rebuild** — `expo prebuild --clean` (new native deps: HealthKit, Google Sign-In, Apple Sign-In)
- [ ] **Deploy 29 Cloud Functions** — `firebase deploy --only functions --project trackr-coaster-app`
- [ ] **Firebase Auth setup** — enable Google + Apple providers in Firebase Console, get webClientId
- [ ] **Enable "Sign in with Apple"** in Apple Developer portal
- [ ] **Firestore sync** — coasters, ratings, logs write to cloud + persist across devices
- [ ] **Test auth flow end-to-end** — sign up, sign in, data persists on new device

### TRACK 2: Frontend UI Completion
- [ ] **Fog gradient** — test 0.97 opacity version, approve or iterate. Then verify on Profile, Settings, OrderHistory screens.
- [ ] **Onboarding flow** — finish remaining screens (auth screen is final page, skip button disappears at auth)
- [ ] **Card game UI** — new TCG format: TrackR logo on card back, art+stats on front. Voice narration game mode.
- [ ] **Card back design** — graphic design for the universal TrackR card back
- [ ] **Screen headers with fog** — ensure all screens have proper FogHeader/SheetFog
- [ ] **Articles visible** — articles need to render from Firestore so Caleb can read them + populate via admin
- [ ] **EmptyState** — already built, applied to most screens. Verify coverage.

### TRACK 3: NanoBanana Card Art Pipeline
- [ ] **Resume NanoBanana batches** — need card art for all park packs in the card shop
- [ ] **Source image verification** — check each against RCDB before submitting to Gemini
- [ ] **Batch review** — approve/reject generated art, re-run rejects
- [ ] **77px card art crop test** — test with QPMN sample batch for print quality

### TRACK 4: Merch Store + Payments
- [ ] **QPMN API signup + pricing** — need real account to test orders
- [ ] **Bulk order model** — 2-week collection windows, batch print (Josh meeting decision)
- [ ] **Instant ship option** — premium price, API direct to QPMN
- [ ] **Stripe/payment integration** — for in-app purchases
- [ ] **PWYW Pro subscription** — stays in V1, quiet background revenue

### TRACK 5: Admin + Web
- [ ] **Admin web app** — manage articles, review card art, manage pro users, view reports
- [ ] **ridetrackr.app domain** — purchase and set up
- [ ] **Landing page** — advertise app, provide download link, maybe card previews
- [ ] **Article management** — admin creates/publishes articles, app reads from Firestore

### TRACK 6: Apple Wallet + External APIs
- [ ] **Pass Type ID certificate** — Apple Developer portal, upload to Cloud Storage
- [ ] **Queue-Times API signup** — proxyWaitTimes CF already built, needs parkId mapping
- [ ] **Apple Wallet passes** — PKPass CF built (5 styles, 40+ geo-fences), needs real certs

### Open Blockers (not assigned to a track)
- [ ] Coaster-themed PWYW tier names
- [ ] Admin notification for user reports — store admin UIDs in `_admin/config` Firestore doc

---

## PREVIOUS SESSION: Fog Gradient Iteration — Awaiting Caleb Feedback

Caleb is testing the latest FogHeader gradient (0.97 peak opacity). Iterated ~12 times with live feedback. Latest version ready for review.

- FogHeader.tsx: 8-stop gradient, 0.97 peak opacity
- SheetFog.tsx: 7-stop gradient, 0.97 peak opacity
- ArticlesList fogExtension: 80 -> 150px

**Other completed work (Session 7):**
- EmptyState component + applied to LogbookScreen (4 tabs), CommunityFeedTab, CommunityFriendsTab, CommunityRankingsTab, SavedArticlesScreen
- Articles FAB fixes, ArticlesList header typography, CartScreen/CheckoutScreen button bars
- CustomPackBuilderScreen header, RateRidesScreen subtitle z-index, MerchCardDetailSheet native Switch

---

## Key Decisions (All Sessions)

### Product
- Auth required. Auth screen is final onboarding page. Skip button navigates to auth, disappears when you reach it.
- Rating criteria gating: 7 total, free users start with 2, unlock over time, 6th triggers Pro prompt
- Activity screen: SCRAPPED
- HealthKit step counting: v1 scope
- heroImageSource on ticket objects = source of truth for pass detail hero images

### Merch Store
- Native in-app (not Shopify/Next.js). Lives in Collection tab. ALL 7 SCREENS BUILT.
- QPMN as POD provider. Standard TCG 2.5"x3.5".
- Gold foil: free if GPS-verified, upcharge if not.
- Pro users: 10% off all orders + 1 free card on first sub

### TrackR Pro
- PWYW $1-$12 slider. Main: $1.99/$2.99/$3.99. Annual: x10.
- Bottom sheet nudge (not blocking). All tiers = same features.
- CONFIRMED in V1 (decided 2026-03-18). Cards are primary revenue, Pro is quiet background.

### Card Game (pivoted 2026-03-18)
- TRADING CARD GAME (Top Trumps-style + One Night Werewolf voice narration)
- Card back: TrackR logo only. Front: art + stats.
- Physical cards on Amazon/Etsy + in-app purchase. Need app to play.
- Kickstarter before/alongside app launch. $100+ tier = 10-pack pick.
- QPMN bulk order: 2-week windows, batch print, pocket margin. Holographic options.

### Apple Wallet
- PKPass CF BUILT (5 styles, 40+ park geo-fences). Needs real certs.

### Domain
- ridetrackr.app CONFIRMED (Caleb + Josh agreed 2026-03-18)

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
- App Store target: END OF APRIL 2026 (moved up from June 22 per Josh meeting 2026-03-18)
- Full strategy: `context/projects/trackr-strategy.md`
- V1 master plan: `docs/V1-IMPLEMENTATION-PLAN.md`

---

## Session Archive
- Sessions 1-5: all 2026-03-16 (pre-team sprint, individual sessions)
- **Session 6: 2026-03-16 (Team Sprint)** — 6 agents, 23 tasks, 22 completed, 1 blocked
- **Session 7: 2026-03-18 (UI Polish)** — Fog gradient iteration (12+ rounds), EmptyState, FAB fixes, screen-specific fog fixes, typography. Fog awaiting final approval.
- **Session 8: 2026-03-18 (Backend Team Sprint)** — 29 Cloud Functions built across 5 phases. All TypeScript clean, all with client wrappers.
