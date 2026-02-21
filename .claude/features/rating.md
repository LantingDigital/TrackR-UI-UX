# Rating System Specification

The rating system allows users to rate roller coasters using weighted, customizable criteria. Ratings produce a weighted score out of 100.

---

## Default Criteria

New users start with 5 default criteria (defined in `src/types/rideLog.ts`):

| Criterion | Weight | Description | Icon |
|-----------|--------|-------------|------|
| **Airtime** | 25% | Moments of weightlessness | `airplane-outline` |
| **Intensity** | 25% | Forces and thrill level | `flash-outline` |
| **Smoothness** | 20% | Ride comfort and lack of roughness | `water-outline` |
| **Theming** | 15% | Visual design and atmosphere | `color-palette-outline` |
| **Pacing** | 15% | Flow and element variety | `speedometer-outline` |

Weights must always sum to 100% across all active criteria.

---

## Slider Behavior

Each criterion has a slider in the RatingModal:

- **Range**: 1.0 to 10.0
- **Precision**: 0.5 increments (half-point snapping)
- **Visual**: Custom slider with accent color (`#CF6769`) fill
- **Haptic**: `Haptics.selectionAsync()` on each half-point snap
- **Display**: Current value shown next to slider

---

## Weighted Score Calculation

Implemented in `calculateWeightedScore()` (`src/types/rideLog.ts`):

```
For each criterion:
  normalizedRating = (rating / 10) * 100    // Convert 1-10 to 0-100 scale
  contribution = normalizedRating * (weight / 100)

weightedScore = sum of all contributions (rounded to integer)
```

### Example

| Criterion | Rating | Weight | Contribution |
|-----------|--------|--------|-------------|
| Airtime | 8.0 | 25% | (80) * 0.25 = 20.00 |
| Intensity | 7.5 | 25% | (75) * 0.25 = 18.75 |
| Smoothness | 9.0 | 20% | (90) * 0.20 = 18.00 |
| Theming | 6.0 | 15% | (60) * 0.15 = 9.00 |
| Pacing | 7.0 | 15% | (70) * 0.15 = 10.50 |
| **Total** | | | **76** |

### Partial Rating Handling

If not all criteria are rated (e.g., user skips one), the score is normalized by the total weight of rated criteria:

```typescript
if (totalWeight > 0 && totalWeight < 100) {
  return Math.round((weightedSum / totalWeight) * 100);
}
```

---

## Data Model

### RatingCriteria

```typescript
interface RatingCriteria {
  id: string;           // Unique identifier (e.g., 'airtime')
  name: string;         // Display name
  weight: number;       // 0-100, must sum to 100 across all criteria
  description?: string; // Hint text for the user
  icon?: string;        // Ionicons icon name
  isLocked?: boolean;   // Whether weight is locked during adjustment
}
```

### Storage on RideLog

```typescript
interface RideLog {
  // ... other fields
  isPendingRating: boolean;              // true until rated
  criteriaRatings?: Record<string, number>; // criterion id -> 1-10 rating
  weightedScore?: number;                // calculated 0-100 score
}
```

---

## Criteria Customization

Managed via CriteriaSetupScreen (`src/screens/CriteriaSetupScreen.tsx`).

### Free Tier
- 5 default criteria (always available)
- Up to 3 custom criteria

### Pro Tier ($29.99/year)
- Unlimited custom criteria
- Custom weight distribution
- Lock individual criterion weights during adjustment

### Configuration Actions

```typescript
// Update all criteria
updateCriteria(criteria: RatingCriteria[]): void

// Mark setup as complete
completeCriteriaSetup(): void

// Get current config
getCriteria(): RatingCriteria[]
getCriteriaConfig(): UserCriteriaConfig
hasCompletedCriteriaSetup(): boolean
```

---

## Rating Entry Points

1. **From Log Flow** (Rate Now button on LogConfirmationCard)
   - Immediate rating after logging a ride
   - RatingModal opens with the new log's data

2. **From Activity Tab** (tap pending item)
   - Deferred rating of a previously quick-logged ride
   - RatingModal opens with the pending log's data

Both paths call `completeRating(logId, ratings, notes?)` on submit.
