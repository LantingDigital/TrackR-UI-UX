# Search Modal Close Behavior (TODO for real app)

## The Rule

When a user is in the Search modal and has typed a query, viewed a stat card (CoasterSheet), and then closes the stat card:

- The search should return to the **generic/empty search modal** (Popular Rides, Trending, etc.)
- It should NOT return to the partially-typed search query with autocomplete results
- The search text should be cleared when the stat card closes

## Why

When you've already found and viewed the ride you were looking for, going back to the half-typed search feels like a dead end. The user already got what they wanted — returning to the clean search state lets them either search for something new or close the modal.

## Where to implement

- `src/screens/HomeScreen.tsx` — in the CoasterSheet `onClose` handler, clear the search query
- `src/components/SearchModal.tsx` — if it manages its own query state, clear on sheet close
- The onboarding demo (`OnboardingSearchEmbed.tsx`) already implements this behavior

## Added: 2026-03-14
