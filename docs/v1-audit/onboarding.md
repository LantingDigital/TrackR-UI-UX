# Onboarding -- v1 Backend Audit

## Screens / Components Covered

- `src/features/onboarding/OnboardingScreen.tsx` (173 lines)
- `src/features/onboarding/screens/WelcomeScreen.tsx` (287 lines)
- `src/features/onboarding/screens/ShowcaseScreen.tsx` (855 lines)
- `src/features/onboarding/screens/HomeParkScreen.tsx` (395 lines)
- `src/features/onboarding/screens/AuthScreen.tsx` (303 lines)
- `src/features/onboarding/screens/ProfileReadyScreen.tsx` (582 lines)
- `src/features/onboarding/screens/RiderTypeScreen.tsx` (357 lines) -- NOT in active flow
- `src/stores/settingsStore.ts` (273 lines)

## Current Data Sources

| Data | Source | Persistence |
|------|--------|-------------|
| Onboarding completion flag | settingsStore `hasCompletedOnboarding` (AsyncStorage) | Local only |
| Selected home park | settingsStore `homeParkName` (AsyncStorage) | Local only |
| Rider type | settingsStore `riderType` (AsyncStorage) | Local only |
| Display name | settingsStore `displayName` (AsyncStorage) | Local only |
| Park list | Hardcoded `POPULAR_PARKS` array (HomeParkScreen L39-95) | None |
| Auth state | None -- all auth buttons are stubs | None |

## Active Onboarding Flow

Steps in OnboardingScreen (L17-27): `welcome` -> `showcase` -> `homePark` -> `auth` -> `profileReady`

Note: `RiderTypeScreen` exists at `src/features/onboarding/screens/RiderTypeScreen.tsx` but is NOT wired into the flow. OnboardingScreen step index 2 renders HomeParkScreen, not RiderTypeScreen.

## Interaction Inventory

| # | Element | Location | Current Behavior | v1 Target |
|---|---------|----------|-----------------|-----------|
| 1 | "Get Started" CTA | WelcomeScreen L163 | Calls `onContinue` (advances step) | No change |
| 2 | Showcase Skip button | ShowcaseScreen L527-533 | Calls `onContinue` (skips to next step) | No change |
| 3 | Showcase Next/Continue button | ShowcaseScreen L566-584 | Advances carousel or calls `onContinue` | No change |
| 4 | Showcase progress dots | ShowcaseScreen L536-548 | Tappable, navigates to slide | No change |
| 5 | Park search input | HomeParkScreen L230-238 | Filters park FlatList locally | No change |
| 6 | Park item press | HomeParkScreen L171-180 | Selects park (animated highlight) | No change |
| 7 | HomePark Continue button | HomeParkScreen L258-269 | Calls `onContinue` with selected park | No change |
| 8 | "Skip for now" link | HomeParkScreen L272-274 | Calls `onContinue` with no park | No change |
| 9 | Continue with Apple button | AuthScreen L105-109 | Calls `handleAuth('apple')` -> `onComplete()` (STUB) | Firebase Auth Apple Sign-In |
| 10 | Continue with Google button | AuthScreen L112-117 | Calls `handleAuth('google')` -> `onComplete()` (STUB) | Firebase Auth Google Sign-In |
| 11 | Sign up with email button | AuthScreen L128-133 | Calls `handleAuth('email')` -> `onComplete()` (STUB) | Navigate to email signup form -> `createUserWithEmailAndPassword` |
| 12 | "Continue without account" link | AuthScreen L140-142 | Calls `onComplete()` directly | Keep as-is (anonymous/local-only mode) |
| 13 | Terms of Service link | AuthScreen L146-147 | Not wired to navigation | Navigate to TermsScreen |
| 14 | Privacy Policy link | AuthScreen L149-150 | Not wired to navigation | Navigate to PrivacyPolicyScreen |
| 15 | ProfileReady auto-advance | ProfileReadyScreen L560-572 | 6.6s animation -> `onComplete()` | No change (visual only) |

## Auth Implementation Detail (AuthScreen)

`handleAuth` (L91-100) currently does nothing except call `onComplete()`. For v1:

- **Apple Sign-In**: Use `expo-apple-authentication` + Firebase `signInWithCredential(appleProvider)`
- **Google Sign-In**: Use `@react-native-google-signin/google-signin` + Firebase `signInWithCredential(googleProvider)`
- **Email Sign-Up**: Navigate to a new email/password form screen, then `createUserWithEmailAndPassword`
- **Skip (no account)**: Continue with local-only mode. Data stays in AsyncStorage. Prompt to create account later in settings.
- On successful auth: Cloud Function `generateProfileReady` creates user doc with defaults + onboarding selections (homePark, riderType)

## Firestore Collections Required

| Collection | Doc Structure | Read/Write |
|------------|--------------|------------|
| `users/{uid}` | Created on first auth with: `{ displayName, homeParkName, riderType, createdAt, authProvider }` | W (on signup) |

## Cloud Function Requirements

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generateProfileReady` | Auth onCreate | Initialize user doc, set defaults, record auth provider |
| `migrateLocalData` | Callable | After auth, migrate AsyncStorage data (rides, settings, wallet) to Firestore |

## Third-Party API Requirements

| Service | Purpose | Milestone |
|---------|---------|-----------|
| Firebase Auth | Email/password, Google, Apple sign-in | M1 |
| expo-apple-authentication | Apple Sign-In native flow | M1 |
| @react-native-google-signin | Google Sign-In native flow | M1 |

## Open Questions

1. "Continue without account" -- what happens when user later decides to sign up? Need a "link account" flow in settings to merge local data with new auth account.
2. RiderTypeScreen is built but not in the flow. Was it intentionally removed? Should it be re-added before or after auth?
3. The email sign-up flow needs its own screen (email field, password field, confirm password). This screen does not exist yet.
4. Terms of Service and Privacy Policy links in AuthScreen are not wired. They should navigate to the existing TermsScreen/PrivacyPolicyScreen, but those contain placeholder text.
5. Local-to-Firestore migration: when a no-account user later signs up, all their ride logs, wallet tickets, and settings must migrate. This is a non-trivial Cloud Function.
