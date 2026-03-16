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
