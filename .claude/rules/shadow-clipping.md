# Shadow Clipping Prevention (Project-Wide Standard)

Card shadows MUST render fully and visibly. Clipped shadows look broken and destroy the premium feel. This rule applies everywhere in the app.

## The Rule

1. **NEVER let card shadows be cut off by their parent container.** If you add a card with a shadow, verify the parent has room for the shadow to render.
2. **NEVER use `overflow: 'hidden'` on containers that hold cards with shadows.** If you need clipping for other reasons (e.g., rounded corners on an image), apply `overflow: 'hidden'` to the inner element, not the outer container.
3. **Always add sufficient padding to parent containers** to accommodate the shadow spread. The required padding depends on the shadow tier (see below).
4. **On ScrollViews (horizontal or vertical) containing shadowed cards**, set `overflow: 'visible'` on the ScrollView style AND add padding to the `contentContainerStyle`.
5. **Use negative margin to compensate** when the shadow padding would create unwanted extra whitespace in layout.

## Shadow Values Reference (src/theme/shadows.ts)

| Tier     | shadowRadius | shadowOffset.height | Min padding needed |
|----------|-------------|--------------------|--------------------|
| small    | 12          | 4                  | spacing.base (12)  |
| card     | 24          | 8                  | spacing.xl (20)    |
| section  | 20          | 6                  | spacing.lg (16)    |
| modal    | 40          | 16                 | spacing.xxxl (32)  |

Min padding = roughly `max(shadowRadius - shadowOffset.height, shadowRadius + shadowOffset.height)` divided sensibly. When in doubt, use a padding equal to the `shadowRadius` value.

## Correct Pattern

```tsx
// CORRECT: Shadow-safe horizontal card strip
const styles = StyleSheet.create({
  scrollContainer: {
    marginHorizontal: -spacing.lg,
    // Compensate for shadow padding so layout spacing stays tight
    marginVertical: -spacing.xl,
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    // Accommodate shadows.card spread (shadowRadius: 24, offset: 8)
    paddingVertical: spacing.xl,
    gap: spacing.base,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    ...shadows.card,
  },
});

<ScrollView
  horizontal
  style={styles.scrollContainer}
  contentContainerStyle={styles.scrollContent}
  showsHorizontalScrollIndicator={false}
>
  {items.map(item => <Card key={item.id} style={styles.card} />)}
</ScrollView>
```

## Wrong Pattern

```tsx
// WRONG: Shadow gets clipped on all sides
const styles = StyleSheet.create({
  scrollContainer: {
    marginHorizontal: -spacing.lg,
    // No overflow: 'visible' -- ScrollView clips shadows
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    // No vertical padding -- top/bottom shadows are cut off
    gap: spacing.base,
  },
  card: {
    ...shadows.card, // Shadow renders but gets clipped by parent
  },
});
```

## Wrong: overflow hidden on shadow container

```tsx
// WRONG: overflow hidden kills the shadow
const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.card,
    overflow: 'hidden', // This clips the shadow completely
    ...shadows.card,
  },
});

// CORRECT: Separate shadow layer from clipping layer
const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.card,
    ...shadows.card,
    // No overflow hidden here -- shadow renders freely
  },
  innerContent: {
    borderRadius: radius.card,
    overflow: 'hidden', // Clip content inside, not the shadow
  },
});
```

## Checklist (use when building any card-based UI)

- [ ] Does the card use a shadow from `src/theme/shadows.ts`?
- [ ] Does the parent container have enough padding for the shadow spread?
- [ ] Is there any `overflow: 'hidden'` between the card and the screen root?
- [ ] If using ScrollView/FlatList, is `overflow: 'visible'` set on the style?
- [ ] If padding was added for shadows, is negative margin used to keep layout tight?
