# TrackR — Current State

Last updated: 2026-03-15

## Active Work: Onboarding Flow

### Completed Screens (5 of 9+)

**Screen 1: Card Art Landing** — APPROVED
`src/features/onboarding/screens/OnboardingCardLanding.tsx`
- 24 cards, 5 size tiers, tier-locked cycling, gap-first placement
- Two independent queues (bg + fg), native pixel rendering, ambient floating

**Screen 2: Search Demo** — APPROVED
`src/features/onboarding/screens/OnboardingSearch.tsx` (wrapper)
`src/features/onboarding/screens/OnboardingSearchEmbed.tsx` (stripped HomeScreen, ~2400 lines)
- Real MorphingPill, SearchBar, MorphingActionButton
- Two sequences: search bar morph (Steel Vengeance → Steel Curtain) + search pill morph (Fury 325)
- Real CoasterSheet with card art, snap scroll, additional info
- Shadow-matched transitions, animated autocomplete results

**Screen 3: Log Demo** — IN TESTING
`src/features/onboarding/screens/OnboardingLog.tsx` (wrapper)
- Uses OnboardingSearchEmbed with `demoMode="log"`
- Two sequences: Maverick (from expanded pill) + Expedition Everest (from collapsed circle after header collapse)
- OnboardingLogConfirmSheet with card art, stats pager (page 1 → 2 → back to 1), "Log It" celebration
- Header collapse/expand animation between sequences
- Human-pace timing (100ms/char, 1s+ pauses)

Known issues still being tested:
- [ ] Autocomplete animation (Reanimated FadeIn/FadeOut) — parent containers updated, needs visual verification
- [ ] Header collapse positions — collapsedY fixed to 41, needs visual verification
- [ ] "Logged!" celebration centering — bottomAnchor set to top: 65%, needs verification
- [ ] Rate nudge centering (only shows in rate mode)

**Screen 4: Scan/Wallet Demo** — IN TESTING
`src/features/onboarding/screens/OnboardingScan.tsx` (wrapper)
- Uses OnboardingSearchEmbed with `demoMode="scan"`
- OnboardingScanModal: Favorites (empty), Tickets (empty), Passes (Cedar Point + Knott's + Import Pass)
- OnboardingPassDetail: card art background (clear on front, blurred on QR flip), multi-pass swiping
- Ghost search bar fixed (empty pill content for scan mode)
- "WALLET" header, carousel auto-scroll, content fades on close
- Demo: scroll carousel → tap Cedar Point → swipe to Knott's → swipe back → flip QR → close

Known issues still being tested:
- [ ] Card art display on pass detail (was showing solid colors before)
- [ ] Pass carousel horizontal swiping in detail view
- [ ] Content fade-out timing on modal close

**Screen 5: Rate Demo** — IN TESTING
`src/features/onboarding/screens/OnboardingRate.tsx` (wrapper)
- Title: "Rate What Matters" / "Not just a number. Rate every aspect that matters to you."
- Sequence 1: Log Iron Gwazi → celebration → "Rate this ride?" nudge → RatingSheet with 7 weighted sliders
- Sequence 2: Nav switches to Logbook tab → logbook grid shows (9 NanoBanana cards) → tap VelociCoaster (Unrated badge) → standalone RatingSheet
- OnboardingRatingSheet: card art hero, weighted criteria, "Rated!" celebration
- OnboardingLogConfirmSheet: rate nudge phase with "Maybe later (5)" countdown

Known issues still being tested:
- [ ] Logbook grid visual quality
- [ ] RatingSheet transparency at top (hard gray edge)
- [ ] Second sequence transition from home to logbook

### Key Files Map

| File | Purpose | Lines |
|------|---------|-------|
| `OnboardingSearchEmbed.tsx` | Main embed (all modes) | ~2400 |
| `OnboardingCoasterSheet.tsx` | Stripped CoasterSheet | ~840 |
| `OnboardingLogConfirmSheet.tsx` | Stripped LogConfirmSheet | ~1050 |
| `OnboardingScanModal.tsx` | Stripped ScanModal | ~450 |
| `OnboardingPassDetail.tsx` | Stripped PassDetailView | ~700 |
| `OnboardingRatingSheet.tsx` | Stripped RatingSheet | ~900 |
| `OnboardingCardLanding.tsx` | Card scatter (Screen 1) | ~700 |
| `OnboardingSearch.tsx` | Search wrapper | ~130 |
| `OnboardingLog.tsx` | Log wrapper | ~75 |
| `OnboardingScan.tsx` | Scan wrapper | ~75 |
| `OnboardingRate.tsx` | Rate wrapper | ~75 |
| `LandingDesignSampler.tsx` | Parent sampler | ~160 |

### Architecture Decisions (documented in memory)

- **Embed real components, strip down** — don't build from scratch
- **Transform scale** phone frame at full pixel dimensions
- `originScreenX/Y` bypasses `measureInWindow` in scaled containers
- Shadow values: bar matches pill resting shadow (0.30 opacity, radius 20)
- `closeShadowFade=false` for bar origin, `true` for button origins
- `searchPillScrollHidden=1` at rest prevents shadow stacking
- `setTimeout` chains for sequencing (NOT `withDelay` on same shared value)
- `LayoutAnimation` removed — conflicts with Reanimated entering/exiting
- Bottom nav z-index 95 (above blur 50, below sheets 300+)

### Sampler Features
- Radial color pulse on page transitions (coral/blue/green/gold)
- Haptic whoosh on scroll
- Skip button top-right
- "SCROLL TO EXPLORE" hint + bouncing chevron

### Screens Still To Build

| Screen | Feature | Notes |
|--------|---------|-------|
| 6 | Customize Criteria | Settings screen — adjust weights, enable/disable criteria |
| 7 | Your Collection | Logbook grid cascade reveal (cards flip gray → color) |
| 8 | Community | Feed, rankings, friend activity |
| 9 | Parks | Park page, change parks, guides, coaster lists |
| 10? | Coastle | Daily guessing game demo |

### TODO Rules Created (for real app fixes)
- `.claude/rules/search-close-behavior.md` — clear search text when stat card closes
- `.claude/rules/log-autocomplete-animation.md` — add Reanimated to log modal autocomplete

---

## Build Note
Dev build signed with paid Apple Developer cert (Team ID: Q9H59NQ25W).
Build: `xcodebuild -workspace ios/TrackR.xcworkspace -configuration Debug -scheme TrackR -destination "id=00008140-00044DA42E00401C" -allowProvisioningUpdates`

## Strategy (locked 2026-03-11)
- Identity: "The premium home for your coaster life"
- Target: Thoosies first. GP in v2.
- App Store target: June 22, 2026

## Backend Progress
- Sprint 1 DONE: Native build with @react-native-firebase
- Sprint 2 next: Firebase Auth integration
- Apple Developer account ACTIVE (Team ID: Q9H59NQ25W)
