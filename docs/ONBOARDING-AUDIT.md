# Onboarding Flow Audit

**Date:** March 9, 2026

## Current State

3-step horizontal carousel in `src/features/onboarding/`:

1. **WelcomeStep** -- Hero intro, "Get Started" CTA, auth bottom sheet
2. **RiderTypeStep** -- 2x2 card grid (Thrills, Data, Planner, Newbie)
3. **CelebrationStep** -- Auto-advancing badge + decorative rings

**What works well:** Visual polish, animations, spring physics, staggered entrances, haptics, safe area handling, AsyncStorage persistence.

## Critical Issues

1. **Auth is fake** -- Apple/Google/email buttons all call `onContinue()` unconditionally. No Firebase Auth integration. No account creation.
2. **No home park selection** -- `homeParkName` exists in settingsStore but no onboarding UI
3. **No notification permissions** -- `notificationsEnabled` flag exists, no permission request
4. **No profile setup** -- displayName/username/avatar defaults used, never set
5. **No guest vs enthusiast mode** -- blueprint calls for this
6. **No feature tutorial** -- users land on Home with no guidance
7. **Progress dots broken** -- shows 2 steps despite 3 screens

## Production Onboarding Steps (Recommended)

1. Welcome + hero (DONE)
2. Account creation -- Firebase Auth (email/password, Google, Apple) -- **MISSING, CRITICAL**
3. Guest vs Enthusiast mode selection -- **MISSING, CRITICAL**
4. Rider type selection (DONE)
5. Home park selection -- **MISSING, CRITICAL**
6. Profile setup (name, avatar) -- **MISSING**
7. Notification permissions -- **MISSING**
8. Feature highlights carousel -- **MISSING**
9. Celebration (DONE)

## Recommended File Additions

```
src/features/onboarding/components/
  AuthStep.tsx
  ModeSelectionStep.tsx
  HomeParkSelectionStep.tsx
  ProfileSetupStep.tsx
  NotificationsPermissionStep.tsx
  FeatureHighlightsStep.tsx
  OnboardingProgressBar.tsx (replace dots for longer flow)
```

## Effort Estimate

| Step | Hours |
|------|-------|
| Auth integration (Firebase) | 4-6 |
| Mode selection UI | 2 |
| Home park selection | 3-4 |
| Profile setup | 2-3 |
| Notification permissions | 1-2 |
| Feature highlights | 3-4 |
| Testing + polish | 3-4 |
| **Total** | **~18-25** |

## Ship Strategy

**Phase A (ship-blocking):** Auth + Mode Selection + Home Park
**Phase B (polish):** Profile setup, notifications, feature highlights
**Phase C (post-launch):** A/B testing, personalization by rider type

## Blockers

- Firebase Auth not integrated (buttons are UI-only)
- Park data source needed for home park selection (RCDB integration is Phase 3)
- No feature highlight designs/assets exist yet
- Home/other screens need to respect guest vs enthusiast mode
