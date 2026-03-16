# TrackR — Complete App Blueprint

> **Created**: February 21, 2026
> **Status**: Active — Source of Truth
> **Replaces**: `v1-mvp-roadmap.md` (Phase 0-7 structure is retired)

## Sub-Files

| File | Contents |
|------|----------|
| [features.md](features.md) | Section 4 — Complete Feature Map (4.1-4.6) |
| [roadmap.md](roadmap.md) | Section 5 — Phased Roadmap (Phases 1-9) |
| [infrastructure.md](infrastructure.md) | Sections 6-7 — Data & Infrastructure Strategy + AI Strategy |
| [monetization.md](monetization.md) | Section 8 — Monetization Framework |
| [current-state.md](current-state.md) | Sections 9-10 + Appendix — Current State Assessment + Design Principles + Feature Cross-Reference |

---

## 1. Vision & Identity

**TrackR is the definitive theme park companion app.**

It's not just a credit logger — it's the app every park-goer opens before, during, and after their visit. Casual visitors use it as a park day utility. Enthusiasts use it to track, rate, and analyze every ride. The community makes it a daily destination even when you're nowhere near a park.

### Core Pillars

| Pillar | What It Means |
|--------|---------------|
| **Premium UX** | Every interaction feels polished. Spring physics, morph animations, haptic feedback. The app *feels* expensive. |
| **All-in-One Utility** | Wait times, maps, food, wallet, navigation — all in one app. No switching between 5 different park apps. |
| **Intelligent Rating System** | Weighted criteria auto-generate personal rankings. You don't decide if Ride A beats Ride B — the math does. |
| **Community** | The social layer is a core pillar, not an afterthought. Community hub, live features, collaborative guides. |
| **AI-Enhanced** | Claude for content and analysis, custom ML for force profiles, smart algorithms for recommendations. |

### What Makes TrackR Different

1. **The rating system**: Customizable weighted criteria that automatically rank your rides. No manual ordering — rate each ride honestly and watch your personal Top 50 sort itself.
2. **All-in-one park companion**: Wait times + maps + wallet + food search + logging in ONE app. Nobody else combines all of this.
3. **Premium feel**: Hero morph animations, spring physics on every touch, haptic feedback everywhere. No other coaster app feels this good.

---

## 2. User Experience Modes

TrackR uses a **single adaptive UI** with two modes: **Guest** and **Enthusiast**. Same screens, different emphasis.

### Onboarding

First launch presents a friendly choice:
- **"I'm visiting a park"** → Guest Mode (default)
- **"I track my rides"** → Enthusiast Mode

This sets the default mode. It's always changeable in Settings.

### Guest Mode (Park Day Utility)

Designed for casual park visitors who want a better park day.

**Home screen emphasis**: Wait times, park map quick-access, food search, wallet
**Visible but secondary**: News feed, logging prompt
**Hidden until discovered**: Credit count, detailed stats, ride forces profile

**Guest cares about:**
- What ride should I go on next? (wait times)
- Where's the nearest corn dog? (food search across all nearby parks)
- Let me pull up my ticket (wallet)
- How do I get to [ride]? (navigation)
- Where did I park? (car locator)

### Enthusiast Mode (Full Experience)

Designed for coaster enthusiasts who log, rate, and analyze.

**Home screen emphasis**: Log button, credit count, news feed, action pills
**All features visible**: Ratings, statistics, ride comparison, force profiles
**Community features**: Prominent hub access, friend activity

**Enthusiast cares about:**
- Log this ride FAST (< 10 seconds)
- What's my weighted score for [coaster]?
- How does Ride A compare to Ride B?
- What's my credit count?
- What are other enthusiasts saying?

### Conversion (Guest → Enthusiast)

No hard gates. Soft conversion moments:
- Guest taps a coaster's stats → inline nudge: "Want to rate this ride? Switch to Enthusiast Mode"
- After a park visit → notification: "You visited 8 rides today. Want to log them?"
- Always accessible via Settings toggle

### Architecture Impact

- ONE set of screen components, not two parallel apps
- Mode stored in user preferences (context/store)
- Conditional rendering based on mode for layout priority and feature visibility
- Components accept a `mode` prop or read from context where needed

---

## 3. Navigation Structure

### 5-Tab Layout (unchanged)

```
Home | Discover | Play | Activity | Profile
```

| Tab | Guest Emphasis | Enthusiast Emphasis |
|-----|---------------|---------------------|
| **Home** | Wait times, park map, food search, pinned parks | News feed, log/search/scan action buttons, credit count |
| **Discover** | Browse parks, food & drink, park guides | Coaster encyclopedia, rankings, ride analysis |
| **Play** | In-line entertainment, daily trivia | Game center, collectible cards, challenges |
| **Activity** | Recent visits (simple list) | Pending ratings, ride history, credit milestones |
| **Profile** | Wallet, car locator, settings | Stats dashboard, shareable card, criteria setup, wallet |

### Modal / Overlay Pattern

All modals continue as in-screen overlays using the MorphingPill hero morph system. No stack navigators for modals.

Stack navigation may be added for:
- Discover → Park Detail → Coaster Detail (push navigation)
- Community → Post Detail → Comments (push navigation)
- Profile → Sub-screens (wallet management, criteria setup, stats detail)

---

*This blueprint is the source of truth for TrackR's vision and roadmap. Individual feature specs live in `.claude/features/`. Design system in `.claude/design/`. Animation conventions in `.claude/animation/`.*
