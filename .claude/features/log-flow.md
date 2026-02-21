# Log Flow Specification

The log flow is the core interaction of TrackR -- how users record ("log") a roller coaster ride from the Home screen.

**Phase**: Phase 1 (In Progress)

---

## Flow Diagram

```
Home Screen
  |
  v
Tap "Log" button (pill or circle)
  |
  v
MorphingPill expands from button position
  |
  v
LogModal opens (coaster search interface)
  |
  v
User types coaster name --> debounced search results appear
  |
  v
User taps a coaster result
  |
  v
LogConfirmationCard slides in
  |
  +---> "Quick Log" (outlined button)
  |       |
  |       v
  |     addQuickLog() called
  |       |
  |       v
  |     Success checkmark animation
  |       |
  |       v
  |     Auto-close after brief delay
  |       |
  |       v
  |     Log stored with isPendingRating: true
  |     Appears in Activity tab "Pending" section
  |
  +---> "Rate Now" (filled, accent color button)
          |
          v
        addQuickLog() called first (creates the log)
          |
          v
        LogConfirmationCard slides out
          |
          v
        RatingModal opens with the new log data
          |
          v
        User rates each criterion (sliders, 1.0-10.0)
          |
          v
        User taps "Submit"
          |
          v
        completeRating() called with ratings
          |
          v
        Success feedback
          |
          v
        Modal closes, morph returns to origin
          |
          v
        Log stored with isPendingRating: false
        Appears in Activity tab "Rated" section
```

---

## LogConfirmationCard

Displayed after selecting a coaster in LogModal.

### Content
- Hero image of the coaster (if available)
- Coaster name (large, bold)
- Park name (secondary text)
- Two action buttons at the bottom

### Buttons

**Quick Log** (outlined/secondary style):
- Calls `addQuickLog({ id, name, parkName })` from `rideLogStore`
- Shows a checkmark success animation
- Auto-closes the entire morph after ~1 second
- The created log has `isPendingRating: true`
- User can rate later from the Activity tab

**Rate Now** (filled/primary style, accent color):
- Calls `addQuickLog()` first to create the log entry
- LogConfirmationCard slides out of view
- RatingModal opens immediately with the log ID and coaster data
- After rating is submitted, `completeRating()` is called
- The log is updated with `isPendingRating: false`, `criteriaRatings`, and `weightedScore`

---

## RatingModal

Full rating interface opened from "Rate Now" or from Activity tab pending items.

### Layout
- **Collapsible hero header**: Shows coaster image, name, park. Collapses on scroll.
- **Criteria sliders**: One slider per criterion from user's config
- **Score display**: Calculated weighted score shown in real time
- **Submit button**: Saves the rating

### Slider Behavior
- Range: 1.0 to 10.0
- Precision: 0.5 increments (half-point)
- Visual: Custom slider with accent color fill
- Haptic feedback on half-point snaps

### Score Calculation
```
weightedScore = sum( (rating / 10 * 100) * (weight / 100) ) for each criterion
```

Example with default criteria:
- Airtime: 8.0 (weight 25%) = (80) * 0.25 = 20.0
- Intensity: 7.5 (weight 25%) = (75) * 0.25 = 18.75
- Smoothness: 9.0 (weight 20%) = (90) * 0.20 = 18.0
- Theming: 6.0 (weight 15%) = (60) * 0.15 = 9.0
- Pacing: 7.0 (weight 15%) = (70) * 0.15 = 10.5
- **Total**: 76.25 -> rounded to **76**

### Submit
- Calls `completeRating(logId, ratings, notes?)` on rideLogStore
- Triggers success haptic feedback
- Closes modal
- Log is now fully rated in the store

---

## Data Flow

### Store Actions Used

```typescript
// Quick Log creates a new pending log
const newLog = addQuickLog(
  { id: coasterId, name: coasterName, parkName },
  seatPosition?  // optional
);
// Returns: RideLog with isPendingRating: true

// Complete Rating updates an existing log
completeRating(
  logId,                    // string
  ratings,                  // Record<string, number> -- criteria id -> 1-10
  notes?                    // optional string
);
// Updates: isPendingRating -> false, adds criteriaRatings + weightedScore
```

### Activity Tab Integration
- `getPendingLogs()` returns all logs where `isPendingRating === true`
- `getPendingCount()` returns the count (used for tab badge)
- Activity tab subscribes to store changes and updates reactively
- Tapping a pending log in Activity opens RatingModal for that log

---

## Haptic Feedback Points

- Button press (Log button): `Haptics.impactAsync(Light)`
- Coaster selected: `Haptics.impactAsync(Medium)`
- Quick Log success: `Haptics.notificationAsync(Success)`
- Slider snap to half-point: `Haptics.selectionAsync()`
- Rating submitted: `Haptics.notificationAsync(Success)`
- Modal close: `Haptics.impactAsync(Light)`
