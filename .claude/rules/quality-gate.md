# Quality Gate — Required Before Any Task Is "Done"

## The Rule

After ANY code changes (new features, bug fixes, refactors, data updates), run the quality gate before considering the work complete:

1. **TypeScript check:** `npm run typecheck` (or `npx tsc --noEmit`)
   - Zero errors required. Warnings are acceptable but should be minimized.
   - If errors exist, fix them before moving on.

2. **Lint check:** `npm run lint` (when ESLint is configured)
   - Fix auto-fixable issues. Flag non-auto-fixable issues for review.

3. **Build check:** Verify the app can start without runtime crashes
   - `npx expo start` should launch without errors

## When Sub-Agents Write Code

Every sub-agent that writes code MUST run `npx tsc --noEmit` before reporting done. If they skip this step, the coordinating agent must run it and fix any issues.

## What This Prevents

- Type errors from multi-agent parallel edits (different agents touching shared types)
- Import errors from renamed/moved functions
- Missing exports that only surface at build time
- Accidental `any` types sneaking in (strict mode is on)
