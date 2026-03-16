# Session 2 — 2026-03-16

## What Was Built

### Card Landing Algorithm Overhaul (Screen 1)
- Replaced tier-sequential greedy placement with grid-aware interleaved placement + gap repair
- Cross-tier gap repair — any card can fill any gap regardless of tier (a micro card can fill a hero-card gap)
- Card entrance replays every time user scrolls back to screen 1 (title/tagline/spheres persist, only cards reset)
- 300ms debounce prevents scroll spam
- `isActiveRef` guards on all deferred callbacks so in-flight animations bail out when screen deactivates

### expo-ahap Integration (Core Haptics)
- Installed `expo-ahap` for iOS Core Haptics — continuous haptic events with parameter curves
- Type declaration override at `src/types/expo-ahap.d.ts` (package ships .ts with type errors against newer expo-modules-core)
- `tsconfig.json` updated: `skipLibCheck: true`, paths redirect for expo-ahap, excluded from type checking
- Requires native rebuild: `npx expo run:ios --device`

### Haptic System
- **Screen transition "Siri Whoosh"**: transient hit + 380ms continuous buzz with intensity/sharpness curves. Plays on every page scroll in LandingDesignSampler.
- **Card cascade rainfall**: 1.9s `HapticContinuous` swell that builds as cards appear, peaks at hero landing, tapers. 6 transient raindrop hits layered on top. Per-card `tick` synced to actual card appearance timing.
- **Keystroke haptic**: `HapticTransient` at 0.25 intensity for typing demos (forward + backspace)
- **MorphingPill haptics**: `haptics.select()` on open, `haptics.tap()` on close — all demo modes
- **Result selection**: `haptics.select()` on highlighted search result
- 5 AHAP patterns auditioned (Siri Whoosh, Soft Bloom, Deep Thud+Tail, Rising Sweep, Double Pulse) — Siri Whoosh selected and locked in

### Radial Color Pulse System
- Soft color wash on every page transition
- Colors: coral (Search), blue (Log), green (Scan), gold (Rate), teal (Parks), purple (Rankings), amber (Community)
- Renders BEHIND the phone frame (inside FlatList renderItem, all screen containers changed to transparent bg)
- 3 concentric circles for soft gradient feel, scales from center outward over 700ms then fades

### Rate Demo (Screen 5) — Major Polish
- Skipped card art/stats swipe in rate flow (log screen already demos it)
- `scrollToSubmit()` added to RatingSheet ref with 48px extra bottom padding
- Visual press animation on "Rate this ride" button (`highlightRateButton()` — scale 0.96, opacity 0.7, 300ms)
- Rate button alignment fixed: `width: 100%` on wrapper, `gap: 6` instead of `marginRight`
- **"Rated!" celebration with blurred card art**:
  - NanoBanana art fills entire screen (explicit `width: SCREEN_WIDTH, height: SCREEN_HEIGHT`, `resizeMode="cover"`)
  - Celebration overlay moved outside sheet (was clipped by `overflow: hidden` + rounded corners)
  - Always mounted, opacity-driven (no React mount flash)
  - Fade in: 500ms background settle, then content appears. Fade out: 400ms.
  - BlurView intensity: 35, white overlay: 45%
  - SVG `RadialGradient` (react-native-svg) white glow behind checkmark for readability — smooth gradient from 82% white center to transparent edge
- **Logbook view rebuilt**:
  - Stats row: big bold numbers (28px) + labels + hairline vertical dividers
  - SegmentedControl pill tabs (Timeline/Collection/Stats/Pending) matching real LogbookScreen
  - Fog gradient + sticky header hidden when logbook active
  - 2-column card grid with park names + star ratings
  - Scrolls to VelociCoaster before selecting it
  - 250ms tap flash (scale 0.97, opacity 0.9) + haptic, not press-and-hold
- **Demo reset on revisit**: full state reset when `isActive` goes false — MorphingPill closes, all shared values snap to initial, all React state clears

### LandingDesignSampler Updates
- 8 screens: Card Landing, Search, Log, Scan, Rate, Parks, Rankings, Community
- 8 pulse colors defined
- Parks, Rankings, Community screens added by Caleb (new wrappers imported)

## Where I Left Off

### Next Task: Auth/Login Screen (Screen 9)
- **Placement decided**: auth is the FINAL page of the vertical scroll (after Community). Skip button also takes you to auth. Skip button hides on the auth screen itself.
- **Auth is required** — no anonymous mode at launch
- **No code started** — screen needs to be designed and built
- Firebase Auth backend: email done (Sprint 2a), Google + Apple Sign-In next (Sprint 2b)

### Still Needs Attention
- Rate demo logbook section flagged as "glitchy/laggy" — may need optimization
- Parks, Rankings, Community screens — added by Caleb, not reviewed this session
- `OnboardingPassDetail.tsx` pre-existing TS error (`TICKET_CARD_ART` not found) — not blocking
- App-wide haptic upgrade to Core Haptics — noted as future task for real app interactions

## Files Modified This Session
- `OnboardingCardLanding.tsx` — placement algorithm, replay logic, Core Haptics cascade
- `OnboardingSearchEmbed.tsx` — typing haptics, morph haptics, rate demo timing, logbook rebuild, imports
- `OnboardingRatingSheet.tsx` — celebration overlay (outside sheet, blur art, SVG glow, fade in/out), scroll padding
- `OnboardingLogConfirmSheet.tsx` — rate button alignment, highlightRateButton(), nudgeContainer padding
- `LandingDesignSampler.tsx` — Siri Whoosh, pulse colors, new screen imports, sampler cleanup
- `OnboardingSearch.tsx` — transparent bg
- `OnboardingLog.tsx` — transparent bg
- `OnboardingScan.tsx` — transparent bg
- `OnboardingRate.tsx` — transparent bg
- `src/types/expo-ahap.d.ts` — NEW (type declarations)
- `tsconfig.json` — skipLibCheck, paths redirect, exclude
- `package.json` / `package-lock.json` — expo-ahap added

## Key Decisions Made
1. Siri Whoosh haptic for screen transitions (auditioned 5 patterns)
2. Core Haptics continuous events > rapid discrete ticks for sustained haptic feel
3. SVG RadialGradient for smooth gradient effects (concentric circles looked tacky)
4. Celebration overlay renders outside sheet for full-screen notch coverage
5. Always-mounted celebration (opacity-driven) prevents React mount flash
6. Auth screen at bottom of scroll + Skip shortcut, Skip hides on auth page
7. Keep phone frame for all demo screens (Apple keynote pattern — variety is in the demo, not the container)
