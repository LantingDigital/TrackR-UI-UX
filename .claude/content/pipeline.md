# TrackR Content Pipeline — Full Production Flow

10-stage pipeline from topic selection to published article. Invoked via skill, executed by agent with browser slots.

---

## Invocation

A skill prompts Caleb:
1. "Which subcategory?" (from content-taxonomy.md)
2. "How many articles?"

The agent takes over and runs non-stop until the target quantity is met. Each article goes through all 10 stages before the next one starts.

---

## Stage 1: TOPIC DISCOVERY

Agent uses its Perplexity browser slot to find current/relevant topics within the chosen subcategory.

- **News subcategories:** Search for what's happening RIGHT NOW in the coaster industry. Trending announcements, recent closures, breaking developments.
- **Evergreen subcategories:** Search for topics that haven't been covered yet, or classic topics worth a fresh take. Check existing published articles to avoid duplicates.
- **Park-specific subcategories:** Target specific parks that don't have guides/content yet.

Output: A specific topic title and 2-3 sentence description of the angle.

---

## Stage 2: PERPLEXITY RESEARCH REPORT

Using the subcategory-adapted prompt from `research-flow.md`:

1. Navigate to perplexity.ai in the browser slot
2. Select **Sonar model** (best, most trusted for up-to-date research)
3. Use **deep research mode** for maximum quality
4. Paste the adapted research prompt with the specific topic
5. **The prompt must explicitly request a cohesive ARTICLE**, not just a research summary. Perplexity should output article-structured content, not bullet points.
6. Extract the full output + ALL source URLs that Perplexity cites

Output: A raw research-based article draft from Perplexity + list of source URLs.

---

## Stage 3: REFORMAT TO TRACKR ARTICLE

Take Perplexity's output and reformat into the TrackR article structure:

- Apply the article structure from research-flow.md (context, facts, enthusiast culture, technical, takeaways)
- Rewrite in **community voice** (authentic thoosie, not editorial, not personal)
- Ensure 3-4 source types are represented (not single-source-dominated)
- Attach all Perplexity source URLs as clickable links in a "Sources" section at the bottom
- Add frontmatter: title, author ("TrackR Community"), date, category, subcategory, tags, excerpt

Output: A formatted article draft with source links.

---

## Stage 4: HUMANIZE (Pass 1)

Run the article through the `/humanizer` skill.

- Strips 25 known AI writing patterns (Wikipedia-based guide)
- Removes em dashes, sycophantic tone, AI vocabulary, significance inflation, etc.
- Includes a built-in "obviously AI" audit pass with rewrite

Output: Humanized article draft.

---

## Stage 5: AI DETECT (Pass 2)

Run the humanized article through a local AI detection tool (researched and selected by the agent — see note below).

- Flags sections that still read as AI-generated
- Reports a confidence score per section

**Note:** The agent's first task is to use its Perplexity browser slot to research open-source, locally-running AI detection tools with no external API dependency. The selected tool is approved by Caleb before being integrated into the pipeline.

Output: Detection report with flagged sections.

---

## Stage 6: REWRITE FLAGGED SECTIONS

For each flagged section:
1. Rewrite with more natural phrasing
2. Re-run through humanizer if needed
3. Re-run through AI detection
4. Repeat until the section passes

Output: Clean article that passes AI detection.

---

## Stage 7: GENERATE HERO IMAGE

Using the agent's Gemini browser slot:

1. Determine the hero image subject based on the article topic
2. Navigate to Gemini, use NanoBanana stylization prompt
3. Generate a **LANDSCAPE** image (article hero aspect ratio)
4. The stylization language matches card art, but the CONTENT is different:
   - Parks, scenes, historical subjects, creative merges
   - NOT just coasters — match the article's subject matter
   - If a weekly roundup mentions two parks, creatively merge them
5. Source photos are OPTIONAL — text-prompt-only generation is fine if results are good
6. Download and save to article assets

Output: Landscape hero image in NanoBanana style.

---

## Stage 8: GENERATE INLINE IMAGES (2-3)

Identify 2-3 key moments/subjects in the article that benefit from visual illustration:

1. Scan the article for distinct topics, parks, rides, or events mentioned
2. For each, generate a NanoBanana-style image via Gemini
3. **Aspect ratios are DYNAMIC:**
   - Landscape for scenery, park overviews, panoramic subjects
   - Portrait for ride close-ups, people, vertical subjects
   - Square for balanced compositions
4. Source photos are optional — text-prompt-only is fine
5. Resolution should be high quality but doesn't need to be identical across images
6. Place images at the relevant section of the article (where the subject is mentioned)

Output: 2-3 inline images placed within the article.

---

## Stage 9: PUBLISH TO FIRESTORE

Upload the complete article to the `articles` Firestore collection:

- Article content (markdown or HTML)
- Hero image URL (uploaded to Firebase Storage)
- Inline image URLs (uploaded to Firebase Storage)
- Source links (clickable, from Perplexity)
- Category, subcategory, tags
- Excerpt (first 1-2 sentences or custom)
- Author: "TrackR Community"
- Published date
- Featured flag (for home screen prominence)

Output: Article live in Firestore, ready for app access.

---

## Stage 10: REPEAT

If the quantity target hasn't been met, return to Stage 1 (Topic Discovery) for the next article. Continue until all requested articles are published.

---

## Browser Slot Requirements

The content agent needs **TWO** dedicated browser slots:
1. **Perplexity slot** — for research (logged into Caleb's Perplexity Pro account)
2. **Gemini slot** — for NanoBanana image generation (logged into Caleb's Google account)

These are assigned by the team lead when the agent is activated.
