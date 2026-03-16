# Card Art Batch Workflow (Proven Process)

This is the exact workflow that produces high-quality NanoBanana card art at scale. Follow it step by step.

## Phase 1: Identify Targets

1. Cross-reference `src/data/cardArt.ts` against the coaster index to find coasters WITHOUT card art
2. Prioritize by popularity rank (highest ranked = most visible in app)
3. Pick 5-10 coasters per batch

## Phase 2: Source Image Acquisition (FAST)

Use Playwright to search Google Images and extract full-resolution URLs:

```js
// Navigate to Google Images for each coaster
await page.goto(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`);
await page.waitForTimeout(1500);

// Click on a close-up result (prefer 2nd or 3rd image, skip YouTube thumbnails)
await page.mouse.click(478, 330);
await page.waitForTimeout(1500);

// Extract the original image URL from the imgres link
const links = await page.locator('a[href*="imgurl"]').all();
for (const link of links) {
  const href = await link.getAttribute('href');
  const match = href.match(/imgurl=([^&]+)/);
  if (match) {
    const url = decodeURIComponent(match[1]);
    // This is the full-res source image URL
  }
}
```

Then download all source images in parallel with curl:
```bash
curl -sL -o sheikra-source.jpg "https://..." &
curl -sL -o nitro-source.jpg "https://..." &
wait
```

### Source Image Rules
- Prefer CLOSER shots showing clear track detail
- NOT zoomed-out whole-ride overview shots
- Simple search queries: "[coaster name] [park]" -- no style modifiers
- Good sources: RCDB, Wikipedia, NYTimes, TripSavvy, fan sites
- RCDB photo viewer works great for close-ups (navigate to rcdb.com/[id].htm, click thumbnails)

## Phase 3: Batch Submit to Gemini (PARALLEL)

Submit all coasters to separate Gemini chats without waiting for generation:

```
For each coaster:
1. Navigate to https://gemini.google.com/app (new chat)
2. Wait 2s for page load
3. Click "Open upload file menu" button
4. Click "Upload files" menuitem (triggers file chooser)
5. Use browser_file_upload to select the source image
6. Type the EXACT prompt (see below) into the textbox
7. Submit (press Enter)
8. DO NOT WAIT -- immediately go to step 1 for the next coaster
```

All chats generate in parallel. Save the chat URLs for harvesting later.

## Phase 4: Harvest Results

After ~60-90 seconds, visit each chat URL and click "Download full size image":

```js
await page.goto(chatUrl);
await page.waitForTimeout(5000);
await page.locator('[data-test-id="download-generated-image-button"]').click();
await page.waitForTimeout(5000);
```

Files download to `.playwright-mcp/Gemini-Generated-Image-[hash].png`

## Phase 5: Batch Process (FAST)

All in one bash script:
```bash
TOOL="/tmp/GeminiWatermarkTool-dir/GeminiWatermarkTool"
CWEBP="/opt/homebrew/bin/cwebp"

# 1. Watermark removal (on ORIGINAL PNG, never webp)
$TOOL --no-banner --force --denoise telea --snap -i [input.png] -o [output-clean.png]

# 2. Convert to webp
$CWEBP -q 90 [output-clean.png] -o assets/cards/[coaster-id].webp
```

## Phase 6: Add to App

1. Add entries to `src/data/cardArt.ts` under the correct park section
2. Update `assets/card-art-pipeline/STATUS.md` with approved entries
3. Clean up: delete screenshots, generated/, approved/ contents, source images

## The Prompt (EXACT -- never modify)

```
Reimagine the exact roller coaster image that is attached as a stylized yet believable illustration. Preserve realistic layout of ride, train type, perspective of the shot, and depth, but simplify surface textures and enhance lighting for a cinematic, illustrated look. Use controlled color grading, soft atmospheric haze, and clean edges. The structure should feel engineered and physically possible, but clearly rendered as premium concept art rather than a photograph. Emphasize mood, lighting, and composition over literal detail. No real-world identifiers.
Use a low angle, dramatic composition looking up at the structure. Soft gradient sky with subtle clouds. Portrait orientation, 2:3 aspect ratio.
Negative / Guidance
Avoid photo grain, avoid hyperreal skin or texture detail, no cartoon exaggeration, no logos or text, no square or landscape compositions.

Additionally, please remove any signs, people, or text from this photo, if applicable, and leave only an empty coaster train.

Make sure to keep the EXACT layout of the ride, as seen in the image attached. Do not deviate from what you see.

If there is no train visible on the track, do NOT add one. If there is snow, remove it and make it look like spring/summer.
```

## Critical Rules
- **NEVER modify the prompt per-coaster.** Same exact text every time.
- **NEVER run watermark removal on webp.** Always on original PNG.
- **Pipeline order:** PNG -> GeminiWatermarkTool -> cwebp -> webp
- **Gemini account:** caleb@lantingdigital.com (primary), caleb.m.lanting@gmail.com (backup)
- **Mode picker "Pro" != NanoBanana Pro.** The mode picker's "Pro" selects the 3.1 Pro TEXT model (generates text, not images). Leave mode on Fast (default). NanoBanana Pro is ONLY accessed via "Redo with Pro" in the three-dot menu after NB2 generates.
- **Approval required.** Show Caleb the generated images before adding to cardArt.ts.

## Performance Target
- 5 cards in ~10 minutes (source + generate + process + approve)
- Key to speed: parallel Gemini submissions + batch processing
