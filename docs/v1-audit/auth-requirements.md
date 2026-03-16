# Auth Requirements -- v1 Backend Audit (Cross-Cutting)

## Current State

Authentication is **0% implemented.** The AuthScreen in onboarding has four buttons that all call the same stub handler which immediately calls `onComplete()` without any actual auth.

All user identity is local: settingsStore holds displayName/username, WalletContext holds tickets, rideLogStore holds logs. Nothing is tied to a user account.

## Required Auth Providers (M1)

| Provider | Library | Priority | Notes |
|----------|---------|----------|-------|
| Apple Sign-In | `expo-apple-authentication` + Firebase `signInWithCredential` | P0 | Required for App Store (Apple mandate if any social login exists) |
| Google Sign-In | `@react-native-google-signin/google-signin` + Firebase `signInWithCredential` | P0 | Most common auth for Android users; Caleb's ecosystem |
| Email/Password | Firebase `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` | P1 | Fallback for users who don't want social auth |
| Anonymous (skip) | No Firebase auth — local-only mode | P1 | "Continue without account" — data stays local |

## Auth Flows

### Sign Up (Onboarding)

```
WelcomeScreen → ShowcaseScreen → HomeParkScreen → AuthScreen → ProfileReadyScreen
```

1. User selects auth method on AuthScreen
2. **Apple:** `expo-apple-authentication` → get credential → `signInWithCredential(appleProvider)` → Firebase user created
3. **Google:** `@react-native-google-signin` → get idToken → `signInWithCredential(googleProvider)` → Firebase user created
4. **Email:** Navigate to new EmailSignUpScreen (doesn't exist yet) → email + password fields → `createUserWithEmailAndPassword` → Firebase user created
5. **Skip:** No auth. `onComplete()` called directly. Data stays in AsyncStorage/SecureStore.
6. On Firebase user creation: `generateProfileReady` Cloud Function triggers (Auth onCreate), creates `users/{uid}` doc with defaults + onboarding selections
7. Client receives auth state → ProfileReadyScreen plays → app navigates to Home

### Sign In (Returning User)

AuthScreen currently has no "sign in" path — it's framed as sign-up only. For v1:
- Detect existing Firebase user on app launch (`onAuthStateChanged`)
- If authenticated: skip onboarding, go straight to Home
- If not: show onboarding as normal
- AuthScreen should handle both sign-up AND sign-in (Apple/Google are automatic; email needs "Already have an account? Sign In" link)

### Sign Out

- SettingsScreen "Sign Out" row (currently stub: "Coming soon" alert)
- Call `firebase.auth().signOut()`
- Clear local caches (rideLogStore, communityStore)
- Keep AsyncStorage settings (haptics, unit prefs)
- Navigate to onboarding/auth screen

### Password Reset

- PasswordScreen "Forgot Password" link (currently stub alert)
- Call `firebase.auth().sendPasswordResetEmail(email)`
- Show confirmation toast
- Only applicable for email/password users

### Password Change

- PasswordScreen form (currently client-only validation, stub submit)
- Re-authenticate: `reauthenticateWithCredential(emailCredential)` with current password
- Update: `user.updatePassword(newPassword)`
- Show success toast, navigate back

### Email Change

- EmailScreen (currently placeholder "Not connected")
- Show current auth email
- Show verification status
- Change email: re-authenticate → `user.verifyBeforeUpdateEmail(newEmail)` → verify → done

### Account Deletion

- SettingsScreen "Delete Account" row (has DangerousActionModal with "DELETE" confirmation)
- Call `deleteUserAccount` Cloud Function (authenticated callable)
- Cloud Function deletes: all Firestore data, Storage files, Auth account
- Required for App Store compliance (Apple requires account deletion if account creation exists)

### Link Account (Anonymous → Authenticated)

- For users who skipped auth during onboarding
- Settings should show "Create Account" or "Link Account" option
- On auth success: call `migrateLocalData` Cloud Function to upload local data to Firestore
- **This is the most complex auth flow** — must handle merging local rides/ratings/tickets with a new Firestore user doc

## Firebase Config Required

- Firebase project: new production project (not shared with website)
- Auth providers enabled: Email/Password, Apple, Google
- iOS: GoogleService-Info.plist
- Apple Sign-In: configure in Apple Developer portal + Firebase console
- Google Sign-In: configure OAuth client ID in GCP + Firebase

## Screens That Need Auth State

| Screen | Auth Need |
|--------|-----------|
| HomeScreen | Show friend activity only if authenticated |
| ProfileScreen | Show real user data if authenticated, defaults if anonymous |
| SettingsScreen | Show Sign Out/Delete Account if authenticated, "Create Account" if anonymous |
| CommunityScreen (all tabs) | Read-only if anonymous, full access if authenticated |
| Any Firestore write | Guard: prompt auth if anonymous user tries to post/comment/friend |

## Cloud Functions Required

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generateProfileReady` | Auth onCreate | Create user doc with defaults |
| `deleteUserAccount` | Callable (authenticated) | GDPR/Apple-compliant full data deletion |
| `migrateLocalData` | Callable (authenticated) | Upload local data to Firestore on first auth |
| `validateUsername` | Callable | Check uniqueness before setting username |

## Third-Party Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `firebase/auth` | Core auth | Not installed |
| `@react-native-firebase/auth` | Native auth module | Not installed |
| `expo-apple-authentication` | Apple Sign-In | Not installed |
| `@react-native-google-signin/google-signin` | Google Sign-In | Not installed |

## Open Questions

1. Should anonymous users be able to use community features (view-only) or locked out entirely?
2. Email verification: required before app use, or soft prompt?
3. Should the app use `@react-native-firebase` (native SDK) or `firebase` JS SDK with `expo-dev-client`? Native is more reliable for auth but adds native rebuild requirement.
4. Rate limiting: should sign-up attempts be rate-limited server-side?
5. Multi-device: when a user signs in on a new device, should all their data sync immediately or lazy-load?
