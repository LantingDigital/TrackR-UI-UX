# Playwright Team Isolation — SOLVED

## The Problem (was)

All agents in the same session shared ONE Playwright MCP browser. When multiple agents needed browsers simultaneously (e.g., card-art in Gemini + backend in Firebase Console), they'd hijack each other's pages.

## The Solution

Use **inline `mcpServers`** in agent definition files (`.claude/agents/*.md`). Each agent's YAML frontmatter defines its own Playwright MCP server, which spins up a separate process = separate browser.

```yaml
---
mcpServers:
  - name: playwright
    type: stdio
    command: npx
    args: ["@playwright/mcp@latest", "--headless", "--isolated"]
---
```

The `--isolated` flag ensures each uses a temporary user-data-dir (no profile collisions).

**Key:** You MUST use inline definitions. If you pass a string reference (just `"playwright"`), it shares the parent's connection.

## Agent Files Created

- `.claude/agents/card-art-browser.md` — for Gemini NanoBanana generation
- `.claude/agents/firebase-browser.md` — for Firebase Console admin tasks
- `.claude/agents/merch-browser.md` — for QPMN, pricing research, vendor signups

## How to Use

When spawning agents that need Playwright, use `subagent_type` matching the agent file name:

```
Agent(subagent_type="card-art-browser", name="card-art", ...)
Agent(subagent_type="firebase-browser", name="backend", ...)
Agent(subagent_type="merch-browser", name="merch", ...)
```

Each agent gets its own browser process. No collisions. Browsers clean up on agent exit.

## What About the Project-Level Config?

The `.claude/settings.json` Playwright config stays as the default for the main session and any agents that DON'T define their own inline MCP. The inline definitions override it per-agent.

## Incident (2026-03-19)

Card-art agent and backend agent collided 3 times. Then card-art and merch-pricing collided 3 more times. Fixed mid-session with sequential access, then permanently solved with inline mcpServers.
