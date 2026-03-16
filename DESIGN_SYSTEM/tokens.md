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
