# TrackR

Premium React Native (Expo SDK 54) app for roller coaster enthusiasts.
Light mode, minimal aesthetic, 60fps spring animations on every interaction.

## Tech: React Native, Expo SDK 54, React Native Reanimated, React Navigation
## Phase: 1 (Core Experience) — see .claude/plans/app-blueprint.md

## Context Pointers
- **Design System (single source of truth)** → DESIGN_SYSTEM.md
- **App Blueprint** → .claude/plans/app-blueprint.md
- Design tokens & conventions → .claude/design/system.md
- Animation conventions → .claude/animation/system.md
- Component inventory → .claude/design/components.md
- Testing → .claude/testing/README.md
- Architecture → .claude/architecture/project-structure.md
- Migration tracking → .claude/animation/migration-log.md
- Legacy roadmap (retired) → .claude/plans/v1-mvp-roadmap.md

## Rules
- All animations use react-native-reanimated (never react-native Animated)
- Spring physics on all morphs and transitions
- 60fps target on all interactions — test on physical device
- Use theme constants (colors, spacing, radius) — never hardcode values
- Haptic feedback on every user-initiated action

## Screen Build Workflow

When I ask you to build a new screen, follow this EXACT process. Do NOT skip steps. Do NOT start coding until Step 4.

### Step 1: Research & Inspiration (Planning Mode)

Before anything else:
1. Read DESIGN_SYSTEM.md cover to cover
2. Ask me what the PURPOSE of this screen is (what does the user accomplish here?)
3. Research and propose 3-5 layout concepts inspired by real-world apps that nail this type of screen
4. For each concept, describe: the structure, why it works, and how it could adopt our design language
5. Ask me which elements or approaches resonate—or if none do, propose more

DO NOT move to Step 2 until I confirm a direction.

### Step 2: Layout Exploration (Planning Mode)

Based on my input:
1. Propose 2-3 refined layout variations
2. For each, describe:
   - Overall structure and visual hierarchy
   - How it flows with existing navigation and screens
   - How it incorporates the Design System's animation principles WITHOUT copying the home screen
   - Scroll behavior and state changes
   - What makes it feel cohesive with the rest of the app
3. Explain tradeoffs between each option

DO NOT move to Step 3 until I pick a direction.

### Step 3: Detailed Design Spec (Planning Mode)

Write a FULL spec:
1. Map every element to specific Design Tokens from DESIGN_SYSTEM.md
2. Define every animation: triggers, exact values, choreography
3. Define every interaction: press states, haptics, transitions
4. Define scroll behavior if applicable
5. Define screen transitions (entering and leaving this screen)
6. Run the Quality Checklist from DESIGN_SYSTEM.md Section 11 against the spec
7. Identify any NEW patterns this screen needs that don't exist in the Design System yet
8. Present the full spec for my review

DO NOT move to Step 4 until I approve the spec.

### Step 4: Structural Build (Code Mode)

1. Build ONLY the structural layout—no animations, no polish, no shadows
2. STOP and show me the skeleton
3. Get my approval on the bones before adding any meat

### Step 5: Animation & Polish Layer (Code Mode)

1. Layer in animations ONE AT A TIME
2. After each animation, verify it matches the Step 3 spec
3. Apply shadows, colors, typography per Design Tokens
4. If anything feels off or doesn't match, STOP and flag it—don't try to fix it silently

### Step 6: QA & Finalize

1. Run through the entire Quality Checklist from DESIGN_SYSTEM.md
2. Compare every element's exact values against the Design Tokens
3. Check for: shadow blinking, overlay timing, duplicate layer issues, animation jank
4. Test all state transitions: resting → active → expanded → condensed → resting
5. Verify haptics fire correctly
6. Present final screen for my review

### Step 7: Update Design System

After I approve the screen:
1. Document any NEW patterns, tokens, or principles this screen introduced
2. Add them to DESIGN_SYSTEM.md
3. Update the Quality Checklist if new checks are needed

### Rules

- NEVER guess at design values. Always reference DESIGN_SYSTEM.md.
- NEVER skip planning steps. The entire point is to avoid building something wrong and starting over.
- If ANYTHING doesn't feel right, STOP and ask me. Don't improvise.
- Always ask: "Would this feel like it belongs next to the home screen?"
- The Design System is a living document. It grows with every screen we build.
