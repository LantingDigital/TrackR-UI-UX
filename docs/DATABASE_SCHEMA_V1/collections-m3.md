# M3 Collections — Premium Features

TypeScript interfaces for M3 Firestore documents. Pro IAP, Apple Wallet, games, badges.

---

## `purchases/{purchaseId}`

Apple IAP receipt records. One doc per transaction. Used for audit trail and dispute resolution.

```typescript
interface PurchaseDoc {
  id: string;
  userId: string;
  productId: string; // Apple IAP product ID (e.g., 'trackr_pro_monthly_299')
  transactionId: string; // Apple transaction ID
  originalTransactionId: string; // for subscription renewal tracking
  receipt: string; // base64 Apple receipt (for re-verification)
  verifiedAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp; // subscription expiry
  environment: 'production' | 'sandbox';
  status: 'active' | 'expired' | 'cancelled' | 'refunded';
  tier: string; // display tier name based on price
  priceUsd: number; // actual price paid (1.99, 2.99, 3.99, etc.)
  isAnnual: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** `checkProStatus` CF, admin dashboard
**Writes:** `verifyPurchase` CF (create), `handleSubscriptionEvent` webhook CF (update status)
**Query:** `userId == uid`, ordered by `createdAt` desc (purchase history)

---

## `appleWalletPasses/{serialNumber}`

Metadata for generated PKPass files. Used by Apple Wallet web service endpoints.

```typescript
interface AppleWalletPassDoc {
  serialNumber: string; // same as document ID, UUID v4
  userId: string;
  ticketId: string; // references users/{userId}/tickets/{ticketId}
  passTypeIdentifier: string; // e.g., 'pass.com.trackr.wallet'
  authenticationToken: string; // random token, sent in Authorization header
  lastUpdated: FirebaseFirestore.Timestamp;
  version: number; // increments on each update, used by Apple's update protocol
  style: 'clean' | 'nanobanana' | 'park-color' | 'dark' | 'light';
  passUrl: string | null; // Firebase Storage URL of the .pkpass file
}
```

**Reads:** `appleWalletWebService` HTTP endpoints (Apple calls these)
**Writes:** `generatePKPass` CF (create), `updatePassOnChange` CF (increment version)

---

## `appleWalletRegistrations/{registrationId}`

Device registrations for pass update push notifications. Apple Wallet creates these via the web service.

```typescript
interface AppleWalletRegistrationDoc {
  id: string; // document ID = `${deviceId}_${serialNumber}`
  deviceId: string; // Apple device library identifier
  serialNumber: string; // pass serial number
  passTypeIdentifier: string;
  pushToken: string; // APNs push token for this device
  createdAt: FirebaseFirestore.Timestamp;
}
```

**Reads:** `updatePassOnChange` CF (find devices to notify)
**Writes:** `appleWalletWebService` HTTP endpoints (Apple registers/unregisters)
**Query:** All registrations for a given `serialNumber` (find all devices that have this pass)

---

## `users/{userId}/gameStats/{gameId}`

Persistent game statistics. One doc per game type per user.

```typescript
interface GameStatsDoc {
  gameId: 'coastle' | 'trivia' | 'speed-sorter' | 'blind-ranking';
  highScore: number;
  gamesPlayed: number;
  currentStreak: number; // consecutive wins/completions
  bestStreak: number;
  totalScore: number; // lifetime cumulative
  lastPlayedAt: FirebaseFirestore.Timestamp;
  history: Array<{
    score: number;
    completedAt: FirebaseFirestore.Timestamp;
    details?: Record<string, any>; // game-specific (e.g., Coastle guesses, trivia category)
  }>; // last 50 games (capped, oldest dropped)
}
```

**Reads:** CommunityPlayTab (personal stats), game screens (streak display), leaderboards
**Writes:** Game completion (client writes after game ends)
**Note:** `history` array is capped at 50 entries client-side. Old entries are dropped, not deleted — they still count toward `totalScore` and `gamesPlayed`.

---

## `users/{userId}/challenges/{challengeId}`

Weekly challenge progress tracking. Challenge definitions come from a server-side config.

```typescript
interface ChallengeProgressDoc {
  challengeId: string; // matches the challenge definition ID
  progress: number; // current progress toward goal
  goal: number; // target number (from challenge definition)
  completedAt: FirebaseFirestore.Timestamp | null;
  startedAt: FirebaseFirestore.Timestamp;
}
```

**Challenge definitions** live in a separate config (Firestore doc or remote config):

```typescript
interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: 'log-rides' | 'rate-coasters' | 'play-games' | 'visit-parks';
  goal: number;
  startDate: string; // ISO 8601 (Monday)
  endDate: string; // ISO 8601 (Sunday)
  reward: { type: 'badge' | 'points'; value: string };
}
```

**Reads:** CommunityPlayTab (challenge card), HomeScreen (challenge widget)
**Writes:** Cloud Functions (increment progress on qualifying actions)
**Rotation:** `getWeeklyChallenge` CF returns current challenge. New one starts every Monday at midnight PT.

---

## `users/{userId}/badges/{badgeId}`

Achievement badges. Awarded by Cloud Functions, never by client writes.

```typescript
interface BadgeDoc {
  badgeId: string; // same as document ID
  name: string;
  description: string;
  icon: string; // emoji or asset reference
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: FirebaseFirestore.Timestamp;
  progress: number; // 0-100 for incremental badges, 100 = earned
}
```

**Badge catalog** (static, bundled in app):

| Badge ID | Name | Criteria | Tier |
|----------|------|----------|------|
| `first-credit` | First Credit | Log 1 ride | Bronze |
| `ten-credits` | Decade Rider | 10 distinct coasters | Silver |
| `fifty-credits` | Half Century | 50 distinct coasters | Gold |
| `century-rider` | Century Rider | 100 distinct coasters | Platinum |
| `first-rating` | Critic's Debut | Rate 1 coaster | Bronze |
| `rate-fifty` | Seasoned Critic | Rate 50 coasters | Gold |
| `park-hopper` | Park Hopper | Log rides at 5 different parks | Silver |
| `game-master` | Game Master | Win all 4 game types | Gold |
| `streak-7` | Week Warrior | 7-day play streak | Silver |
| `coastle-100` | Coastle Century | 100 Coastle games | Gold |

**Reads:** ProfileScreen (badges segment), post author badges
**Writes:** `awardBadges` CF only (triggered by ride log, rating, and game score writes)
**Query:** All badges for a user, show earned (progress == 100) and in-progress

---

## IAP Product IDs

Apple IAP products to register in App Store Connect:

| Product ID | Type | Display Price | Actual Price | Period |
|------------|------|--------------|--------------|--------|
| `trackr_pro_monthly_199` | Auto-renewable | $2 | $1.99 | Monthly |
| `trackr_pro_monthly_299` | Auto-renewable | $3 | $2.99 | Monthly |
| `trackr_pro_monthly_399` | Auto-renewable | $4 | $3.99 | Monthly |
| `trackr_pro_monthly_499` | Auto-renewable | $5 | $4.99 | Monthly |
| `trackr_pro_monthly_599` | Auto-renewable | $6 | $5.99 | Monthly |
| `trackr_pro_monthly_699` | Auto-renewable | $7 | $6.99 | Monthly |
| `trackr_pro_monthly_799` | Auto-renewable | $8 | $7.99 | Monthly |
| `trackr_pro_monthly_899` | Auto-renewable | $9 | $8.99 | Monthly |
| `trackr_pro_monthly_999` | Auto-renewable | $10 | $9.99 | Monthly |
| `trackr_pro_monthly_1099` | Auto-renewable | $11 | $10.99 | Monthly |
| `trackr_pro_monthly_1199` | Auto-renewable | $12 | $11.99 | Monthly |
| `trackr_pro_annual_1999` | Auto-renewable | $20 | $19.99 | Annual |
| `trackr_pro_annual_2999` | Auto-renewable | $30 | $29.99 | Annual |
| `trackr_pro_annual_3999` | Auto-renewable | $40 | $39.99 | Annual |

**Main cards:** $1.99, $2.99 (default), $3.99
**Slider range:** $1.99–$11.99 monthly, snapping to Apple tiers
**Annual:** Same tiers × 10, with "Save X%" badge
