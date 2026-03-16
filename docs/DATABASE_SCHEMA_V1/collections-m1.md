# M1 Collections — Foundation

TypeScript interfaces for every M1 Firestore document. Copy-paste ready for `src/types/firestore.ts`.

---

## `users/{userId}`

The central user document. Profile-visible fields sync to Firestore; device-local prefs stay in AsyncStorage/Zustand.

```typescript
interface UserDoc {
  // Identity
  uid: string;
  displayName: string;
  username: string; // unique, validated via usernames/{username}
  profileImageUrl: string | null; // Firebase Storage URL
  authProvider: 'apple' | 'google' | 'email';

  // Onboarding selections
  homeParkName: string;
  riderType: 'thrill-seeker' | 'well-rounded' | 'casual' | 'family';

  // Denormalized stats (updated by Cloud Functions, NOT client writes)
  totalCredits: number; // distinct coasters ridden
  totalRides: number; // total ride count across all coasters

  // Privacy
  accountVisibility: 'public' | 'private';

  // Notifications
  fcmTokens: string[]; // one per device
  notificationsEnabled: boolean;

  // Pro status (M3, but field exists from M1)
  proStatus: {
    active: boolean;
    tier: string | null; // 'supporter' | 'enthusiast' | 'champion' etc
    expiresAt: FirebaseFirestore.Timestamp | null;
    platform: 'ios' | null;
  };

  // Timestamps
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** ProfileScreen, SettingsScreen, HomeScreen (friend activity), CommunityScreen (post author info), any friend profile view
**Writes:** Onboarding (via `generateProfileReady` CF), SettingsScreen (profile edits), Cloud Functions (stats, pro status)
**Note:** `totalCredits` and `totalRides` are ONLY written by Cloud Functions (`onRideLogCreate`/`onRideLogDelete`). Client reads them but never writes them directly — prevents count drift.

---

## `usernames/{username}`

Enforces username uniqueness via a flat collection. The document ID IS the username (lowercased).

```typescript
interface UsernameDoc {
  uid: string;
  createdAt: FirebaseFirestore.Timestamp;
}
```

**Pattern:** Before setting a username, `validateUsername` CF checks if `usernames/{lowercase(username)}` exists. If not, it creates it in a transaction alongside updating `users/{uid}.username`.
**Reads:** `validateUsername` Cloud Function
**Writes:** `validateUsername` Cloud Function (create), `deleteUserAccount` CF (delete)

---

## `rideLogs/{userId}/logs/{logId}`

One document per ride logged. The `{userId}` in the path is the top-level document (not a real doc — just a path segment for the subcollection).

```typescript
interface RideLogDoc {
  id: string; // same as document ID
  coasterId: string; // from static coaster database
  coasterName: string; // denormalized for query-free display
  parkName: string; // denormalized
  timestamp: string; // ISO 8601, user-editable
  seat: {
    row: string; // 'front' | 'back' | 'middle' | specific row number
    position: 'left' | 'middle' | 'right';
  } | null;
  rideCount: number; // within-day sequence (1st ride today, 2nd ride today...)
  notes: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** LogbookScreen (timeline, collection, stats), HomeScreen (recent rides), ProfileScreen (ride count)
**Writes:** LogConfirmSheet (create), LogbookScreen (delete, update timestamp)
**Triggers:** `onRideLogCreate`, `onRideLogDelete`, `onRideLogUpdate`
**Query patterns:**
- All logs for a user, ordered by timestamp desc (timeline view)
- All logs for a user + specific coasterId (ride history for one coaster)
- Count of distinct coasterIds (credit count — computed by CF, stored in meta)

---

## `rideLogs/{userId}/meta` (single document)

Denormalized counters computed by Cloud Functions. Document ID is literally `"meta"` — it's a single doc, not a collection.

```typescript
interface RideLogMetaDoc {
  creditCount: number; // count of distinct coasterIds across all logs
  totalRideCount: number; // count of all log documents
  lastLogAt: FirebaseFirestore.Timestamp | null;
}
```

**Reads:** ProfileScreen, LogbookScreen stats tab, HomeScreen
**Writes:** Cloud Functions ONLY (`onRideLogCreate`, `onRideLogDelete`)
**Why denormalize:** Counting distinct coasterIds across all logs requires reading every document. The meta doc gives O(1) reads for the most-displayed stat in the app.

---

## `ratings/{userId}/{coasterId}`

One document per coaster the user has rated. Uses a flat subcollection under the userId for easy per-user queries.

```typescript
interface RatingDoc {
  coasterId: string;
  coasterName: string; // denormalized
  parkName: string; // denormalized
  criteriaRatings: Record<string, number>; // criterionId → 0.0-10.0 in 0.5 steps
  weightedScore: number; // 0-100, computed from criteria × weights
  notes: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** LogbookScreen (collection view badge), RatingSheet (edit existing), ProfileScreen (rankings segment)
**Writes:** RatingSheet (create/update)
**Triggers:** `onRatingWrite` — updates global rankings, checks badge criteria
**Query patterns:**
- All ratings for a user, ordered by weightedScore desc (personal ranking list)
- Single rating by userId + coasterId (check if rated, show existing)

---

## `users/{userId}/criteriaConfig` (single document)

Stores the user's custom rating criteria and weights. Document path: `users/{userId}/criteriaConfig/config`.

```typescript
interface CriteriaConfigDoc {
  criteria: Array<{
    id: string; // 'airtime' | 'intensity' | 'smoothness' | 'theming' | 'pacing' | 'fun' | 'uniqueness' | custom
    name: string;
    icon: string; // emoji or icon name
    weight: number; // 0.0-1.0, all weights sum to 1.0
    isLocked: boolean; // default 7 are locked, Pro users can add more
  }>;
  hasCompletedSetup: boolean;
  lastModifiedAt: string; // ISO 8601
}
```

**Reads:** RatingSheet (which criteria to show), CriteriaWeightEditorScreen
**Writes:** CriteriaWeightEditorScreen (edit weights), RatingSheet (first-time setup)
**Default:** 7 criteria with equal weights (1/7 each). Pro users can add custom criteria beyond the default 7.

---

## Zustand Migration Map

Before wiring Firestore, migrate local stores to Zustand with the same API surface.

| Current Store | Zustand Store | Fields That Go to Firestore | Fields That Stay Local |
|---------------|---------------|---------------------------|----------------------|
| rideLogStore | useRideLogStore | logs, ratings, creditCount, totalRideCount, criteriaConfig | (none — all persist) |
| settingsStore | useSettingsStore | displayName, username, profileImageUrl, homeParkName, riderType, activityVisibility | hapticsEnabled, notificationsEnabled, unitSystem, hasCompletedOnboarding |
| WalletContext | useWalletStore | tickets (M2) | filterPreferences |
| communityStore | useCommunityStore | posts, comments, likes (M2) | (none) |
| friendsStore | useFriendsStore | friends, requests (M2) | (none) |
| rankingsStore | useRankingsStore | rankings (M2) | (none) |
| savedArticlesStore | useSavedArticlesStore | savedIds (M2) | (none) |

**Pattern:** Each Zustand store gets a `sync()` method that wires Firestore listeners when authenticated. Anonymous users continue with local-only state. On first auth, `migrateLocalData` uploads everything.
