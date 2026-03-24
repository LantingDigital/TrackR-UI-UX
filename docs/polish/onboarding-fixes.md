# Onboarding Polish Fixes

Captured during device walkthrough 2026-03-23. Every issue must be fixed before V1 launch.

**Rule:** Each onboarding screen must match the REAL app's polish level. The onboarding is a preview of the app — if it looks broken, users won't trust the app itself.

---

## APP-WIDE (affects ALL onboarding screens)

- [ ] **Card art loads gray** — images aren't pre-loaded/cached. Cards show gray placeholder, then art appears with a visible pop. Fix: pre-load all card art images before rendering. Zero gray frames.
- [ ] **Card art swap timing** — when cards rotate in the fan/carousel, the image swaps AFTER the card reappears (visible instant swap). Should swap DURING the fade-out (while hidden) so the new art is already loaded when the card fades back in.

---

## Screen 1: TrackR Logo + Card Art Fan

- [ ] Card art gray loading (see app-wide)
- [ ] Card swap timing (see app-wide)

---

## Screen: "Search for Anything"

- [ ] Card art gray loading in carousel (see app-wide)
- [ ] Stats card shows loading state — should be instant if possible

---

## Screen: "Log Every Ride"

- [ ] **"Logged" celebration card position** — card art only partially covers the ride title text. On the REAL app, the card goes completely above and hides all the text. Fix: move content above the "Log" button UPWARD to create more space, which also lets the card fully cover the ride name.
- [ ] **Search autocomplete doesn't show images** — the real app shows ride images in search results. The onboarding version is text-only and looks worse. Must match the real app's search result format (with images).
- [ ] **Collapse/expand animation is stale** — correct end positions but no fluidity. No overshoot to sell the polish. Needs spring physics with slight overshoot (within no-jello rules — subtle, not bouncy).
- [ ] **"Log" button spacing** — too close to content above. Needs more breathing room/padding. Moving content upward (for the card coverage fix) should help.
- [ ] Card art gray loading (see app-wide)

---

## Screen: Wallet / Scan Modal

- [ ] **Carousel incorrectly scrolls passes** — an AI previously misunderstood "make the carousel scroll." It now scrolls the PASSES carousel (the row of pass cards), which is wrong. The passes carousel should stay static. What SHOULD scroll is the DETAIL VIEW (when you tap a pass and can swipe between passes in the opened view).
- [ ] **"Add" button bleeding outside container** — the add button for passes extends beyond its parent container. Must stay within padding.
- [ ] **White card containers wrong width** — the white card backgrounds holding the passes are narrower than in the real app. Fix: match the width to the search bar width exactly. Same padding on both sides.
- [ ] **Card art for park pass doesn't fit** — the pass photo is too big with wrong aspect ratio. Only a percentage of the park photo is visible. Fix: shrink to show the full image OR use a different image that fits the frame.
- [ ] Card art gray loading (see app-wide)

---

## Screen: "Rate What Matters"

- [ ] **White status bar line** — there's a solid white line where the status bar area should be. Should match all other onboarding screens (seamless, no visible bar).
- [ ] **Search autocomplete no images** — same issue as "Log Every Ride" screen. Autocomplete results need images like the real app.
- [ ] **Ranking card half coverage** — the card only goes halfway over the text. Should go completely over it (same fix as Log screen).
- [ ] **Status bar covers content** — the rating photo/blurred background is getting covered by the status bar area. Needs to extend under the status bar OR have proper safe area handling.

---

## Screen: "Rate What Matters" — Criteria Distribution

- [ ] **Percentages truncated** — percentage values on criteria are getting cut off and not fully visible.
- [ ] **Criteria not spaced/centered** — criteria items are misaligned, crowded, not properly spaced.
- [ ] **Scroll animation jumping** — when clicking different buttons, the scroll jumps around instead of smoothly scrolling up/down.
- [ ] **No lock feature shown** — the lock button on criteria weights (a key feature) isn't demonstrated.
- [ ] **No explanation of percentages** — doesn't explain how the on/off works for criteria.
- [ ] **"Distribute evenly" button broken** — doesn't function in the onboarding demo.
- [ ] **Can't scroll to see rest** — no scrolling down to see confirm button or remaining criteria.
- [ ] **Loop animation not seamless** — the demo animation ends wherever it ended and flashes back to the beginning. Should be a PERFECT LOOP where the end state cycles seamlessly back to the start state. No visible reset.
- [ ] **Overall: doesn't convey excitement** — this is a unique, powerful feature but the onboarding portrays it poorly. Needs a redesign of how the criteria/weights demo is presented to make it feel as exciting as the feature actually is.

---

## Screen: Community Tabs

- [ ] **Status bar visible** — status bar area needs to be hidden or matched to the screen's background.
- [ ] **Content doesn't fill under status bar** — the full-screen blurred background (behind the rating/card) should extend all the way up, filling the status bar area.

---

## Screen: "Your Park Day"

This screen is the WORST. Needs an immense makeover.

- [ ] **Quick action buttons rectangular** — should be SQUARE. Wrong aspect ratio.
- [ ] **Park name not below notch** — no padding between notch and park name. Needs proportional spacing.
- [ ] **Wait times carousel extends to screen edge** — no padding on right side. Should match the real app's horizontal padding.
- [ ] **Wait times scroll too fast** — scrolls and then scrolls back without giving time to read. Needs to be SLOWER with pause at each end.
- [ ] **Food and Dining modal only halfway** — should be a full-screen modal. Currently only opens halfway and doesn't scroll through the list.
- [ ] **Pass section completely wrong** — shows something that doesn't match the scan modal. SCRAP IT and replace with the same logic/UI as the scan modal onboarding screen.
- [ ] **Park Guides modal too small** — should be full-screen display, only comes up partially.
- [ ] **Change Modal (park switcher) animation is horrible:**
  - No bounce/spring animation (just instant expansion)
  - Expands WAY too large, taking up entire screen
  - Completely off-center (up and to the left)
  - Content cut off screen
  - Does NOT match the MorphingPill behavior from the real app
  - NEEDS COMPLETE REDO to match real app's MorphingPill expansion

---

## Screen: "Ride Together" / Community

- [ ] **Navigation bar not fog-and-blur** — should match the real app's GlassHeader/FogHeader. Currently a solid sticky bar that content is visible behind. Looks terrible.
- [ ] **Dimensions not to scale** — games section, stories bubbles, and other elements are smaller than the real app. The whole thing looks zoomed out. Needs to match real app proportions.
- [ ] **Feed double-tap on half-visible post** — the demo scrolls down and double-taps a post that's halfway off screen. Should scroll to a FULLY VISIBLE post before demonstrating the double-tap like.
- [ ] **Friends stories too small** — story bubbles need to be larger with real photos (not tiny placeholders).
- [ ] **Rankings tab outdated** — needs to be redone to match the new Coasters/Riders segmented control design.
- [ ] **Friends tab** — make sure it matches the new design (friend request UI, story row, activity feed).
- [ ] **Play section** — looks decent. Just fix truncation and maybe add a brief Coastle modal open/close demo.

---

## Caleb's Meta Feedback

"The entire polished experience of the real app is not encapsulated during this onboarding, and it looks very bad. I want it to be fixed immediately."

**Principle:** The onboarding is a PREVIEW of the app. Every screen, every animation, every dimension must match the real app EXACTLY. If the real app has images in search results, the onboarding must too. If the real app has spring physics, the onboarding must too. The onboarding is NOT a simplified version — it IS the app, just non-interactive.
