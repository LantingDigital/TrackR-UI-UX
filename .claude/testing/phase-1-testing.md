# Phase 1 Testing Checklist -- Log Flow

Phase 1 delivers the complete log-to-rate flow from the Home screen. Use this checklist to validate all functionality before marking Phase 1 as complete.

---

## Prerequisites

- App running on a physical iPhone (not simulator) for animation/haptic validation
- Rating criteria configured (run through CriteriaSetupScreen at least once)

---

## LogConfirmationCard

- [ ] After selecting a coaster in LogModal, LogConfirmationCard slides in
- [ ] Card displays coaster name correctly
- [ ] Card displays park name correctly
- [ ] Card shows hero image (if available for the coaster)
- [ ] Two buttons visible: "Quick Log" (outlined) and "Rate Now" (filled, accent color)
- [ ] Both buttons have spring press feedback on tap

---

## Quick Log Path

- [ ] Tapping "Quick Log" triggers `addQuickLog()` (verify via console or Activity tab)
- [ ] Success checkmark animation plays after Quick Log
- [ ] Haptic success feedback fires (`Haptics.notificationAsync(Success)`)
- [ ] Morph auto-closes after brief delay (~1 second)
- [ ] Morph closes smoothly back to origin position
- [ ] New log appears in Activity tab "Pending" section
- [ ] Log has `isPendingRating: true`

---

## Rate Now Path

- [ ] Tapping "Rate Now" calls `addQuickLog()` first (log is created)
- [ ] LogConfirmationCard slides out of view
- [ ] RatingModal opens with correct coaster name and park name
- [ ] Transition from card-out to modal-in is smooth (no flicker)

---

## RatingModal

- [ ] Hero header shows coaster image, name, and park
- [ ] Hero header collapses on scroll down
- [ ] Hero header expands on scroll back up
- [ ] All criteria sliders are present (matching user's criteria config)
- [ ] Sliders have correct range: 1.0 to 10.0
- [ ] Sliders snap to 0.5 increments
- [ ] Haptic selection feedback on each half-point snap
- [ ] Current value displayed next to each slider
- [ ] Weighted score updates in real time as sliders move
- [ ] Score calculation matches expected formula (see `features/rating.md`)
- [ ] Submit button is visible and tappable
- [ ] Tapping Submit calls `completeRating()` with correct data
- [ ] Success haptic feedback on submit
- [ ] Modal closes after submit
- [ ] Morph returns to origin position smoothly

---

## Post-Rating Verification

- [ ] After Rate Now + Submit, log appears in Activity tab as **rated** (not pending)
- [ ] Log has `isPendingRating: false`
- [ ] Log has `criteriaRatings` populated
- [ ] Log has `weightedScore` calculated correctly
- [ ] Pending badge count on Activity tab decreases

---

## Full End-to-End Flow

- [ ] Home -> tap Log -> search coaster -> select -> Quick Log -> Activity shows pending
- [ ] Home -> tap Log -> search coaster -> select -> Rate Now -> rate all criteria -> Submit -> Activity shows rated
- [ ] Activity -> tap pending log -> RatingModal opens -> rate -> Submit -> log now shows as rated
- [ ] Badge count on Activity tab updates reactively after each action

---

## Animation Quality (Physical Device Only)

- [ ] Log button morph opens at 60fps (no dropped frames)
- [ ] Bounce arc is visible and smooth on open
- [ ] Content fades in during landing phase (not instantly)
- [ ] Morph close is smooth with linear return path
- [ ] LogConfirmationCard slide-in animation is fluid
- [ ] RatingModal header collapse/expand is smooth on scroll
- [ ] Slider drag is responsive with no lag
- [ ] No visual glitches, z-index issues, or layout jumps

---

## Haptic Feedback

- [ ] Log button tap: light impact
- [ ] Coaster selected from search: medium impact
- [ ] Quick Log success: success notification
- [ ] Slider half-point snap: selection feedback
- [ ] Rating submit: success notification
- [ ] Modal close: light impact

---

## Edge Cases

- [ ] Dismissing LogModal without selecting a coaster (tap backdrop or swipe) closes cleanly
- [ ] Dismissing LogConfirmationCard without choosing an action closes cleanly
- [ ] Dismissing RatingModal mid-rating (back button or swipe) -- log remains pending
- [ ] Logging the same coaster twice creates two separate logs
- [ ] Re-ride count increments correctly for same-day logs of same coaster
- [ ] Works with default criteria (5 criteria)
- [ ] Works if user has modified criteria weights
