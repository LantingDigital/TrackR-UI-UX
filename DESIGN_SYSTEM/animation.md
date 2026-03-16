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
