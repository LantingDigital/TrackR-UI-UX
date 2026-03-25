# TrackR V1 — Team Progress (Live)

**Team:** trackr-v1 | **Started:** 2026-03-24 | **Target:** End of April 2026

---

## Questions for Caleb (ACTION NEEDED)

1. **2FA on browser slots (Desktop 2)** — Browser 1 is sitting on Google 2FA for caleb@lantingdigital.com (Perplexity login). Browser 2 will need the same for Gemini. Swipe to Desktop 2 and complete 2FA on both. Content-agent and card-art-agent need these.
2. **Firebase CLI reauth** — Run `firebase login --reauth` in terminal. Content-agent and park-data-agent need it for Firestore publishing. Not blocking (both building locally), but needed before anything goes to Firestore.

---

## Active Agents

### auth-agent (Blue) — Task #6
**Scope:** Firebase Auth, onboarding auth section, profile setup, browse mode
**Status:** BUILDING
- [x] Assessment complete — backend 90% built, frontend gaps identified
- [x] Auth section added to LandingDesignSampler (vertical scroll) ✅
- [x] Skip scrolls to auth + scroll-driven fade-out ✅
- [x] Wire Apple/Google/Email to existing auth service ✅
- [x] LandingDesignSampler is now default (old dark system removed) ✅
- [x] Sign-in/sign-up toggle with animated pill ✅
- [x] npx tsc --noEmit passes ✅
- [x] Auth state persistence — skip onboarding if signed in, handle unverified email ✅
- [x] Profile Setup screen — name (OAuth auto-fill), username (real-time CF validation), avatar picker ✅
- [x] Email verification flow — auto-send, 3s polling, resend cooldown, different account option ✅
- [x] OnboardingScreen rewritten as state machine (showcase→verify→profile→celebration→app) ✅
- [x] Make LandingDesignSampler the default onboarding ✅
- [x] Browse-only mode + useAuthGate hook ✅
- [x] AuthNudgeSheet — reusable, 8 feature contexts ✅
- [x] Settings: Sign Out, Delete Account, Create Account (auth-aware) ✅
- [x] Celebration screen — new/returning user variants ✅
- **STATUS: COMPLETE — all 11 deliverables done, 12 files, zero TS errors**

### core-data-agent (Green) — Task #7
**Scope:** Wire Firestore sync to UI, fix bugs, batch logging, export
**Status:** BUILDING
- [x] Assessment complete — service layer FULLY built, wiring needed
- [x] FIX: seat conversion mismatch (SeatPosition type + rideLogSync) ✅
- [x] Ratings path CORRECT in client (security rules need separate fix) ✅
- [x] initSync() already wired in App.tsx ✅
- [x] ALL UI writes transparently route to Firestore (zero import changes!) ✅
- [x] addQuickLog, upsertCoasterRating, deleteRating, updateLogTimestamp, updateLogNotes, deleteLog, updateCriteria all wired ✅
- [x] npx tsc --noEmit passes ✅
- [x] Build batch logging service (createBatchRideLogs with seat toggle) ✅
- [x] Build weight revert system (save/revert/hasPrevious) ✅
- [x] Wire export screen to callExportRideLog CF ✅
- [ ] Build offline sync indicator (deferred — low priority)
- [x] Security rules verified CORRECT (stale doc was the issue, not the rules) ✅
- **STATUS: COMPLETE — all deliverables done, agent idle**

### polish-onboarding-agent (Yellow) — Task #8
**Scope:** 38+ onboarding showcase fixes
**Status:** BUILDING
- [x] Assessment complete — 38 issues, 0 fixed
- [x] APP-WIDE: FadeInImage component (8 files, 10 instances) ✅
- [x] APP-WIDE: Fixed 18 transparent gradient bugs across 8 files ✅
- [x] "Your Park Day" complete makeover — real MorphingPill, square buttons, emojis→Ionicons ✅
- [x] "Log Every Ride" — celebration position, autocomplete images, spring animations ✅
- [ ] Wallet / Scan Modal fixes
- [ ] "Rate What Matters" fixes
- [ ] Community Tabs fixes
- [ ] Criteria Distribution redesign
- [ ] "Ride Together" fixes
- [ ] "Search for Anything" fixes

### card-art-agent (Purple) — Task #9
**Scope:** Card art generation pipeline
**Status:** IDLE (258 cards in app, past 80-card target)
- [x] Assessment complete
- [x] v3 directory structure created
- [x] 28 rejected legacy cards deleted
- [ ] Available for new batches on demand

---

## Git Safety
- Last commit: `2732fb4` — pushed to GitHub before agents started
- All agent work happens on `main` branch (agents share working directory)

### import-agent (Red) — Task #13
**Scope:** Ride data import from any file format
**Status:** BUILDING
- [x] Assessment complete — clean slate, core-data patterns identified ✅
- [ ] Install papaparse + xlsx in functions/
- [ ] Build processImportFile CF (parse, detect format, map fields)
- [ ] Build matchCoasterNames CF (fuzzy match against 3,135 coasters)
- [ ] Build frontend: file picker → preview/mapping → confirmation → progress
- [ ] Wire to Firestore via core-data's addRideLog pattern

### games-agent (Orange) — Task #10
**Scope:** Parkle, SpeedSorter rebuild, game persistence, leaderboards
**Status:** BUILDING
- [x] Assessment complete ✅
- [x] Parkle built — 11 files, daily puzzles, blue accent, wired into Play tab ✅
- [ ] SpeedSorter drag-and-drop rebuild (reanimated + gesture handler)
- [ ] Game stats persistence to Firestore
- [ ] Daily puzzle system with difficulty tiers
- [ ] Leaderboards (global + friends)

### park-data-agent — Task #11
**Status:** ASSESSING

### content-agent — Task #12
**Status:** ASSESSING

---

## Key Decisions This Session
- Vertical scroll onboarding (LandingDesignSampler) confirmed as THE real onboarding
- designSamplerMode to become default (auth-agent handling)
- 28 legacy batch-review cards rejected and deleted
- Card art at 258 (past target), card-art-agent on standby
