# Playwright Rules (Project-Wide Standard)

## HEADLESS MODE ONLY — NO EXCEPTIONS

All Playwright automation in this project MUST run in **headless** mode. Never launch a headed browser.

```js
// CORRECT — always headless
const browser = await chromium.launch({ headless: true });

// WRONG — NEVER do this
const browser = await chromium.launch({ headless: false });
const browser = await chromium.launch(); // default might vary, always set explicitly
```

## Rules

1. **Always set `headless: true` explicitly** when calling `chromium.launch()`, `firefox.launch()`, or `webkit.launch()`.
2. **Never use headed mode** for any reason — debugging, demos, or "quick tests." Use screenshots and traces for debugging instead.
3. **Use screenshots liberally** to see what the headless browser sees at each step.
4. **Save screenshots** to `assets/card-art-pipeline/screenshots/` for card art workflows, or a temp directory for other tasks.
5. **Respect rate limits** — add reasonable delays between requests (1-2s between page navigations).
6. **Kill stale processes** — always wrap Playwright scripts in try/finally to ensure `browser.close()` runs.

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
