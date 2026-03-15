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

## When Building New Game UIs

- Games are line entertainment — played while waiting in line at a park
- Cards/tiles should feel tactile and collectible
- Left-aligned game titles (not centered)
- Game UI should feel like a premium mini-app within the main app, not a web game bolted on
- Reference existing games (Coastle, Trivia) for tone

## Iteration History

This section grows with each iteration cycle. Format: what was tried, what was rejected, what worked, and why.

### ProfileReady Onboarding — v1 rejected (2026-03-10)
- **Built:** Particle convergence animation with character-by-character name reveal, glow ring, accent pulse, dark→light bg transition
- **Rejected:** "I don't like the bend in the text for the username. It's just small, and nothing else in the app does that." Particles didn't actually disappear — lingered awkwardly.
- **New direction:** Tunnel-to-light concept. Particles fly TOWARD camera (3D depth, like emerging from a tunnel). Light blooms at exit. Camera "exposure" adjusts (overexposed white → settles to page color). Cinematic, not decorative.
- **Lesson:** Text animations must match the app's existing patterns. If nothing else uses a technique, don't introduce it in isolation. Stick to whole-unit text with fade+translate.
