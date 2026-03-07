# Keyboard Behavior -- Project-Wide Rule

## The Rule

Whenever a text input is focused and the keyboard appears, the screen MUST smoothly auto-scroll so the focused field sits just above the keyboard. When the keyboard dismisses, the screen MUST animate back to its original position equally smoothly.

This applies to EVERY screen in the app that has text inputs -- not just forms, but search bars, chat inputs, comment fields, anything with a keyboard.

## Requirements

- The scroll animation must feel native and smooth -- not instant, not janky, not delayed
- The focused field should never be hidden behind the keyboard
- The scroll-back on keyboard dismiss should be the same smooth quality as the scroll-up
- If the user taps a different text field while the keyboard is already open, the view should smoothly adjust to the new field's position
- The keyboard should never push content off the top of the screen -- if the field is already visible above the keyboard, don't scroll at all
- Tapping outside a text field should dismiss the keyboard (keyboardShouldPersistTaps="handled" pattern)

## What NOT To Do

- Don't let the keyboard cover a text field the user is actively typing in
- Don't use instant/snapping scroll behavior -- it must animate
- Don't use jello/bouncy springs for the scroll animation (see no-jello.md)
- Don't resize the entire screen in a way that causes layout thrashing or content jumping
- Don't ignore this on screens where "it probably won't matter" -- it always matters
