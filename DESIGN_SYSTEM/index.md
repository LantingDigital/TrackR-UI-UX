# TrackR Design System

The single source of truth for the visual and interaction language of the entire app. Every screen, every component, every animation references this document.

---

## 1. Design Philosophy

TrackR feels like holding a polished stone — smooth, weighty, satisfying. Every interaction has physical consequence. Buttons don't just respond, they *yield* under your thumb like real objects. Modals don't just appear, they *emerge* from the element you touched, maintaining spatial continuity so your brain never loses track of where things came from.

**The vibe:** Premium minimalism with playful physics. Think Apple's iOS springboard fluidity crossed with Airbnb's search morph (the way their search bar expands into a full modal, maintaining the illusion that it's the same element transforming). Clean whites, soft shadows, and a single rose-red accent that draws the eye without screaming.

**Emotional targets:**
- **Satisfying** — Every tap should feel like clicking a well-made pen. Haptic feedback, spring physics, and shadow depth work together to create tactile richness on a flat screen.
- **Effortless** — Complex interactions feel simple because animations guide the eye. You never wonder "where did that come from?" or "where did that go?" — spatial continuity answers those questions through motion.
- **Premium** — Nothing jitters, nothing blinks, nothing snaps. Shadows are soft, springs settle naturally, crossfades overlap so there's never a blank frame. The attention to detail communicates quality.

**What it is NOT:**
- Not flashy or attention-seeking. No neon gradients, no particle effects, no "look what I can do" animations.
- Not flat or lifeless. Depth matters — shadows, layering, and physics give the UI physical presence.
- Not dense or utilitarian. Generous spacing, clear hierarchy, breathing room.

**Inspirations:**
- Apple's iOS system animations (spring physics, spatial continuity)
- Airbnb's search bar → modal morph (element identity preservation)
- Things 3 (satisfying press feedback, premium minimalism)
- Linear (clean typography, purposeful whitespace)

---

## Sub-Files

| File | Contents |
|------|----------|
| [animation.md](animation.md) | Animation Philosophy — springs, timing, press feedback, scroll-triggered, button morphs, staggered cascades, rotating placeholder |
| [morphing-pill.md](morphing-pill.md) | The MorphingPill System & HomeScreen Modal Orchestration |
| [layout.md](layout.md) | Layout Principles — spacing scale, header layout, fog gradient, section cards, news feed |
| [typography.md](typography.md) | Typography System — font sizes, weights, line heights, usage patterns |
| [colors.md](colors.md) | Color System — backgrounds, accents, text, borders, shadows, status, interactive |
| [shadows.md](shadows.md) | Shadow & Depth System — presets, morph animation, z-index strategy, button opacity |
| [interactions.md](interactions.md) | Interaction Patterns — haptics, press feedback, scroll behavior, modal lifecycle |
| [components.md](components.md) | Component Anatomy — SearchBar, MorphingActionButton, NewsCard, SearchCarousel, Tab Bar |
| [tokens.md](tokens.md) | Reusable Design Tokens — animation, shadow, spacing, radius, color, typography, haptic |
| [anti-patterns.md](anti-patterns.md) | Anti-Patterns & Lessons Learned |
| [quality-checklist.md](quality-checklist.md) | Quality Checklist — animation, visual, interaction, state management, cohesion |

---

*This document is the DNA of the entire app. It grows with every screen we build.*
