# TrackR

Premium React Native (Expo SDK 54) app for roller coaster enthusiasts.
Light mode, minimal aesthetic, 60fps spring animations on every interaction.

## Tech: React Native, Expo SDK 54, React Native Reanimated, React Navigation
## Phase: 1 (Log Flow) — see .claude/plans/v1-mvp-roadmap.md

## Context Pointers
- Design system → .claude/design/system.md
- Animation conventions → .claude/animation/system.md
- Current phase spec → .claude/plans/phase-1-spec.md
- Component inventory → .claude/design/components.md
- Testing → .claude/testing/README.md
- Architecture → .claude/architecture/project-structure.md
- Migration tracking → .claude/animation/migration-log.md

## Rules
- All animations use react-native-reanimated (never react-native Animated)
- Spring physics on all morphs and transitions
- 60fps target on all interactions — test on physical device
- Use theme constants (colors, spacing, radius) — never hardcode values
- Haptic feedback on every user-initiated action
