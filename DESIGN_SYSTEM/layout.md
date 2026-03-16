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
