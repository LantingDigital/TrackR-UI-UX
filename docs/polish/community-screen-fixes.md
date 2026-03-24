# Community Screen — Bug & Polish Tracker

All known issues from Caleb's walkthrough of the Community screen (Feed, Friends, Rankings, Play tabs). Organized by tab and section.

---

## App-Wide (Discovered During This Walkthrough)

- [ ] **TrackR logo treatment everywhere.** Wherever "TrackR" appears as a title element, "Track" should be black and the "R" should be red — matching the first onboarding screen. This is app-wide, not just Community.
- [ ] **iOS toggle switch animation glitch.** The iOS-style on/off switch sometimes loses its glass/lift animation and the knob just fades to the other side instead of physically sliding. Intermittent — happens in game settings, rating criteria, and elsewhere. Root cause unknown. Must always persist with the proper glass slide effect.
- [ ] **No bottom sheets should have fog effects.** Caleb explicitly banned fog effects on bottom sheets (profile bottom sheet had one — remove it).

---

## Feed Tab

### Empty State
- [ ] **Center "No Posts Yet" module between margins.** Top margin = games carousel, bottom margin = "Create Post" button. The entire "No Posts Yet" block (message icon through the "Create a Post" pill) must be perfectly vertically centered between those two margins.

### Create Post — General
- [ ] **Post type selection has no transition animation.** Tapping "Review," "Trip Report," "Ranked List," etc. from the "Make Post" sheet instantly swaps content with no animation. Must animate (slide, crossfade, or new bottom sheet — never instant).
- [ ] **Post creation sheets are too small.** The initial "Make Post" bottom sheet height is fine, but once a specific post type is selected, it needs a much larger sheet — full screen or 90% modal. Trying to fill out a post in 40% of the screen is not acceptable.
- [ ] **Keyboard covers input fields across all post types.** When tapping any text input in post creation, the keyboard pops up and covers the content. The sheet must adapt to keyboard height so the user can always see what they're typing. (See keyboard-behavior.md rule.)
- [ ] **Remove "Bucket List" post type.** Replace with a generic text + image post (Instagram-style: description field, attach multiple photos on a carousel with page indicators matching the app's existing page indicator style).

### Create Post — Review
- [ ] **Search bar doesn't match app design language.** The coaster search box is thin and small — looks like "college ruled notebooks." Must match the thicker, more user-friendly search bars used elsewhere in the app.
- [ ] **Keyboard covers search bar.** Tapping the search bar brings up the keyboard which completely covers the input — user can't see what they're typing. Critical fix.
- [ ] **Star rating has a jello effect.** The rating animation overshoots and wobbles. Pop effect is fine, but the bounce/settle is banned. (See no-jello.md.)
- [ ] **Replace star ratings with TrackR's rating system.** Stars are "completely against what we've been doing." Reviews should integrate directly with the app's existing rating system. If the user has already rated the ride, show a quick-view of their score. If they haven't rated it, prompt them to do the full rating. On the viewing side, show the actual score with an option to tap and see the reviewer's weights/criteria breakdown.

### Create Post — Trip Report
- [ ] **Complete redesign — make it step-by-step, not text boxes.** Current flow (title, ride count, text) is impractical and redundant. New flow: (1) Title the report, (2) Search/select the park — auto-populate all rides at that park, (3) Check off which rides you did, (4) Tap up-counter for ride count per coaster, (5) Add optional paragraph note, (6) Auto-generate the formatted trip report from those selections. The point is quick taps and buttons, not typing in empty text boxes.
- [ ] **Bottom sheet needs to be much taller.** Everything is cramped. Needs full-screen or 90% modal.
- [ ] **Text boxes are tiny.** Match the larger input style used elsewhere in the app.

### Create Post — Ranked List
- [ ] **Emojis are present — banned.** Replace all emoji icons with SVG icons only. (See feedback_no-emojis.md.)
- [ ] **Icon grid is 8 per row — too small to tap.** Reduce to 4 per row and make icons bigger.
- [ ] **Title text box is tiny.** Match larger input styling.
- [ ] **Keyboard covers content.** Can't see search results or the list after typing. Critical.
- [ ] **Redesign ranked list creation to be category-aware.** Add a category selector (coasters, parks, food, road trips, etc.) so the search/autocomplete adapts: coasters use the ride search modal, parks use park search, freeform categories allow typed entries with optional photo upload.
- [ ] **Adjustable list size.** User should choose top 5, top 7, top 10, etc. That number of empty slots appears on screen to be filled.
- [ ] **Interactive slot-filling UX.** After searching and selecting an entry, it hovers at the bottom of the screen. User taps the slot where it belongs. Entry fills that slot and disappears until the next search. (Edge case: what happens when placing an entry in an occupied slot? — needs decision, noted for future.)
- [ ] **Photo support per entry.** Coasters default to card art. Non-coaster categories (food, road trips) allow user-uploaded photos. Photos are small (icon-sized next to the entry text). Viewers can tap to see full photo.
- [ ] **Entry display should match ride search visual style.** Text on left, small image on right, similar to how rides appear when logging.

### Post Viewing (Feed)
- [ ] **All coaster/park names in posts must be tappable.** Tapping opens the standard coaster/park bottom sheet (log ride, view ride, etc.). This applies to reviews, trip reports, ranked lists — any post that references a coaster or park.

---

## Games — Coastle

### APPROVED (Do Not Touch)
- Coastle overall design: "perfectly designed, I love this game, it's perfect"
- Settings morphing pill: "perfect for me"
- Stats screen layout: "perfect"
- Send Feedback button: "perfect"
- Parallax animation on dismiss: "I like the parallax animation"
- Coastle completion modal with full-width "Share" and "Play Again" buttons — this is the reference for how game completion should look

### Fixes
- [ ] **Stats must be dynamic, not mock data.** Current data appears hardcoded. Wire to real coaster data.
- [ ] **Daily Coastle must use valid coasters.** Ensure the daily puzzle never picks a coaster with "unknown" name or stats. Pull from validated coaster database only.
- [ ] **Consider Coastle-specific settings in the settings page.** Currently feedback goes to generic app feedback from Coastle settings, which is "a little bit strange." Either add Coastle-specific settings or acknowledge the current routing is acceptable.
- [ ] **Parallax dismiss animation must be consistent across all games.** Coastle's dismiss looks good — replicate it for Blind Ranking, Trivia, SpeedSorter, and any future games.

---

## Games — SpeedSorter

### BROKEN
- [ ] **Render error crashes the app.** SpeedSorterScreen.tsx has errors on line 318 (chevron pointing at open parentheses after `useMemo`) and line 201 (chevron at opening parentheses on `useSafeAreaInsets`). Crashes require full app reload. Fix the render error first before any polish.

### Fixes (Post-Crash Fix)
- [ ] **Drag and drop is janky.** Cards don't move in real time during drag. Placing a card causes everything to abruptly shift. Different-size rectangles make it look awful. Cards must smoothly animate to their target positions in real time while dragging, and all other cards must smoothly reflow — not snap/jank into place after release.
- [ ] **Deep audit of settings.** Make sure settings aren't redundant (like the Trivia hard mode issue). All settings should be meaningful and functional.

---

## Games — Blind Ranking

### Gameplay
- [ ] **Add reveal effect when placing an item.** Currently the park name just appears when you place a coaster in position — no effect. Add a confetti, particle, or other subtle celebration effect to engage the user.
- [ ] **Add fog effect to header during gameplay.** Content scrolling behind the header (status bar down to the "Where Does This Belong?" card line) should be fogged, not hard-cut. Top fog only during gameplay.
- [ ] **Add bottom fog effect during gameplay.** The page indicator should sit on top of subtle bottom fog so content doesn't look hard-cut at the bottom.
- [ ] **Add drum-roll / celebration effect on completion.** Currently results appear instantly. There should be a build-up (drum roll effect) before revealing final rankings in a "really cool format."
- [ ] **Community Comparison toggle doesn't work in real time.** Turning off "Community Comparison" in settings doesn't remove it from the current game — it persists even after completing a new round. Must apply immediately.

### Results Screen
- [ ] **"Play Again" and "Done" buttons need restyling.** Buttons should be full-width pills matching Coastle's completion modal style ("Share" and "Play Again" as full-width). "Done" should be renamed to "Return to Menu."
- [ ] **Add fog effect to results header.** Replace the solid line under "Blind Ranking" / settings / X with a fog effect. Content should scroll behind fog, not behind a hard line.

### Play Tab Card Info
- [ ] **"Accuracy" metric is confusing for Blind Ranking.** Blind Ranking is a personal ranking tool — accuracy against community isn't the primary purpose. Rephrase or replace this stat with something more relevant to self-ranking.
- [ ] **"Perfect" metric is also misleading.** Same issue — Blind Ranking is for you, not community comparison. Community comparison is optional, not the headline stat.

---

## Games — Trivia

- [ ] **Complete layout overhaul.** Current layout doesn't take up space well, isn't oriented well, and doesn't match the polish level of other screens. "This looks like every other trivia game ever." Needs to feel premium and unique to TrackR.
- [ ] **No tap feedback on answer selection.** Tapping an answer instantly shows correct/incorrect with no animation. Needs: (1) button press feedback, (2) brief pause, (3) animated fade to the correct color. No jello, just evidence of a tap before the reveal.
- [ ] **Rounded corners on answer selections are good.** Keep those.
- [ ] **Hard mode is backwards.** Hard mode shows 3 answer choices instead of 4, which actually makes it EASIER. Fix: hard mode should have MORE choices or shorter time, not fewer choices.
- [ ] **Hard mode doesn't activate mid-game.** Toggling hard mode only takes effect after exiting and re-entering. It should either apply immediately or clearly indicate it applies to the next round.
- [ ] **Deep audit of settings.** Remove any redundant settings (same issue as other games).

---

## Games — Coaster Clash

- [ ] **Coaster Clash doesn't exist yet.** Acknowledged — will design later using the perfected design language from the other games. Remove or replace placeholder in the games carousel for now.

---

## Friends Tab

### Stories Carousel
- [ ] **Read/unread story ordering.** Red-bordered (unread) stories should be pushed to the LEFT. Gray-bordered (read) stories should be on the far RIGHT. Currently they're scattered.
- [ ] **Story tap vs long-press behavior.** Tap should open the story. Long-press should open the friend's profile. Currently tap goes directly to profile (acceptable placeholder since no stories exist yet, but the final behavior must be tap = story, long-press = profile).

### Friend Profile Bottom Sheet
- [ ] **Remove fog effect from profile bottom sheet.** No bottom sheets should have fog effects (app-wide rule from this walkthrough).
- [ ] **Profile picture must match story icon.** The profile picture in the story carousel must be the same as the one in the profile bottom sheet.
- [ ] **Credits, reviews, mutual counts must be dynamic.** Currently appear hardcoded.
- [ ] **Recent rides must be tappable red text.** Coaster names (e.g., "Iron Gwazi," "Montu") should appear in red text. Tapping opens the standard coaster bottom sheet (log ride, view ride, etc.).
- [ ] **Replace star ratings with TrackR rating display.** Recent ratings on the profile should use the app's rating system format, not stars. Display should match how ratings appear in feed review posts.

### Activity Feed
- [ ] **All coaster/park names in friend activity must be tappable.** Tapping any coaster or park reference in friend activity opens the standard bottom sheet. Same rule as feed posts.

---

## Rankings Tab

- [ ] **Screen is being redesigned — needs populated design.** Currently empty/placeholder. Populate with rider rankings, coaster scores, and game high scores as previously discussed.

---

## Play Tab

### Challenges Section
- [ ] **Challenges section feels redundant with only one challenge.** Currently just "Weekly Challenge." Need more challenge types to justify the section. (Specifics TBD — noted for future brainstorm.)
- [ ] **Weekly Challenge card should be tappable.** Tapping should break down which games have been played and progress per game. Currently the progress bar just shows "1 of 4" (appears hardcoded).
- [ ] **Weekly Challenge progress must be dynamic.** Wire to actual gameplay data.

### More Games Section
- [ ] **Game stats are hardcoded.** Streaks, rounds, times played, percentages — all must be dynamic based on actual gameplay data.
- [ ] **Game-specific criteria, not generic.** Each game card's displayed stats should reflect what matters for THAT game, not generic info copy-pasted across all games.
- [ ] **Remove or replace Coaster Clash.** Still showing in the games carousel despite not existing.

---

## APPROVED (Summary — Do Not Touch)

These elements were explicitly praised by Caleb:

1. **Coastle overall design** — "perfectly designed, perfect"
2. **Coastle settings morphing pill** — "perfect for me"
3. **Coastle stats screen** — "perfect"
4. **Coastle send feedback button** — "perfect"
5. **Coastle dismiss parallax animation** — "I like the parallax animation"
6. **Coastle completion modal** (full-width Share + Play Again) — reference standard for all game completions
7. **Blind Ranking as a game concept** — "I love the blind ranking, it's a fun game to play"
8. **Trivia answer rounded corners** — keep
9. **Story carousel red/gray border system** — "actually perfect" (just fix ordering)
10. **Feed "Create Post" bottom sheet initial height** — good for the initial menu; only needs to expand for specific post types
