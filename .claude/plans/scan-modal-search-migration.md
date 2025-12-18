# Scan Modal Search Bar Migration Plan

## Overview
Migrate the Scan/Wallet modal to use the same search bar pattern as Log and Search, allowing users to filter their passes by typing. Implement Option A (section card style) for the empty state.

---

## Patterns Learned from Log/Search

### 1. Modal Modes (inputOnly vs sectionsOnly)
Both Log and Search modals use a split rendering approach:
- **inputOnly**: Just the TextInput, rendered inside the MorphingPill's expandedContent
- **sectionsOnly**: Floating section cards rendered on the blur backdrop

**For Scan**: We'll adopt this same pattern. The pill contains a search input, and the passes display as floating content below.

### 2. State Flow
```
User types → onQueryChange(query) → Parent debounces → filteredPasses passed to sectionsOnly
```
Log and Search both:
1. Keep local `searchQuery` state for immediate UI feedback
2. Call `onQueryChange` to notify parent
3. Parent debounces and passes filtered results back

**For Scan**: Same flow, but filtering is simpler (local array filter on `tickets` prop instead of searching a database).

### 3. Section Card Styling
All section cards share:
- `backgroundColor: '#FFFFFF'`
- `borderRadius: 20`
- `marginHorizontal: 8`
- `paddingVertical: 16`
- Shadow: `shadowColor: '#323232'`, offset 6, opacity 0.14, radius 20

**For Scan**: Use identical styling for visual consistency.

### 4. Empty State Pattern (Option A)
LogModal's empty state (lines 388-405) shows:
1. Icon in circular background (tinted with accent color)
2. Title text (bold, 17px)
3. Subtitle text (muted, 14px)
4. CTA button (accent color pill)

**For Scan**: Adapt this pattern:
- Icon: `ticket-outline`
- Title: "No passes yet"
- Subtitle: "Add passes from your Profile"
- CTA: "Add Your First Pass" → navigates to Profile

### 5. Autocomplete Results Rendering
When `searchQuery.length > 0`, both modals:
1. Replace discovery content with a single section card
2. Show filtered results as pressable rows
3. Show "No results found" if empty

**For Scan**: When filtering, show matching passes. But instead of small rows, we show pass preview cards since wallet items are more visual.

---

## Key Differences from Log/Search

| Aspect | Log/Search | Scan/Wallet |
|--------|------------|-------------|
| Data source | Global database search | Local array filter |
| Result display | Text rows with small images | Pass cards with QR preview |
| Discovery content | Carousels, trending lists | Card carousel of passes |
| Empty state action | Focus search input | Navigate to Profile |
| Placeholder text | "Find a coaster to log..." | "Search passes..." |

---

## Implementation Plan

### Step 1: Update ScanModal Props
Add props to match Log/Search pattern:
```typescript
interface ScanModalProps {
  tickets: Ticket[];
  onClose?: () => void;
  onAddTicket?: () => void;
  onTicketPress?: (ticket: Ticket) => void;
  onSetDefault?: (ticketId: string) => void;
  // NEW - Match Log/Search pattern
  isEmbedded?: boolean;
  inputOnly?: boolean;
  sectionsOnly?: boolean;
  onInputFocus?: () => void;
  onQueryChange?: (query: string) => void;
  searchQuery?: string; // Passed from parent for filtering
}
```

### Step 2: Implement inputOnly Mode
Render just a TextInput for inside the MorphingPill:
- Placeholder: "Search passes..."
- Calls onQueryChange on text change
- Calls onInputFocus when focused

Unlike Search (which uses RotatingPlaceholder), Wallet uses a static placeholder since users likely have few passes and don't need inspiration.

### Step 3: Implement sectionsOnly Mode
Two states:

**A) Has passes (discovery mode):**
- Section 1: Status card (similar to Log's pattern)
  - If no default set: prompt to set default
  - If all good: show pass count summary
- Section 2: Pass card carousel (horizontal scroll, cards with QR preview)

**B) Filtering mode (searchQuery.length > 0):**
- Single section card with filtered results
- Pass rows showing park name, pass type
- "No matching passes" empty state

### Step 4: Redesign Empty State
Replace EmptyWalletPrompt usage with section card style:
```jsx
<View style={styles.section}>
  <View style={styles.emptyStateContainer}>
    <View style={styles.emptyStateIcon}>
      <Ionicons name="ticket-outline" size={32} color="#CF6769" />
    </View>
    <Text style={styles.emptyStateTitle}>No passes yet</Text>
    <Text style={styles.emptyStateSubtitle}>
      Add theme park passes from your Profile
    </Text>
    <Pressable style={styles.emptyStateCTA} onPress={onAddTicket}>
      <Text style={styles.emptyStateCTAText}>Add Your First Pass</Text>
      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
    </Pressable>
  </View>
</View>
```

### Step 5: Update HomeScreen Integration
Currently HomeScreen passes static `stackTickets`. We need:
1. Add `scanQuery` state to HomeScreen
2. Add `debouncedScanQuery` with debounce logic
3. Filter tickets based on query
4. Pass filtered tickets and query handlers to ScanModal

### Step 6: Update MorphingPill expandedContent
Change from static "Your Passes" text to actual TextInput:
```jsx
expandedContent={(close) => (
  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
    <Ionicons name="search" size={20} color="#999999" />
    <ScanModal
      tickets={filteredTickets}
      isEmbedded={true}
      inputOnly={true}
      onInputFocus={handleScanFocus}
      onQueryChange={handleScanQueryChange}
    />
    <Pressable onPress={close}>...</Pressable>
  </View>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `ScanModal.tsx` | Complete rewrite with inputOnly/sectionsOnly modes |
| `HomeScreen.tsx` | Add scanQuery state, debounce, filter logic, update MorphingPill |
| `EmptyWalletPrompt.tsx` | Keep for Profile wallet management (not needed in Scan modal) |

---

## Animation Considerations

1. **Staggered section animations**: ScanModal should use the same `sectionAnimations` pattern as Log/Search, but we don't have `morphProgress` passed in. We can simplify since wallet doesn't need complex cascade animations.

2. **Keyboard handling**: When user focuses the search input, the floating content should remain scrollable. KeyboardAvoidingView wrapper needed.

3. **Pass card expansion**: When a non-default pass is tapped, it should expand to show full QR. This is a unique interaction not in Log/Search.

---

## Pass Filtering Logic

```typescript
const filterPasses = (tickets: Ticket[], query: string): Ticket[] => {
  if (!query.trim()) return tickets;

  const lowerQuery = query.toLowerCase();
  return tickets.filter(ticket =>
    ticket.parkName.toLowerCase().includes(lowerQuery) ||
    ticket.passholder?.toLowerCase().includes(lowerQuery) ||
    PASS_TYPE_LABELS[ticket.passType]?.toLowerCase().includes(lowerQuery)
  );
};
```

---

## Visual Hierarchy (Discovery Mode)

When no search query:
```
┌────────────────────────────────────┐
│ [Status Section Card]              │
│ "3 passes ready to use"            │
│ or empty state with CTA            │
└────────────────────────────────────┘
          [16px gap]
┌────────────────────────────────────┐
│ [Your Passes Section Card]         │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ Pass│ │ Pass│ │ Pass│ ← Carousel│
│ └─────┘ └─────┘ └─────┘           │
└────────────────────────────────────┘
```

When filtering:
```
┌────────────────────────────────────┐
│ [Search Results Section Card]      │
│ ┌──────────────────────────────┐  │
│ │ Cedar Point - Annual Pass    │  │
│ └──────────────────────────────┘  │
│ ┌──────────────────────────────┐  │
│ │ Cedar Point - Parking Pass   │  │
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

## Success Criteria

1. ✓ Scan button morphs to search bar (already done)
2. □ User can type to filter passes
3. □ Filtered results show in section card
4. □ Empty state matches Log/Search style (section card with CTA)
5. □ Discovery mode shows pass carousel in section card
6. □ Tapping pass expands QR code
7. □ "Add Pass" navigates to Profile

