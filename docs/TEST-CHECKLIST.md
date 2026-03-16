# Homepage Changes -- Testing Checklist

Use this on your iPhone with the dev build. Work through each section top to bottom.

---

## 1. Scroll-Triggered Entrance Animations

These sections should animate in as you scroll to them, NOT all load at once on app start.

### Setup
Kill the app and relaunch fresh so all sections start in their pre-animated state.

### TrendingCoasters (already animates on mount -- verify it still works)
- [ ] Open app, TrendingCoasters section animates in immediately on load
- [ ] Animation is smooth, no jello/bounce (should feel weighted and decisive)
- [ ] Cards slide/fade in with staggered timing (not all at once)

### FeaturedPark
- [ ] Section is NOT visible/animated when the app first loads (it's below the fold)
- [ ] Scroll down until FeaturedPark comes into view -- it animates in smoothly
- [ ] Animation triggers when roughly 20-30% of the section enters the viewport (not too early, not too late)
- [ ] Scroll back up past it, then scroll down again -- animation does NOT replay (fires once only)

### Games
- [ ] Same as FeaturedPark: invisible until scrolled to, then animates in
- [ ] Game cards stagger in if there are multiple
- [ ] No jello effect on the entrance

### DidYouKnow
- [ ] Animates in on scroll, fires once
- [ ] Card fades/slides in smoothly

### NearbyParks
- [ ] Animates in on scroll, fires once
- [ ] Park cards stagger if there are multiple

### FriendActivity
- [ ] Animates in on scroll, fires once
- [ ] Individual activity rows stagger in (each row slightly after the previous)

### General Animation Checks
- [ ] Scroll slowly through the entire feed -- every section animates in as it appears
- [ ] Scroll FAST through the entire feed -- sections still animate, no visual glitches or missing sections
- [ ] Switch to another tab (Parks, etc.) and come back to Home -- sections should still be visible (don't re-animate on tab return)
- [ ] No dropped frames or jank during any animation (watch for stutters at 60fps)
- [ ] No section appears as a blank/empty space before animating (should be invisible, not take up blank space, OR fade from 0 opacity)

### Edge Cases
- [ ] Pull-to-refresh (if implemented) -- do animations replay after refresh? (decide: should they or shouldn't they?)
- [ ] Rotate device (if supported) -- animations don't break or replay
- [ ] Scroll to bottom, kill app, reopen -- all animations fire fresh

---

## 2. Search Modal -- NanoBanana Card Art

### Setup
Tap the search bar on the Home screen to open the search modal.

### Card Art Display
- [ ] "Nearby Rides" carousel shows NanoBanana card art (illustrated style), NOT real coaster photos
- [ ] Card art images load without visible delay (cached properly)
- [ ] Card art aspect ratio is correct -- no stretching or cropping artifacts
- [ ] Card art matches the correct coaster (Steel Vengeance art on Steel Vengeance, etc.)

### Search Results
- [ ] Type a coaster name -- search result thumbnails use NanoBanana card art, not real photos
- [ ] Coasters that have card art show the art
- [ ] Coasters that DON'T have card art yet -- what shows? (placeholder? blank? verify it's not broken)

### Visual Quality
- [ ] Card art looks crisp on the iPhone display (not blurry/pixelated)
- [ ] Card art renders well at the small thumbnail size in search results
- [ ] Colors don't clash with the search modal's light mode background

### Edge Cases
- [ ] Scroll through all results in the carousel -- no missing images or flash of wrong image
- [ ] Open search, close it, open it again -- images still load correctly (no stale state)
- [ ] Search for a ride, tap it, go back, search again -- no image issues

---

## 3. Friend Activity -- Differentiated Tap Targets

### Setup
Scroll to the Friend Activity section on the home feed.

### Ride Name Tap (should open CoasterSheet)
- [ ] Tap directly on the **ride name text** (e.g., "Steel Vengeance") -- CoasterSheet opens
- [ ] CoasterSheet shows the correct coaster details for the one you tapped
- [ ] CoasterSheet dismisses cleanly (swipe down or tap close)
- [ ] After dismissing CoasterSheet, you're back on the home feed at the same scroll position

### Everything Else Tap (should navigate to Community post)
- [ ] Tap on the **username** -- navigates to that friend's post in Community tab
- [ ] Tap on the **avatar/profile pic** -- navigates to Community post (same behavior as username)
- [ ] Tap on the **post body text** (the "rode" / "rated" text) -- navigates to Community post
- [ ] Tap on the **park name** -- navigates to Community post
- [ ] Tap on the **timestamp** -- navigates to Community post
- [ ] Tap on the **star rating** (if visible) -- navigates to Community post

### Tap Target Accuracy
- [ ] Tap the ride name on the first activity row -- CoasterSheet opens (not Community)
- [ ] Tap right next to the ride name (but on surrounding text) -- Community post opens (not CoasterSheet)
- [ ] The ride name tap target is big enough to hit reliably with a thumb (not a tiny text link)
- [ ] No "dead zones" where tapping does nothing

### Haptics
- [ ] Tapping ride name gives haptic feedback
- [ ] Tapping other areas gives haptic feedback
- [ ] The haptic feels the same for both tap types (or intentionally different -- verify either way)

### Edge Cases
- [ ] Tap ride name while the section is still animating in -- does it register correctly?
- [ ] Rapid-tap the ride name multiple times -- only one CoasterSheet opens (no double-open)
- [ ] Tap a ride name, dismiss the sheet, immediately tap a different ride name -- correct sheet opens
- [ ] Activity items with long ride names (text wrapping) -- tap target still works on the wrapped text
- [ ] Activity items without a rating -- tap behavior still correct on all targets

---

## 4. Cross-Feature Checks

- [ ] All three features work together without conflicts (animations + search + tap targets)
- [ ] No performance regression -- feed scrolls at 60fps with all changes active
- [ ] Memory: scroll up and down the feed 10+ times -- no growing lag or memory warnings
- [ ] Tab switching (Home -> Parks -> Home) -- everything still works correctly
- [ ] App backgrounding and foregrounding -- no visual glitches on return

---

## Notes
_Use this space to jot down bugs or issues as you test:_

-
-
-
