# Animation Defaults — EVERY New UI Element (Project-Wide)

## The Rule

**EVERY new interactive or state-changing UI element MUST have animated transitions.** There are ZERO exceptions. Static/instant state changes are NEVER acceptable in this app. If it changes visually, it animates.

This includes but is not limited to:
- Selection states (pills, tabs, cards, checkboxes, toggles)
- Content appearing/disappearing
- Container size changes (height/width adjustments when content changes)
- Navigation between steps/screens
- List item additions/removals
- Any element that goes from state A to state B

## What "animated" means

- Use `withTiming` (duration 150-350ms, Easing.out(Easing.cubic)) for standard transitions
- Use `withSpring` (damping 20+, stiffness 200+) for physical interactions (see no-jello.md)
- Content crossfades: opacity 1→0 (150ms), swap content, opacity 0→1 (150ms)
- Container height changes: animate with withTiming (300-400ms, Easing.out(Easing.cubic))
- Selection highlights: interpolateColor or withTiming opacity (200ms)
- Screen/step transitions: match React Navigation's native push (slide from right)

## What is NEVER acceptable

- Instant color changes on selection (must interpolate)
- Content popping in without fade/slide
- Container height jumping without animation
- Tab/pill selection with no visual transition on the pill itself
- Static text replacement without crossfade
- Any `setState` that causes visible layout shift without animation

## Navigation transitions

Screen-to-screen transitions MUST match React Navigation's native stack push:
- New screen slides from right edge to center
- Old screen slides slightly left with dim overlay
- This is the DEFAULT behavior of `@react-navigation/native-stack`
- Custom in-component step flows should replicate this exactly, or better yet, use actual React Navigation screens

## Check before submitting

Before considering any UI work complete, verify:
1. Does every interactive element animate on state change?
2. Do containers animate their size when content changes?
3. Are there any instant/static visual state changes anywhere?
4. Does the animation feel consistent with the rest of the app?

If ANY answer is "no" or "I'm not sure", fix it before submitting.
