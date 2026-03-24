# Logbook Screen — Bug & Polish Tracker

All known issues from the Logbook screen and its child modals/flows. Organized by area. Captured during device walkthrough 2026-03-23.

---

## Empty States (Timeline, Collection, Stats, Pending)

- [ ] **"No rides logged yet" vertical centering.** Placeholder text must be PERFECTLY CENTERED vertically between the tab navigation bar (top boundary) and the plus icon (bottom boundary). Currently positioned too high.
- [ ] **"Your collection is empty" same centering rule.** Apply the exact same vertical centering logic — centered between tab nav bar and plus icon.
- [ ] **Stats empty state — hide zero-value cards.** When all values are zero, HIDE the Credits / Total Rides / Parks / Top Rating cards entirely. Do not render them. Show only "No stats yet" + "Log your first ride." The stat cards should appear ONLY when at least one value is non-zero.

---

## Card Art Loading (APP-WIDE, manifests here)

- [ ] **Gray-to-visible pop on card art.** Card art starts gray then instantly appears with no transition. Fix: show a loading indicator (shimmer skeleton or spinner) while loading, then smooth fade-in when the image is ready. Never an instant pop from gray to loaded.
- [ ] **Collection/Pending tab switching loses cache.** Toggling between Collection and Pending tabs — where cards SHOULD already be cached — still shows the gray-to-pop cycle. Images that have already been loaded and displayed should remain cached and appear instantly on tab switch. Fix the caching layer so previously-loaded art does not re-trigger the loading state.

---

## Plus Icon Behavior

- [ ] **Plus icon disappears behind bottom sheets then reappears abruptly.** When a bottom sheet opens, the plus icon disappears (correct), but when the sheet closes, the icon pops back in instantly with no animation. Fix: the plus icon should animate in/out on the same layer and timing as the placeholder content — not independently snap back into existence.
- [ ] **Search bar auto-focus + keyboard must be ONE animation.** Tapping the plus icon opens the log bottom sheet. Currently the sheet animates up in one step, THEN the search bar focuses and keyboard appears as a second step. These must be unified: bottom sheet rises, search bar auto-focuses, and keyboard slides up all as a single simultaneous animation. No two-step sequence.

---

## No Fog on Bottom Sheets (NEW RULE — APP-WIDE)

- [ ] **Remove ALL fog from ALL bottom sheets.** Bottom sheets showing coaster details (e.g., "Top Thrill 2 Cedar Point") currently have a fog blur at the top that covers the card art. Remove fog overlays from every bottom sheet in the entire app. Bottom sheets are not scrollable page screens — they should not have fog headers. This is a new app-wide rule.

---

## Delete Ride Confirmation

- [ ] **Replace iOS native Alert with custom bottom sheet.** The "Delete ride?" confirmation currently uses the iOS native `Alert.alert()` modal. Replace it with a custom-styled bottom sheet matching the app's design language. Use the warning/destructive action pattern (red button, clear messaging) consistent with other confirmation flows in the app. No native iOS modals — everything uses branded custom bottom sheets.

---

## Keyboard Dismiss on Scroll (APP-WIDE RULE)

- [ ] **Scrolling results list must auto-dismiss keyboard.** When typing in a search/autocomplete field and then scrolling the results list, the keyboard should AUTOMATICALLY DISMISS on scroll. The user should not need to tap outside the field or tap a specific result to close the keyboard. Scrolling alone = keyboard goes away. Apply this behavior everywhere in the app that has a search or text input above a scrollable results list — not just logbook.

---

## Rating Flow

- [ ] **"Save Rating" celebration must match onboarding celebration style.** The celebration screen after saving a rating should use: blurred coaster background + soft radial gradient + checkmark animation. Pull the implementation directly from the onboarding celebration screen. Same visual language, same feel.
- [ ] **Post-rating bottom sheet has NO close animation.** After rating from the log modal, the bottom sheet instantly disappears with zero animation. Needs a proper animated dismissal (slide down + fade out, matching how other bottom sheets close).
- [ ] **Rating bottom sheet fog — remove.** Per the new app-wide rule above, the rating bottom sheet should have no fog overlay. Remove it.

---

## Scroll Behavior — Sticky Tab Bar

- [ ] **Tab nav bar must be STICKY at top when scrolling Collection.** When scrolling through Collection cards, the tab navigation bar (Timeline / Collection / Stats / Pending) must stick to the top of the screen and remain visible at all times.
- [ ] **Credits, Ride Count, Park Count collapse on scroll down.** The stat summary row (Credits, Ride Count, Park Count) should collapse/hide when the user scrolls down through content, and reappear when the user scrolls back up. Same pattern as collapsing headers elsewhere in the app.
- [ ] **Tab bar sits ON TOP of the fog layer.** Visual layering order from back to front: scrollable content, fog overlay, tab bar. Content scrolls behind the fog, fog is behind the tab bar. Tab bar is always the topmost visual element in this stack.
- [ ] **Generous padding above tab bar.** The padding between the tab bar and the top of the screen should be generous — at LEAST the same distance as between the tab bar and the first card below it, possibly more. The tab bar should not feel cramped against the top.

---

## Shopping Icon

- [ ] **Subtle POP animation on shopping cart icon appearance.** The shopping cart icon (navigates to merch store) should have a gentle scale-bounce animation when it appears: scale from `0.9` to `1.05` to `1.0`. Not extreme — just enough to subtly draw the eye. A single quick spring, not a repeating pulse.

---

## Coaster Detail Stat Cards

- [ ] **Complete redesign of Height/Speed/Length/Inversions/Year Opened/Builder cards.** Current implementation looks bad: text truncates, squares are inconsistent sizes, text wraps to different line counts even for similar content lengths. Needs a clean, consistent card layout where all stat cards are uniform in size, text never truncates, and values align cleanly regardless of content length.

---

## Card Game Stats Placement (PENDING DECISION — not a polish fix)

This is a product/design decision, not a bug or polish task. Document only.

- [ ] **DECISION NEEDED: Where do gameplay stats live on trading cards?** Physical trading card game requires stats (speed, height, inversions, etc.) somewhere on the card for Top Trumps-style gameplay.
- Card BACK must be uniform across all cards (TrackR logo only — no identifying info visible from the back, for game fairness).
- Card FRONT has the coaster art. Two options:
  - **Option A:** Stats on the front (small, integrated with the art layout)
  - **Option B:** Stats on the back (breaks the uniform-back rule, which exists for gameplay fairness)
- **Status:** PENDING. Needs Caleb + Josh decision. May require consultation with Ethan Lee (board game designer contact).

---

## Rarity / Legendary Status (QUESTION — needs investigation)

- [ ] **QUESTION: Where does rarity data come from?** Collection tab shows "Rare" and "Legendary" badges on some cards. Caleb does not remember approving this feature. Investigate:
  - Where is rarity stored? (Firestore field? Local data? Hardcoded?)
  - What determines whether a card is Rare vs Legendary vs common?
  - Is it safe to remove without breaking other features?
  - Was this part of an approved design or added speculatively?
- **Status:** Needs team lead investigation before any action is taken.

---

## Stats Tab — Tappable Stat Cards

- [ ] **Credits card — tappable.** Tapping Credits navigates to a list of all unique coasters ridden. List should be sortable: alphabetical or by ride count.
- [ ] **Total Rides card — tappable.** Tapping Total Rides navigates to a list showing ride count per coaster. This is a DIFFERENT screen from Credits — Credits shows unique coasters, Total Rides shows frequency per coaster.
- [ ] **Parks card — tappable.** Tapping Parks navigates to a list of all parks visited. Each row shows coaster art on the left + ride name. Coasters that HAVE card art should be sorted first, followed by coasters without art.
- [ ] **Top Rating card — tappable.** Tapping Top Rating navigates to the Riders rankings screen (new design, may not exist yet).
- [ ] **Long-press on coaster rows.** Every coaster listed in the Credits, Total Rides, and Parks drill-down screens should support long-press to show the same action sheet used everywhere else in the app (Log, View Stats, Share, etc.).

---

## Pending Tab

- [ ] **Card art loading fix.** Same gray-to-pop loading issue as Collection tab. Apply the same shimmer/fade-in fix (see Card Art Loading section above).
- [ ] **No fog on pending bottom sheets.** Per the new app-wide rule, remove fog from all bottom sheets opened from the Pending tab.
- [ ] **"All caught up!" celebration when clearing all pending rides.** When the user rates every pending ride and the pending list becomes empty, play the "All caught up!" celebration animation. This celebration ONLY plays when the user intentionally cleared pending rides, accessed from one of two specific entry points:
  1. The **Pending tab** on the Logbook screen
  2. The **"Rate All"** button from the home screen log modal
- [ ] **No celebration from other flows.** If the last pending ride happens to get rated through any other flow (e.g., rating from search, from a coaster detail sheet, from a friend's profile), do NOT play the celebration. The celebration is reserved for the intentional "clear the queue" action only.

---

## Log Modal (from Plus Icon)

- [ ] **Autocomplete results need Reanimated entering/exiting transitions.** Apply the same animation pattern used in the home screen search modal: `FadeIn.duration(200)` entering, `FadeOut.duration(150)` exiting, staggered by index (`delay(index * 50)`), with `Layout.duration(200)` for position changes. See `.claude/rules/log-autocomplete-animation.md` for full spec.
- [ ] **Search bar auto-focus + keyboard simultaneous with sheet open.** When the log bottom sheet opens, the search bar must auto-focus and the keyboard must animate up AT THE SAME TIME as the bottom sheet slides into view. One unified animation, not a two-step sequence (repeated from Plus Icon Behavior section — both entry points should behave identically).
