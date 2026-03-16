# Firestore Indexes

Composite indexes required for TrackR v1 queries. Single-field indexes are automatic.

Deploy via `firestore.indexes.json` or Firebase Console.

---

## M1 Indexes

### Ride Logs — Timeline View
```json
{
  "collectionGroup": "logs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**Query:** `rideLogs/{userId}/logs` ordered by `timestamp` desc
**Used by:** LogbookScreen timeline, HomeScreen recent rides

### Ride Logs — Per-Coaster History
```json
{
  "collectionGroup": "logs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "coasterId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```
**Query:** `rideLogs/{userId}/logs` where `coasterId == X` ordered by `timestamp` desc
**Used by:** Coaster detail ride history

### Ratings — Personal Rankings
```json
{
  "collectionGroup": "ratings",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "weightedScore", "order": "DESCENDING" }
  ]
}
```
**Query:** `ratings/{userId}` ordered by `weightedScore` desc
**Used by:** ProfileScreen rankings segment, LogbookScreen collection view sort

---

## M2 Indexes

### Posts — Community Feed (Public, Chronological)
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "visibility", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `posts` where `visibility == 'public'` ordered by `createdAt` desc
**Used by:** CommunityFeedTab (community view)

### Posts — Author's Posts
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "authorId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `posts` where `authorId == uid` ordered by `createdAt` desc
**Used by:** ProfileScreen (user's posts), friends feed query

### Posts — Friends Feed
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "authorId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `posts` where `authorId in [friendIds]` ordered by `createdAt` desc
**Note:** Same index as author's posts. Firestore `in` limited to 30 values — batch for users with 30+ friends.

### Comments — Post Thread
```json
{
  "collectionGroup": "comments",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
}
```
**Query:** `posts/{postId}/comments` ordered by `createdAt` asc
**Used by:** PostDetailScreen

### Friend Requests — Incoming Pending
```json
{
  "collectionGroup": "friendRequests",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "toUserId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `friendRequests` where `toUserId == uid AND status == 'pending'` ordered by `createdAt` desc
**Used by:** CommunityFriendsTab (pending requests badge + list)

### Friend Requests — Outgoing
```json
{
  "collectionGroup": "friendRequests",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "fromUserId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Query:** `friendRequests` where `fromUserId == uid AND status == 'pending'`
**Used by:** Check if already sent request to a user (prevent duplicates)

### Tickets — Default First, Then Recent
```json
{
  "collectionGroup": "tickets",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "isDefault", "order": "DESCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `users/{uid}/tickets` ordered by `isDefault` desc, `addedAt` desc
**Used by:** WalletCardStack (default card on top)

---

## M3 Indexes

### Purchases — User History
```json
{
  "collectionGroup": "purchases",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Query:** `purchases` where `userId == uid` ordered by `createdAt` desc
**Used by:** Subscription management screen, admin dashboard

### Apple Wallet Registrations — By Serial
```json
{
  "collectionGroup": "appleWalletRegistrations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "serialNumber", "order": "ASCENDING" }
  ]
}
```
**Query:** `appleWalletRegistrations` where `serialNumber == X`
**Used by:** `updatePassOnChange` CF (find all devices to push-notify)

### Game Stats — Leaderboard
```json
{
  "collectionGroup": "gameStats",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "gameId", "order": "ASCENDING" },
    { "fieldPath": "highScore", "order": "DESCENDING" }
  ]
}
```
**Query:** All `gameStats` across all users where `gameId == X` ordered by `highScore` desc
**Used by:** Game leaderboards (public)
**Note:** Collection group query — searches across ALL `users/{uid}/gameStats` subcollections.

---

## `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "coasterId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUserId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fromUserId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "DESCENDING" },
        { "fieldPath": "addedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "purchases",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "gameStats",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "gameId", "arrayConfig": "CONTAINS" },
        { "fieldPath": "highScore", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Query Cost Notes

| Query | Reads | Frequency | Cost Impact |
|-------|-------|-----------|-------------|
| Community feed (page) | 20 docs/page | High | Low (paginated) |
| Friends feed | 20 docs × batch queries | High | Medium (multiple `in` batches for 30+ friends) |
| Rankings | 1 doc | Medium | Negligible |
| Friend requests check | 1-5 docs | Low | Negligible |
| computeRankings (daily) | All ratings | 1/day | HIGH at scale (500k+ reads). Optimize: maintain running averages in ranking docs, only recompute deltas. |
| Wait times | 1 doc | High per park | Low (cached, 5-min TTL) |
| Game leaderboard | Collection group query | Low | Medium (scans all users' gameStats) |

**Free tier budget:** 50k reads/day, 20k writes/day. At launch (50-200 DAU), well within limits. Monitor `computeRankings` as user base grows.
