# NanoBanana Card Art Pipeline -- Session 4

Date: 2026-03-16
Status: **Pre-work complete, generation blocked (no Playwright access)**

## Summary

Full visual audit of ALL 64 remaining source images (#48-#111). No cards generated this session due to Playwright browser being locked by another agent, then the MCP server becoming unavailable entirely.

## What Was Done

1. **Visual verification of every source image** -- read each image file, compared against expected coaster appearance
2. **Categorized all 64 sources:**
   - 23 CONFIRMED GOOD (verified correct coaster, good composition)
   - 16 BORDERLINE (likely correct but harder to confirm)
   - 7 UNCERTAIN (skip unless needed)
   - 18 WRONG SOURCE (wrong coaster, duplicate, not a coaster, facade only, etc.)
3. **Updated QUEUE.md** with new sections: VERIFIED GOOD, BORDERLINE, UNCERTAIN, WRONG SOURCE
4. **Documented all wrong sources** with what they show vs what they should be

## First Generation Batch (10 strongest, ready to go)

These are the highest confidence, best composition sources:

1. corkscrew-alton-towers
2. d-monen
3. dare-devil-dive
4. dc-rivals-hypercoaster
5. decepticoaster
6. dragon-khan
7. furius-baco
8. galeforce
9. helix
10. flying-aces

## Prompt to Use

**FOG PROMPT** (session 3 default -- adds atmospheric fog to base prompt):

```
Reimagine the exact roller coaster image that is attached as a stylized yet believable illustration. Preserve realistic layout of ride, train type, perspective of the shot, and depth, but simplify surface textures and enhance lighting for a cinematic, illustrated look. Use controlled color grading, soft atmospheric haze, and clean edges. The structure should feel engineered and physically possible, but clearly rendered as premium concept art rather than a photograph. Emphasize mood, lighting, and composition over literal detail. No real-world identifiers.
Use a low angle, dramatic composition looking up at the structure. Soft gradient sky with subtle clouds. Portrait orientation, 2:3 aspect ratio.
Negative / Guidance
Avoid photo grain, avoid hyperreal skin or texture detail, no cartoon exaggeration, no logos or text, no square or landscape compositions.

Additionally, please remove any signs, people, or text from this photo, if applicable, and leave only an empty coaster train.

Make sure to keep the EXACT layout of the ride, as seen in the image attached. Do not deviate from what you see.

If there is no train visible on the track, do NOT add one. If there is snow, remove it and make it look like spring/summer.

Add subtle ground-level atmospheric fog that softens the base of structures and creates gentle depth separation between foreground and background.
```

## Wrong Source Details (18 items)

| Coaster ID | What Source Shows | What It Should Be |
|-----------|-------------------|-------------------|
| corkscrew | Small abandoned station | Cedar Point Arrow corkscrew |
| corkscrew-coaster | DUPLICATE of alton-towers | Different ride |
| corkscrew-nagashima-spa-land | Tropical kiddie train | Japanese Arrow corkscrew |
| corkscrew-valleyfair | Cliff railway/funicular | Arrow corkscrew at Valleyfair |
| crazy-bats | Promotional poster | Indoor VR coaster, Phantasialand |
| darkoaster | Building facade | Indoor coaster at BGW |
| der-schwur-des-k-rnan | Traveling carnival | Gerstlauer Infinity, Hansa-Park |
| divertical | Park grounds, no coaster | Water coaster, Mirabilandia |
| enchanted-airways | Carousel park | Family coaster, USS |
| exterminator | Building facade | Indoor spinning wild mouse, Kennywood |
| f-l-y | "The Fly" wild mouse, CW | F.L.Y. flying coaster, Phantasialand |
| firebird | Wonder Woman ride | Firebird floorless, SFA |
| flying-fox | Promotional render | Family coaster, Wild Adventures |
| flying-school | Alpine coaster | LEGOLAND Flying School |
| gadgets-go-coaster | Aviation museum | Gadget's Go Coaster, Disneyland |
| georgia-gold-rusher | B&M coaster | Mine train at SFoG |
| ghoster-coaster | Indoor gem mine | Outdoor kids' woodie, CW |
| grand-exposition-coaster | "Caya Land" sign | Different park entirely |

## Key Finding

**28% of "GOOD" queue sources are actually wrong coasters** -- consistent with session 3's ~30% observation. Visual verification before Gemini submission is CRITICAL. The file-size-only check catches thumbnails but misses completely wrong images.

## Next Steps (for next session)

1. Restart Playwright MCP or ensure browser access
2. Submit the 10 strongest verified sources to Gemini with fog prompt
3. Process results: watermark removal + cwebp conversion
4. Show Caleb for approval
5. Continue with remaining 13 verified good sources
6. Then move to 16 borderline sources

---

*Session 4 -- 2026-03-16*
