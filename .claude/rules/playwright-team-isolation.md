# Playwright Team Isolation (Known Limitation)

## The Problem

Per-project Playwright MCP isolation (`.claude/settings.json`) prevents browser collisions between SEPARATE Claude Code sessions (e.g., TrackR session vs iAttend session). But agents within the SAME team/session share the parent session's MCP connections, so they share one browser instance.

## Impact

When multiple agents on a team need Playwright simultaneously (e.g., backend in Firebase Console + card-art in Gemini), they collide — one agent's navigation redirects the other's page.

## Current Workaround

Sequential browser access: only ONE agent uses Playwright at a time. Team lead coordinates by pausing other agents.

## Incident (2026-03-19)

Backend agent (Firebase Console) and card-art agent (Gemini NanoBanana) collided. Card-art uploaded a source image and got NB2 generation, then backend navigated to Firebase Console, killing the Gemini session before "Redo with Pro" could be clicked. Resolved by pausing backend.

## Future Fix (TODO)

Research whether agents can spawn their own isolated Playwright MCP servers on different ports. This would require per-agent MCP config, not just per-project.
