# Dev Environment Facts (DO NOT QUESTION THESE)

These are foundational truths about the TrackR project. Do not second-guess them, suggest alternatives, or ask Caleb to verify them. They are always true.

## Build Environment

- TrackR is ALWAYS a **dev client build** (`npx expo run:ios` or EAS dev build). NEVER Expo Go.
- Expo Go is NOT compatible with this project. The project uses native modules (Reanimated, Mapbox, etc.) that require a dev client.
- Expo Go is deprecated for this type of framework. Do not mention it. Do not suggest it. Do not diagnose problems as "you might be in Expo Go."
- The app is built and signed via Xcode. Caleb has a working signing certificate and provisioning profile.
- Device: iPhone, UDID `00008140-00044DA42E00401C`, name "Calabbbb"

## Map Provider

- **Mapbox** is the primary and only map provider in use.
- Google Maps exists as legacy fallback code in the codebase but is NOT the active map.
- If Google Maps is rendering, the problem is a code bug (wrong component mounted), NOT an Expo Go issue.
- All navigation features (Dijkstra routing, GPS, simulated location) are wired into MapboxMapScreen.

## Dev Testing Shortcuts

The home screen has dev-only buttons for testing specific flows without reloading the app:
- **Coastle** — launches the Coastle game directly
- **Loading animation** — plays the loading/splash animation
- **Onboarding** — replays the full onboarding flow from step 1

When testing changes to onboarding, loading, or games, tell Caleb to press the relevant home screen button. NEVER say "reload the app" or "restart the app" — the dev buttons exist specifically so reloading is unnecessary. Hot reload handles code changes automatically.

## Best Tool for the Job — Not the Easiest

When solving a problem, ALWAYS recommend the BEST solution first — even if it requires:
- Installing a new dependency
- Adding a new native module (requires dev client rebuild, that's fine)
- Paying for a tool, asset, or service
- Learning a new library

Do NOT default to "what's already in package.json." That's optimizing for convenience, not quality. Caleb wants to hear the best option so HE can decide whether the tradeoff is worth it. Don't make that decision for him.

**Pattern to follow:**
1. Research what the best tool/approach is for the job (globally, not just what's installed)
2. Present it as the recommendation, including cost/effort if relevant
3. If what's already installed happens to be the best tool, great — but arrive at that conclusion through research, not by checking package.json first

## What NOT to Do

- NEVER suggest switching to Expo Go
- NEVER suggest "you might be in Expo Go" as a diagnosis
- NEVER suggest running Google Maps as an alternative to Mapbox
- NEVER ask "are you running a dev build?" — the answer is always yes
- NEVER suggest `npx expo start` without `--dev-client` flag
