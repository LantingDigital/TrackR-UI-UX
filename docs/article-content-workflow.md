# TrackR Article Content Workflow

Documented 2026-03-11. Manual process for now — will become a `/article` skill later.

## Purpose
Frontload 10-20 articles before launch so the app feels alive on day one. Articles appear in users' home feeds alongside community posts.

## Pipeline

### Step 1: Discover (Perplexity)
Find what's actually newsworthy in the coaster/theme park world right now.
- Use Perplexity search or Perplexity Pro to find current news topics
- Categories: new ride openings, park announcements, ride reviews, industry news, seasonal events, record-breaking coasters
- Goal: identify 3-5 article topics per session
- Output: list of topics with source URLs

### Step 2: Research (Deep Research Tool)
Build the factual backbone of each article.
- Tool: Perplexity Sonar Pro (preferred — citations built in), Gemini Deep Think, or Opus deep research
- Query: comprehensive research on the topic — stats, history, context, quotes, timelines
- Output: thorough research document with citations and sources

### Step 3: Humanize (Voice Pass)
Transform the research paper into something that sounds like Caleb wrote it.
- Run through AI with a TrackR article voice file (to be created — based on voice.md but adapted for editorial content)
- Tone: enthusiastic thoosie who did their homework. Not scholarly, not clickbait. Like a well-informed friend telling you about something cool.
- Summarize the research into a readable article (800-1500 words)
- Keep source attribution — link to original sources for credit
- No AI-sounding phrases, no corporate buzzwords

### Step 4: Format
- Add NanoBanana card art as banner image (use relevant coaster's card if it exists)
- Structure: headline, subtitle, banner image, body with subheadings, source links at bottom
- Add metadata: category tags, estimated read time, publish date
- If images are needed beyond the banner, source from RCDB or park press kits (credit required)

### Step 5: Store
- Save article as a Firestore document in `articles/{articleId}` collection
- Schema: { title, subtitle, body (markdown or rich text), bannerImageUrl, category, tags, readTimeMinutes, sources: [], authorId (Caleb's uid), publishedAt, status: 'draft' | 'published' }
- Set status to 'draft' until ready to publish
- Publish by flipping status to 'published' (from Firebase console or admin dashboard)

## Content Calendar (Pre-Launch Target)
- March-April: 2-3 articles per week in off-time
- Goal: 15-20 articles ready before TestFlight beta
- Mix of evergreen (ride reviews, park guides) and timely (new openings, seasonal news)

## Future: /article Skill
This manual workflow will become an automated skill similar to /nanobanana:
1. Perplexity API discovers topics
2. Perplexity Sonar Pro or Gemini researches
3. AI humanizer with voice file
4. Auto-format with NanoBanana banner
5. Store as draft in Firestore
6. Caleb reviews and publishes

Perplexity Pro account ($20/mo) recommended when article production becomes regular.
