# TrackR

Premium React Native (Expo SDK 54) app for roller coaster enthusiasts.
Light mode, minimal aesthetic, 60fps spring animations on every interaction.

## Tech: React Native, Expo SDK 54, React Native Reanimated, React Navigation
## Phase: 1 (Core Experience) — see .claude/plans/app-blueprint/

## Context Pointers (read only when relevant to the current task)
- **Design System (single source of truth)** → DESIGN_SYSTEM/index.md
- **App Blueprint** → .claude/plans/app-blueprint/index.md
- **Screen Build Workflow** → .claude/plans/screen-build-workflow.md
- Design tokens & conventions → .claude/design/system.md
- Animation conventions → .claude/animation/system.md
- Component inventory → .claude/design/components.md
- Testing → .claude/testing/README.md
- Architecture → .claude/architecture/project-structure.md
- Migration tracking → .claude/animation/migration-log.md
- Reusable component inventory → .claude/plans/reusable-inventory.md

## Rules
- All animations use react-native-reanimated (never react-native Animated)
- Spring physics on all morphs and transitions
- 60fps target on all interactions — test on physical device
- Use theme constants (colors, spacing, radius) — never hardcode values
- Haptic feedback on every user-initiated action
- NEVER guess at design values — always reference DESIGN_SYSTEM/
- When building a new screen, follow .claude/plans/screen-build-workflow.md exactly
