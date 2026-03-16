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
