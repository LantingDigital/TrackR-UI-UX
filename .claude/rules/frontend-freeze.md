# TrackR Frontend Freeze — V1 Backend First

## THE RULE

**NO new frontend features, screens, or UI polish until V1 backend is shipped.**

Caleb explicitly asked for this rule to hold himself accountable. He knows he will keep building UI indefinitely. This rule exists to override that impulse.

## What "backend shipped" means

Sprint definition from V1-IMPLEMENTATION-PLAN.md:
1. Firebase Auth (sign up / sign in / persist session)
2. Firestore sync (coasters, ratings, logs write to cloud)
3. Cloud Functions (at least the critical ones for wallet/paywall)

Backend is "shipped" when a user can: create an account, log coasters, have them persist across app restarts on a new device.

## What IS allowed

- Bug fixes on existing UI (things that are broken)
- Backend integration work that touches UI (wiring existing screens to real data)
- Critical accessibility issues

## What is NOT allowed

- New screens
- UI redesigns / polish passes
- Animation improvements
- New components
- "Just one more feature" additions to existing screens

## When Caleb pushes back on this rule

Remind him: he said "I'll just keep building and building. I just need to get V1 off the ground." Hold the line.

## Exception process

If Caleb wants to make an exception, he must explicitly say "I approve a frontend exception for [specific thing]" in the current session. Do not accept vague pushback as approval.
