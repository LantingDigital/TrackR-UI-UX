## 10. Anti-Patterns & Lessons Learned

### 10.1 Shadow Overcast During Morph Close

**Problem:** When the MorphingPill closed back to a button, its shadow was still elevated (large offset, high opacity) as it passed through the button area, creating a dark "stain" over the buttons below.

**Root cause:** A single shadow fade curve doesn't account for what's underneath the pill at different points in its trajectory.

**Fix:** Origin-aware shadow curves. For bar origins (positioned above buttons): `closeShadowFade=true` fades the shadow to 0 before the pill enters the button zone. For button origins: default shadow curve since the pill IS the button.

**Lesson:** Shadow animation needs per-origin curves based on visual context.

### 10.2 Ghost Double Image on Re-open

**Problem:** First time opening a MorphingPill looked perfect. Second open showed a "ghost" — both the real button AND the pill visible simultaneously.

**Root cause:** First open: pill fades from opacity 0 → 1, so a 120ms crossfade works. Second open: pill is already at full opacity from the previous close, so both layers are visible at full opacity.

**Fix:** Check `scrollHidden` to distinguish first-open from re-open. On re-open, hide the real button instantly instead of crossfading.

**Lesson:** Crossfade timing must account for the STARTING state of each layer, not just the end state.

### 10.3 Rotating Placeholder Text Blink

**Problem:** The rotating placeholder in the search bar blinked for one frame during text transitions.

**Root cause:** Text state update (React re-render) and animation progress reset were happening in different frames, creating a gap.

**Fix:** Use `withTiming` completion callback + `requestAnimationFrame` to sync the text swap with the progress reset in the same frame.

**Lesson:** When animated elements coordinate with React state, sync them via animation callbacks + rAF, not independent timing.

### 10.4 Gradient Redraw Jank

**Problem:** The fog gradient at the top of the feed dropped frames during scroll animations.

**Root cause:** Animating the gradient's `height` property forced the 12-stop LinearGradient to be redrawn (re-rasterized) every single frame.

**Fix:** Pre-render the gradient at full height, then animate `scaleY` + `translateY` transforms. The GPU scales the pre-rendered texture without redrawing.

**Lesson:** Never animate layout properties (`width`, `height`) on elements with expensive children (gradients, SVGs). Use transform-based animations.

### 10.5 Boolean Animation Lock Deadlock

**Problem:** A single `modalAnimLockRef` boolean gated all press handlers. Under certain race conditions, the lock was never released, permanently freezing the UI.

**Fix:** Two-layer approach: (1) Physical touch-blocking overlay at z=9999 that automatically disappears when animation completes. (2) `isModalAnimatingRef` as backup logical guard.

**Lesson:** Never use a single boolean as an animation lock. Use a physical overlay as the primary gate (self-healing if code path fails) with boolean as backup.

### 10.6 Legacy Animated API on JS Thread

**Problem:** Scroll-driven animations using React Native's `Animated` API ran on the JS thread, dropping frames and lagging after tab navigation.

**Fix:** Migrated all scroll and gesture animations to Reanimated (UI thread). Used `useAnimatedScrollHandler` instead of `Animated.event`.

**Lesson:** All scroll-driven, gesture-driven, or high-frequency animations MUST use Reanimated shared values. The JS thread is too congested for 60fps.

### 10.7 borderRadius in Worklets

**Problem:** `MorphingActionButton` calculated `borderRadius` inside an animated worklet, wasting CPU cycles per frame.

**Fix:** Set `borderRadius` as a static StyleSheet value. The renderer auto-clamps `borderRadius` to `min(width, height) / 2` at any size, so a static value of 21 (circle half-height) works at every animation point.

**Lesson:** If the renderer auto-clamps a property, make it static rather than computing it per frame.

### 10.8 Close ≠ Reverse Open

**Problem:** Early implementation reversed the open animation for close. It felt unnatural — like watching a video played backward.

**Fix:** Designed close as an independent animation: different duration (470ms vs 850ms), different easing (Easing.out(cubic) vs bezier), valley arc overshoot below origin (-0.04), spring snap back.

**Lesson:** Open and close are psychologically different actions. Open = anticipation + reveal. Close = dismissal + return. They need independent timing, easing, and character.

### 10.9 Proportional Speed Scaling

**Problem:** Individual animation durations were tweaked independently, breaking the internal timing ratios that made sequences feel cohesive.

**Fix:** Applied a uniform 0.85x multiplier to ALL modal animation durations, preserving internal ratios while reducing absolute duration.

**Lesson:** When adjusting animation speed, scale ALL durations by the same factor to preserve the "feel."
