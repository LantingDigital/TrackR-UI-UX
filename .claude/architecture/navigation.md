# Navigation Architecture

TrackR uses React Navigation with a bottom tab navigator. All complex interactions (modals, overlays) are handled as in-screen overlays rather than stack navigation.

---

## Tab Structure

5-tab bottom navigation implemented in `src/navigation/TabNavigator.tsx`:

```
Home | Discover | Play | Activity | Profile
 house  compass  game    time     person
```

| Tab | Screen Component | Icon (Ionicons) |
|-----|-----------------|-----------------|
| Home | HomeScreen | `home-outline` |
| Discover | DiscoverScreen | `compass-outline` |
| Play | PlayScreen | `game-controller-outline` |
| Activity | ActivityScreen | `time-outline` |
| Profile | ProfileScreen | `person-outline` |

---

## Tab Navigator

**File**: `src/navigation/TabNavigator.tsx`

Uses `createBottomTabNavigator()` from `@react-navigation/bottom-tabs`.

### Custom Tab Bar: AnimatedTabBar
The default tab bar is replaced with a custom `AnimatedTabBar` component that supports:
- Animated show/hide (slides off-screen when hidden)
- Custom dot badge on Activity tab (pending count from rideLogStore)
- Tab reset behavior on re-tap

### Tab Bar Styling
- Background: `#FFFFFF`
- Border top: 0.5px `#E5E5E5`
- Active color: `#CF6769` (accent)
- Inactive color: `#999999` (meta text)
- Icon size: 24
- Label font size: 10, weight 500
- Height: 49px + safe area bottom inset

### Badge
- Activity tab shows a small dot badge (8x8, `#CF6769`) when `getPendingCount() > 0`
- Badge count subscribes to rideLogStore changes via `usePendingCount()` hook

---

## Tab Bar Visibility

**File**: `src/contexts/TabBarContext.tsx`

The `TabBarProvider` wraps the app and provides:

```typescript
interface TabBarContextValue {
  tabBarTranslateY: Animated.Value;  // 0 = visible, 1 = hidden
  hideTabBar: (duration?: number) => void;
  showTabBar: (duration?: number) => void;
  registerResetHandler: (screenName: string, handler: () => void) => void;
  unregisterResetHandler: (screenName: string) => void;
  resetScreen: (screenName: string) => void;
  resetAllScreens: () => void;
}
```

### Hide/Show Tab Bar
- `hideTabBar()`: Animates tab bar down off-screen (for full-screen modals, confirmation cards)
- `showTabBar()`: Animates tab bar back up
- Default duration: 300ms timing animation

### Screen Reset System
- Each screen can register a reset handler via `registerResetHandler(screenName, fn)`
- When user taps an already-active tab, `resetScreen(screenName)` is called
- HomeScreen uses this to close any open morphs when the Home tab is re-tapped
- When navigating to a different tab, reset is deferred via `InteractionManager.runAfterInteractions()`

---

## Navigation Pattern: In-Screen Overlays

TrackR does NOT use stack navigators for modals. Instead, all modal experiences (Log, Search, Scan, Rating) are rendered as overlay components within the screen itself, using the MorphingPill hero morph system.

### Benefits
- Hero morph animations work perfectly (element morphs from exact origin)
- No navigation transition conflicts
- Tab bar can be hidden/shown independently

### Drawbacks
- HomeScreen is very large (~3298 lines) because it contains all morph overlay logic
- No automatic back gesture/button handling (must implement manually)

### Future Consideration
If sub-screens are needed (e.g., coaster detail from Discover), a Stack navigator can be nested inside individual tabs. This has not been implemented yet.

---

## Root Navigator

**File**: `src/navigation/RootNavigator.tsx`

The root navigator wraps the TabNavigator. Currently minimal -- exists to support future additions like authentication screens or onboarding flow above the tab level.

---

## Navigation Hooks

Access tab bar control from any screen:

```typescript
import { useTabBar } from '../contexts/TabBarContext';

const tabBar = useTabBar();
tabBar?.hideTabBar();
tabBar?.showTabBar();
tabBar?.registerResetHandler('Home', () => closeAllMorphs());
```
