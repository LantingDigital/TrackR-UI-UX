# State Management Architecture

TrackR uses a lightweight module-level store pattern rather than a heavy state management library. State persists across component re-mounts but resets on app restart.

---

## Ride Log Store

**File**: `src/stores/rideLogStore.ts`

The primary data store for the app. Manages ride logs, credit counts, and rating criteria configuration.

### Pattern

Module-level variables hold the state. Exported functions provide getters, setters, and a subscription system for reactive updates.

```typescript
// Module-level state (not React state)
let state: RideLogState = { ...DEFAULT_RIDE_LOG_STATE };
let listeners: Set<() => void> = new Set();
```

### State Shape

```typescript
interface RideLogState {
  logs: RideLog[];                    // All ride logs
  criteriaConfig: UserCriteriaConfig; // Rating criteria + weights
  creditCount: number;                // Unique coasters logged
  totalRideCount: number;             // Total rides including re-rides
}
```

### Subscription System

Components can subscribe to state changes:

```typescript
const unsubscribe = subscribe(() => {
  // Called whenever state changes
  setLocalState(getState());
});

// Clean up
unsubscribe();
```

### Getters

| Function | Returns | Description |
|----------|---------|-------------|
| `getState()` | `RideLogState` | Full state object |
| `getAllLogs()` | `RideLog[]` | All ride logs |
| `getPendingLogs()` | `RideLog[]` | Logs where `isPendingRating === true` |
| `getPendingCount()` | `number` | Count of pending logs (for badge) |
| `getCreditCount()` | `number` | Unique coaster count |
| `getTotalRideCount()` | `number` | Total rides including re-rides |
| `getCriteria()` | `RatingCriteria[]` | Current criteria list |
| `getCriteriaConfig()` | `UserCriteriaConfig` | Full criteria config |
| `hasCompletedCriteriaSetup()` | `boolean` | Whether setup is done |
| `getLogById(id)` | `RideLog \| undefined` | Find log by ID |
| `getLogsForCoaster(id)` | `RideLog[]` | All logs for a coaster |
| `getTodayRideCountForCoaster(id)` | `number` | Same-day ride count |

### Actions

| Function | Purpose |
|----------|---------|
| `addQuickLog(coaster, seat?)` | Create a new log with `isPendingRating: true`. Increments credit count if new coaster. Returns the created `RideLog`. |
| `completeRating(logId, ratings, notes?)` | Update a pending log with criteria ratings. Sets `isPendingRating: false`, calculates `weightedScore`. |
| `updateLogNotes(logId, notes)` | Update notes on an existing log. |
| `deleteLog(logId)` | Remove a log. Decrements credit count if it was the only log for that coaster. |
| `updateCriteria(criteria)` | Replace criteria list. Sets `hasCompletedSetup: true`. |
| `updateCriteriaConfig(config)` | Partial update to criteria config. |
| `completeCriteriaSetup()` | Mark setup as complete without changing criteria. |
| `resetStore()` | Reset to default state (dev/testing). |

### React Hook

```typescript
const store = useRideLogStore();
// Returns all getters + actions in one object
// Note: This is currently a simple wrapper, not using useSyncExternalStore
```

---

## Tab Bar Context

**File**: `src/contexts/TabBarContext.tsx`

React Context for controlling tab bar visibility and screen reset behavior. See `architecture/navigation.md` for details.

### Access

```typescript
import { useTabBar } from '../contexts/TabBarContext';
const tabBar = useTabBar(); // returns null if outside provider
```

---

## Wallet Context

**File**: `src/contexts/WalletContext.tsx`

React Context for wallet state management. Currently broken -- will be rebuilt in Phase 2.

### Access (currently broken)

```typescript
import { useWallet } from '../hooks/useWallet';
```

---

## Persistence

Currently, all state lives in memory only:
- Persists across component re-mounts (module-level variables)
- Resets on app restart
- No AsyncStorage or database integration yet

**Future**: Production version should use AsyncStorage or SQLite for persistence, with the same store API surface.

---

## Data Flow Diagram

```
User Action (tap Log, submit rating, etc.)
  |
  v
Store Action (addQuickLog, completeRating, etc.)
  |
  v
Module-level state updated
  |
  v
notifyListeners() called
  |
  v
All subscribed components re-render with new data
```
