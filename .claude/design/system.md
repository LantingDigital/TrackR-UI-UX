# TrackR Design System

Reference for all visual design tokens used throughout the app. Source files live in `src/theme/`.

---

## Colors

Defined in `src/theme/colors.ts`.

| Token | Value | Usage |
|-------|-------|-------|
| **Accent Primary** | `#CF6769` | Buttons, highlights, active tab icons, badge dots, primary CTAs |
| **Accent Primary Light** | `#CF676715` | Tinted backgrounds, subtle accent fills |
| **Background Page** | `#F7F7F7` | Screen backgrounds |
| **Background Card** | `#FFFFFF` | Card surfaces, tab bar background |
| **Text Primary** | `#000000` | Headings, important labels |
| **Text Secondary** | `#666666` | Body text, descriptions |
| **Text Meta** | `#999999` | Timestamps, inactive tab labels, helper text |
| **Text Inverse** | `#FFFFFF` | Text on dark/accent backgrounds |
| **Border Subtle** | `#E5E5E5` | Dividers, card outlines, tab bar top border |
| **Border Accent** | `#CF6769` | Focused input borders, accent outlines |
| **Shadow** | `rgba(50, 50, 50, 0.16)` | Card drop shadows |
| **Status Error** | `#DC3545` | Error states, destructive actions |
| **Status Success** | `#28A745` | Success feedback, confirmations |

### Usage Pattern

```typescript
import { colors } from '../theme/colors';

// Direct access
colors.accent.primary      // '#CF6769'
colors.background.page     // '#F7F7F7'
colors.text.secondary      // '#666666'
colors.shadow.color        // 'rgba(50, 50, 50, 0.16)'
```

---

## Spacing

Defined in `src/theme/spacing.ts`. All values in logical pixels.

| Token | Value | Typical Usage |
|-------|-------|---------------|
| `xs` | 4 | Tight inner padding, icon gaps |
| `sm` | 6 | Small gaps between inline elements |
| `md` | 8 | Standard inner padding, list item gaps |
| `base` | 12 | Section padding, card inner margins |
| `lg` | 16 | Screen horizontal padding, section gaps |
| `xl` | 20 | Large section spacing |
| `xxl` | 24 | Major section dividers |
| `xxxl` | 32 | Screen-level vertical spacing |

### Usage Pattern

```typescript
import { spacing } from '../theme/spacing';

paddingHorizontal: spacing.lg,    // 16
marginBottom: spacing.base,       // 12
gap: spacing.md,                  // 8
```

---

## Border Radius

Defined in `src/theme/radius.ts`.

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8 | Small elements, chips, tags |
| `md` | 12 | Medium cards, input fields |
| `lg` | 16 | Large cards, modals |
| `xl` | 20 | Card component default |
| `pill` | 999 | Full pill shapes (buttons, badges) |
| `card` | 20 | Standard card corners |
| `searchBar` | 28 | Search bar (half of 56px height) |
| `actionPill` | 18 | Action pill buttons (half of 36px height) |

### Usage Pattern

```typescript
import { radius } from '../theme/radius';

borderRadius: radius.card,       // 20
borderRadius: radius.pill,       // 999 (full pill)
borderRadius: radius.searchBar,  // 28
```

---

## Typography

Defined in `src/theme/typography.ts`. Uses system fonts (San Francisco on iOS, Roboto on Android).

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `title` | 17 | Section headers, card titles |
| `subtitle` | 15 | Subtitles, secondary headings |
| `body` | 15 | Standard body text |
| `meta` | 12 | Timestamps, labels, fine print |
| `tabLabel` | 10 | Bottom tab bar labels |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `light` | 300 | De-emphasized text |
| `regular` | 400 | Body text |
| `medium` | 500 | Tab labels, subtle emphasis |
| `semibold` | 600 | Headings, buttons, important labels |

### Line Heights

| Token | Multiplier | Usage |
|-------|------------|-------|
| `tight` | 1.2 | Compact headers |
| `normal` | 1.3 | Default body text |
| `relaxed` | 1.4 | Long-form readable text |

### Usage Pattern

```typescript
import { typography } from '../theme/typography';

fontFamily: typography.fontFamily,
fontSize: typography.sizes.title,     // 17
fontWeight: typography.weights.semibold, // '600'
lineHeight: typography.sizes.body * typography.lineHeights.normal, // 19.5
```

---

## Shadows

Defined in `src/theme/shadows.ts`. Platform-specific (iOS shadow properties vs Android elevation).

### Card Shadow (Standard)

```typescript
// iOS
shadowColor: '#323232',
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.16,
shadowRadius: 24,

// Android
elevation: 8
```

### Small Shadow (Subtle)

```typescript
// iOS
shadowColor: '#323232',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.12,
shadowRadius: 12,

// Android
elevation: 4
```

### Usage Pattern

```typescript
import { shadows } from '../theme/shadows';

<View style={[styles.card, shadows.card]}>
  ...
</View>
```

---

## Design Principles

1. **Light mode only** -- No dark mode in V1. Clean white cards on light gray backgrounds.
2. **Minimal aesthetic** -- Inspired by Apple system apps and Airbnb. Restrained use of color; accent color reserved for interactive elements.
3. **Floating card design** -- Content lives in elevated white cards with soft shadows, sitting above the page background.
4. **Blur backgrounds** -- Modals and overlays use backdrop blur (expo-blur) for depth.
5. **Spring physics everywhere** -- All transitions use spring animations, never linear. See `animation/system.md`.
6. **60fps target** -- All animations must run at 60fps on physical devices. Use UI-thread animations (Reanimated) for scroll-driven and gesture-driven motion.
7. **Generous whitespace** -- Use spacing tokens consistently. When in doubt, add more space.
8. **System fonts** -- San Francisco on iOS, Roboto on Android. No custom fonts.
