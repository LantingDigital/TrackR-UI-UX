# Wallet (AddTicketFlow) — Polish Fixes

All issues captured from walkthrough of the AddTicketFlow (add pass to wallet).

---

## Pass Type Selection (Screen 1)

- [ ] **No animation on type selection cards** — tapping instantly changes color. Needs smooth animated color transition (interpolateColor or withTiming opacity, 200ms minimum). See `.claude/rules/animation-defaults.md`.
- [ ] **Long-press blink glitch** — pressing down turns the color instantly, then goes white during depress, then back to color. Needs consistent press feedback matching the app's `useSpringPress` pattern (scale down on press, spring back on release).
- [ ] **"Choose how you want to import your pass" text is within the fog boundary** — needs crossfade treatment. This screen is not scrollable, so the text should never be obscured by fog.

---

## Import Method Selection

- [ ] **Redesign layout** — replace current layout with two main vertical rectangle cards side by side: "Scan with Camera" and "Upload from Photos." Underneath, a small tertiary text button for "Enter manually" (less prominent since it's the least-used option).
- [ ] **"Enter manually" is too prominent** — current design gives it equal visual weight to scan/upload. It should be clearly de-emphasized as a fallback option.

---

## QR Code Scanner (Camera)

- [ ] **Viewfinder is not centered** — offset up and asymmetric on the phone. Must be perfectly centered on screen.
- [ ] **Red corner brackets look wrong** — the QR outline is already squared. The red brackets feel redundant and clash with the pointed corners. Remove or redesign.
- [ ] **Remove the up-and-down scanner line animation** — too gimmicky for TrackR's premium aesthetic.
- [ ] ~~Flash toggle~~ — KEEP. Works fine.
- [ ] **Library button is redundant** — user should have selected "Upload from Photos" on the previous screen if they wanted to pick from library. Consider removing entirely or making it very subtle/secondary.

---

## Page Transitions (Flow-Wide)

- [ ] **Transitions between screens stutter/lag** — instead of smooth push-over animation, transitions feel choppy. Every page-to-page transition in this flow needs smooth, consistent slide transitions matching React Navigation's native stack push behavior (new screen slides from right, old screen slides slightly left with dim overlay).

---

## Manual Entry — Barcode (Screen 1 of Manual Flow)

- [ ] **Remove numbered circle step indicator** — the numbered circle at top of page doesn't match any other screen in the app. Remove it entirely.
- [ ] **Content is too vertically centered** — too much empty space at the bottom. Content should sit higher with natural spacing.
- [ ] **Number "1" is inside the fog boundary** — needs crossfade treatment or fog adjustment so the step indicator (if kept) isn't obscured.
- [ ] **No validation before proceeding** — allows navigating to next screen without entering a barcode number. Validation should block progression and show an inline error BEFORE the "Next" button works, not at the end when trying to save the pass.

---

## Park Selection (Screen 2)

- [ ] ~~Layout~~ — APPROVED. Disney, Universal, Six Flags, SeaWorld chain auto-detection is nice.
- [ ] **Fog effect issue** — same old-style fog problems as the rest of the flow (see "Fog Effect" section below).
- [ ] **Consider FAB for "Next" button** — instead of an always-at-bottom pill, consider a floating action button. NOTE: This would be an APP-WIDE change for all selection+submit screens. **Decision pending — do not implement without explicit approval.**

---

## Pass Details (Screen 3)

- [ ] **List style doesn't match the app** — too texty, old-fashioned, not card-based enough. Consider square cards or a more visual layout that matches TrackR's design language.
- [ ] **Entire flow feels "too texty and not very UI friendly"** — needs more visual, card-based design throughout. Less text-heavy forms, more interactive card-style inputs.

---

## Fog Effect (Across Entire Flow)

- [ ] **Old fog style throughout AddTicketFlow** — fog headers use the OLD fog style with a hard cutoff line. Must be updated to the new standard GlassHeader fog (smooth gradient, no hard line). Reference approved GlassHeader values in `.claude/rules/design-taste.md` — 0.88 opacity header zone, 60px fade distance, smooth S-curve to transparent.

---

## Annual vs Season Pass Clarity

- [ ] **Clarify annual vs season pass difference** — annual pass = calendar year (Jan–Dec). Season pass = purchase date + 12 months. Users from different park chains use these terms differently (e.g., Disney "annual" vs Six Flags "season"). Add explanatory text or tooltip so users pick the right type.

---

## Review Pass (Final Screen)

- [ ] ~~Card preview concept~~ — APPROVED. The pass card preview it generates looks good.
- [ ] **Content is not centered** — layout alignment is off. Center the card preview and details properly.
- [ ] **No barcode/QR preview** — doesn't show what the gate scan will look like if no barcode was entered. Should display a placeholder or indicate that no scannable code exists.
- [ ] **"Save Pass" haptic error when no barcode** — correct behavior (blocking save without barcode), but the error should trigger BEFORE this screen at the barcode entry step. By the time the user reaches Review, all required data should already be validated.
- [ ] **Validation errors are unclear** — "Save Pass" fails without telling the user WHY on this screen. If validation must happen here, show specific error messages (e.g., "Barcode is required" or "Select a park").

---

## Manual vs Scan/Upload Parity

- [ ] **Different-looking screens between manual and scan/upload flows** — the manual entry flow and the scan/upload flow result in different layouts and field presentations. They should be IDENTICAL — same layout, same fields, same experience regardless of how the data was entered. The manual entry flow currently looks better; scan/upload should match it.

---

# Merch Store — Polish Fixes

All issues captured from walkthrough of the merch store flow (store screen, card detail, pack builder, cart, checkout).

---

## Merch Store Screen

- [ ] **Fog effect is wrong** — needs to match the new GlassHeader standard (see `.claude/rules/design-taste.md` Fog Rules section). Verify 0.88 opacity header zone, 60px fade, smooth S-curve, clean `#F7F7F7` base.
- [ ] **Hero card needs crossfade treatment** — "Physical Cards Collect Your Eye" hero content spawns too high and is already covered by fog. Apply scroll-based fog crossfade (fog starts at opacity 0, fades in over first ~80px of scroll) so hero content is fully visible at rest.
- [ ] **Search bar placement isn't ideal** — current position doesn't feel right. Agent should propose a better location (e.g., sticky below header, inside hero area, or collapsible on scroll like parks screen).
- [x] **New Arrivals card art looks great** — APPROVED. Keep the art style as-is.
- [ ] **Build Your Pack card is buried too low** — it's a main feature and should be closer to the top of the screen, not hidden below carousels. Move it above or immediately after the first carousel.
- [ ] **Build Your Pack card shape doesn't fit** — the card's shape/format feels out of place in the environment. Needs reformatting to match the screen's card layout language.
- [ ] **Browse All only shows ~20 cards** — hundreds of cards exist but only ~20 are displayed. Add pagination or a "Load More" button so users can access the full catalog.
- [ ] **Excessive blank space at bottom** — too much empty space below content (app-wide issue that manifests here). Reduce or eliminate dead space below the last content section.

---

## Card Detail Screen

- [ ] **Fog effect is wrong** — fix to match the GlassHeader standard (0.88 opacity, 60px fade, S-curve, `#F7F7F7` base). See `.claude/rules/design-taste.md`.
- [ ] **Buy Now and Add to Cart buttons on solid white** — currently sitting on a flat white background. Replace with floating action buttons (FABs) that float above content, matching the approved FAB pattern from the cart screen.
- [ ] **Add gold foil border toggle/preview** — let users toggle a gold border preview on the card so they can see what it looks like before purchasing.
- [ ] **Gold border preview should auto-scroll to top** — when the gold border toggle is activated, the screen should auto-scroll to the top of the card so the user sees the full gold-bordered card.
- [ ] **Add gold border Pro text** — near the gold border toggle, add text: "Gold border is free for TrackR Pro members."
- [ ] **Excessive blank space below total cost** — too much dead space at the bottom of the screen below the price/total area. Tighten up.

---

## Custom Pack Builder

- [ ] **Text bleeding out of containers** — text overflows on the 5-pack/10-pack/20-pack selector cards. Fix text sizing, padding, or container dimensions so text stays within bounds.
- [ ] **Selected count indicator overlapping pack card** — the count badge/indicator visually collides with the pack card element. Reposition so they don't overlap.
- [ ] **Fog effect is decent** — noted as close to correct on this screen, but verify it matches the GlassHeader standard exactly (0.88 opacity, 60px fade, S-curve).
- [ ] **Pack size selector should collapse on scroll** — the 5/10/20 pack size selector should collapse upward when the user scrolls down (similar to parks screen header collapse behavior). It should stay sticky while scrolling through cards and reappear on scroll back up.
- [ ] **Total on bottom left doesn't look good** — the price total placement in the bottom-left feels awkward. Needs repositioning or integration into the FAB area.
- [ ] **"Select 10 More" pill should be a full-width FAB** — replace the small pill button with a full-width floating action button at the bottom of the screen.
- [ ] **Money/total positioning** — total cost can be placed below the FAB or integrated into the FAB area differently. Agent should propose the best layout.
- [ ] **Only showing ~9 cards in viewing window** — the card grid/list only shows about 9 cards at a time. Optimize the layout to show more cards in the visible area without sacrificing card readability.

---

## Cart Screen

- [ ] **Fog effect looks close but verify** — fog appears mostly correct on this screen, but verify it matches the GlassHeader standard exactly (0.88 opacity, 60px fade, S-curve, `#F7F7F7` base).
- [x] **Floating action button is a great example** — APPROVED pattern. The FAB on the cart screen is the reference implementation. Use this as the model for FABs on other merch screens (card detail, pack builder, checkout).
- [ ] **Add bottom fog effect** — add a fog gradient at the bottom of the screen so the FAB floats cleanly without content overlapping or visually colliding underneath it.
- [ ] **Empty cart with one item has too much blank space** — when only one item is in the cart, there's excessive dead space. Agent should propose a solution (e.g., centered layout, suggested items section, "Continue Shopping" prompt).
- [ ] **"Buy Now" auto-add-to-cart conflict** — "Buy Now" on the card detail screen automatically adds the item to the cart. Going back and adding another item shows 2 in cart. Fix: either "Buy Now" should NOT auto-add to cart (just go straight to checkout), OR going back from checkout should prompt "Keep in cart?" so the user can remove the item if they were just previewing.

---

## Checkout Screen

- [ ] **Fog effect needs verification** — verify fog matches the GlassHeader standard (0.88 opacity, 60px fade, S-curve, `#F7F7F7` base).
- [ ] **Shipping address starts too low** — the shipping address section is positioned too far down the page. Move it up and apply the scroll-based crossfade fog treatment so content is visible at rest but fog kicks in on scroll.
- [x] **Payment section is fine** — APPROVED. No changes needed.
- [ ] **Place Order button is on solid white and half off-screen** — CRITICAL: the Place Order button sits on a flat white background AND is partially cut off at the bottom of the screen. Must be fully visible and not on a plain white surface. Convert to a floating action button or ensure it's always in view.
- [ ] **Add Apple Pay button** — alongside the Place Order button, add a black "Buy with Apple Pay" button with the Apple Pay logo. Two side-by-side buttons: one for standard card payment, one for Apple Pay.
- [ ] **No order confirmation screen** — after placing an order, there's no confirmation screen. `OrderConfirmationScreen` may already exist in the codebase but isn't being navigated to. Wire it up or build one if it doesn't exist.
