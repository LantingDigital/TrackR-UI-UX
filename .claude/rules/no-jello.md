# No Jello Effect -- Animation Rule (Project-Wide)

## What "Jello" Means

The "jello effect" is when a spring animation overshoots its target and wobbles/bounces back, making UI elements look like they're made of gelatin. This happens when spring configs have:
- Low damping (< 15)
- Low stiffness relative to mass
- High overshoot that causes visible oscillation

## The Rule

**NEVER use overshoot/bouncy spring animations for standard UI transitions.** This includes:
- Screen entrances and exits
- Modal presentations
- Card reveals
- List item appearances
- Form transitions
- Bottom sheet presentations
- Any content that slides, fades, or scales into view

Overshoot makes the app feel cheap and immature. TrackR is a premium app. Animations should feel **smooth, weighted, and decisive** -- like a luxury car door closing, not a trampoline.

## What To Use Instead

### For screen/modal/content transitions:
Use `SPRINGS.responsive` or `SPRINGS.stiff` -- they settle quickly with minimal/no visible overshoot:
```typescript
// CORRECT: Smooth, decisive entrance
value.value = withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }); // stiff
value.value = withSpring(1, { damping: 16, stiffness: 180, mass: 0.8 }); // responsive

// CORRECT: Timing with easing for simple fades/slides
value.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
```

### For press feedback (scale down/up on tap):
Springs are fine here because the overshoot is tiny (0.97 -> 1.0 range):
```typescript
// OK: Press feedback has minimal travel distance, overshoot is imperceptible
scaleValue.value = withSpring(1, SPRINGS.responsive);
```

### When overshoot IS acceptable:
- **Celebratory/reward moments only**: e.g., Coastle hint unlock animation, achievement badges, confetti. These are earned moments where a little bounce communicates delight.
- Extremely small movements (< 5px or < 3% scale) where overshoot is imperceptible
- Pull-to-refresh rubber band effect (this is expected iOS behavior)
- Press feedback (scale 0.97 -> 1.0 range, travel distance too small to notice)

The key distinction: if the user just did something mundane (opened a screen, submitted a form, scrolled to a section), NO bounce. If the user just accomplished something (solved a puzzle, unlocked a hint, earned an achievement), a subtle bounce is welcome.

## Wrong vs Right

```typescript
// WRONG: Jello entrance animation
const entranceStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(1, { damping: 10, stiffness: 100, mass: 1 }) }],
  // This will visibly bounce past scale 1.0 and wobble back -- jello
}));

// WRONG: Bouncy slide-in
translateY.value = withSpring(0, { damping: 12, stiffness: 80 });
// Will overshoot past 0 and oscillate -- jello

// RIGHT: Smooth, weighted entrance
const entranceStyle = useAnimatedStyle(() => ({
  opacity: withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }),
  transform: [
    { translateY: withSpring(0, { damping: 20, stiffness: 200, mass: 0.9 }) },
  ],
}));

// RIGHT: Clean scale entrance
scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
```

## Spring Damping Quick Reference

| Damping | Overshoot | Feel | Use Case |
|---------|-----------|------|----------|
| 8-12 | Heavy | Jello/bouncy | NEVER for standard UI |
| 14 | Moderate | Noticeable bounce | Only for celebrations |
| 16-18 | Minimal | Snappy with slight settle | Press feedback, small moves |
| 20+ | None/negligible | Smooth and decisive | Screen transitions, modals, content |

**When in doubt, use higher damping.** A slightly overdamped animation always looks more premium than an underdamped one.
