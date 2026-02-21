# Home Screen Detailed Spec

The Home screen (`src/screens/HomeScreen.tsx`) is the app's primary surface and the most complex screen in the codebase (~3298 lines). This document describes its architecture, layout, and interaction design.

---

## Layout Structure

```
+------------------------------------------+
|  Status Bar                              |
+------------------------------------------+
|  HEADER (collapsible)                    |
|  +--------------------------------------+|
|  | Search Bar [Log] [Search] [Scan]     ||
|  +--------------------------------------+|
+------------------------------------------+
|                                          |
|  NEWS FEED (FlatList)                    |
|  +--------------------------------------+|
|  | NewsCard                             ||
|  +--------------------------------------+|
|  | NewsCard                             ||
|  +--------------------------------------+|
|  | ...                                  ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
|  Tab Bar                                 |
+------------------------------------------+
```

---

## Header Behavior

The header has two states driven by scroll position.

### Expanded State (scroll near top)
- Full-width search bar with rotating placeholder text
- Three pill-shaped action buttons in a row beside the search bar: **Log**, **Search**, **Scan**
- Each pill shows an icon + label

### Collapsed State (scrolled down)
- Compact search bar (narrower)
- Three circle action buttons (icon only, no label)
- Header takes up less vertical space

### Scroll Animation
- All header animations use Reanimated shared values running on the UI thread
- Scroll position drives interpolation between expanded and collapsed states
- Header collapses as user scrolls down
- Header expands as user scrolls back up
- Smooth spring-based transitions between states

---

## Action Buttons

Three action buttons sit in the header: **Log**, **Search**, **Scan**.

Each button:
1. Measures its on-screen position using `onLayout` + refs
2. On tap, triggers a MorphingPill that expands from the button's exact position to fill the screen
3. The morph uses the "hero morph" animation pattern (see `animation/morph-system.md`)

### Log Button
- Icon: `add-circle-outline`
- Morph expands into LogModal
- LogModal provides coaster search
- Selecting a coaster shows LogConfirmationCard
- LogConfirmationCard offers Quick Log or Rate Now paths

### Search Button
- Icon: `search`
- Morph expands into SearchModal
- SearchModal provides global search across coasters, parks, guides, news

### Scan Button
- Icon: `scan-outline`
- Currently broken (wallet system needs Phase 2 rebuild)
- Will morph into wallet quick-use overlay

---

## Morph Origins

The MorphingPill system supports multiple origin points. Each action button and the search bar itself can be a morph origin:

- **Expanded search bar**: Morphs into SearchModal
- **Search pill button**: Morphs into SearchModal
- **Collapsed search bar**: Morphs into SearchModal
- **Collapsed circle button**: Morphs into SearchModal
- **Log pill/circle**: Morphs into LogModal
- **Scan pill/circle**: Morphs into ScanModal (Phase 2)

The origin position is captured via `ref.current.measureInWindow()` before starting the morph animation.

---

## News Feed

Below the header, a FlatList renders NewsCard components from `src/data/mockNews.ts`.

- Vertical scrollable list
- Each card shows: title, source name, hero image, timestamp
- Cards use BaseCard with spring press feedback
- Pull-to-refresh (future)
- "On This Day" memories section (future, Phase 3)

---

## State Management

The Home screen interacts with:
- **TabBarContext**: Registers a reset handler so tapping the Home tab while already on Home closes any open morphs
- **rideLogStore**: `addQuickLog()` and `completeRating()` for the log flow

---

## Known Issues

1. **File size**: At ~3298 lines, HomeScreen.tsx is very large. The morph logic is partially inline rather than fully extracted to hooks/components. Future refactoring should extract more logic into MorphingPill and dedicated hooks.
2. **TypeScript ref warning**: There is a cosmetic TypeScript type mismatch on some refs. Does not affect functionality.
