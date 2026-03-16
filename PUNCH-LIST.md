# Sprint 8 Punch List

## Onboarding
- [x] Rider type screen: removed from onboarding
- [ ] ProfileReady particles: janky — animation stops abruptly instead of completing its form
- [ ] ProfileReady name: text wraps to two lines (word gets split by a line break). Needs to fit on ONE line — scale font down or truncate
- [ ] ProfileReady timing: takes too long before particles start. Reduce initial delay so animation begins faster
- [ ] ProfileReady name + subtitle: subtitle barely visible or not enough time to read. Give the name/subtitle more screen time
- [ ] HomePark screen: feels out of place — blank dark screen with a list of parks. Doesn't match the app's design language (morphing pill, etc.). Needs redesign to feel cohesive with the rest of onboarding

## Community
- [ ] Fog gradient: still starts too low — "Games" title is hard to read, needs to lift higher (will help both feed and rankings)
- [ ] Fog hard line: ~1/5 down the screen there's a visible hard edge where fog starts (goes from 0 to visible instantly). Needs to fade in gradually instead of a sharp 0-to-1 jump. Especially noticeable over solid colors. Fix without changing the overall ratio/fade that's already good — just soften the bottom edge into a gradual onset.

## Google Maps
- [x] Custom markers now visible (nodes showing)
- [x] Navigation/routing works and is fairly accurate
- [ ] Too many nodes — chaotic and overwhelming. Needs a cleaner, less cluttered approach
- [ ] Node shadows getting cut off by their container
- [ ] Route/trail should animate like Google Maps does (draw the path progressively) — nice-to-have, current static line is acceptable for now
- [ ] Filter colors wrong: food is yellow, shops also yellow (need distinct colors). Food nodes also appear when coasters filter is selected
- [ ] Coasters filter works correctly (only coasters show)
- [ ] Zoom-out level when selecting a POI doesn't zoom out enough — looks cramped, needs wider view
- [ ] Caleb is unsure how he feels about the map overall — may need a design rethink

## Profile
- [x] Tab pills: sliding segmented control (matches Logbook)
- [x] Container height: morphs with LinearTransition + content crossfade
- [x] Pro card: follows container with layout animation
- [ ] Scroll-to-top too aggressive: only scroll up when new tab content is shorter than current scroll position, not every time
- [ ] Rankings tab: add medal accent colors (gold/silver/bronze) on rank badges to visually differentiate
- [ ] Badges tab: current Ionicon circles are placeholder — needs illustrated/designed badges (Phase 2)
- [ ] Header: change "PROFILE" title to show username (@caleb) for a more personal feel
- [ ] Tab content is visually same (white card + list rows) — each tab should have distinct visual treatment (Phase 2)

## Import Pass / AddTicketFlow
- [x] Type selection cards: horizontal rectangles (Caleb likes this, keep it)
- [ ] Type selection cards: no animation on tap (needs animated selection like rest of app)
- [ ] Continue button: should be visible from the start, just disabled/gray until a type is selected, then becomes red/tappable
- [x] iOS push transition on Continue: working correctly
- [x] Barcode number required: working
- [x] Auto-detect / QR / Barcode picker: working
- [ ] REDESIGN: layout of the barcode entry screen + extra info screen (QR code, barcode scanning/uploading). Right info, wrong layout. Caleb wants to revisit design.

## Trivia
- [x] Flip-to-answer collapse delay: perfect, content waits long enough
- [ ] Next Question transition: sometimes misses — card shrinks but content below doesn't follow. Have to open and close again to fix. Needs reliable height sync on Next Question flip, not just answer flip.
