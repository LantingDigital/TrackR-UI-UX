# JSON Image Prompting — TrackR Art Pipeline (v3 — PROVEN)

Tested and validated 2026-03-24 with Alpengeist and Lightning Rod. This is the official approach for ALL image generation.

## The Flow: 3 Steps, Same Gemini Session

### Step 1: Upload Source + Get JSON Analysis

Upload source photo to Gemini. Paste this prompt:

```
Output ONLY a JSON object. No explanation, no commentary, no markdown formatting, no code fences — just the raw JSON. Analyze this image and describe every visual element using this exact structure:

{
  "subject": { "type": "", "name": "", "description": "", "key_features": [], "position": "" },
  "environment": { "setting": "", "time_of_day": "", "weather": "", "season": "", "background_elements": [] },
  "lighting": { "type": "", "direction": "", "color_temperature": "", "intensity": "", "shadows": "" },
  "color_palette": { "dominant_colors": [], "accent_colors": [], "overall_temperature": "" },
  "composition": { "framing": "", "camera_angle": "", "camera_distance": "", "focal_point": "", "depth_of_field": "" },
  "mood": "",
  "textures": [],
  "notable_details": []
}

Fill in every field based on what you actually see. If a field doesn't apply, use "N/A" or describe what IS there instead. Be precise — this JSON will be used to recreate this image in a different artistic style.
```

Gemini outputs ONLY the JSON. No preamble.

### Step 2: Agent Modifies the JSON

The agent takes Gemini's JSON output and makes these changes:

**Fields that get MODIFIED:**
- `subject.description` → change "filled with riders/passengers" to "with empty seats, no passengers"
- `environment.time_of_day` → change to "Golden hour"
- `lighting` → replace entirely with warm golden-hour lighting (see style override below)
- `color_palette.overall_temperature` → change to warm golden shift
- `mood` → change to "Cinematic, warm, atmospheric, premium concept art"
- `textures` → simplify (smooth beams, clean surfaces, soft foliage)
- `notable_details` → replace with ["No people, no riders — empty train seats only", "No signs, text, logos, or watermarks", "No real-world identifiers"]

**Fields that stay UNTOUCHED (preserves layout accuracy):**
- `subject.type` — what kind of coaster it is
- `subject.key_features` — structural details (track type, supports, train style)
- `subject.position` — where the coaster is in the frame
- `environment.setting` — real location (forest, open field, etc.)
- `environment.background_elements` — what's behind the coaster
- `composition` — ALL composition fields stay exactly as analyzed (framing, camera angle, distance, focal point, depth of field). THIS IS WHAT PRESERVES THE LAYOUT.

**Add the `artistic_treatment` block** (see below).

### Step 3: Send Modified JSON → Generate Image

In the SAME Gemini conversation, paste:

```
Output ONLY the image. No text, no explanation. Reimagine this scene as described in the JSON below. The artistic_treatment defines the EXACT style. Portrait orientation, 2:3 aspect ratio.

{the modified JSON}
```

Then: "Redo with Pro" (mandatory for quality).

---

## Style Override Block (PROVEN — v3)

This block gets added to every modified JSON:

```json
"artistic_treatment": {
  "style": "Stylized yet believable illustration. Anime-realism hybrid. Premium concept art, NOT a photograph, NOT a cartoon",
  "rendering": "Simplified surface textures with clean edges. Structurally accurate and engineered-looking. Surfaces should feel smooth and almost low-poly, NOT metallic or photorealistic",
  "color_grading": "WARM golden-hour color grading on EVERYTHING. Sky must be peach/salmon/soft orange gradient with subtle clouds — NEVER flat blue. All colors shift warm. Controlled and muted, NOT vibrant or punchy",
  "atmosphere": "Soft atmospheric haze throughout, especially where light filters through trees or around structures. Cinematic depth with atmospheric perspective — distant elements fade into warm haze",
  "lighting_treatment": "Enhanced cinematic golden-hour warmth. Emphasize mood and composition over literal accuracy. Rim lighting on track edges. Soft volumetric light through foliage",
  "edges": "Clean and defined on mechanical/structural elements (track, supports, train). Soft and painterly on organic elements (trees, foliage, sky, ground)",
  "detail_level": "SIMPLIFIED — reduce surface complexity. Wooden beams are smooth, not grainy. Foliage is soft masses, not individual leaves. Steel is clean, not reflective. The overall feel should match Studio Ghibli-meets-architectural-rendering",
  "negative_guidance": "Avoid photo grain, avoid hyperreal texture detail, no cartoon exaggeration, no logos or text, no square or landscape compositions, no bright saturated colors, no visible brush strokes, no flat blue sky, no cool color temperature"
}
```

---

## Sanity Check (Agent runs AFTER generation)

Before approving any generated image, the agent verifies:

1. **Track layout matches source** — direction, banking, curves in the correct places. Compare the composition fields from the JSON against the output.
2. **Correct coaster type** — wooden stays wooden, steel stays steel, inverted stays inverted. No type swaps.
3. **No phantom track** — no extra track pieces that don't exist in the source image.
4. **Correct train type** — the train matches the source (or is correctly empty). No wrong train style.
5. **No people/riders** — seats should be empty. No visible humans.
6. **No watermarks, text, or logos** — clean image.
7. **Portrait 2:3 aspect ratio** — correct orientation and ratio.
8. **Warm color grading** — sky should be peach/salmon, NOT flat blue. Overall warmth present.
9. **Simplified textures** — surfaces are smooth, not photorealistic. Foliage is soft masses.

**If any check fails:**
- Log which check failed in the JSON receipt
- If layout deviation: flag as "layout drift" — may need a different source image
- If color is too cool/blue: re-run with explicit "sky must be peach/salmon" emphasis
- If train type is wrong: add specific train description to the JSON
- If phantom track: add "Do NOT add any track sections not visible in the original" to notable_details

---

## JSON Receipt (saved per card)

After generation, save the modified JSON as `{coaster-id}.json` alongside the image. This is the card's recipe — it documents:
- Exactly what was requested
- Can reproduce the same image
- Can debug issues by comparing JSON to output
- Builds a library of corrections over time

---

## File Structure

```
assets/card-art/
├── sources/                    — source photos (input)
│   └── {coaster-id}-source.jpg
├── json/                       — per-card JSON receipts
│   └── {coaster-id}.json
├── batch-review/               — generated cards pending Caleb's approval
│   └── {coaster-id}.webp
├── rejected/                   — rejected cards (stay for reference)
│   └── {coaster-id}-rejected.webp
├── in-app/                     — approved cards, live in app + merch store
│   └── {coaster-id}.webp
└── style-override.json         — the artistic_treatment block (single source of truth)
```

Watermark removal (GeminiWatermarkTool) happens between generation and batch-review.
Pipeline order: generated PNG → watermark removal → cwebp -q 90 → batch-review/ as .webp

---

## Key Learnings from Testing (2026-03-24)

1. **The JSON composition fields are what preserve layout.** Never modify `composition.camera_angle`, `composition.framing`, `subject.position`, or `subject.key_features`. These are the layout anchors.
2. **Warm golden-hour sky is essential.** The first test used cool blue colors and looked nothing like the approved cards. The warm peach/salmon sky is a defining characteristic of TrackR card art.
3. **"Simplified" means smooth and low-poly, not desaturated.** The first test was too flat. The approved cards have simplified textures but still feel dimensional and warm.
4. **Step 1 JSON analysis is highly accurate.** Gemini correctly identifies track types, structural details, and environmental elements. This data anchors the generation.
5. **The "Create image" button in Gemini triggers a style picker, not NanoBanana directly.** Just paste the prompt normally — Gemini auto-invokes NanoBanana when given an image + reimagine instruction.
6. **Always "Redo with Pro"** after the initial NanoBanana 2 generation for higher quality.

---

## Application Beyond Coaster Cards

### Park Art (landscape)
- Same Step 1-3 flow
- Source: aerial/skyline of park
- Modify composition for landscape orientation
- For impossible compositions (multiple rides merged): manually write the subject/composition fields describing the merge

### Article Hero Images (landscape)
- Same flow, different source (relevant to article topic)
- Add "landscape orientation, 16:9 aspect ratio" to the generation prompt
- Content varies by topic (not always coasters)

### Article Inline Images (variable aspect ratio)
- Same flow, or text-only generation (skip Step 1 if no source photo)
- Specify aspect ratio in composition field per image
