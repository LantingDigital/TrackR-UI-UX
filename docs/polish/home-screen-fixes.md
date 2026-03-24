# Home Screen — Bug & Polish Tracker

All known issues from the home screen and its child modals/flows. Organized by area.

---

## Fog & Status Bar (CRITICAL — REGRESSION)

The home screen fog was the **gold standard** before the last fog pass. The adaptive fog controls meant for other screens were incorrectly applied to the home screen. It needs to be **completely reverted** to its pre-fog-pass state.

- [ ] **Home screen fog — revert to original.** Adaptive fog controls should NOT apply here. Restore the exact fog behavior from before the fog pass.
- [ ] **Status bar gray line.** A solid gray bar appears where there should be none. Content should scroll behind a blurry status bar with no hard line.
- [ ] **Search modal fog broken.** Same fog regression — needs the same revert/fix.
- [ ] **Log modal fog broken.** Same fog regression — needs the same revert/fix.

---

## Search Modal

- [ ] Fog regression (see Fog & Status Bar above)
- [ ] Status bar gray line (see Fog & Status Bar above)
- [ ] Popular parks need placeholder images

---

## Log Modal

- [ ] Fog regression (see Fog & Status Bar above)
- [ ] **"More from Busch Gardens Tampa" showing on initial landing.** No park-specific content should appear until the user interacts. Should be empty or generic on first open.
- [ ] **Rides without card art show gray** (Sand Serpent, Air Grover). This is a card-art-agent problem, not a polish issue — but tracking here for visibility.
- [ ] **"Trending This Week" is placeholder data.** Needs real data. Backend/content problem.
- [ ] **Card art images load gray then pop in.** Needs a loading indicator, skeleton, or pre-loading strategy so images don't flash from gray to loaded.

---

## Rating Flow

- [ ] **Notes text input — keyboard dismiss behavior.** Currently scrolls up correctly for the keyboard but INSTANTLY snaps back down on dismiss AND auto-closes the Notes section. Fix: (1) animate back smoothly, (2) do NOT close Notes on keyboard dismiss, (3) only close when user taps Close.
- [ ] **Rating celebration screen — restyle.** Should match onboarding celebration: blurred coaster background + soft radial gradient + checkmark. Pull code directly from the onboarding celebration implementation.
- [ ] **Post-rating bottom sheet — no close animation.** After rating from the log modal, the bottom sheet instantly disappears. Needs an animated dismissal.
- [ ] **"All Caught Up" / congratulations screen not centered.** Center it.
- [ ] **"Rate All" from log modal — visual clash.** The Rate Rides screen overlays on top of the bottom sheet, creating a visual conflict. Rate Rides screen should go behind the rating bottom sheet or disappear when the sheet opens.
- [ ] **Rating bottom sheet missing grab handle.** All other bottom sheets have one. Add a grab handle for consistency.
- [ ] **X button on rating bottom sheet doesn't work.** Have to use the back arrow to dismiss. X button needs to properly dismiss the sheet.

---

## Navigation Bar Disappearing (CRITICAL BUG)

- [ ] **Bottom nav randomly disappears during use.** Especially after bottom sheets open/close. No reliable way to restore it (sometimes tapping an article and going back brings it back).
- [ ] **Systematic fix needed: global nav bar visibility manager.** Rule: bottom nav MUST always be present. Bottom sheets should hide it, and when the sheet closes, the nav MUST return. Every single time. This needs a centralized solution, not per-screen fixes.

---

## Scan Modal / Wallet

- [ ] **Nav bar behavior with bottom sheet.** When the long-press bottom sheet opens on a pass, nav bar should disappear. When the sheet closes, nav bar should return. (Related to the nav bar disappearing bug above.)
- [ ] **"Scan at Gate" — extra modal underneath.** Long-press menu "Scan at Gate" shows the correct screen but there is a wider modal visible underneath it that should not be there. Remove the extra modal.
- [ ] **"Scan at Gate" should open as a bottom sheet.** Should behave the same as manual navigation to scan — open as a bottom sheet, and scrolling down should dismiss it.
- [ ] **"Edit Details" does nothing.** Needs routing to the edit form.
- [ ] **"Delete Pass" needs confirmation.** Add a warning/confirmation modal before deleting. Match the delete warning pattern used elsewhere in the app.

---

## Articles

- [ ] **All articles say "Article not found."** Content exists in `content/articles/` but is not connected/routed. Articles need to be properly loaded and displayed.
- [ ] **Saved articles screen — may not exist.** If there is no saved articles destination, the Save Article button is redundant. Either build the saved articles screen or remove the save functionality.
- [x] Bookmark animation works well (keep it).
- [x] Long-press save/unsave works (keep it).
- [x] Share opens correct modal (keep it).
- [x] "Not for me" feedback animation is great (keep it).

---

## Trending This Week

- [ ] **Needs real data.** Currently showing placeholders.
- [ ] **Long-press "View rankings" — verify deep link.** Should deep link to the trending list within rankings. Verify this actually works.

---

## Friend Activity

- [ ] **"See All" routes to feed instead of Friends screen.** Should take the user to the Friends screen since that is where friend activity lives.
- [ ] **"Their Post" says post doesn't exist.** Expected for mock data — will resolve when real data is connected.
- [ ] **"Post not found" bottom sheet has no X button.** Add an X button for dismissal consistency.
- [ ] **Bottom sheet dismiss causes visual jump.** Dismissing the "Post not found" sheet goes to the home screen and then reopens the community tab. Should dismiss cleanly without jumping.
- [ ] **Long-pressing ride name in friend activity does nothing.** Should show the same long-press menu as ride names elsewhere in the app (Log, View Stats, etc.).

---

## Featured Park

- [ ] **Tapping featured park goes to generic parks screen.** This is redundant. Should navigate to a park stats page or park detail view instead.
- [ ] **Stats on the card are hardcoded.** Need to be dynamically loaded from data.
- [ ] **Long-press — add useful actions if applicable.** Otherwise, no long-press needed.

---

## Games Section

- [ ] **SpeedSorter crashes.** Error: "rendered more hooks than during previous render" — `SpeedSorterScreen.tsx` line 118 (`useMemo`) and line 201 (`useSafeAreaInsets`). This is a render bug, not a polish issue — needs a code fix.
- [ ] **Trivia icon (pointed arrows) doesn't look right.** Needs a better, more appropriate icon.
- [ ] **Trivia card expand/collapse animation is too slow.** Too long before expanding after tap, too long before collapsing, and leaves empty space before closing. Needs faster, tighter animation.
- [ ] **Trivia source accuracy.** ("Vekoma/RCDB") needs verification for every question.
- [x] Coastle works fine from home screen (keep it).
- [x] Blind Ranking works fine from home screen (keep it).
- [x] Trivia works fine from home screen (keep it).
- [x] "View all games" correctly takes to Play section (keep it).

---

## Nearby Parks

- [ ] **Tapping a park goes to generic parks screen.** Same issue as Featured Park — redundant. Needs a park stats/detail page.
- [ ] **"See all parks" does nothing useful.** Goes to the same screen. Needs proper navigation to a parks list or map.
- [ ] **Coaster count needs to come from actual data.** Should not be pulled from the internet at runtime — use the app's own data source.
- [ ] **Miles from user needs GPS accuracy.** Must use device location for real distance calculations.
- [ ] **Park hours are all mock data.** Need a park hours API or data source for dynamic open/closed status.
