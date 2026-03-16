## 7. Interaction Patterns

### 7.1 Haptic Feedback

```javascript
haptics = {
  tap:     Haptics.impactAsync(ImpactFeedbackStyle.Light),    // Menu items, small buttons, tab switches
  select:  Haptics.impactAsync(ImpactFeedbackStyle.Medium),   // Card selection, important presses
  heavy:   Haptics.impactAsync(ImpactFeedbackStyle.Heavy),    // Destructive actions, confirmations
  success: Haptics.notificationAsync(NotificationFeedbackType.Success), // Log complete, rating saved
  error:   Haptics.notificationAsync(NotificationFeedbackType.Error),   // Failures
  warning: Haptics.notificationAsync(NotificationFeedbackType.Warning), // Warnings
  tick:    Haptics.selectionAsync(),                           // Slider movement, picker change
  snap:    Haptics.impactAsync(ImpactFeedbackStyle.Light),    // Toggle, snap-to-grid
}
```

**Rules:**
- Every user-initiated action fires a haptic. No silent taps.
- `haptics.tap()` is the default. Use it unless there's a specific reason not to.
- `haptics.select()` for actions with consequence (selecting an item, opening a modal).
- `haptics.success()` / `haptics.error()` for completion states.

### 7.2 Press Feedback

Every interactive element uses the `useSpringPress` hook:

```javascript
// Press in: scale down + opacity dim
scaleAnim = withSpring(targetScale, SPRINGS.responsive)
opacityAnim = withTiming(targetOpacity, { duration: TIMING.instant })

// Press out: spring back
scaleAnim = withSpring(1, SPRINGS.responsive)
opacityAnim = withTiming(1, { duration: TIMING.instant })
```

**Presets:**
| Preset | Scale | Opacity | Use For |
|--------|-------|---------|---------|
| `useSubtlePress()` | 0.98 | 1.0 | Cards, large areas |
| `useSpringPress()` | 0.97 | 1.0 | Standard buttons |
| `useStrongPress()` | 0.95 | 1.0 | Primary CTAs |
| `useCardPress()` | 0.98 | 0.9 | News cards, tappable rows |

### 7.3 Scroll Behavior

- Feed scrolls under a fixed sticky header
- Scroll down 50px+ → header collapses (search bar shrinks, pills become circles)
- Any upward scroll > 5px → header expands
- 400ms cooldown between state changes prevents bounce-triggered rapid switching
- Bounce at top/bottom is ignored (no state changes during overscroll)

### 7.4 Modal Lifecycle

```
User taps button → haptics.tap()
                 → isModalAnimating = true (touch block overlay appears)
                 → MorphingPill.open() called
                 → Pill measures position
                 → Origin button crossfades out
                 → Pill morphs to modal (850ms)
                 → Backdrop fades in (510ms)
                 → Content fades in (delayed 425ms, duration 280ms)
                 → isModalAnimating = false (touch block removed)

User taps close  → haptics.tap()
                 → Keyboard dismissed
                 → Content fades out (255-300ms)
                 → Backdrop fades out (340-435ms)
                 → Pill morphs to origin (470ms + spring snap)
                 → Z-index drops when backdrop opacity < 0.01
                 → Pill swaps to real button
                 → Modal state cleared
```
