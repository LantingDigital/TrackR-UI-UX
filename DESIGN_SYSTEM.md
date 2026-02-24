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

## 2. Animation Philosophy

### 2.1 Core Principle: Everything Is Physics

Every animation in TrackR is driven by spring physics or carefully eased timing curves — never linear interpolation. Springs create the illusion of mass and inertia. When a button scales down on press, it bounces back like a physical object. When a modal opens, it arcs upward with momentum, overshoots slightly, then settles.

**Why springs feel premium:** Linear animations feel robotic — they start and stop at the same speed. Springs accelerate, decelerate, and overshoot naturally, mimicking real-world objects with mass and elasticity. The human eye reads this as "quality" because it matches physical intuition.

### 2.2 Spring Configurations

Five presets, each optimized for a specific interaction type:

```javascript
SPRINGS = {
  responsive: { damping: 16, stiffness: 180, mass: 0.8 },
  // Use for: button presses, small UI movements, quick transitions
  // Feel: snappy, no visible overshoot, settles in ~200ms

  bouncy: { damping: 14, stiffness: 120, mass: 1 },
  // Use for: success states, celebrations, attention-grabbing
  // Feel: playful, visible overshoot, settles in ~400ms

  morph: { damping: 14, stiffness: 42, mass: 1.2 },
  // Use for: hero morphs, modal expansions, large-scale transitions
  // Feel: graceful, slow bloom, settles in ~600ms

  gentle: { damping: 20, stiffness: 80, mass: 1.5 },
  // Use for: background animations, ambient motion
  // Feel: heavy, glacial, settles in ~800ms

  stiff: { damping: 20, stiffness: 200, mass: 0.9 },
  // Use for: toggles, switches, definitive state changes
  // Feel: decisive, minimal overshoot, settles in ~250ms
}
```

**Additional spring used in scroll-triggered header collapse/expand:**
```javascript
BUTTON_SPRING = { damping: 18, stiffness: 180, mass: 1 }
// Settles in ~400ms with slight overshoot
// Used for header collapse/expand and button pill↔circle morphs
```

**MorphingPill close spring (snap-back from overshoot):**
```javascript
CLOSE_SNAP_SPRING = { damping: 24, stiffness: 320, mass: 0.5 }
// Settles in ~100-150ms, very stiff snap
// Used only for the final snap from -0.04 back to 0 after close timing
```

### 2.3 Timing Durations

```javascript
TIMING = {
  instant:      100,   // Instant feedback (opacity changes on press)
  fast:         150,   // Fast transition
  normal:       250,   // Standard transition
  slow:         400,   // Slow transition
  contentFade:  250,   // Content fade during morph
  backdrop:     300,   // Backdrop fade
  morphExpand:  500,   // Morph expansion
  stagger:       50,   // Stagger delay between items
}
```

### 2.4 Press Feedback Scales

```javascript
PRESS_SCALES = {
  subtle: 0.98,   // Large tappable areas, cards
  normal: 0.97,   // Standard buttons
  strong: 0.95,   // Emphasis buttons, primary CTAs
  card:   0.98,   // News cards, list rows (same as subtle)
}
```

Every press uses `SPRINGS.responsive` for the spring-back and `TIMING.instant` (100ms) for opacity changes.

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

### 2.7 Scroll-Triggered Animations

The HomeScreen header collapses and expands based on scroll direction:

**Thresholds:**
```javascript
COLLAPSE_THRESHOLD = 50   // Scroll down 50px → collapse
EXPAND_THRESHOLD = 10     // Minimum scroll delta to expand (any upward scroll > 5px)
STATE_CHANGE_COOLDOWN = 400  // ms — prevents rapid state changes during bounces
```

**What animates during collapse (reanimatedProgress: 1 → 0):**
```javascript
// Search bar morphs
width:      328px → 260px
height:     56px → 42px
marginLeft: 16px → equalGap (computed)

// Buttons stagger with 50ms delay each
buttonProgress0 = withSpring(0, BUTTON_SPRING)     // Log: immediate
buttonProgress1 = withDelay(50, withSpring(0, ...)) // Search: 50ms delay
buttonProgress2 = withDelay(100, withSpring(0, ...))// Scan: 100ms delay

// Fog gradient
scaleY: 1 → FOG_SCALE_COLLAPSED (ratio of collapsed/expanded heights)
translateY: pins top edge during scale
```

**Placeholder text crossfade:**
```javascript
// Full text ("Search rides, parks, news..."): opacity = reanimatedProgress
// Short text ("Search..."): opacity = interpolate(progress, [0, 0.3, 1], [1, 0, 0])
// Short text is fully visible when collapsed, gone by 30% of expansion
```

### 2.8 Button Pill ↔ Circle Morphing

Each `MorphingActionButton` morphs between pill (expanded) and circle (collapsed) states using `animProgress` (0=circle, 1=pill):

```javascript
// Size
width:  42px (circle) → ~108px (pill)
height: 42px (circle) → 36px (pill)

// Position — custom ease-out curve with per-button "swoop intensity"
CURVE_INTENSITIES = [3, 1.5, 1]  // Log (most swoopy), Search, Scan (least)
translateX: 4-keyframe interpolation at [0, 0.3, 0.6, 1] with overshoot/undershoot
translateY: 4-keyframe interpolation at [0, 0.4, 0.7, 1] (fast start: 70% distance by 40%)

// Label
opacity: 0 until 60% expanded, then fades to 1
maxWidth: 0 → 100px
marginLeft: 0 → 6px

// Landing scale pop
[0, 0.05]: 1.0 → 1.04 (pop at expand start)
[0.88, 0.95]: 1.0 → 1.02 (subtle pop at destination)
```

### 2.9 Staggered Cascade Animations (Section Cards)

When a modal opens, section cards inside animate in with staggered delays tied to `morphProgress`:

**SearchModal cascade (4 sections):**
| Section | Start | End | TranslateY |
|---------|-------|-----|------------|
| Recent Searches | 0.50 | 0.85 | 30px → 0 |
| Nearby Rides | 0.58 | 0.93 | 40px → 0 |
| Nearby Parks | 0.66 | 1.00 | 50px → 0 |
| Trending | 0.74 | 1.00 | 60px → 0 |

**LogModal cascade (4 sections, dynamic):**
- Base start: 0.50, stagger: 0.06, duration: 0.30 per section
- TranslateY starts at 30px and increases 8px per section (30, 38, 46, 54)

**Why this works:** Sections "pull down" like a projector screen — each one follows the previous, creating a waterfall effect that guides the eye downward through the content hierarchy.

### 2.10 Rotating Placeholder Animation

The search input shows cycling placeholder text:

```javascript
VISIBILITY_DELAY = 1100ms   // Wait before component fades in
FIRST_TRANSITION_DELAY = 300ms  // Wait before first text swap
TRAVEL_DISTANCE = 16px      // Vertical travel during transition
TRANSITION_DURATION = 400ms  // Each text swap animation
INTERVAL = 2500ms           // Time between swaps
FADE_IN_DURATION = 200ms    // Initial component fade-in
```

**Transition animation (per swap):**
```javascript
// Current text exits upward
opacity: [0, 0.3, 0.7, 1] → [1, 0.7, 0.2, 0]
translateY: [0, 1] → [0, -16]  // moves up 16px

// Next text enters from below
opacity: [0, 0.3, 0.7, 1] → [0, 0.2, 0.7, 1]
translateY: [0, 1] → [16, 0]   // rises from 16px below
```

---

## 3. Layout Principles

### 3.1 Spacing Scale

An 8-value scale based on a 4px base unit:

```javascript
spacing = {
  xs:   4,    // Micro spacing (icon-to-text gaps, tight margins)
  sm:   6,    // Small (close adjacency)
  md:   8,    // Medium (default gap between related items)
  base: 12,   // Base (standard padding/margin, list row padding)
  lg:   16,   // Large (card padding, section gaps, horizontal page margin)
  xl:   20,   // Extra large (section spacing)
  xxl:  24,   // Double extra large (generous internal padding)
  xxxl: 32,   // Triple extra large (hero spacing, section separators)
}
```

**Relationships:**
- `lg` (16px) is the universal page margin. Every screen uses `paddingHorizontal: 16`.
- Card internal padding matches page margin: `paddingVertical: 16`, `paddingHorizontal: 16`.
- Gaps between cards/sections: `16px` (frostedGap).
- Gaps between items within a section: `8-12px`.
- Section cards use `marginHorizontal: 8` (tighter than page margin to float wider).

### 3.2 Header Layout

**Expanded state (HEADER_HEIGHT = 132px):**
```
┌─────────────────────────────────────────┐
│ paddingTop: 12                          │
│ ┌─────────────────────────────────────┐ │
│ │ Search Bar: 328×56, borderRadius:28 │ │  ← 56px
│ └─────────────────────────────────────┘ │
│ paddingTop: 12                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Log Pill  │ │Search Pill│ │ Scan Pill│ │  ← 36px
│ │  108×36   │ │  108×36   │ │  108×36  │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ paddingBottom: 16                       │
└─────────────────────────────────────────┘
  ← 16px margin →     gap: 12px
  Total width: 328px (SCREEN_WIDTH - 32)
  Pill width: (328 - 24) / 3 ≈ 108px
```

**Collapsed state (HEADER_HEIGHT = 66px):**
```
┌──────────────────────────────────────────────────┐
│ paddingTop: 12                                   │
│ ┌────────────────────┐  ⊕   🔍   📷             │
│ │ Search: 260×42     │ 42×42 42×42 42×42         │  ← 42px
│ │ borderRadius: 21   │                           │
│ └────────────────────┘                           │
│ paddingBottom: 12                                │
└──────────────────────────────────────────────────┘
  5-gap layout: [gap][search][gap][○][gap][○][gap][○][gap]
  Search width: 260px (50% of SCREEN_WIDTH)
  Circle size: 42×42, total circles width: 126px
  equalGap = (SCREEN_WIDTH - 260 - 126) / 5
```

### 3.3 Fog Gradient

A 12-stop linear gradient creates a soft fade from the header into content:

```javascript
colors: [
  'rgba(240,238,235, 0.94)',  // Solid at top
  'rgba(240,238,235, 0.94)',
  'rgba(240,238,235, 0.94)',
  'rgba(240,238,235, 0.88)',  // Ease begins
  'rgba(240,238,235, 0.75)',
  'rgba(240,238,235, 0.55)',
  'rgba(240,238,235, 0.35)',
  'rgba(240,238,235, 0.18)',
  'rgba(240,238,235, 0.08)',
  'rgba(240,238,235, 0.03)',
  'rgba(240,238,235, 0.01)',
  'transparent',              // Fully transparent
]
locations: [0, 0.12, 0.24, 0.32, 0.38, 0.44, 0.50, 0.55, 0.60, 0.64, 0.68, 0.72]
```

**Important:** Animated via `scaleY` + `translateY` transforms (GPU-composited), NOT by changing height (which would cause expensive gradient redraws every frame).

### 3.4 Section Card Layout

Modal section cards float on the blur backdrop:

```javascript
section: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  marginHorizontal: 8,     // Wider than page content (8 vs 16)
  paddingVertical: 16,
  // Shadow: see Section 6
}
```

Gap between sections: 16px (`frostedGap`).
Content starts at: `paddingTop = 60 + 56 + 16 = 132px` (below floating search bar).

### 3.5 News Feed

```javascript
feedContent: {
  paddingHorizontal: 16,
  paddingBottom: 20,
}
cardWrapper: {
  marginBottom: 12,
}
```

Cards use golden ratio for image aspect: `1.618:1`.

---

## 4. Typography System

```javascript
typography = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',

  sizes: {
    tabLabel:  10,   // Bottom tab labels
    small:     11,   // Micro labels, count badges
    meta:      12,   // Timestamps, metadata
    caption:   13,   // Source labels, captions (uppercase + letterSpacing: 0.5)
    label:     14,   // Button labels, secondary UI text
    subtitle:  15,   // Body text, subtitles
    body:      15,   // Primary body text (same as subtitle)
    input:     16,   // Input field text, list row titles
    title:     17,   // Section titles, card titles
    large:     18,   // Large text, prominent labels
    heading:   20,   // Main headings
    hero:      24,   // Hero text
    heroLarge: 26,   // Extra large hero
    display:   32,   // Display text (screen titles)
  },

  weights: {
    light:    '300',  // Italic placeholders, subtle text
    regular:  '400',  // Body text, descriptions
    medium:   '500',  // Emphasized body, tab labels
    semibold: '600',  // Section titles, button labels, card titles
    bold:     '700',  // Display titles, rank badges, card headlines
  },

  lineHeights: {
    tight:   1.2,    // Headings, single-line labels
    normal:  1.3,    // Body text, descriptions
    relaxed: 1.4,    // Long-form text, multi-line content
  },
}
```

**Usage patterns:**
| Context | Size | Weight | Color |
|---------|------|--------|-------|
| Screen title | display (32) | bold (700) | text.primary |
| Section title | title (17) | semibold (600) | text.primary |
| Card headline | title (17) | bold (700) | text.primary |
| Card body | subtitle (15) | regular (400) | text.secondary |
| Source label | caption (13) | semibold (600) | text.meta, uppercase, letterSpacing: 0.5 |
| Timestamp | caption (13) | regular (400) | text.meta |
| Button label | label (14) | semibold (600) | text.primary or text.inverse |
| Input text | input (16) | regular (400) | text.primary |
| Placeholder | input (16) | light (300) | text.meta |
| Tab label | tabLabel (10) | medium (500) | accent.primary (active) or text.meta (inactive) |
| Trending count | input (16) | semibold (600) | accent.primary |
| Trending sublabel | small (11) | regular (400) | text.meta |

---

## 5. Color System

```javascript
colors = {
  background: {
    page:             '#F7F7F7',          // Light gray page background
    card:             '#FFFFFF',          // White card surfaces
    input:            '#F5F5F5',          // Input fields, icon containers
    imagePlaceholder: '#F0F0F0',          // Image loading state
    overlay:          'rgba(0,0,0,0.4)',  // Modal backdrop (40% black)
    overlayHeavy:     'rgba(0,0,0,0.7)', // Heavy overlay (success states)
  },

  accent: {
    primary:      '#CF6769',             // Rose red — THE brand color
    primaryLight: '#CF676715',           // Rose red at ~8% opacity (tinted backgrounds)
  },

  text: {
    primary:   '#000000',   // Headlines, titles, primary content
    secondary: '#666666',   // Body text, descriptions, subtitles
    meta:      '#999999',   // Timestamps, placeholders, tertiary info
    inverse:   '#FFFFFF',   // Text on dark/accent backgrounds
  },

  border: {
    subtle: '#E5E5E5',      // Dividers, card borders, tab bar top
    accent: '#CF6769',       // Accent borders (selected states)
  },

  shadow: {
    color: 'rgba(50,50,50,0.16)',  // Neutral shadow base
  },

  status: {
    error:       '#DC3545',  // Red
    success:     '#28A745',  // Green
    warning:     '#F9A825',  // Amber
    successSoft: '#4CAF50',  // Soft green (checkmarks, confirmations)
  },

  interactive: {
    pressed:           'rgba(0,0,0,0.04)',  // 4% black pressed overlay
    pressedAccent:     '#FFF0F0',           // Light pink pressed accent
    pressedAccentDark: '#B85557',           // Darker rose pressed accent
    separator:         'rgba(0,0,0,0.08)', // 8% black separator lines
  },

  banner: {
    warningBg:     'rgba(255,193,7,0.12)',   // Amber background at 12%
    warningBorder: 'rgba(255,179,0,0.3)',    // Amber border at 30%
    warningText:   '#333333',                // Dark text on warning banner
  },
}
```

**Color rules:**
- `#CF6769` is the ONLY accent color. It appears in active tab icons, CTA buttons, clear/action text, trending counts, and accent borders.
- Page background is `#F7F7F7`, never pure white. Cards are `#FFFFFF` to lift off the page.
- Text uses exactly three grays: `#000000` (primary), `#666666` (secondary), `#999999` (meta). No other gray values.
- Shadows always use `#323232` as their color, never `#000000`.

---

## 6. Shadow & Depth System

### 6.1 Shadow Presets

Four levels, platform-aware:

```javascript
shadows = {
  small: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,  // Android
  },

  section: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },

  card: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },

  modal: {
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.30,
    shadowRadius: 40,
    elevation: 16,
  },
}
```

**Usage:**
| Element | Shadow Level |
|---------|-------------|
| Action pills (resting) | `card` (shadowOffset 8, opacity 0.30 inline — matches buttons) |
| Search bar | `card` (inline: offset 8, opacity 0.30, radius 20) |
| Section cards (inside modals) | `section` |
| Modal (MorphingPill at rest) | `card` |
| Carousel cards | `small` |
| Modal (MorphingPill expanded) | grows via animated interpolation (see below) |

### 6.2 Shadow Animation During Morph

**Opening (shadow grows as element lifts):**
```javascript
shadowOpacity: interpolate(t, [0, 0.05, 0.5, 1], [0, 0.12, 0.16, 0.20])
shadowOffsetH: interpolate(t, [0, 0.5, 1], [4, 8, 12])
shadowRadius:  interpolate(t, [0, 0.5, 1], [6, 12, 20])
elevation:     interpolate(t, [0, 1], [4, 12])
```

**Closing (normal — button origins):**
```javascript
shadowOpacity: interpolate(t, [0, 0.15, 0.5, 1], [0.30, 0.22, 0.16, 0.20])
shadowOffsetH: interpolate(t, [0, 0.15, 0.5, 1], [8, 8, 8, 12])
shadowRadius:  interpolate(t, [0, 0.15, 0.5, 1], [20, 16, 12, 20])
```

**Closing (search bar origins — closeShadowFade=true):**
```javascript
shadowOpacity: interpolate(t, [0, 0.3, 0.7, 0.85, 1], [0.30, 0, 0, 0.10, 0.20])
// Shadow disappears BEFORE pill enters button area (prevents shadow overcast)
```

### 6.3 Z-Index Strategy

```
z=5:     Fog gradient (background, never changes)
z=10:    Sticky header + pill wrappers at rest
z=11:    Action buttons container (ALWAYS above pill wrappers at rest)
z=50:    Blur backdrop (modal backdrops)
z=80:    Floating section cards
z=90:    Fog gradient during modal open
z=160:   Modal headers ("SEARCH", "LOG", "WALLET" text)
z=200:   Pill wrappers during modal open (above backdrop)
z=9999:  Touch-blocking overlay during animations
```

**Dynamic z-index (UI-thread, per pill):**
```javascript
// Three-way conditional prevents shadow overcast:
if (pillZIndex <= 10) return { zIndex: 10 }
if (isClosing && backdropOpacity < 0.01) return { zIndex: 10 }  // Drop early
return { zIndex: pillZIndex }  // 200 during open
```

### 6.4 Button Opacity Management

After a MorphingPill closes, the pill remains rendered at the button position. To prevent shadow stacking (pill shadow + real button shadow), the system uses an opacity swap:

```javascript
// After close, pill stays at 0.011 opacity (invisible to eye, hittable by iOS)
// Real button restored to opacity 1
// On scroll collapse: pill hidden (scrollHidden=1), real button shown
```

The `0.011` value is critical for iOS: views with `opacity: 0` are skipped during hit-testing.

---

## 7. Interaction Patterns

### 7.1 Haptic Feedback

```javascript
haptics = {
  tap:     Haptics.impactAsync(ImpactFeedbackStyle.Light),    // Menu items, small buttons, tab switches
  select:  Haptics.impactAsync(ImpactFeedbackStyle.Medium),   // Card selection, important presses
  heavy:   Haptics.impactAsync(ImpactFeedbackStyle.Heavy),    // Destructive actions, confirmations
  success: Haptics.notificationAsync(NotificationFeedbackType.Success), // Log complete, rating saved
  error:   Haptics.notificationAsync(NotificationFeedbackType.Error),   // Failures
  warning: Haptics.notificationAsync(NotificationFeedbackType.Warning), // Warnings
  tick:    Haptics.selectionAsync(),                           // Slider movement, picker change
  snap:    Haptics.impactAsync(ImpactFeedbackStyle.Light),    // Toggle, snap-to-grid
}
```

**Rules:**
- Every user-initiated action fires a haptic. No silent taps.
- `haptics.tap()` is the default. Use it unless there's a specific reason not to.
- `haptics.select()` for actions with consequence (selecting an item, opening a modal).
- `haptics.success()` / `haptics.error()` for completion states.

### 7.2 Press Feedback

Every interactive element uses the `useSpringPress` hook:

```javascript
// Press in: scale down + opacity dim
scaleAnim = withSpring(targetScale, SPRINGS.responsive)
opacityAnim = withTiming(targetOpacity, { duration: TIMING.instant })

// Press out: spring back
scaleAnim = withSpring(1, SPRINGS.responsive)
opacityAnim = withTiming(1, { duration: TIMING.instant })
```

**Presets:**
| Preset | Scale | Opacity | Use For |
|--------|-------|---------|---------|
| `useSubtlePress()` | 0.98 | 1.0 | Cards, large areas |
| `useSpringPress()` | 0.97 | 1.0 | Standard buttons |
| `useStrongPress()` | 0.95 | 1.0 | Primary CTAs |
| `useCardPress()` | 0.98 | 0.9 | News cards, tappable rows |

### 7.3 Scroll Behavior

- Feed scrolls under a fixed sticky header
- Scroll down 50px+ → header collapses (search bar shrinks, pills become circles)
- Any upward scroll > 5px → header expands
- 400ms cooldown between state changes prevents bounce-triggered rapid switching
- Bounce at top/bottom is ignored (no state changes during overscroll)

### 7.4 Modal Lifecycle

```
User taps button → haptics.tap()
                 → isModalAnimating = true (touch block overlay appears)
                 → MorphingPill.open() called
                 → Pill measures position
                 → Origin button crossfades out
                 → Pill morphs to modal (850ms)
                 → Backdrop fades in (510ms)
                 → Content fades in (delayed 425ms, duration 280ms)
                 → isModalAnimating = false (touch block removed)

User taps close  → haptics.tap()
                 → Keyboard dismissed
                 → Content fades out (255-300ms)
                 → Backdrop fades out (340-435ms)
                 → Pill morphs to origin (470ms + spring snap)
                 → Z-index drops when backdrop opacity < 0.01
                 → Pill swaps to real button
                 → Modal state cleared
```

---

## 8. Component Anatomy

### 8.1 SearchBar

**Expanded state:**
```javascript
width: 328 (SCREEN_WIDTH - 32)
height: 56
borderRadius: 28 (height / 2)
backgroundColor: '#FFFFFF'
shadowColor: '#000000', offset: {0, 8}, opacity: 0.30, radius: 20
paddingHorizontal: 20
```

**Collapsed state:**
```javascript
width: 260 (50% of SCREEN_WIDTH)
height: 42
borderRadius: 21 (height / 2)
// Same shadow
paddingHorizontal: 12
```

**Icon:** globe-outline, size 20 (expanded) / 16 (collapsed), color `#999999`
**Placeholder text:** `#999999`, fontSize 16 (expanded) / fontSize dependent on collapse

### 8.2 MorphingActionButton (Pill/Circle)

**Pill state (expanded):**
```javascript
width: ~108 ((SCREEN_WIDTH - 32 - 24) / 3)
height: 36
borderRadius: 21 (static, auto-clamped)
backgroundColor: '#FFFFFF'
shadowColor: '#000000', offset: {0, 8}, opacity: 0.30, radius: 20
icon: 16px, color '#000000'
label: fontSize 14, weight '600', color '#000000', marginLeft: 6
```

**Circle state (collapsed):**
```javascript
width: 42
height: 42
borderRadius: 21
// Same shadow
icon: 16px, color '#000000'
label: hidden (opacity 0, maxWidth 0)
```

### 8.3 NewsCard

```javascript
borderRadius: 20
image aspectRatio: 1.618 (golden ratio)
padding: 16

// Unread indicator
dot: 8×8, borderRadius: 4, top: 12, left: 12, color: '#CF6769'

// Bookmark button
size: 32×32, borderRadius: 16, top: 12, right: 12, bg: 'rgba(0,0,0,0.3)'

// Text hierarchy
source:    13px, weight '600', color '#999999', uppercase, letterSpacing: 0.5
title:     17px, weight '700', color '#000000', lineHeight: 24, marginBottom: 8
subtitle:  15px, weight '400', color '#666666', lineHeight: 21, marginBottom: 8
timestamp: 13px, weight '400', color '#999999'

// Shadow
shadowColor: '#323232', offset: {0, 8}, opacity: 0.16, radius: 24

// Press feedback
scale: 0.96, opacity: 0.9 (useCardPress variant)
```

### 8.4 SearchCarousel

```javascript
cardWidth: 120
cardHeight: 120 (square)
cardGap: 12
borderRadius: 16 (radius.lg)
backgroundColor: '#E5E5E5' (border.subtle)
shadow: shadows.small

// Gradient overlay on card
colors: ['transparent', 'rgba(0,0,0,0.7)']
height: 60% from bottom

// Card text
padding: 10, fontSize: 14, weight '700', color '#FFFFFF'
```

### 8.5 Tab Bar

```javascript
height: 49 + insets.bottom
backgroundColor: '#FFFFFF'
borderTopWidth: 0.5
borderTopColor: '#E5E5E5'
paddingTop: 8

icon size: 24
active color: '#CF6769'
inactive color: '#999999'
label: fontSize 10, weight '500', marginTop: 2

animation: 'fade' (React Navigation v7)
transitionDuration: 100ms
```

**Hide/show animation:** Translates off-screen via `tabBarTranslateY` shared value, interpolated from [0,1] to [0, totalHeight + 20].

---

## 9. Reusable Design Tokens

### Animation Tokens
```javascript
animation.spring.responsive = { damping: 16, stiffness: 180, mass: 0.8 }
animation.spring.bouncy     = { damping: 14, stiffness: 120, mass: 1 }
animation.spring.morph      = { damping: 14, stiffness: 42, mass: 1.2 }
animation.spring.gentle     = { damping: 20, stiffness: 80, mass: 1.5 }
animation.spring.stiff      = { damping: 20, stiffness: 200, mass: 0.9 }
animation.spring.button     = { damping: 18, stiffness: 180, mass: 1 }
animation.spring.closeSnap  = { damping: 24, stiffness: 320, mass: 0.5 }

animation.timing.instant     = 100
animation.timing.fast        = 150
animation.timing.normal      = 250
animation.timing.slow        = 400
animation.timing.contentFade = 250
animation.timing.backdrop    = 300
animation.timing.morphExpand = 500
animation.timing.stagger     = 50

animation.press.subtle = 0.98
animation.press.normal = 0.97
animation.press.strong = 0.95
animation.press.card   = 0.98

animation.morph.openDuration      = 850
animation.morph.closeDuration     = 470
animation.morph.closeArcHeight    = 35
animation.morph.arcPeakHeight     = 70
animation.morph.arcEndT           = 0.7
animation.morph.bounceOffset      = 14
animation.morph.backdropFadeIn    = 510
animation.morph.contentFadeDelay  = 425
animation.morph.contentFadeDuration = 280
animation.morph.closeSnapSpring   = { damping: 24, stiffness: 320, mass: 0.5 }
```

### Shadow Tokens
```javascript
shadow.small   = { offset: {0, 4}, opacity: 0.12, radius: 12, elevation: 4 }
shadow.section = { offset: {0, 6}, opacity: 0.14, radius: 20, elevation: 6 }
shadow.card    = { offset: {0, 8}, opacity: 0.16, radius: 24, elevation: 8 }
shadow.modal   = { offset: {0, 16}, opacity: 0.30, radius: 40, elevation: 16 }
shadow.color   = '#323232'
```

### Spacing Tokens
```javascript
spacing.xs   = 4
spacing.sm   = 6
spacing.md   = 8
spacing.base = 12
spacing.lg   = 16
spacing.xl   = 20
spacing.xxl  = 24
spacing.xxxl = 32

spacing.pageMargin     = 16    // Horizontal page padding
spacing.sectionGap     = 16    // Gap between section cards
spacing.cardPadding    = 16    // Internal card padding
spacing.sectionMarginH = 8     // Section card horizontal margin (wider than page)
spacing.cardGap        = 12    // Gap between cards in a row/carousel
spacing.headerPadTop   = 12    // Header top padding
```

### Radius Tokens
```javascript
radius.sm         = 8
radius.md         = 12
radius.lg         = 16
radius.xl         = 20
radius.pill       = 999

radius.card       = 20
radius.modal      = 24
radius.searchBar  = 28
radius.actionPill = 18
radius.closeButton = 16
radius.trendingRank = 14
radius.button     = 28
```

### Color Tokens
```javascript
color.page         = '#F7F7F7'
color.card         = '#FFFFFF'
color.accent       = '#CF6769'
color.accentLight  = '#CF676715'
color.text.primary    = '#000000'
color.text.secondary  = '#666666'
color.text.meta       = '#999999'
color.text.inverse    = '#FFFFFF'
color.border.subtle   = '#E5E5E5'
color.shadow          = '#323232'
color.overlay.modal   = 'rgba(0,0,0,0.4)'
color.overlay.heavy   = 'rgba(0,0,0,0.7)'
color.interactive.pressed = 'rgba(0,0,0,0.04)'
color.interactive.separator = 'rgba(0,0,0,0.08)'
```

### Typography Tokens
```javascript
type.display   = { size: 32, weight: '700' }
type.heading   = { size: 20, weight: '600' }
type.title     = { size: 17, weight: '600' }
type.body      = { size: 15, weight: '400' }
type.label     = { size: 14, weight: '600' }
type.caption   = { size: 13, weight: '600', uppercase: true, letterSpacing: 0.5 }
type.meta      = { size: 12, weight: '400' }
type.input     = { size: 16, weight: '400' }
type.tabLabel  = { size: 10, weight: '500' }
```

### Haptic Tokens
```javascript
haptic.tap     = ImpactFeedbackStyle.Light
haptic.select  = ImpactFeedbackStyle.Medium
haptic.heavy   = ImpactFeedbackStyle.Heavy
haptic.success = NotificationFeedbackType.Success
haptic.error   = NotificationFeedbackType.Error
haptic.warning = NotificationFeedbackType.Warning
haptic.tick    = selectionAsync
haptic.snap    = ImpactFeedbackStyle.Light
```

---

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

---

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

---

*This document is the DNA of the entire app. It grows with every screen we build.*
