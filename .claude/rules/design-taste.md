# TrackR Design Taste

Project-specific taste that extends `context/caleb/design-taste.md`. These are lessons learned from building TrackR's UI — what works, what doesn't, and why.

For universal Caleb preferences, read: `context/caleb/design-taste.md`
For technical design specs, read: `DESIGN_SYSTEM/index.md` and sub-files

## The TrackR Vibe

"Premium minimalism with playful physics." Not a utility app. Not a social app. It's the app that makes people say "this is the best-designed app on my phone." Every screen should feel like it could be in an Apple keynote demo.

Inspirations: Apple iOS system animations, Airbnb's search morph, Things 3 press feedback, Linear typography.

## Approved Patterns (Reference These)

These are components/screens Caleb has approved. Study their feel when building new things:

- **MorphingPill** — the hero animation. A button physically becomes a modal. No separate overlay. The element IS both states. This is the gold standard for TrackR interactions.
- **NewsCard** — golden ratio image, soft shadow, clear text hierarchy. Press feedback scales to 0.96 with opacity dim.
- **Header collapse/expand** — search bar and action pills morph between expanded and collapsed states on scroll. Staggered timing with per-button "swoop intensity."
- **Section card cascade** — when modals open, content cards animate in with staggered waterfall timing. Each card "pulls down like a projector screen."
- **useSpringPress** — spring-based press feedback on everything. Scale down on press, spring back on release. Never timing-based.

## Rejected Patterns (Never Repeat These)

- **Jello/bouncy entrances** — low-damping springs on screen transitions. Feels like a kids' app. See `.claude/rules/no-jello.md`.
- **Keyframe interpolation** — straight line segments between points. Looks robotic. Use spring physics or eased curves.
- **Silent interactions** — any tap without haptic + visual feedback. Every interaction is acknowledged.
- **Single boolean animation locks** — caused deadlocks. Use physical touch-blocking overlay + boolean backup.
- **Animating layout properties on expensive children** — caused gradient jank. Use transform-based animations (scaleY/translateY) instead of height/width.
- **Reversed close animations** — closing should feel different from opening. Different duration, easing, and character.
- **Shadow overcast** — pill shadow visible over buttons during morph close. Fixed with origin-aware shadow curves.
- **Character-by-character text reveal** — individual letter animations (wave, stagger, bend). Feels gimmicky and off-brand. Nothing else in the app does this. Use simple, clean text presentation: fade-in + subtle translateY at most. Text should appear as a whole unit, not letter-by-letter.

## Color Rules

- Page: `#F7F7F7` (never pure white)
- Cards: `#FFFFFF` (lift off page)
- Accent: `#CF6769` (rose/coral — the ONLY accent color)
- Text: exactly three grays — `#000000`, `#666666`, `#999999`
- Shadows: `#323232` (never black)
- No other gray values. No blue tints. No cool tones.

## Fog Rules (updated 2026-03-19)

### Two fog systems in the app:

**1. FogHeader (warm fog) — Main tab screens only**
- Used on: HomeScreen, ParksScreen, CommunityScreen, LogbookScreen
- Color: warm `rgba(240, 238, 235, ...)` — matches the main screen aesthetic
- Fully opaque (0.97) through header, micro-stepped fade below
- These are APPROVED and should NOT be changed

**2. GlassHeader (clean fog) — Secondary/pushed screens**
- Used on: Settings, Profile, Merch, Articles, all settings sub-screens
- Color: page background `rgba(247, 247, 247, ...)` — clean white, no warm tint
- APPROVED values (2026-03-19):
  - Header zone: 0.88 opacity (content visible but foggy, NOT fully opaque)
  - Fade distance: 60px
  - Fade curve: 0.88 → 0.82 → 0.70 → 0.52 → 0.32 → 0.15 → 0.05 → 0.01 → transparent
  - 10 gradient stops, smooth S-curve
- Key principles:
  - Content behind the header must ALWAYS be somewhat visible (foggy, not hidden)
  - Fade must reach fully transparent (0.0) — no hard line at the bottom
  - Header is translucent, not opaque — this is what makes it feel like iOS native

### Scroll-Based Fog Crossfade (APPROVED pattern for screens with hero content)

When a screen has content that starts near/under the header (like a profile avatar), the fog should NOT cover it at rest. Instead:

1. Fog starts at `opacity: 0` (invisible)
2. As user scrolls, fog crossfades in over the first ~80px of scroll
3. Content is fully visible at top, fog gradually takes over

Implementation:
```tsx
const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => { scrollY.value = event.contentOffset.y; },
});
const fogAnimStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.value, [0, 80], [0, 1], 'clamp'),
}));

// Wrap GlassHeader in Animated.View with fogAnimStyle
<Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, fogAnimStyle]}>
  <GlassHeader headerHeight={topBarHeight} />
</Animated.View>
```

Use this pattern on: ProfileScreen, ProfileView, and any screen where hero content (avatars, images, featured cards) sits directly below the header.

Do NOT use on screens where content starts well below the header (Settings, sub-screens) — those use static GlassHeader at full opacity.

### What was tried and rejected (2026-03-19):
- **expo-blur + MaskedView**: Creates a hard line where blur exists vs doesn't. Blur opacity != blur intensity. Always visible and jarring.
- **@callstack/liquid-glass (UIGlassEffect)**: Renders real Apple glass material but as a hard-edged rectangle. No feathered edge. Wrong use case for headers.
- **React Navigation native header** (`headerShown: true` + `headerBlurEffect`): Sharp bottom edge, no feathered blur. react-native-screens doesn't produce the iOS 26 liquid glass feathered edge.
- **BlurFogHeader (previous session)**: Wrong color base, wrong approach. Scrapped entirely.
- **Fully opaque header (1.0)**: Content completely hidden behind header = wrong. Must be translucent.
- **Gradient that stops at 0.30**: Creates a hard line at the bottom where 0.30 meets 0.0.

### Lesson: The iOS 26 feathered-blur nav bar is SwiftUI-native and cannot be replicated in React Native. The approved GlassHeader gradient is the best approximation — clean, smooth, no hard lines.

## When Building New Game UIs

- Games are line entertainment — played while waiting in line at a park
- Cards/tiles should feel tactile and collectible
- Left-aligned game titles (not centered)
- Game UI should feel like a premium mini-app within the main app, not a web game bolted on
- Reference existing games (Coastle, Trivia) for tone

## Iteration History

This section grows with each iteration cycle. Format: what was tried, what was rejected, what worked, and why.

### Header Fog — 6 iterations to approval (2026-03-19)
- **Goal:** Replicate iOS 26 native feathered-blur navigation bar header
- **Tried:** BlurFogHeader (custom gradient, wrong color), React Navigation native header (hard edge), expo-blur + MaskedView (hard blur line), @callstack/liquid-glass (glass material but hard rectangle), CleanFogHeader (fades to 0% = content disappears), gradient ending at 0.30 (hard line at bottom)
- **Approved:** GlassHeader — 0.88 opacity header (translucent, not opaque), smooth S-curve fade to transparent over 60px. Clean `#F7F7F7` base color.
- **Key insight:** The header must be TRANSLUCENT (content visible but foggy), not opaque. And the fade must reach fully transparent — any non-zero floor creates a hard line. The iOS native effect cannot be replicated in RN; this gradient is the best approximation.

### ProfileReady Onboarding — v1 rejected (2026-03-10)
- **Built:** Particle convergence animation with character-by-character name reveal, glow ring, accent pulse, dark→light bg transition
- **Rejected:** "I don't like the bend in the text for the username. It's just small, and nothing else in the app does that." Particles didn't actually disappear — lingered awkwardly.
- **New direction:** Tunnel-to-light concept. Particles fly TOWARD camera (3D depth, like emerging from a tunnel). Light blooms at exit. Camera "exposure" adjusts (overexposed white → settles to page color). Cinematic, not decorative.
- **Lesson:** Text animations must match the app's existing patterns. If nothing else uses a technique, don't introduce it in isolation. Stick to whole-unit text with fade+translate.
