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
