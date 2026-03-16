## 11. Quality Checklist

Run this against every screen before shipping:

### Animation Quality
- [ ] All springs use approved configs from Section 2.2 (responsive, bouncy, morph, gentle, stiff, button, closeSnap)
- [ ] No `withTiming` without an easing curve (except opacity fades, which can be linear)
- [ ] No legacy `Animated` API usage — all Reanimated
- [ ] All scroll-driven animations use `useAnimatedScrollHandler` on UI thread
- [ ] No `width`/`height` animation on elements with expensive children — use transforms
- [ ] Shadow layers don't blink or flash during any transition
- [ ] No single-frame gaps during content crossfades (overlap range sufficient)
- [ ] Close animations are independently designed, not reversed opens
- [ ] All animation durations use values from Section 2.3 or derived proportionally

### Visual Quality
- [ ] All colors reference the color token system (Section 5) — no inline hex codes
- [ ] All spacing uses the spacing scale (Section 3.1) — no magic numbers
- [ ] All typography matches the type hierarchy (Section 4)
- [ ] All shadows use one of the four preset levels (Section 6.1)
- [ ] All border radii use the radius token system (Section 9)
- [ ] Page background is `#F7F7F7`, card surfaces are `#FFFFFF`
- [ ] Shadow color is `#323232`, never `#000000`
- [ ] Only three text grays used: `#000000`, `#666666`, `#999999`

### Interaction Quality
- [ ] Every tappable element has press feedback via `useSpringPress`
- [ ] Haptic feedback fires on every user-initiated action
- [ ] Press states provide immediate visual feedback (< 16ms)
- [ ] No silent taps — every interaction is acknowledged
- [ ] Modal touch-blocking overlay active during open/close animations

### State Management
- [ ] Z-index is managed correctly (no shadow overcast, no touch interception issues)
- [ ] Tab blur resets all modal state (no orphaned overlays after tab switch)
- [ ] Scroll state resets correctly on tab focus
- [ ] No boolean animation locks without physical overlay backup
- [ ] `scrollHidden` / button opacity swaps handle both first-open and re-open correctly

### Cohesion
- [ ] Screen feels like it belongs next to the HomeScreen
- [ ] Animation timing feels proportional to existing screen animations
- [ ] Spacing ratios match (16px margins, 12px gaps, 8px tight gaps)
- [ ] Typography hierarchy follows the same weight/size patterns
- [ ] The screen answers: "Where did this come from?" and "Where does this go?" through motion
