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
