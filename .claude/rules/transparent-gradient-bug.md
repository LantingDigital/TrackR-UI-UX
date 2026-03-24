# CSS `transparent` in Gradients = Gray Banding (NEVER USE)

## The Bug

In React Native (and CSS), `transparent` is defined as `rgba(0, 0, 0, 0)` — BLACK at zero opacity. When a gradient interpolates between white and `transparent`, it passes through semi-transparent GRAY:

- Start: `rgba(255, 255, 255, 0.88)` — white
- Mid: `rgba(128, 128, 128, 0.44)` — GRAY (interpolated)
- End: `rgba(0, 0, 0, 0)` — "transparent" (actually black)

This creates a visible gray band in the middle of the gradient.

## The Fix

ALWAYS use the same RGB values with zero alpha instead of `transparent`:

```tsx
// WRONG — creates gray banding
colors: ['rgba(255, 255, 255, 0.88)', 'transparent']

// CORRECT — stays white the whole way
colors: ['rgba(255, 255, 255, 0.88)', 'rgba(255, 255, 255, 0)']
```

## Where This Applies

- GlassHeader component (fog overlays)
- Any LinearGradient that fades to "transparent"
- SheetFog, FogHeader, or any future gradient overlay

## Discovered: 2026-03-19

Spent 3+ iterations debugging visible gray bands in the GlassHeader before identifying `transparent` as the root cause.
