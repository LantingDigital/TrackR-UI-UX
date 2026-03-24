# Browser Rules (Project-Wide Standard)

## Browser Slot System

All browser automation in this project uses the **browser slot system**. Agents are assigned a browser slot by the team lead and use `mcp__browser-{N}__*` tools. Browsers are headed (visible) and already running when assigned. Do NOT launch your own browser. Do NOT use `mcp__playwright__*` tools.

Refer to BROWSER-WORKFLOW.md in the EA project root for the full tool list and usage rules.

## Rules

1. **Only use your assigned browser slot.** Use `mcp__browser-{N}__*` tools matching your assigned slot number. Never use a different slot.
2. **Use screenshots liberally** to verify what the browser shows at each step.
3. **Save screenshots** to `assets/card-art-pipeline/screenshots/` for card art workflows, or a temp directory for other tasks.
4. **Respect rate limits** — add reasonable delays between requests (1-2s between page navigations).
5. **If 2FA is needed, pause and notify the team lead.** Caleb handles 2FA manually.

## NanoBanana Card Art Workflow

When automating NanoBanana card art generation:
1. Source images go to `assets/card-art-pipeline/source/[coaster-id]-source.jpg`
2. Generated images go to `assets/card-art-pipeline/generated/[coaster-id]-pro.png`
3. NEVER put generated images directly into `assets/cards/` — they must go through approval
4. NEVER modify `src/data/cardArt.ts` — only Caleb's approval triggers that
5. If Gemini auth requires 2FA, pause and ask Caleb
6. If primary Google account (caleb@lantingdigital.com) runs out of tokens, switch to secondary (caleb.m.lanting@gmail.com)
7. Use the NanoBanana prompt from `context/aspirations/nanobanana-card-design.md`
8. Always request "Redo with Pro" after initial NanoBanana 2 generation
