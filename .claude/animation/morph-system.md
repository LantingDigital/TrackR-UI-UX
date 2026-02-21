# Hero Morph Animation System

The "hero morph" is TrackR's signature interaction pattern. UI elements morph from their origin position on screen into full-screen modal overlays with spring physics, bounce arcs, and orchestrated content reveals.

**Implementation**: `src/hooks/useMorphAnimation.ts` and `src/components/MorphingPill.tsx`

---

## Overview

```
Origin (pill/button)  -->  Bounce Arc  -->  Full-Screen Modal
[small, positioned]       [arcs up]        [fills screen]
```

The morph has two phases:
1. **Open**: Element arcs upward with a bounce, expands to fill the screen, content fades in during landing
2. **Close**: Content fades out first, then element shrinks linearly back to origin

---

## Animated Values

The `useMorphAnimation` hook manages five animated values:

| Value | Range | Purpose |
|-------|-------|---------|
| `morphProgress` | 0 -> 1 | Overall expansion progress (origin -> final size) |
| `bounceProgress` | 0 -> 1 | Bounce arc progress (spring-driven, overshoots) |
| `backdropOpacity` | 0 -> 1 | Backdrop blur layer opacity |
| `contentFade` | 0 -> 1 | Modal content opacity (delayed fade-in) |
| `closePhase` | 0 or 1 | Curve selector: 0 = bounce curve (open), 1 = linear curve (close) |

---

## Open Animation -- Bounce Arc

When opening, the element follows a bounce arc with these keyframes:

### Vertical Position (top)

| bounceProgress | Position | Description |
|----------------|----------|-------------|
| 0.00 | origin.top | Starting position |
| 0.35 | finalTop - arcHeight | Peak of arc (above final position) |
| 0.70 | finalPosition.top | Arrives at final position |
| 0.85 | finalPosition.top + 8 | Slight overshoot (settles down) |
| 1.00 | finalPosition.top | Settled at final position |

The `bounceArcHeight` parameter (default: 60px) controls how high above the final position the element arcs.

### Size Expansion (width, height)

| bounceProgress | Size | Description |
|----------------|------|-------------|
| 0.00 | origin size | Starting dimensions |
| 0.35 | 80% of final | Most of expansion happens during arc up |
| 0.70 | 100% of final | Full size by the time it descends |
| 1.00 | 100% of final | Settled |

### Horizontal Position (left)

Left position settles early (by 0.35 of bounce progress) since the arc is primarily vertical.

### Border Radius

Follows the same interpolation curve as width/height, transitioning from origin border radius (e.g., pill shape) to final border radius (e.g., modal corners).

---

## Animation Orchestration (Open)

All animations run in parallel:

```
Time -->

morphProgress:   |====== 500ms timing (cubic ease-out) ======|
bounceProgress:  |===== spring (morph config) ============..===| (overshoots, settles)
backdropOpacity: |==== 400ms timing ====|
contentFade:     |---- 400ms delay ----|=== 250ms fade ===|
```

- `morphProgress`: Timing animation (500ms, `Easing.out(Easing.cubic)`)
- `bounceProgress`: Spring animation (`SPRINGS.morph`: damping 14, stiffness 42, mass 1.2)
- `backdropOpacity`: Timing (400ms slow fade)
- `contentFade`: Timing (250ms) with 400ms delay -- content only appears during the landing phase

---

## Close Animation

The close animation is a two-step sequence:

### Step 1: Fade out content (150ms)
```
contentFade: 1 -> 0 (fast timing)
```

### Step 2: Morph back + fade backdrop (in parallel)
```
morphProgress:   1 -> 0 (300ms, cubic ease-out)
backdropOpacity: 1 -> 0 (250ms timing)
```

The `closePhase` value is set to 1 before close begins, which switches the position interpolation from the bounce curve to a simple linear interpolation. This ensures the close animation is smooth and direct (no bounce arc on the way back).

### Curve Blending

Position is calculated as a blend of two curves:

```
position = (bounceCurve * (1 - closePhase)) + (linearCurve * closePhase)
```

- When `closePhase = 0` (opening): Uses bounce curve with arc
- When `closePhase = 1` (closing): Uses linear interpolation

---

## Opacity Layers

| Layer | Interpolation | Purpose |
|-------|---------------|---------|
| **Pill opacity** | morphProgress [0, 0.05, 0.15] -> [0, 0.5, 1] | Morphing pill fades in quickly at start |
| **Placeholder opacity** | morphProgress [0, 0.3] -> [1, 0] | Origin placeholder text fades out |
| **Backdrop** | backdropOpacity 0 -> 1 | Blur backdrop fades in |
| **Content** | contentFade 0 -> 1 (delayed) | Modal content appears during landing |

---

## Usage

```typescript
const morph = useMorphAnimation({
  originPosition: { top: 100, left: 20, width: 200, height: 50, borderRadius: 25 },
  finalPosition: { top: 60, left: 16, width: screenWidth - 32, height: 56, borderRadius: 16 },
  bounceArcHeight: 60,  // optional, default 60
  useBounce: true,       // optional, default true
  onOpenComplete: () => {},
  onCloseComplete: () => {},
});

// Open
morph.open();

// Close
morph.close(() => setVisible(false));

// Reset (e.g., on tab switch)
morph.reset();

// Update origin dynamically (e.g., after scroll changes layout)
morph.updateOrigin({ top: 150, left: 20, width: 200, height: 50, borderRadius: 25 });
```

### Applying Position Values

```tsx
<Animated.View style={{
  position: 'absolute',
  top: morph.position.top,
  left: morph.position.left,
  width: morph.position.width,
  height: morph.position.height,
  borderRadius: morph.position.borderRadius,
  opacity: morph.opacity.pill,
}}>
  {/* Modal content */}
  <Animated.View style={{ opacity: morph.opacity.content }}>
    ...
  </Animated.View>
</Animated.View>

{/* Backdrop */}
<Animated.View style={{ opacity: morph.opacity.backdrop }}>
  <BlurView ... />
</Animated.View>
```

---

## Migration Note

The current `useMorphAnimation` hook still uses the legacy `react-native` Animated API internally. It is a migration candidate -- see `animation/migration-log.md`. The API surface (open/close/reset/position/opacity) should remain the same after migration to Reanimated shared values.
