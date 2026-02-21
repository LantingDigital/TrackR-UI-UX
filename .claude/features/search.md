# Search Flow Specification

The search system provides global search across coasters, parks, guides, and news. It is accessible from multiple entry points on the Home screen, all using the hero morph pattern.

---

## Entry Points (Morph Origins)

The search modal can be triggered from four different origin points on the Home screen, each of which morphs into the same expanded search interface:

| Origin | State | Element |
|--------|-------|---------|
| Expanded search bar | Header expanded (near top of scroll) | Full-width SearchBar component |
| Search pill button | Header expanded | "Search" ActionPill next to search bar |
| Collapsed search bar | Header collapsed (scrolled down) | Narrow SearchBar |
| Collapsed circle button | Header collapsed | "Search" circle icon button |

All origins use MorphingPill, which measures the origin element's position via `ref.measureInWindow()` and expands from that exact screen location.

---

## Flow

```
Home Screen
  |
  v
Tap any search entry point
  |
  v
MorphingPill expands from origin position
  |
  v
SearchModal opens with text input focused
  |
  v
User types query
  |
  v
Debounced search (300ms) runs against mock data
  |
  v
Results appear in categorized sections:
  - Coasters
  - Parks
  - Guides
  - News
  |
  v
User taps a result
  |
  v
Detail view (future: push to detail screen)
  |
  v
Back / Close -> morph collapses to origin
```

---

## Search Interface

### SearchModal (`src/components/SearchModal.tsx`)

**Input Section**:
- Auto-focused text input at the top
- Placeholder text (via RotatingPlaceholder when empty)
- Clear button appears when text is entered
- Keyboard automatically opens on morph completion

**Results Section**:
- Results appear after 300ms debounce
- Organized by category with section headers
- Each result rendered as a SearchResultRow
- Categories: Coasters, Parks, Guides, News

**Empty/Unfocused State**:
- When no query is entered, shows section cards (browse categories)
- Section cards have cascade fade-in animation
- Cards toggle visibility based on focus state

---

## Search Data

Data source: `src/data/mockSearchData.ts`

The mock data contains sample entries for:
- **Coasters**: Name, park, type, stats
- **Parks**: Name, location, coaster count
- **Guides**: Park guide titles and descriptions
- **News**: Article titles and sources

In production, this will be replaced with RCDB integration and a backend search API.

---

## Animation Details

### Open
1. User taps origin element
2. Origin position captured via `measureInWindow()`
3. MorphingPill expands with hero morph (bounce arc)
4. Search input appears during content fade-in phase (400ms delay)
5. Input auto-focuses, keyboard slides up

### Close
1. Keyboard dismisses first
2. Content fades out (150ms)
3. MorphingPill shrinks back to origin position (linear interpolation)
4. Backdrop blur fades out

### Result Appearance
- Results cascade in with staggered delays (50ms between items)
- Each row has a subtle fade + slide-up entrance

---

## Future Enhancements

- Live search against RCDB database
- Recent searches history
- Search suggestions/autocomplete
- Tap result to push to detail screen (requires stack navigator)
- Search from Discover tab (shared search infrastructure)
