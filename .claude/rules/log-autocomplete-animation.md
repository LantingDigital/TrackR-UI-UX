# Log Modal Autocomplete Animation (TODO for real app)

## The Rule

The Log modal's search autocomplete results should animate in/out using Reanimated entering/exiting transitions, matching how the Search modal does it.

## What the Search modal does right:
- Rich card (top result) uses `FadeIn.duration(200)` entering, `FadeOut.duration(150)` exiting
- Regular result rows use `FadeIn.duration(200).delay(index * 50)` for staggered cascade
- All rows use `Layout.duration(200)` for position changes
- Each row has a unique `key` so Reanimated can track enter/exit

## What the Log modal needs:
- Apply the same `FadeIn`/`FadeOut`/`Layout` transitions to the log autocomplete results
- The log results have a different structure (status card, carousels, trending) but the TYPE of animation should match
- Results should fade in with slight slide-up as they appear, stagger between rows

## Where to implement:
- `src/components/LogModal.tsx` — the autocomplete overlay section
- Apply Reanimated entering/exiting to each result row/card

## Added: 2026-03-14
