# Card Art Pipeline - Playwright MCP Flow

## How this works
1. Use Playwright MCP to search Google Images for picturesque coaster photos
2. Caleb approves the source image before proceeding
3. Playwright MCP navigates to Gemini, uploads source + NanoBanana prompt
4. NanoBanana Pro generates the image (already set to Pro in Gemini)
5. Download to generated/, Caleb reviews
6. **Watermark removal** via GeminiWatermarkTool (MANDATORY)
7. Convert to .webp and move to assets/cards/
8. Add entry to src/data/cardArt.ts

## Source Image Rules
- Prefer closer shots showing clear track detail, NOT zoomed-out whole-ride views
- Simple search queries: "[coaster name] [park]" -- no style modifiers
- NanoBanana handles the style transformation

## Prompt Rules
- Use the EXACT prompt from context/aspirations/nanobanana-card-design.md
- DO NOT add coaster-type-specific lines or any custom modifications
- Same prompt every single time. No exceptions.

## Train Fallback Rule
- If NanoBanana can't render the train correctly (e.g., inverted coasters where trains hang below track), modify the prompt to remove the train entirely: "leave the track completely empty with NO train on it at all. Remove the train entirely -- show only empty track and supports."
- This is the approved fallback for any coaster where the train rendering is wrong.

## Single-Rail Coaster Rule
- For RMC Raptor / single-rail coasters (e.g., Jersey Devil), add to prompt: "This photo is a SINGLE RAIL ROLLERCOASTER. Output it as such."
- NanoBanana still struggles with single-rail — may produce two-rail anyway. NB2 (non-Pro) may be acceptable if Pro also fails.

## Queue (Batch 2026-03-09 — pending Caleb review)

All 20 cards are in `approved/batch-review/` as webp files. Watermark removal + cwebp -q 90 applied.

| Coaster | Coaster ID | Mode | Status |
|---------|-----------|------|--------|
| Great American Scream Machine | `great-american-scream-machine-six-flags-great-adventure` | Pro | In batch-review/ |
| Wonder Woman Flight of Courage | `wonder-woman-flight-of-courage` | Pro | In batch-review/ |
| The Bat | `the-bat` | Pro | In batch-review/ |
| Dark Knight Coaster | `the-dark-knight-coaster` | Pro | In batch-review/ |
| Cheetah Hunt | `cheetah-hunt` | Pro | In batch-review/ |
| Great Bear | `great-bear` | Pro | In batch-review/ |
| Jolly Rancher Remix | `jolly-rancher-remix` | Pro | In batch-review/ |
| Thunder Road | `thunder-road` | Pro | In batch-review/ |
| Hurler | `hurler` | Pro | In batch-review/ |
| Iron Dragon | `iron-dragon` | Pro | In batch-review/ |
| WildCat | `wildcat-cedar-point` | Pro | In batch-review/ |
| Fahrenheit | `fahrenheit` | Pro | In batch-review/ |
| Afterburn | `afterburn` | NB2 | In batch-review/ |
| Cedar Creek Mine Ride | `cedar-creek-mine-ride` | NB2 | In batch-review/ |
| Adventure Express | `adventure-express` | NB2 | In batch-review/ |
| Mystery Mine | `mystery-mine` | NB2 | Approved (v2: train removed, new source) |
| Tennessee Tornado | `tennessee-tornado` | NB2 | In batch-review/ |
| Seven Dwarfs Mine Train | `seven-dwarfs-mine-train` | NB2 | In batch-review/ |
| Phoenix Rising | `phoenix-rising` | NB2 | Approved (v2: no added elements, new source) |
| Big Bear Mountain | `big-bear-mountain` | NB2 | In batch-review/ |

## Approved

| Coaster | Coaster ID | Source | NanoBanana | Added to App |
|---------|-----------|--------|------------|-------------|
| Iron Gwazi | `iron-gwazi` | Osprey Observer (full ride) | Pro - first try | Yes (cards/iron-gwazi.webp, cardArt.ts) |
| Fury 325 | `fury-325` | Google Images | Pro - first try | Yes (cards/fury-325.webp, cardArt.ts) |
| Thunder Striker | `thunder-striker` | RCDB photo (first drop) | Pro - redo | Yes (cards/thunder-striker.webp, cardArt.ts) |
| Nitro | `nitro` | RCDB (close-up, hills) | Pro - first try | Yes (cards/nitro.webp, cardArt.ts) |
| Skyrush | `skyrush` | NYTimes (close-up, train) | Pro - first try | Yes (cards/skyrush.webp, cardArt.ts) |
| SheiKra | `sheikra` | Wikipedia (dive coaster) | Pro - first try | Yes (cards/sheikra.webp, cardArt.ts) |
| New Texas Giant | `new-texas-giant` | TripSavvy (hybrid close-up) | Pro - first try | Yes (cards/new-texas-giant.webp, cardArt.ts) |
| Candymonium | `candymonium` | Lancaster Online (track detail) | Pro - first try | Yes (cards/candymonium.webp, cardArt.ts) |
| Mr. Freeze | `mr-freeze` | Guide to SFOT (shuttle tower) | Pro - first try | Yes (cards/mr-freeze.webp, cardArt.ts) |
| Tower of Terror II | `tower-of-terror-ii` | Wikipedia (escape pod) | Pro - first try | Yes (cards/tower-of-terror-ii.webp, cardArt.ts) |
| Red Force | `red-force` | YouTube (launch tower) | Pro - first try | Yes (cards/red-force.webp, cardArt.ts) |
| Superman The Ride | `superman-the-ride` | RCDB (station/track) | Pro - first try | Yes (cards/superman-the-ride.webp, cardArt.ts) |
| Wildcat's Revenge | `wildcats-revenge` | Coaster101 (hybrid layout) | Pro - first try | Yes (cards/wildcats-revenge.webp, cardArt.ts) |
| Disaster Transport | `disaster-transport` | RCDB (bobsled track) | Pro - first try | Yes (cards/disaster-transport.webp, cardArt.ts) |
| Raging Bull | `raging-bull` | RCDB (hyper close-up) | Pro - first try | Yes (cards/raging-bull.webp, cardArt.ts) |
| Titan | `titan` | RCDB (hyper layout) | Pro - first try | Yes (cards/titan.webp, cardArt.ts) |
| Galactica | `galactica` | RCDB (flying coaster) | Pro - first try | Yes (cards/galactica.webp, cardArt.ts) |
| Gemini | `gemini` | RCDB (racing coaster) | Pro - first try | Yes (cards/gemini.webp, cardArt.ts) |
| Vortex (Kings Island) | `vortex-kings-island` | RCDB (multi-inversion) | Pro - first try | Yes (cards/vortex-kings-island.webp, cardArt.ts) |
| Loch Ness Monster | `loch-ness-monster` | RCDB ID 110 (interlocking loops) | Pro - first try | Yes (cards/loch-ness-monster.webp, cardArt.ts) |
| Iron Rattler | `iron-rattler` | RCDB (first drop) | Pro - first try | Yes (cards/iron-rattler.webp, cardArt.ts) |
| Storm Runner | `storm-runner` | RCDB (loop element) | Pro - first try | Yes (cards/storm-runner.webp, cardArt.ts) |
| Lightning Rod | `lightning-rod` | RCDB (wooded terrain) | Pro - first try | Yes (cards/lightning-rod.webp, cardArt.ts) |
| Griffon | `griffon` | RCDB (Immelmann close-up) | Pro - redo | Yes (cards/griffon.webp, cardArt.ts) |
| Apollo's Chariot | `apollos-chariot` | Wikipedia (ground-level first drop) | Pro - redo | Yes (cards/apollos-chariot.webp, cardArt.ts) |
| Volcano: The Blast Coaster | `volcano-the-blast-coaster` | Coasterpedia 2007 (inverted trains) | Pro - redo, train removed | Yes (cards/volcano-the-blast-coaster.webp, cardArt.ts) |
| Corkscrew (Cedar Point) | `corkscrew-cedar-point` | RCDB ID 13 (corkscrew inversion) | Pro - first try | Yes (cards/corkscrew-cedar-point.webp, cardArt.ts) |
| Maxx Force | `maxx-force` | RCDB ID 16586 (double inversion) | Pro - first try | Yes (cards/maxx-force.webp, cardArt.ts) |
| Jersey Devil Coaster | `jersey-devil-coaster` | Wikipedia (lift hill/station) | NB2 - Caleb manual, single-rail prompt | Yes (cards/jersey-devil-coaster.webp, cardArt.ts) |
| Outlaw Run | `outlaw-run` | TPA 78230 (lift hill, fall foliage) | Pro - redo source | Yes (cards/outlaw-run.webp, cardArt.ts) |
| American Eagle | `american-eagle` | Source image | Pro | Yes (cards/american-eagle.webp, cardArt.ts) |
| Silver Star | `silver-star` | Source image | Pro | Yes (cards/silver-star.webp, cardArt.ts) |
| Dominator | `dominator` | Source image | Pro | Yes (cards/dominator.webp, cardArt.ts) |
| Pantheon | `pantheon` | Source image | Pro | Yes (cards/pantheon.webp, cardArt.ts) |
| Alpengeist | `alpengeist` | Source image | Pro | Yes (cards/alpengeist.webp, cardArt.ts) |
| Montu | `montu` | Source image | Pro | Yes (cards/montu.webp, cardArt.ts) |
| The Voyage | `the-voyage` | Source image | Pro | Yes (cards/the-voyage.webp, cardArt.ts) |
| Medusa (SFGA) | `medusa-six-flags-great-adventure` | Source image | Pro | Yes (cards/medusa-six-flags-great-adventure.webp, cardArt.ts) |
| Shockwave | `shockwave` | Source image | Pro | Yes (cards/shockwave.webp, cardArt.ts) |
| Kumba | `kumba` | Source image | Pro | Yes (cards/kumba.webp, cardArt.ts) |
| Mako | `mako` | Source image | Pro | Yes (cards/mako.webp, cardArt.ts) |
| Fujiyama | `fujiyama` | Source image | Pro | Yes (cards/fujiyama.webp, cardArt.ts) |
| Nighthawk | `nighthawk` | Source image | Pro | Yes (cards/nighthawk.webp, cardArt.ts) |
| Shambhala | `shambhala` | Source image | Pro | Yes (cards/shambhala.webp, cardArt.ts) |
| Big Bad Wolf | `big-bad-wolf` | Source image | Pro | Yes (cards/big-bad-wolf.webp, cardArt.ts) |
| Drachen Fire | `drachen-fire` | Source image | Pro | Yes (cards/drachen-fire.webp, cardArt.ts) |
| Do-Dodonpa | `do-dodonpa` | Source image | Pro | Yes (cards/do-dodonpa.webp, cardArt.ts) |
| Blue Fire Megacoaster | `blue-fire-megacoaster` | Source image | Pro | Yes (cards/blue-fire-megacoaster.webp, cardArt.ts) |
| Wrath of Rakshasa | `wrath-of-rakshasa` | Source image | NB2 (Pro limit hit) | Yes (cards/wrath-of-rakshasa.webp, cardArt.ts) |
| Phoenix Rising | `phoenix-rising` | RCDB (track close-up, Paul Daley) | NB2 - v2, no added elements | Yes (cards/phoenix-rising.webp, cardArt.ts) |
| Mystery Mine | `mystery-mine` | RCDB (barn+loop, Patrick Wagner) | NB2 - v2, train removed | Yes (cards/mystery-mine.webp, cardArt.ts) |
| Great American Scream Machine (SFOG) | `great-american-scream-machine` | RCDB ID 41 (wooden close-up, Rik Engelen) | NB2 - replaces wrong steel card | Yes (cards/great-american-scream-machine.webp, cardArt.ts) |
| Copperhead Strike | `copperhead-strike` | Google Images (double inversions) | Pro | Yes (cards/copperhead-strike.webp, cardArt.ts) |
| Thunderhead | `thunderhead` | Google Images (wooden track detail) | Pro | Yes (cards/thunderhead.webp, cardArt.ts) |
| Wild Eagle | `wild-eagle` | Google Images (wing coaster) | Pro | Yes (cards/wild-eagle.webp, cardArt.ts) |
| Verbolten | `verbolten` | Google Images (themed track) | Pro | Yes (cards/verbolten.webp, cardArt.ts) |
| Tigris | `tigris` | Google Images (launch coaster) | Pro | Yes (cards/tigris.webp, cardArt.ts) |
| SooperDooperLooper | `sooperdooperlooper` | Google Images (loop element) | Pro | Yes (cards/sooperdooperlooper.webp, cardArt.ts) |
| Lightning Racer | `lightning-racer` | Google Images (racing wooden) | Pro | Yes (cards/lightning-racer.webp, cardArt.ts) |
| X-Flight | `x-flight` | Google Images (wing coaster) | Pro | Yes (cards/x-flight.webp, cardArt.ts) |
| Goliath (SFGAm) | `goliath-six-flags-great-america` | Google Images (wooden hybrid) | Pro | Yes (cards/goliath-six-flags-great-america.webp, cardArt.ts) |
| Time Traveler | `time-traveler` | Google Images (spinning coaster) | Pro | Yes (cards/time-traveler.webp, cardArt.ts) |
| Expedition Everest | `expedition-everest` | Google Images | Pro | Yes (cards/expedition-everest.webp, cardArt.ts) |
| Guardians of the Galaxy: Cosmic Rewind | `guardians-of-the-galaxy-cosmic-rewind` | Google Images | Pro | Yes (cards/guardians-of-the-galaxy-cosmic-rewind.webp, cardArt.ts) |
| Tron Lightcycle Run | `tron-lightcycle-run` | Google Images | Pro | Yes (cards/tron-lightcycle-run.webp, cardArt.ts) |
| Wicked Cyclone | `wicked-cyclone` | Google Images | Pro | Yes (cards/wicked-cyclone.webp, cardArt.ts) |
| Twisted Cyclone | `twisted-cyclone` | Google Images | Pro | Yes (cards/twisted-cyclone.webp, cardArt.ts) |
| Superman: Krypton Coaster | `superman-krypton-coaster` | Google Images | Pro | Yes (cards/superman-krypton-coaster.webp, cardArt.ts) |
| Goliath (SFOG) | `goliath-six-flags-over-georgia` | Google Images | Pro | Yes (cards/goliath-six-flags-over-georgia.webp, cardArt.ts) |
| Mamba | `mamba` | Google Images | Pro | Yes (cards/mamba.webp, cardArt.ts) |
| Revenge of the Mummy | `revenge-of-the-mummy` | Google Images | Pro | Yes (cards/revenge-of-the-mummy.webp, cardArt.ts) |
| Tempesto | `tempesto` | Google Images | Pro | Yes (cards/tempesto.webp, cardArt.ts) |

## Rejected

| Coaster | Reason |
|---------|--------|
| Thunder Striker (first attempt) | Prompt was modified with wrong coaster type (called GCI, actually B&M hyper). Generated a wooden coaster instead of steel. |
| Mr. Freeze (first attempt) | Too realistic, didn't match NanoBanana illustration style of other cards. Redone with new RCDB source. |
| Apollo's Chariot (first attempt) | Bad source image (aerial/on-ride), generation added wrong train direction, ignored no-train instruction. |
| Griffon (first attempt) | Didn't use Redo with Pro, train style was completely changed. |
| Volcano v1-v3 | NanoBanana can't render inverted coasters (puts trains on top). Solved by removing train entirely in v4. |
| Jersey Devil Pro | NanoBanana Pro rendered two-rail track instead of single-rail. Caleb redid manually with NB2 + single-rail prompt. |
| Outlaw Run (first source) | Aerial RCDB photo too cartoonish, dead-end track in both NB2 and Pro. Need closer source. |

## Watermark Removal Log

- 2026-03-06: Batch processed all 127 cards in assets/cards/. 20 had watermarks removed, 107 were clean.
- Affected: eejanaika, escape-from-gringotts, formula-rossa, goliath-six-flags-new-england, hagrid-s-magical-creatures-motorbike-adventure, hakugei, hiccups-wing-gliders, hollywood-rip-ride-rockit, hyperia, hyperion, jurassic-world-velocicoaster, nemesis-reborn, oblivion, phantoms-revenge, stardust-racers, steel-dragon-2000, takabisha, the-incredible-hulk-coaster, the-smiler, wicker-man
- 2026-03-09: Batch of 10 new cards — all watermark-removed from original PNGs before webp conversion. Affected: expedition-everest, guardians-of-the-galaxy-cosmic-rewind, tron-lightcycle-run, wicked-cyclone, twisted-cyclone, superman-krypton-coaster, goliath-six-flags-over-georgia, mamba, revenge-of-the-mummy, tempesto
