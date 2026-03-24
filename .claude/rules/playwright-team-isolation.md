# Browser Team Isolation — Browser Slot System

## History

The original inline Playwright MCP system (per-agent `mcpServers` in YAML frontmatter) has been **REPLACED** by the browser slot system. The old approach defined isolated `--headless --isolated` Playwright instances per agent. The new system uses pre-launched headed browser slots managed by the team lead.

## The Old System (DEPRECATED)

Used inline `mcpServers` in agent YAML frontmatter to spin up per-agent Playwright processes. Each agent got `--headless --isolated`. This solved browser collisions but required each agent to manage its own browser lifecycle.

## The New System — Browser Slots

Agents now use pre-assigned browser slots via `mcp__browser-{N}__*` tools. The browser is already running when the agent starts. Agents do NOT launch their own browsers.

Key rules:
- Do NOT use `mcp__playwright__*` tools — use only your assigned `mcp__browser-{N}__*` tools
- The browser is already running — do NOT launch your own
- Browser slots are assigned by the team lead when activating agents
- Refer to BROWSER-WORKFLOW.md in the EA project root for the full tool list and usage rules

## Agent Files Updated

- `card-art-agent.md` — uses browser slot for Gemini NanoBanana generation and source image search
- `experience-agent.md` — uses browser slot for PKPass cert setup and API testing
- `firebase-browser.md` — utility agent, uses browser slot for Firebase Console admin tasks
- `merch-browser.md` — utility agent, uses browser slot for QPMN, pricing research, vendor signups

## What About the Project-Level Config?

The `.claude/settings.json` Playwright config may still exist as a fallback for the main session. The browser slot system is the primary method for team agents.
