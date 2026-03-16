# Profile Tab -- v1 Backend Audit

## Screens / Components Covered

- `src/screens/ProfileScreen.tsx` (1027 lines)
- `src/screens/PerksScreen.tsx` (659 lines)
- `src/screens/SavedArticlesScreen.tsx` (1004 lines)
- `src/stores/settingsStore.ts` (273 lines)
- `src/stores/savedArticlesStore.ts` (80 lines)

## Current Data Sources

| Data | Source | Persistence |
|------|--------|-------------|
| Display name | settingsStore (AsyncStorage `@app_settings`) | Local only |
| Username | settingsStore (AsyncStorage) | Local only |
| Profile image | settingsStore (AsyncStorage, URI string) | Local only |
| Home park | settingsStore (AsyncStorage) | Local only |
| Ride count | rideLogStore (in-memory, sourced from local data) | Local only |
| Parks visited | MOCK hardcoded `34` (L525) | None |
| Games played | MOCK hardcoded `18` (L528) | None |
| Join date | MOCK `"March 2024"` (L535) | None |
| My Rides tab | MOCK `RIDES_DATA` array (L69-143) | None |
| Rankings tab | MOCK `RANKINGS_DATA` array (L145-174) | None |
| Badges tab | MOCK `BADGES_DATA` array (L176-190) | None |
| Credit milestones | MOCK array in PerksScreen (L42-72) | None |
| Achievements | MOCK array in PerksScreen (L74-120) | None |
| Saved articles | savedArticlesStore (in-memory Set of IDs) | Lost on restart |
| News articles | MOCK_NEWS from data file | None |

## Interaction Inventory

| # | Element | Location | Current Behavior | v1 Target |
|---|---------|----------|-----------------|-----------|
| 1 | Settings gear icon | ProfileScreen L604-614 | Navigates to SettingsScreen | No change needed |
| 2 | Avatar press | ProfileScreen L474-491 | ImagePicker Alert (Camera/Library) | Upload to Firebase Storage, save URL to Firestore user doc |
| 3 | Stats card (Rides) | ProfileScreen L520-525 | Count from rideLogStore | Read from Firestore `users/{uid}/stats.rideCount` |
| 4 | Stats card (Parks) | ProfileScreen L525 | MOCK `34` | Compute from Firestore ride log (distinct parks) |
| 5 | Stats card (Games) | ProfileScreen L528 | MOCK `18` | Compute from Firestore game sessions |
| 6 | Home park meta | ProfileScreen L535 | settingsStore | Read from Firestore user doc |
| 7 | Join date meta | ProfileScreen L535 | MOCK string | Read `createdAt` from Firestore user doc |
| 8 | Tab pills (My Rides / Rankings / Badges) | ProfileScreen L182-194 | Switches displayed mock data | No change to tabs; data behind them must be real |
| 9 | Ride row press | ProfileScreen L348-372 | Navigates to Parks tab | No change needed |
| 10 | Ranking row press | ProfileScreen L379-406 | Navigates to Parks tab | No change needed |
| 11 | Pro upgrade card | ProfileScreen L560-583 | Empty `handleProUpgrade` handler | Navigate to Pro upgrade screen (IAP flow, M3) |
| 12 | Achievement card tap | PerksScreen L221 | Haptics only | Show achievement detail or share sheet |
| 13 | Pro upgrade button | PerksScreen L393-403 | Toast "coming soon" | Navigate to Pro upgrade screen (IAP) |
| 14 | Back button | PerksScreen L298-302 | Navigation goBack | No change needed |
| 15 | Saved article row tap | SavedArticlesScreen | Opens ArticleSheet | No change needed |
| 16 | Unsave bookmark button | SavedArticlesScreen | Removes from in-memory Set | Sync saved articles to Firestore |
| 17 | Long press article | SavedArticlesScreen | LongPressActionSheet (Remove/Share) | Share should use native share; Remove syncs to Firestore |

## Firestore Collections Required

| Collection | Doc Structure | Read/Write |
|------------|--------------|------------|
| `users/{uid}` | `{ displayName, username, profileImageUrl, homeParkName, riderType, createdAt, updatedAt }` | R/W |
| `users/{uid}/stats` (subcollection or field) | `{ rideCount, parksVisited, gamesPlayed, totalCredits }` | R (computed by Cloud Function) |
| `users/{uid}/rides` | `{ coasterId, parkId, ratedAt, rating, notes }` | R/W |
| `users/{uid}/rankings` | `{ coasterId, rank, ratedAt }` | R/W |
| `users/{uid}/badges` | `{ badgeId, earnedAt, progress }` | R |
| `users/{uid}/savedArticles` | `{ articleId, savedAt }` | R/W |

## Cloud Function Requirements

| Function | Trigger | Purpose |
|----------|---------|---------|
| `computeUserStats` | Firestore write on `users/{uid}/rides` | Recompute rideCount, parksVisited, totalCredits |
| `awardBadges` | Firestore write on rides/games | Check badge criteria, write to badges subcollection |
| `generateProfileReady` | Auth onCreate | Initialize user doc with defaults, set createdAt |

## Third-Party API Requirements

| Service | Purpose | Milestone |
|---------|---------|-----------|
| Firebase Storage | Profile image upload | M1 |
| Firebase Auth | User identity for profile ownership | M1 |

## Open Questions

1. Should Rankings be global (all users) or personal (my top coasters)? Currently mock data suggests personal ranking.
2. savedArticlesStore has zero persistence -- articles are lost on restart. Is Firestore sync required for v1, or is AsyncStorage sufficient?
3. The Pro upgrade card handler is empty. What screen/flow should it navigate to? IAP is M3 scope.
4. Stats computation (parks visited, games played) -- should these be real-time queries or cached in a stats doc?
