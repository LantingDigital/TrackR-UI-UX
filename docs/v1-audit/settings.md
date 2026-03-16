# Settings -- v1 Backend Audit

## Screens / Components Covered

- `src/screens/SettingsScreen.tsx` (1059 lines)
- `src/screens/settings/EmailScreen.tsx` (295 lines)
- `src/screens/settings/PasswordScreen.tsx` (394 lines)
- `src/screens/settings/BlockedUsersScreen.tsx` (335 lines)
- `src/screens/settings/ExportRideLogScreen.tsx` (379 lines)
- `src/screens/settings/CreditsScreen.tsx` (359 lines)
- `src/screens/settings/PrivacyPolicyScreen.tsx` (223 lines)
- `src/screens/settings/TermsScreen.tsx` (218 lines)
- `src/stores/settingsStore.ts` (273 lines)

## Current Data Sources

| Data | Source | Persistence |
|------|--------|-------------|
| All settings | settingsStore (AsyncStorage `@app_settings`) | Local only |
| Display name | settingsStore default `"Coaster Rider"` | Local only |
| Username | settingsStore default `"@coasterrider"` | Local only |
| Profile image | settingsStore (URI string) | Local only |
| Email address | MOCK `"Not connected"` (EmailScreen L122) | None |
| Password | MOCK placeholder form | None |
| Blocked users | MOCK empty array `[]` (BlockedUsersScreen L35) | None |
| Export data | Stub alert, no actual export logic | None |
| Terms / Privacy | Static placeholder legal text | None |
| Credits | Static open-source library list | None |

## Interaction Inventory

| # | Element | Location | Current Behavior | v1 Target |
|---|---------|----------|-----------------|-----------|
| 1 | Back button | SettingsScreen L784-792 | goBack | No change |
| 2 | Profile card press | SettingsScreen L560-564 | Empty handler | Navigate to profile edit screen or expand inline |
| 3 | Photo change button | SettingsScreen L577-584 | ImagePicker flow (local only) | Upload to Firebase Storage, update Firestore user doc |
| 4 | Display name row | SettingsScreen L593-598 | Alert.prompt -> settingsStore | Write to Firestore `users/{uid}.displayName` |
| 5 | Username row | SettingsScreen L599-603 | Alert.prompt -> settingsStore | Write to Firestore, validate uniqueness via Cloud Function |
| 6 | Email row | SettingsScreen L605-609 | Navigates to EmailScreen | No change to nav; EmailScreen needs real implementation |
| 7 | Password row | SettingsScreen L611-615 | Navigates to PasswordScreen | No change to nav; PasswordScreen needs real implementation |
| 8 | Sign out row | SettingsScreen L617-621 | Stub alert "Coming soon" | Call `firebase.auth().signOut()`, navigate to AuthScreen |
| 9 | Home park row | SettingsScreen L629-634 | Navigates to Parks tab | No change needed |
| 10 | Haptics toggle | SettingsScreen L635-639 | settingsStore local toggle | Sync to Firestore user preferences |
| 11 | Notifications toggle | SettingsScreen L641-645 | settingsStore local toggle | Register/unregister FCM token via Cloud Function |
| 12 | Units row | SettingsScreen L647-652 | Opens bottom sheet (imperial/metric) | Sync to Firestore |
| 13 | Rating criteria row | SettingsScreen L654-658 | Navigates to CriteriaWeightEditor | No change needed |
| 14 | Rider type row | SettingsScreen L659-665 | Opens bottom sheet | Sync to Firestore |
| 15 | Friends row | SettingsScreen L673-678 | Stub alert "Coming soon" | Navigate to friends list (community feature) |
| 16 | Activity visibility row | SettingsScreen L679-684 | Opens bottom sheet (everyone/friends/private) | Sync to Firestore, enforce server-side |
| 17 | Blocked users row | SettingsScreen L685-690 | Navigates to BlockedUsersScreen | No change to nav |
| 18 | Clear cache row | SettingsScreen L699-703 | Opens DangerousActionModal | Clear AsyncStorage + local image cache |
| 19 | Export ride log row | SettingsScreen L704-707 | Navigates to ExportRideLogScreen | No change to nav |
| 20 | Reset onboarding row | SettingsScreen L709-713 | DangerousActionModal -> resets onboarding flag | No change (local-only) |
| 21 | Delete account row | SettingsScreen L715-721 | DangerousActionModal with typed confirmation "DELETE" | Call Cloud Function to delete user data + Firebase Auth account |
| 22 | Terms/Privacy/Credits rows | SettingsScreen L739-753 | Navigate to static screens | No change needed |
| 23 | Rate app row | SettingsScreen L754-759 | Stub alert "Coming soon" | Open App Store review prompt (`expo-store-review`) |
| 24 | EmailScreen back button | EmailScreen L72-83 | goBack | No change |
| 25 | EmailScreen (entire screen) | EmailScreen | Placeholder "Not connected" | Show auth email, verification status, change email flow |
| 26 | PasswordScreen fields | PasswordScreen L128-229 | Local state, client-only validation | Call `firebase.auth().updatePassword()` |
| 27 | PasswordScreen eye toggles | PasswordScreen L152,191,229 | Toggle show/hide password | No change needed |
| 28 | Forgot Password link | PasswordScreen L233-238 | Stub alert | Call `firebase.auth().sendPasswordResetEmail()` |
| 29 | Update Password button | PasswordScreen L243-259 | Stub alert | Re-authenticate + updatePassword |
| 30 | Blocked user unblock button | BlockedUsersScreen L106-116 | Removes from local array with Alert | Remove from Firestore `users/{uid}/blockedUsers` |
| 31 | Export format pills (CSV/JSON) | ExportRideLogScreen L128-160 | Local state selection | No change (UI-only until export) |
| 32 | Export date range pills | ExportRideLogScreen L167-196 | Local state selection | No change |
| 33 | Export button | ExportRideLogScreen L211-219 | Stub alert | Query Firestore rides, generate file, share via native share sheet |

## Firestore Collections Required

| Collection | Doc Structure | Read/Write |
|------------|--------------|------------|
| `users/{uid}` | All profile + preference fields | R/W |
| `users/{uid}/blockedUsers` | `{ blockedUid, blockedAt }` | R/W |
| `usernames/{username}` | `{ uid }` -- for uniqueness enforcement | R/W |

## Cloud Function Requirements

| Function | Trigger | Purpose |
|----------|---------|---------|
| `validateUsername` | Callable | Check uniqueness, validate format, reserve username |
| `deleteUserAccount` | Callable (authenticated) | Delete Firestore data, Storage files, Auth account |
| `registerFCMToken` | Callable | Store push token for notifications |
| `exportRideLog` | Callable | Query rides, format CSV/JSON, return download URL |

## Third-Party API Requirements

| Service | Purpose | Milestone |
|---------|---------|-----------|
| Firebase Auth | Sign out, password update, email change, account deletion | M1 |
| Firebase Storage | Profile photo upload | M1 |
| FCM (Firebase Cloud Messaging) | Push notification registration | M2+ |
| expo-store-review | App Store rating prompt | M4 |

## Open Questions

1. EmailScreen is a placeholder. Full implementation requires: show current auth email, email verification status, "Change Email" flow (re-auth + updateEmail + verification). Scope for M1?
2. PasswordScreen only applies to email/password auth. Should it be hidden for Apple/Google sign-in users?
3. Friends row is stubbed. Is the friends list feature in v1 scope or deferred to community phase?
4. Export ride log -- should the Cloud Function generate the file and return a Storage URL, or should the client query and build the file locally?
5. Settings currently save to AsyncStorage only. Migration strategy: on first auth, copy all AsyncStorage settings to Firestore user doc?
