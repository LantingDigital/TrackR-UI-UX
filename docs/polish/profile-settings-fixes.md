# Profile & Settings — Bug & Polish Tracker

All known issues from the Profile screen and all Settings sub-screens. Organized by area.

---

## Modal Interaction Rule (THREE-TIER SYSTEM)

This walkthrough established a clear, project-wide hierarchy for modal interactions. This is NOT binary (bottom sheet vs modal). It is three tiers:

| Tier | Type | Use For | Example |
|------|------|---------|---------|
| 1 | **Bottom Sheet** | Options, choices, most interactions | Units picker, Rider Type, Forgot Password, profile pic picker |
| 2 | **Custom On-Brand Modal** (blurred background) | Destructive / attention-requiring actions | Delete Account (type "DELETE" to confirm), Reset Onboarding |
| 3 | **iOS Native Alert Modal** | **NEVER** | N/A — banned entirely |

**Rule:** iOS native `Alert.alert()` modals are NEVER acceptable anywhere in the app. If something currently uses one, it must be replaced with either a bottom sheet (Tier 1) or a custom on-brand modal (Tier 2) depending on the action's severity.

---

## Profile Screen

### Layout / Design

- [ ] **Profile section vertical space.** The profile area takes up too much vertical space without using horizontal space well. Consider redesigning toward an Instagram-style layout (avatar + stats row + bio compact). Needs design suggestions from agent.
- [ ] **Rides/Rankings data must be dynamic.** Currently placeholder — needs to reflect actual user data once backend is connected.

### Tab Navigation Bar

- [ ] **PRESERVE the tab animation.** The tab bar animation was carefully built (1.5 hours of work). Do not change or regress the animation behavior. Any profile redesign must keep the existing tab navigation and its animations intact.

### Badges Section

- [ ] **Badge icons are unclear.** No way to tell what each badge icon means. Needs labels, tooltips, or a detail view.
- [ ] **"+7" indicator is undefined.** What does the +7 represent? Needs definition and should link to a full badge list.
- [ ] **Progress bar lacks context.** What is the progress bar tracking? Needs a label or explanation.
- [ ] **Cannot view individual badge items.** Tapping a badge should open a detail view or bottom sheet explaining the badge, how to earn it, and current progress.
- [ ] **Badges system needs full definition.** Before polish, decide: what badges exist, how they're earned, what tiers/levels are there, what do the icons represent.

### TrackR Pro Upgrade Card

- [ ] **Red outline is approved.** Keep the red/coral accent border on the Pro upgrade card.
- [ ] **Pill button placement needs work.** The CTA pill button position within the card doesn't feel right. Reposition or rethink layout.
- [ ] **Card/box design needs improvement.** The overall container design for the Pro upgrade CTA doesn't feel on-brand. Redesign the card layout.
- [ ] **Pro upgrade flow not accessible.** Tapping the Pro card doesn't lead anywhere yet. Wire up to the Pro upgrade flow when backend supports it.

---

## Settings — General

### Profile Picture Picker

- [ ] **Must be a bottom sheet, NOT iOS modal.** Currently presents as an iOS native picker. Replace with a custom bottom sheet (camera, photo library, remove options).

### Top Card (Profile Pic + Username + Rider Type)

- [ ] **Needs scroll-based crossfade treatment.** When the user scrolls down, the top profile card should crossfade using the approved scroll-based fog pattern (opacity 0 at rest, fades in over ~80px of scroll). Same pattern used on ProfileScreen hero content.

### Display Name Change

- [ ] **Must be a bottom sheet, NOT iOS modal.** Currently opens an iOS native text input modal. Replace with a custom bottom sheet containing a styled text input.

### Username Change

- [ ] **Must be a bottom sheet, NOT iOS modal.** Same as display name — replace iOS modal with custom bottom sheet.

### Email

- [ ] **"Not connected" must be dynamic.** Currently always shows "not connected." Once backend auth is wired up, this should reflect the actual connected email address or show "not connected" only when truly not linked.

### Verification Status

- [ ] **Backend-dependent — fine for now.** Will need to show actual verification state once auth backend is connected. No immediate polish needed.

### Account Recovery Text

- [ ] **Must be dynamically accurate.** Recovery info text should reflect actual account state (what recovery methods are set up, what's missing). Currently static placeholder.

---

## Settings — Password

### Layout

- [ ] **Center content vertically.** All password-related content is bunched at the top with the rest of the page empty. Center the content block vertically on the screen so it doesn't feel top-heavy.

### Update Password Button (Disabled State)

- [ ] **Disabled button too invisible.** The greyed-out pill button is barely visible — hard to even recognize it as a button. Increase opacity or adjust styling so the disabled state is clearly a button (just not active). Users should see the button shape and know it will become active when they fill in the fields.
- [ ] **Same fix needed for email disabled state.** Any disabled action buttons across settings should follow this same principle — visually recognizable as buttons even when disabled.

### Forgot Password

- [ ] **Must open a bottom sheet, NOT iOS modal.** Replace the iOS native alert with a custom bottom sheet for the forgot password flow.
- [ ] **Center the "Forgot Password" link.** Currently not centered on the screen. Center it horizontally.

### Backend Connection Text

- [ ] **"Password Management not yet connected" text.** This placeholder text should disappear automatically when the backend auth is connected. Guard it with a backend connection check.

---

## Settings — Toggles & Switches

### Glass Effect iOS Switches

- [ ] **Animation must always work.** The glass-effect iOS toggle switches sometimes fail to animate (they snap instead of smoothly transitioning). Debug and fix so the toggle animation fires 100% of the time, every time.

### Haptics Toggle (MASTER SWITCH)

- [ ] **Haptics is the MASTER SWITCH for the entire app.** When haptics is toggled OFF, there must be ZERO haptic feedback anywhere in the entire app — including sliders, switches, buttons, press feedback, and any other interaction. When ON, all haptics are active.
- [ ] **Must apply INSTANTLY.** No delay, no restart required. The moment the toggle flips, haptic behavior changes app-wide immediately.
- [ ] **Implementation:** This likely needs a global context/provider that every haptic-triggering component reads from. A simple check before every `Haptics.impact()` / `Haptics.selection()` call.

### Notifications

- [ ] **Should be its own SCREEN, not just a toggle.** Notifications needs to push to a dedicated NotificationPreferences screen with per-type toggle controls:
  - Reminders (ride reminders, park visit reminders)
  - Order tracking (merch, card orders)
  - Social (friend requests, comments, community activity)
  - Marketing / announcements
  - Other relevant categories as features ship
- [ ] Notification preferences screen should use the same glass toggle switches.

### Units (Imperial / Metric)

- [ ] **Bottom sheet is good and clean.** Approved. Minor polish: ensure the units bottom sheet styling is consistent with other bottom sheets throughout settings. Slightly adjust if needed for visual consistency.

### Rating Criteria

- [ ] **APPROVED — keep as-is.** Sliders work well, on/off switches work. Looks good. Do not change.
- [ ] **Ensure changes propagate everywhere.** When rating criteria toggles or weights change, the changes must be reflected in every rating flow, rating display, and ranking calculation throughout the app. Verify propagation.

### Unsaved Changes Alert

- [ ] **Must be a bottom sheet, NOT iOS modal.** If the user tries to leave settings with unsaved changes, the alert must be a custom bottom sheet, not an iOS native alert.

### Rider Type

- [ ] **Bottom sheet is clean.** Approved. Keep as-is.

---

## Settings — Social

### Friends List

- [ ] **"Coming soon" must be a bottom sheet, NOT iOS modal.** Replace the iOS native alert with a bottom sheet.
- [ ] **Consider moving friend management to Profile.** Friends list might be better placed on the Profile screen rather than buried in Settings. Settings should just have the toggle for who can see your profile. Actual friend management (list, add, remove, requests) belongs closer to the social surface — the Profile screen.

### Visibility (Everyone / Friends Only / Just Me)

- [ ] **Options are good.** The three visibility tiers are the right options. Keep them.
- [ ] **Must be enforced dynamically.** Once backend is connected, visibility settings must actually control who can see the user's profile, rides, and activity. Not just a stored preference — must be enforced server-side.

### Bottom Sheet Style in Settings

- [ ] **Settings bottom sheets can be slightly different from main app bottom sheets.** Settings is a utility context, not a core interaction surface. The bottom sheets should still be recognizable as TrackR, but minor styling differences (simpler, more functional) are acceptable. Don't over-design settings bottom sheets to match the full polish of main app sheets.

---

## Settings — Blocked Users

### Fog Effect

- [ ] **Wrong fog style.** Blocked Users screen uses a different fog effect than the rest of the app. Needs the standard GlassHeader fog (content-aware, translucent, only affects content as it scrolls behind the header). See design-taste.md fog rules.

### Top Card

- [ ] **May need scroll-based crossfade treatment.** If there's a top card/header area, it should use the same scroll-based fog crossfade pattern as other screens with hero content.

### Empty State

- [ ] **No blocked users to test with.** Build an empty state that looks intentional (not broken). Will need test data to verify the populated state once backend is connected.

---

## Settings — Data

### Clear Cache Bottom Sheet

- [ ] **PERFECT — do not change.** This is the gold standard example of an on-brand bottom sheet. Reference this when building other bottom sheets. Keep as-is.

### Export Ride Log Screen

- [ ] **Screen looks good overall.** Approved layout and design.
- [ ] **Date range row size inconsistency.** When a date range is selected, the row height increases (to accommodate the checkmark). Either: (A) animate the size change smoothly, OR (B) keep all rows the same height regardless of selection state. Pick one approach — no instant size jumps.
- [ ] **Confirmation modal must be a bottom sheet.** The export confirmation currently uses a modal — replace with a bottom sheet.

### Reset Onboarding vs Sign Out

- [ ] **Sign Out = back to LOGIN screen.** User has an account, they're just signing out. Returns to the login/welcome screen.
- [ ] **Reset Onboarding = back to START of onboarding.** This resets the onboarding completion flag and takes the user through the full onboarding flow from step 1 again (as if they're a new user). These are two distinct actions — do not conflate them.

---

## Settings — Destructive Actions

### Delete Account Modal

- [ ] **APPROVED as a custom on-brand modal.** This is the EXCEPTION to the "everything is a bottom sheet" pattern. The Delete Account modal uses a custom design with blurred background and requires typing "DELETE" to confirm. This is intentionally a modal, not a bottom sheet, because it demands full attention.
- [ ] **Keyboard animation on "DELETE" typing.** When the text input is focused and the keyboard opens, the modal must ANIMATE upward smoothly (not instantly jump). Same when the keyboard dismisses — modal should animate back down. Use keyboard height listeners with spring/timing animation.

### New Rule Established

- [ ] **Custom on-brand modals (blurred background) are OK for destructive/attention-requiring actions.** This applies to: Delete Account, Reset Onboarding confirmation, and any future action where the user must stop and pay attention. These modals should have: blurred background, custom styled content, clear destructive action styling (red button, type-to-confirm, etc.).

---

## Settings — Legal / Info

### Terms of Service

- [ ] **Needs to look more on-brand.** Currently reads like a text dump. Needs better typography, section headers, and visual hierarchy to feel like part of a premium app (not a legal PDF).
- [ ] **"Last Updated" text needs crossfade treatment.** The "Last Updated" date text should use the scroll-based crossfade pattern so it fades smoothly as the user scrolls.

### Privacy Policy

- [ ] **Same issues as Terms of Service.** Needs the same on-brand styling treatment and "Last Updated" crossfade.

### Credits Page

- [ ] **Hero card with heart doesn't look great.** The heart icon/card at the top of the credits page needs a redesign. Current version doesn't feel on-brand.
- [ ] **Credits list presentation.** The list of credits/attributions is fine content-wise but needs better visual presentation. Style it to match the app's premium feel.
- [ ] **Wrong fog header.** Same issue as Blocked Users — using the wrong fog effect. Needs the standard GlassHeader fog (content-aware, translucent).
- [ ] **"Designed and developed by Caleb Lanting" at bottom — KEEP.** This is approved. Do not remove or change.

### Rate TrackR

- [ ] **Needs to be functional.** Should trigger the App Store review prompt (SKStoreReviewController / expo-store-review). Make the prompt interaction feel on-brand if possible (pre-prompt bottom sheet asking "Enjoying TrackR?" before firing the native review dialog).

### App Version

- [ ] **Fine as-is.** Informational only, no changes needed.

---

## App-Wide Issues Identified in This Walkthrough

These issues surfaced during the Profile/Settings walkthrough but apply globally:

- [ ] **All iOS native Alert modals must be replaced.** Audit every `Alert.alert()` call in the entire app and replace with bottom sheets or custom on-brand modals per the three-tier system above.
- [ ] **Disabled button visibility standard.** All disabled buttons across the app should be visually recognizable as buttons (not invisible). Establish a consistent disabled state: same shape/size, reduced but visible opacity (try 0.4-0.5 instead of near-zero).
- [ ] **Haptics master switch infrastructure.** Build a global HapticsProvider that wraps the app and exposes `triggerHaptic()` which checks the master toggle before firing. Every haptic call must go through this provider.
- [ ] **Bottom sheet vs modal decision tree.** Document the three-tier system in the design system so all future development follows it automatically.
