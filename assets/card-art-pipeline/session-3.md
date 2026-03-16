# NanoBanana Card Art Pipeline — Session 3

Date: 2026-03-16

## Summary

**29 new cards deployed this session.** Total in cardArt.ts: **242** (was 210 at session start).

### Cards Deployed This Session

1. Alpenfury (Europa-Park)
2. Anubis: The Ride (Plopsaland De Panne) — re-sourced from RCDB
3. Aquaman: Power Wave (SeaWorld San Antonio)
4. ArieForce One (Fun Spot America Atlanta)
5. Arkham Asylum: Shock Therapy (Warner Bros. Movie World AU)
6. Arthur (Europa-Park)
7. Atlantica SuperSplash (Europa-Park)
8. Ba-A-A Express (Europa-Park) — re-sourced from RCDB
9. Backlot Stunt Coaster (Kings Island)
10. Avengers Assemble: Flight Force (Walt Disney Studios Park) — station/car shot, enclosed coaster
11. Battlestar Galactica: Human vs Cylon (USS)
12. Batgirl Batarang (Six Flags Mexico)
13. Baron 1898 (Efteling) — redo, first had phantom track
14. Bat Lagoon — redo with train removal prompt
15. Batwing (Six Flags America)
16. Cannibal (Lagoon)
17. Boardwalk Bullet (Kemah Boardwalk)
18. Bobbahn Phantasialand
19. Black Mamba (Phantasialand)
20. Blue Tornado (Gardaland)
21. Coney Island Cyclone — first fog-prompt card
22. Comet
23. Cocoa Cruiser (Hersheypark)
24. Carolina Goldrusher (Carowinds)
25. Catwoman's Whip (Six Flags Great Adventure)
26. Chupacabra (Six Flags Mexico)
27. Coccinelle (France)
28. Carolina Cyclone (Carowinds)
29. Cobra's Curse (BGT) — v3, heavily stylized prompt

### Prompt Evolution

1. **Original prompt** (cards 1-9): Standard NanoBanana prompt from skill doc. No fog. Results were clean but lacked the atmospheric depth of Caleb's original California cards.
2. **Fog prompt** (cards 21-28): Added "Add subtle ground-level atmospheric fog that softens the base of structures and creates gentle depth separation between foreground and background." Caleb loved it — matches the California card vibe.
3. **Heavy stylization prompt** (Cobra's Curse v3): For coasters that come out too realistic, added "HEAVILY stylized, painterly illustration... bold simplification... clean vector-like edges, flat color fills with soft gradients... like a high-end theme park poster or animated film background." Takes longer to generate but pushes further from photorealism.

**Current default prompt = fog prompt (#2).** Use heavy stylization (#3) only as a fallback when NB2 produces too-realistic results.

## Redo Backlog

| Coaster | Issue | Action Needed |
|---------|-------|---------------|
| Bombora (Lagoon) | Too realistic | Re-submit with fog prompt or heavy stylization |
| Blue Hawk (SFoG) | Track bending/distortion | Re-submit, maybe different source angle |
| Black Diamond (Knoebels) | Building facade source — it's a dark ride | Need station/train photo from RCDB |
| Big Thunder Mountain | Chat failed to load during download | Re-submit |

## Bad Source Images Identified (DO NOT SUBMIT)

These source images in the `source/` folder are WRONG coasters. They need replacement from RCDB before generation:

| Coaster ID | What Source Shows | What It Should Be |
|-----------|-------------------|-------------------|
| batman-the-ride-six-flags-great-america | Scandinavian kiddie coaster | B&M inverted (clone) |
| batman-the-ride-six-flags-over-georgia | Georgia Cyclone wooden coaster | B&M inverted (clone) |
| batman-the-dark-knight | Boardwalk pier coaster | Mack wild mouse (indoor) |
| batgirl-coaster-chase | Large wooden coaster | Small DC-themed family ride |
| big-apple-coaster | Caterpillar kiddie coaster | Manhattan Express at NY-NY Vegas |
| big-thunder-mountain-railroad-disneyland-paris | Landscape photo, no coaster | BTMRR at Disneyland Paris |
| casey-jr-circus-train | Historical plaque about Wonderland City | Casey Jr at Disneyland |
| chip-n-dale-s-gadget-coaster | Azhari Park building (Middle East) | Gadget Coaster at Tokyo Disneyland |
| bob | Sea Viper station (wrong coaster) | Bob bobsled at Efteling |
| comet-express | Brazilian traveling coaster (same wrong image used for avengers originally) | Comet Express at whatever park |
| bergbanan | Looping coaster (wrong type) | Small family coaster at Gröna Lund |
| black-hole | Yellow inverted loop (uncertain) | Needs verification |
| barracuda-strike | Promotional render (may get copyright blocked) | Need fan photo |
| bat | Red Vekoma boomerang (unverified which park) | Needs verification |

## Queue Position

Completed through: `coney-island-cyclone` (GOOD queue item #47 of 111)
Next up: `corkscrew` (#48)

## Rules Created/Updated This Session

- `projects/trackr/.claude/rules/source-image-verification.md` — verify ALL source images against RCDB before submitting. Indoor coasters: use station/train photos.
- Fog prompt addition documented above.
- Heavy stylization fallback prompt documented above.

## Key Learnings

- **Source image quality is the #1 bottleneck.** ~30% of "GOOD" queue sources are actually wrong coasters. ALWAYS verify visually before submitting.
- **Indoor/enclosed coasters:** Use station/train photos. Building facades produce useless cards.
- **Copyrighted characters:** Gemini blocks generation from images with Disney/Marvel characters. Use fan photos without characters.
- **"Redo with Pro"** was unavailable on most NB2 generations this session (Gemini quota/session issue). NB2 quality is acceptable.
- **Subtle ground-level fog** is the magic ingredient that makes cards feel cinematic. Don't overdo it.
- **evaluate() method** for filling prompts + clicking send is MUCH faster than the type() + submit pattern.
- **Sidebar navigation** is unreliable for matching chats to coasters (all identical titles). Process cards with numbered names and identify visually during review.

---

*Session 3 — 2026-03-16*
