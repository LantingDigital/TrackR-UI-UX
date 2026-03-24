# App-Wide Fixes (Cross-Cutting Issues)

Discovered during full app walkthrough 2026-03-24. These are global issues that affect multiple screens and must be fixed systemically, not screen-by-screen.

---

## Global UI Rules

- [ ] **NO FOG ON BOTTOM SHEETS** — remove all fog effects from every bottom sheet in the app. Bottom sheets should never have fog overlays. Audit every bottom sheet component and strip fog.
- [ ] **NO EMOJIS** — SVG icons only, everywhere. No emoji characters in any UI element. Audit all screens, modals, and components for emoji usage and replace with proper SVG icons.
- [ ] **TRACKR LOGO TREATMENT** — headings/logos only: "Track" = black, "R" = red. Body text stays normal. Ensure this is consistent across all screens where the TrackR name appears as a logo/heading.

---

## Interaction & Input

- [ ] **KEYBOARD DISMISS ON SCROLL** — scrolling any autocomplete/search results list must auto-dismiss the keyboard. App-wide, every screen. Implement globally so every ScrollView/FlatList with search results calls `Keyboard.dismiss()` on scroll begin.
- [ ] **HAPTICS MASTER SWITCH** — Settings haptics toggle is the master switch. When OFF: zero haptics anywhere, instantly. When ON: all haptics active. Includes switches, sliders, buttons, everything. Must be checked at the point of every haptic call, not just in specific components.
- [ ] **iOS TOGGLE SWITCH GLITCH** — the glass/lift animation on iOS-style toggle switches sometimes breaks (knob fades instead of physically sliding). Must always work with proper glass slide effect. Root cause unknown — needs investigation. Could be a race condition in the animated values or a rerender killing the animation mid-transition.

---

## Modal & Sheet System

- [ ] **THREE-TIER MODAL SYSTEM** — enforce consistently across the entire app:
  - **iOS native Alert = NEVER.** Do not use `Alert.alert()` anywhere.
  - **Custom on-brand modal (blurred bg) = destructive/attention actions.** Examples: delete account, delete ride, reset onboarding. These are high-stakes actions that need the user's full attention.
  - **Bottom sheet = options/choices.** Examples: unit selection, rider type, sort order. Low-stakes selections that don't need a full modal.
  - Audit every `Alert.alert()` call in the codebase and replace with the appropriate tier.
- [ ] **NAV BAR DISAPPEARING** — bottom navigation randomly disappears after bottom sheets open/close. Build a global nav bar visibility manager: nav hides when sheet opens, MUST reliably return when sheet closes. Every time, no exceptions. This needs a centralized state manager (context or zustand store) that tracks sheet open/close and guarantees nav bar restoration.

---

## Loading & Performance

- [ ] **REUSABLE COASTER LOADING ANIMATION** — build the roller coaster loading animation as a reusable component. Replace ALL loading indicators across the app (ActivityIndicator, spinners, skeleton screens). Variously sized but never too small to recognize. Tweakable from one place (color, size, speed). Single source of truth component that every screen imports.
- [ ] **CARD ART GRAY LOADING** — the #1 recurring issue across the entire app. All card art loads gray then instantly appears. Fix requires a multi-step approach:
  1. Pre-load/cache images (use `Image.prefetch` or a caching library)
  2. Show loading animation (coaster spinner component from above) while loading
  3. Smooth fade-in when image is ready (opacity 0 to 1, 200-300ms)
  4. NEVER instant pop — the gray-to-image jump is jarring every time
  5. Apply to every `Image` component that loads card art, park images, or any remote asset

---

## Layout

- [ ] **BOTTOM PADDING EXCESS** — every scrollable page has too much empty space at the bottom. Find the root cause (likely double safe-area inset — both the screen wrapper and the ScrollView adding bottom padding). Fix globally by identifying the shared pattern and removing the duplicate. Check `SafeAreaView` usage, `contentContainerStyle` bottom padding, and tab bar height calculations.

---

## Buttons & Actions

- [ ] **FLOATING ACTION BUTTON CONSIDERATION** — Caleb likes FABs for submit buttons (see Cart screen as approved example). Consider converting bottom-anchored pill submit buttons to FABs across the app. Add bottom fog for clean FAB separation. Decision: implement where it makes sense, use Cart screen as the reference pattern. Screens to evaluate: any screen with a bottom-pinned submit/confirm button.

---

## Data Display

- [ ] **RATING DISPLAY FORMAT** — ratings shown as X.X/10 (e.g., 8.9/10). Tappable to expand into per-criteria breakdown. This format replaces star ratings everywhere they appear (community posts, friend profiles, ride detail sheets, etc.). Ensure consistency across all rating displays.

---

## Agent Routing (NOT polish-agent's responsibility)

These issues were discovered during the walkthrough but belong to other agents. Listed here for tracking and routing.

- [ ] **Article "not found" errors** — route to content-agent
- [ ] **SavedArticlesScreen navigation** — route to content-agent
- [ ] **SpeedSorter render crash** — route to games-agent
- [ ] **ProUpgradeScreen build** — route to commerce-agent (note: profile card redesign IS polish)
- [ ] **Friend Activity "See All" routes to feed instead of friends** — route to social-agent
- [ ] **Coaster count wrong on park stats** — route to core-data-agent
- [ ] **Park hours API** — route to experience-agent (ThemeParks.wiki or scraper)
- [ ] **Food/ride data collection** — route to new park-data-agent
- [ ] **Missing card art for rides** — route to card-art-agent
- [ ] **Trending data (mock)** — route to core-data/content agents

---

## Clarifying Answers (from Q&A session 2026-03-24)

Reference answers for agents working on related features:

- **Card art fan on onboarding:** automated loop, random selection — agent should verify in code
- **Onboarding animations:** match the REAL app's collapse/expand exactly (same spring configs)
- **Wallet onboarding demo:** automated (not interactive)
- **Criteria demo:** show sliders moving smoothly, percentages redistributing, lock mechanism. No templates. Perfect loop.
- **Park switcher onboarding:** replicate real MorphingPill at smaller scale
- **Rankings onboarding:** build ahead — show new Coasters/Riders segmented control even before social-agent builds it
- **Home screen fog:** git blame to find last correct state, revert
- **Nav bar:** hide during sheets, always return. Global visibility manager.
- **Delete ride:** custom modal (destructive action tier)
- **Rarity/legendary badges:** REMOVE entirely
- **Logbook tab collapse:** simple fade-out like parks screen
- **Stats drill-down screens:** core-data-agent builds them
- **Park data (food, rides, hours):** new park-data-agent needed
- **Annual vs Season pass:** add clarifying text
- **Profile redesign:** polish-agent proposes 2-3 concepts
