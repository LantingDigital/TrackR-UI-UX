### 2.5 The MorphingPill System

The hero animation of the app. A pill-shaped button physically transforms into a full-width modal card. The element IS the button — there is no separate modal appearing on top.

#### How It Works

1. **Pill state:** A compact button (e.g., 108×36px pill or 42×42px circle) with icon and label
2. **Tap:** User taps the pill, triggering `open()`
3. **Measure:** Component measures its screen position via `measureInWindow`
4. **Arc trajectory:** Pill travels to modal position (top-left corner, 16px from edges) via a parabolic arc path
5. **Size expansion:** Width and height interpolate from pill size to modal size using ease-out curve
6. **Content crossfade:** Pill content fades out (0→0.55 of progress), expanded content fades in (0.55→0.88)
7. **Shadow growth:** Shadow opacity, offset, and blur grow as the element "lifts" off the surface
8. **Landing bounce:** At t=0.88, element overshoots 14px downward, then settles to final position

#### Open Animation (850ms)

```javascript
// Main progress: 0 → 1 over 850ms
morphProgress = withTiming(1, {
  duration: 850,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});

// Arc path (upward parabola, completes at 70% of animation)
ARC_END_T = 0.7
ARC_PEAK_HEIGHT = 70  // pixels upward
arcOffset = (ARC_PEAK_HEIGHT / 0.1225) * t * (t - 0.7)  // parabolic

// Position easing
easeOut = 1 - Math.pow(1 - t, 2.5)

// Landing bounce at end
bounceOffset = interpolate(t, [0, 0.7, 0.85, 1.0], [0, 0, 14, 0])

// Final position = smooth travel + arc + bounce
currentY = easeOut * targetY + arcOffset + bounceOffset
```

**Phase breakpoints during open:**
| Progress | Event |
|----------|-------|
| 0.00 | Pill begins moving, shadow starts growing |
| 0.05 | Pill content starts fading (opacity 1 → 0.85) |
| 0.15 | Pill content scale peaks at 1.03 (subtle pulse) |
| 0.20 | Pill content at 30% opacity |
| 0.32 | Arc peak reached (highest point of parabolic path) |
| 0.35 | Size expansion accelerates |
| 0.40 | Pill content at 0% opacity, scale at 0.95 |
| 0.55 | Expanded content starts fading in (crossfade begins) |
| 0.70 | Arc completes, element at final X/Y position |
| 0.85 | Bounce overshoot peaks (14px below final position) |
| 0.88 | Expanded content fully visible |
| 1.00 | Bounce settles, animation complete |

#### Close Animation (470ms + spring snap)

Close is NOT the reverse of open. It uses a two-phase sequence:

```javascript
// Phase 1: Timing from 1 → -0.04 (past origin, valley overshoot)
morphProgress = withSequence(
  withTiming(-0.04, {
    duration: 470,    // default, customizable per origin
    easing: Easing.out(Easing.cubic),
  }),
  // Phase 2: Spring snap from -0.04 → 0
  withSpring(0, { damping: 24, stiffness: 320, mass: 0.5 })
);
```

**Valley arc during close:**
- Default arc height: 35px downward dip
- Search bar origins: asymmetric timing (75% descent, 25% recovery)
- Button origins: symmetric timing

**Close tuning props (per-origin customization):**
| Prop | Default | Purpose |
|------|---------|---------|
| `closeDuration` | 470ms | Phase 1 timing duration |
| `closeArcHeight` | 35px | Valley dip magnitude |
| `closeFixedSize` | false | Keep size fixed during close (search bar origins) |
| `closeShadowFade` | false | Fade shadow early to prevent overcast on buttons |

#### Overshoot Angles

Each origin has a custom overshoot direction (degrees clockwise from north):

| Origin | Angle | Why |
|--------|-------|-----|
| Expanded search bar | 0° (straight up) | Bar is at top, modal goes straight up |
| Collapsed search bar | 340° (slightly left of up) | Bar is offset, compensate |
| Search pill | 0° (straight up) | Pill is centered, go straight up |
| Search circle | 15° (slightly right) | Circle is right-of-center |
| Log pill | 340° (slightly left) | Pill is left-positioned |
| Log circle | 10° (slightly right) | Circle is right-positioned |
| Scan pill | 20° (right) | Rightmost pill |
| Scan circle | 19° (right) | Rightmost circle |

#### Layer Management

The MorphingPill uses three content layers (no DOM swapping):

1. **Pill Content Layer** — fades out during open (t: 0→0.55), fades in during close
2. **Persistent Content Layer** — never fades (e.g., globe icon in search bar). Positioned between pill and expanded content.
3. **Expanded Content Layer** — fades in during open (t: 0.55→0.88), fades out during close

**Why this works:** Crossfade overlap ensures there's never a blank frame. Pill content is still partially visible when expanded content begins appearing, creating a smooth handoff rather than a jarring swap.

### 2.6 HomeScreen Modal Orchestration

When a MorphingPill opens on the HomeScreen, several external animations coordinate with it:

**Open sequence (all three modals follow this pattern):**
```
t=0ms:    Pill begins morphing (internal 850ms animation)
          Pill z-index: 10 → 200 (above backdrop at z=50)
          Other pills hidden (scrollHidden=1)
          Origin button crossfades: 120ms (first open) or instant (re-open)

t=0-510ms: Backdrop blur fades in (withTiming, 510ms)

t=425ms:   External content begins fading in
t=705ms:   External content fully visible (withDelay(425) + withTiming(280))
```

**Close sequence:**
```
t=0ms:    Content fades out (255-300ms)
          Backdrop fades out (340-435ms)
          Pill morphs back (385-485ms with Easing.out(cubic))
          isClosing flag set (signals z-index drop)

When backdrop opacity < 0.01:
          Pill z-index drops: 200 → 10 (prevents shadow overcast)

After animation complete:
          Pill scrollHidden=1 (swap to real button)
          Button opacity restored
          Modal state cleared
```

**Modal-specific timing differences:**
| Property | Search | Log | Scan |
|----------|--------|-----|------|
| Content fade out | 300ms | 255ms | 255ms |
| Backdrop fade out | 435ms | 340ms | 340ms |
| Morph progress close | 485ms | 385ms | — (internal) |
