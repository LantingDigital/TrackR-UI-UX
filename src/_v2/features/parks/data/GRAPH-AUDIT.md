# TrackR Park Map Graph Audit

**Generated:** 2026-03-10
**Parks audited:** 28
**Purpose:** Validate walkway graph connectivity before wiring up Dijkstra routing

## Executive Summary

| Metric | Value |
|--------|-------|
| Total parks | 28 |
| Fully connected graphs | 28 |
| Disconnected graphs | 0 |
| Parks with unreachable POIs | 22 |
| Parks with dangling edge refs | 0 |
| Total issues found | 23 |

**Overall health: MOSTLY GOOD** -- Graphs are connected but some POIs are unreachable (not in any edge). Navigation between connected nodes will work, but some POIs cannot be routed to.

## Summary Table

| Park | Walkway Nodes | POIs | Edges | Connected | Lat/Lng | Issues |
|------|:------------:|:----:|:-----:|:---------:|:-------:|:------:|
| Animal Kingdom | 7 | 32 | 41 | YES | Yes | 0 |
| Busch Gardens Tampa | 12 | 40 | 40 | YES | Yes | **1** |
| Busch Gardens Williamsburg | 16 | 54 | 56 | YES | Yes | **1** |
| Canadas Wonderland | 10 | 36 | 47 | YES | Yes | **1** |
| Carowinds | 11 | 44 | 36 | YES | Yes | **1** |
| Cedar Point | 15 | 66 | 52 | YES | Yes | **1** |
| Disneyland | 25 | 74 | 93 | YES | Yes | **1** |
| Dollywood | 11 | 37 | 41 | YES | Yes | **1** |
| Dorney Park | 10 | 37 | 48 | YES | Yes | 0 |
| Epcot | 15 | 36 | 51 | YES | Yes | 0 |
| Epic Universe | 16 | 51 | 51 | YES | Yes | **1** |
| Hersheypark | 11 | 34 | 40 | YES | Yes | **1** |
| Hollywood Studios | 9 | 35 | 45 | YES | Yes | 0 |
| Islands Of Adventure | 10 | 40 | 44 | YES | Yes | **1** |
| Kings Island | 13 | 54 | 44 | YES | Yes | **1** |
| Knotts | 16 | 125 | 79 | YES | Yes | **2** |
| Legoland California | 16 | 64 | 82 | YES | Yes | 0 |
| Legoland Florida | 16 | 71 | 91 | YES | Yes | 0 |
| Magic Kingdom | 10 | 44 | 52 | YES | Yes | **1** |
| Magic Mountain | 12 | 58 | 49 | YES | Yes | **1** |
| Seaworld Orlando | 21 | 46 | 65 | YES | Yes | **1** |
| Seaworld San Diego | 16 | 40 | 55 | YES | Yes | **1** |
| Six Flags Fiesta Texas | 12 | 47 | 56 | YES | Yes | **1** |
| Six Flags Great Adventure | 12 | 40 | 43 | YES | Yes | **1** |
| Six Flags Great America | 11 | 46 | 47 | YES | Yes | **1** |
| Six Flags Over Georgia | 14 | 57 | 60 | YES | Yes | **1** |
| Universal Hollywood | 12 | 50 | 44 | YES | Yes | **1** |
| Universal Studios Florida | 13 | 45 | 51 | YES | Yes | **1** |

## Coverage Statistics

| Park | POI:Edge Ratio | Unreachable POIs | % POIs Connected |
|------|:--------------:|:----------------:|:----------------:|
| Animal Kingdom | 0.78 | 0 | 100.0% |
| Busch Gardens Tampa | 1.00 | 14 | 65.0% |
| Busch Gardens Williamsburg | 0.96 | 16 | 70.4% |
| Canadas Wonderland | 0.77 | 1 | 97.2% |
| Carowinds | 1.22 | 20 | 54.5% |
| Cedar Point | 1.27 | 30 | 54.5% |
| Disneyland | 0.80 | 7 | 90.5% |
| Dollywood | 0.90 | 9 | 75.7% |
| Dorney Park | 0.77 | 0 | 100.0% |
| Epcot | 0.71 | 0 | 100.0% |
| Epic Universe | 1.00 | 15 | 70.6% |
| Hersheypark | 0.85 | 5 | 85.3% |
| Hollywood Studios | 0.78 | 0 | 100.0% |
| Islands Of Adventure | 0.91 | 6 | 85.0% |
| Kings Island | 1.23 | 25 | 53.7% |
| Knotts | 1.58 | 72 | 42.4% |
| Legoland California | 0.78 | 0 | 100.0% |
| Legoland Florida | 0.78 | 0 | 100.0% |
| Magic Kingdom | 0.85 | 4 | 90.9% |
| Magic Mountain | 1.18 | 21 | 63.8% |
| Seaworld Orlando | 0.71 | 4 | 91.3% |
| Seaworld San Diego | 0.73 | 3 | 92.5% |
| Six Flags Fiesta Texas | 0.84 | 6 | 87.2% |
| Six Flags Great Adventure | 0.93 | 10 | 75.0% |
| Six Flags Great America | 0.98 | 11 | 76.1% |
| Six Flags Over Georgia | 0.95 | 13 | 77.2% |
| Universal Hollywood | 1.14 | 17 | 66.0% |
| Universal Studios Florida | 0.88 | 7 | 84.4% |

## Detailed Issues by Park

### Busch Gardens Tampa

- **Files:** `buschGardensTampaMapData.ts` + `buschGardensTampaPOI.ts`
- **Graph:** 12 walkway nodes, 40 POIs, 40 edges, 1 component(s)
- 14 unreachable POI(s): ride-phoenix, ride-skyride-bgt, ride-serengeti-express, food-twisted-tails-pretzels, food-rescue-cafe, food-dippin-dots-bgt, shop-marrakesh-market, shop-xcursions, shop-sheikra-shop, shop-emporium-bgt (+4 more)

<details><summary>Unreachable POIs (14)</summary>

- `ride-phoenix`
- `ride-skyride-bgt`
- `ride-serengeti-express`
- `food-twisted-tails-pretzels`
- `food-rescue-cafe`
- `food-dippin-dots-bgt`
- `shop-marrakesh-market`
- `shop-xcursions`
- `shop-sheikra-shop`
- `shop-emporium-bgt`
- `attraction-serengeti-safari`
- `attraction-edge-of-africa`
- `attraction-moroccan-palace-theater`
- `attraction-gwazi-gliders`

</details>

### Busch Gardens Williamsburg

- **Files:** `buschGardensWilliamsburgMapData.ts` + `buschGardensWilliamsburgPOI.ts`
- **Graph:** 16 walkway nodes, 54 POIs, 56 edges, 1 component(s)
- 16 unreachable POI(s): shop-england-emporium, shop-italy-gifts, shop-germany-gifts, shop-scotland-gifts, shop-sesame-store, show-globe-theatre, show-das-festhaus-show, show-sesame-street-show, attraction-wolf-valley, attraction-eagle-ridge (+6 more)

<details><summary>Unreachable POIs (16)</summary>

- `shop-england-emporium`
- `shop-italy-gifts`
- `shop-germany-gifts`
- `shop-scotland-gifts`
- `shop-sesame-store`
- `show-globe-theatre`
- `show-das-festhaus-show`
- `show-sesame-street-show`
- `attraction-wolf-valley`
- `attraction-eagle-ridge`
- `service-first-aid-bgw`
- `service-guest-relations-bgw`
- `service-quick-queue-bgw`
- `service-atm-england`
- `service-atm-germany`
- `service-lockers-entrance-bgw`

</details>

### Canadas Wonderland

- **Files:** `canadasWonderlandMapData.ts` + `canadasWonderlandPOI.ts`
- **Graph:** 10 walkway nodes, 36 POIs, 47 edges, 1 component(s)
- 1 unreachable POI(s): shop-wonder-store

<details><summary>Unreachable POIs (1)</summary>

- `shop-wonder-store`

</details>

### Carowinds

- **Files:** `carowindsMapData.ts` + `carowindsPOI.ts`
- **Graph:** 11 walkway nodes, 44 POIs, 36 edges, 1 component(s)
- 20 unreachable POI(s): ride-windseeker-cw, ride-electro-spin, ride-zephyr, ride-dodgem-cw, ride-grand-carousel-cw, ride-charlie-browns-raft-blast, ride-boo-blasters, food-bier-fest-grill, food-brickhouse-bbq, food-jukebox-diner (+10 more)

<details><summary>Unreachable POIs (20)</summary>

- `ride-windseeker-cw`
- `ride-electro-spin`
- `ride-zephyr`
- `ride-dodgem-cw`
- `ride-grand-carousel-cw`
- `ride-charlie-browns-raft-blast`
- `ride-boo-blasters`
- `food-bier-fest-grill`
- `food-brickhouse-bbq`
- `food-jukebox-diner`
- `food-dippin-dots-cw`
- `shop-main-gate-gifts`
- `shop-fury-325-store`
- `shop-camp-snoopy-store-cw`
- `shop-boardwalk-gifts-cw`
- `attraction-carolina-harbor`
- `attraction-celebration-stage`
- `attraction-midway-games-cw`
- `service-atm-cw`
- `service-lockers-cw`

</details>

### Cedar Point

- **Files:** `cedarPointMapData.ts` + `cedarPointPOI.ts`
- **Graph:** 15 walkway nodes, 66 POIs, 52 edges, 1 component(s)
- 30 unreachable POI(s): ride-giant-wheel, ride-pipe-scream, ride-matterhorn, ride-ocean-motion, ride-monster, ride-dodgem, ride-midway-carousel, ride-cedar-downs, ride-super-himalaya, ride-sky-ride (+20 more)

<details><summary>Unreachable POIs (30)</summary>

- `ride-giant-wheel`
- `ride-pipe-scream`
- `ride-matterhorn`
- `ride-ocean-motion`
- `ride-monster`
- `ride-dodgem`
- `ride-midway-carousel`
- `ride-cedar-downs`
- `ride-super-himalaya`
- `ride-sky-ride`
- `food-miss-keats-smokehouse`
- `food-chickie-petes`
- `food-coasters-drive-in`
- `food-red-garter-saloon`
- `food-johnny-rockets-cp`
- `food-famous-daves`
- `food-dippin-dots-cp`
- `food-frontier-inn`
- `shop-main-gift-shop-cp`
- `shop-frontier-trading-post`
- `shop-steel-vengeance-shop`
- `shop-gatekeeper-shop`
- `shop-boardwalk-gifts`
- `attraction-lake-erie-eagles`
- `attraction-cp-shores-entrance`
- `attraction-games-midway`
- `attraction-jack-aldrich-theater`
- `attraction-luminosity-stage`
- `service-atm-main-cp`
- `service-lockers-cp`

</details>

### Disneyland

- **Files:** `disneylandMapData.ts` + `disneylandPOI.ts`
- **Graph:** 25 walkway nodes, 74 POIs, 93 edges, 1 component(s)
- 7 unreachable POI(s): shop-emporium-dl, shop-star-trader, shop-savis-workshop, shop-droid-depot, shop-pieces-of-eight, shop-bibbidi-bobbidi-boutique, shop-fantasy-faire-gifts

<details><summary>Unreachable POIs (7)</summary>

- `shop-emporium-dl`
- `shop-star-trader`
- `shop-savis-workshop`
- `shop-droid-depot`
- `shop-pieces-of-eight`
- `shop-bibbidi-bobbidi-boutique`
- `shop-fantasy-faire-gifts`

</details>

### Dollywood

- **Files:** `dollywoodMapData.ts` + `dollywoodPOI.ts`
- **Graph:** 11 walkway nodes, 37 POIs, 41 edges, 1 component(s)
- 9 unreachable POI(s): ride-dizzy-disk, ride-whistle-punk-chaser, shop-showstreet-emporium, shop-valley-wood-carvers, shop-dolly-closet, attraction-dollys-home-on-wheels, attraction-chasing-rainbows, attraction-showstreet-palace, attraction-back-porch-theater

<details><summary>Unreachable POIs (9)</summary>

- `ride-dizzy-disk`
- `ride-whistle-punk-chaser`
- `shop-showstreet-emporium`
- `shop-valley-wood-carvers`
- `shop-dolly-closet`
- `attraction-dollys-home-on-wheels`
- `attraction-chasing-rainbows`
- `attraction-showstreet-palace`
- `attraction-back-porch-theater`

</details>

### Epic Universe

- **Files:** `epicUniverseMapData.ts` + `epicUniversePOI.ts`
- **Graph:** 16 walkway nodes, 51 POIs, 51 edges, 1 component(s)
- 15 unreachable POI(s): shop-other-worlds-mercantile, shop-moonship-chocolates, shop-nintendo-super-star-store, shop-sensorium-emporium, shop-1-up-factory-eu, shop-mario-motors-eu, shop-funkys-fly-n-buy, shop-pretorius-oddities, shop-darkmoor-makeup, shop-acajor-baguettes (+5 more)

<details><summary>Unreachable POIs (15)</summary>

- `shop-other-worlds-mercantile`
- `shop-moonship-chocolates`
- `shop-nintendo-super-star-store`
- `shop-sensorium-emporium`
- `shop-1-up-factory-eu`
- `shop-mario-motors-eu`
- `shop-funkys-fly-n-buy`
- `shop-pretorius-oddities`
- `shop-darkmoor-makeup`
- `shop-acajor-baguettes`
- `shop-les-galeries`
- `shop-tour-en-floo`
- `shop-toothless-treasures`
- `shop-viking-traders`
- `shop-hiccups-workshop`

</details>

### Hersheypark

- **Files:** `hersheyparkMapData.ts` + `hersheyparkPOI.ts`
- **Graph:** 11 walkway nodes, 34 POIs, 40 edges, 1 component(s)
- 5 unreachable POI(s): ride-wave-swinger, food-dippin-dots-hp, shop-chocolatetown-sweet-shop, shop-emporium-hp, shop-frontier-general

<details><summary>Unreachable POIs (5)</summary>

- `ride-wave-swinger`
- `food-dippin-dots-hp`
- `shop-chocolatetown-sweet-shop`
- `shop-emporium-hp`
- `shop-frontier-general`

</details>

### Islands Of Adventure

- **Files:** `islandsOfAdventureMapData.ts` + `islandsOfAdventurePOI.ts`
- **Graph:** 10 walkway nodes, 40 POIs, 44 edges, 1 component(s)
- 6 unreachable POI(s): shop-honeydukes, shop-ollivanders, shop-filchs-emporium, shop-marvel-alterniverse, shop-jurassic-outfitters, shop-port-of-entry-gifts

<details><summary>Unreachable POIs (6)</summary>

- `shop-honeydukes`
- `shop-ollivanders`
- `shop-filchs-emporium`
- `shop-marvel-alterniverse`
- `shop-jurassic-outfitters`
- `shop-port-of-entry-gifts`

</details>

### Kings Island

- **Files:** `kingsIslandMapData.ts` + `kingsIslandPOI.ts`
- **Graph:** 13 walkway nodes, 54 POIs, 44 edges, 1 component(s)
- 25 unreachable POI(s): ride-great-pumpkin-coaster, ride-snoopys-soap-box-racers, ride-grand-carousel, ride-dodgem-ki, ride-white-water-canyon, ride-congo-falls, food-chicken-shack, food-panda-express-ki, food-hanks-burrito-shack, food-tom-and-chee (+15 more)

<details><summary>Unreachable POIs (25)</summary>

- `ride-great-pumpkin-coaster`
- `ride-snoopys-soap-box-racers`
- `ride-grand-carousel`
- `ride-dodgem-ki`
- `ride-white-water-canyon`
- `ride-congo-falls`
- `food-chicken-shack`
- `food-panda-express-ki`
- `food-hanks-burrito-shack`
- `food-tom-and-chee`
- `food-reds-hall-of-fame-grille`
- `food-festhaus`
- `food-dippin-dots-ki`
- `shop-emporium-ki`
- `shop-orion-gear`
- `shop-beast-shop`
- `shop-planet-snoopy-store`
- `shop-international-gifts`
- `attraction-eiffel-tower`
- `attraction-kings-island-theater`
- `attraction-festhaus-stage`
- `attraction-soak-city-entrance`
- `attraction-phantom-theater`
- `service-atm-ki`
- `service-lockers-ki`

</details>

### Knotts

- **Files:** `knottsMapData.ts` + `knottsPOI.ts`
- **Graph:** 16 walkway nodes, 125 POIs, 79 edges, 1 component(s)
- 2 duplicate edge(s): ride-xcelerator <-> w-east-path, entrance-main <-> w-entry-plaza
- 72 unreachable POI(s): food-cave-inn-snacks, food-papas-mexicanas, food-cardina-del-sur, food-baja-taqueria, food-supreme-scream-dippin-dots, food-pacific-coast-paninis, food-charleston-circle-coffee, food-log-ride-funnel-cake, food-strictly-on-a-stick, food-panda-express (+62 more)

### Magic Kingdom

- **Files:** `magicKingdomMapData.ts` + `magicKingdomPOI.ts`
- **Graph:** 10 walkway nodes, 44 POIs, 52 edges, 1 component(s)
- 4 unreachable POI(s): shop-emporium-mk, shop-memento-mori, shop-big-top-souvenirs, shop-merchant-of-venus

<details><summary>Unreachable POIs (4)</summary>

- `shop-emporium-mk`
- `shop-memento-mori`
- `shop-big-top-souvenirs`
- `shop-merchant-of-venus`

</details>

### Magic Mountain

- **Files:** `magicMountainMapData.ts` + `magicMountainPOI.ts`
- **Graph:** 12 walkway nodes, 58 POIs, 49 edges, 1 component(s)
- 21 unreachable POI(s): ride-scrambler, ride-buccaneer, ride-swashbuckler, ride-wonder-woman-lasso, ride-the-flash, ride-sky-tower, ride-grand-carousel-mm, food-cold-stone-mm, food-dc-eats, food-dippin-dots-mm (+11 more)

<details><summary>Unreachable POIs (21)</summary>

- `ride-scrambler`
- `ride-buccaneer`
- `ride-swashbuckler`
- `ride-wonder-woman-lasso`
- `ride-the-flash`
- `ride-sky-tower`
- `ride-grand-carousel-mm`
- `food-cold-stone-mm`
- `food-dc-eats`
- `food-dippin-dots-mm`
- `shop-main-gate-shop-mm`
- `shop-twisted-colossus-shop`
- `shop-dc-universe-store`
- `shop-tatsu-gift-shop`
- `shop-looney-tunes-store`
- `attraction-dc-universe-stage`
- `attraction-movie-district-theater`
- `attraction-midway-games-mm`
- `attraction-hurricane-harbor`
- `service-atm-mm`
- `service-lockers-mm`

</details>

### Seaworld Orlando

- **Files:** `seaworldOrlandoMapData.ts` + `seaworldOrlandoPOI.ts`
- **Graph:** 21 walkway nodes, 46 POIs, 65 edges, 1 component(s)
- 4 unreachable POI(s): ride-seaquest-swo, shop-shamu-emporium-swo, shop-mako-shark-swo, shop-sesame-store-swo

<details><summary>Unreachable POIs (4)</summary>

- `ride-seaquest-swo`
- `shop-shamu-emporium-swo`
- `shop-mako-shark-swo`
- `shop-sesame-store-swo`

</details>

### Seaworld San Diego

- **Files:** `seaworldSanDiegoMapData.ts` + `seaworldSanDiegoPOI.ts`
- **Graph:** 16 walkway nodes, 40 POIs, 55 edges, 1 component(s)
- 3 unreachable POI(s): shop-park-entrance-swsd, shop-arctic-gifts-swsd, shop-ocean-explorer-swsd

<details><summary>Unreachable POIs (3)</summary>

- `shop-park-entrance-swsd`
- `shop-arctic-gifts-swsd`
- `shop-ocean-explorer-swsd`

</details>

### Six Flags Fiesta Texas

- **Files:** `sixFlagsFiestaTexasMapData.ts` + `sixFlagsFiestaTexasPOI.ts`
- **Graph:** 12 walkway nodes, 47 POIs, 56 edges, 1 component(s)
- 6 unreachable POI(s): shop-rockville-trading-co, shop-dc-shop-sfft, shop-spassburg-gifts, shop-los-festivales-market, show-lone-star-amphitheater, show-rockville-stage

<details><summary>Unreachable POIs (6)</summary>

- `shop-rockville-trading-co`
- `shop-dc-shop-sfft`
- `shop-spassburg-gifts`
- `shop-los-festivales-market`
- `show-lone-star-amphitheater`
- `show-rockville-stage`

</details>

### Six Flags Great Adventure

- **Files:** `sixFlagsGreatAdventureMapData.ts` + `sixFlagsGreatAdventurePOI.ts`
- **Graph:** 12 walkway nodes, 40 POIs, 43 edges, 1 component(s)
- 10 unreachable POI(s): ride-cyborg-cyber-spin, ride-scrambler, ride-twister, ride-houdini, food-granny-bs, food-cold-stone-sfga, food-big-wheel-pizza, shop-main-gate-shop, shop-justice-league-store, shop-frontier-trading-post-sfga

<details><summary>Unreachable POIs (10)</summary>

- `ride-cyborg-cyber-spin`
- `ride-scrambler`
- `ride-twister`
- `ride-houdini`
- `food-granny-bs`
- `food-cold-stone-sfga`
- `food-big-wheel-pizza`
- `shop-main-gate-shop`
- `shop-justice-league-store`
- `shop-frontier-trading-post-sfga`

</details>

### Six Flags Great America

- **Files:** `sixFlagsGreatAmericaMapData.ts` + `sixFlagsGreatAmericaPOI.ts`
- **Graph:** 11 walkway nodes, 46 POIs, 47 edges, 1 component(s)
- 11 unreachable POI(s): shop-hometown-general-store, shop-dc-comics-shop, shop-southwest-traders, shop-county-fair-gifts, show-grand-music-hall, show-dc-stunt-show, service-first-aid-sfga, service-guest-relations-sfga, service-flash-pass-sfga, service-lockers-sfga (+1 more)

<details><summary>Unreachable POIs (11)</summary>

- `shop-hometown-general-store`
- `shop-dc-comics-shop`
- `shop-southwest-traders`
- `shop-county-fair-gifts`
- `show-grand-music-hall`
- `show-dc-stunt-show`
- `service-first-aid-sfga`
- `service-guest-relations-sfga`
- `service-flash-pass-sfga`
- `service-lockers-sfga`
- `service-atm-entrance-sfga`

</details>

### Six Flags Over Georgia

- **Files:** `sixFlagsOverGeorgiaMapData.ts` + `sixFlagsOverGeorgiaPOI.ts`
- **Graph:** 14 walkway nodes, 57 POIs, 60 edges, 1 component(s)
- 13 unreachable POI(s): shop-main-street-emporium, shop-gotham-gifts, shop-photo-spot, shop-lickskillet-trading-post, shop-justice-league-gear, show-crystal-pistol, show-gotham-city-stunt-show, service-first-aid-sfog, service-guest-relations, service-flash-pass-sfog (+3 more)

<details><summary>Unreachable POIs (13)</summary>

- `shop-main-street-emporium`
- `shop-gotham-gifts`
- `shop-photo-spot`
- `shop-lickskillet-trading-post`
- `shop-justice-league-gear`
- `show-crystal-pistol`
- `show-gotham-city-stunt-show`
- `service-first-aid-sfog`
- `service-guest-relations`
- `service-flash-pass-sfog`
- `service-lockers-entrance-sfog`
- `service-atm-entrance-sfog`
- `service-atm-peachtree`

</details>

### Universal Hollywood

- **Files:** `universalHollywoodMapData.ts` + `universalHollywoodPOI.ts`
- **Graph:** 12 walkway nodes, 50 POIs, 44 edges, 1 component(s)
- 17 unreachable POI(s): attraction-dinoplay, attraction-animal-actors, attraction-special-effects-show, food-hogs-head, food-lard-lad-donuts, food-minion-cafe, food-dippin-dots-ush, shop-universal-studio-store, shop-honeydukes, shop-zonkos (+7 more)

<details><summary>Unreachable POIs (17)</summary>

- `attraction-dinoplay`
- `attraction-animal-actors`
- `attraction-special-effects-show`
- `food-hogs-head`
- `food-lard-lad-donuts`
- `food-minion-cafe`
- `food-dippin-dots-ush`
- `shop-universal-studio-store`
- `shop-honeydukes`
- `shop-zonkos`
- `shop-filchs-emporium`
- `shop-1-up-factory`
- `shop-kwik-e-mart`
- `shop-jurassic-outfitters`
- `shop-feature-presentation`
- `service-atm-ush`
- `service-lockers-ush`

</details>

### Universal Studios Florida

- **Files:** `universalStudiosFloridaMapData.ts` + `universalStudiosFloridaPOI.ts`
- **Graph:** 13 walkway nodes, 45 POIs, 51 edges, 1 component(s)
- 7 unreachable POI(s): shop-weasleys-wizard-wheezes, shop-ollivanders-usf, shop-borgin-and-burkes, shop-quality-quidditch, shop-universal-studios-store-usf, shop-kwik-e-mart-usf, shop-supply-vault

<details><summary>Unreachable POIs (7)</summary>

- `shop-weasleys-wizard-wheezes`
- `shop-ollivanders-usf`
- `shop-borgin-and-burkes`
- `shop-quality-quidditch`
- `shop-universal-studios-store-usf`
- `shop-kwik-e-mart-usf`
- `shop-supply-vault`

</details>

### Clean Parks (No Issues)

- **Animal Kingdom** -- 7 walkway nodes, 32 POIs, 41 edges
- **Dorney Park** -- 10 walkway nodes, 37 POIs, 48 edges
- **Epcot** -- 15 walkway nodes, 36 POIs, 51 edges
- **Hollywood Studios** -- 9 walkway nodes, 35 POIs, 45 edges
- **Legoland California** -- 16 walkway nodes, 64 POIs, 82 edges
- **Legoland Florida** -- 16 walkway nodes, 71 POIs, 91 edges

## Cross-Park Pattern: Unreachable POIs by Type

The orphan POI problem is **systemic, not random**. Certain POI types were consistently added to POI files but never wired into the edge graphs:

| POI Type | Total (all parks) | Unreachable | % Orphaned |
|----------|:-----------------:|:-----------:|:----------:|
| ride | 560 | 42 | 7.5% |
| food | 310 | 59 | 19.0% |
| service | 262 | 34 | 13.0% |
| attraction | 69 | 26 | 37.7% |
| theater | 59 | 32 | 54.2% |
| shop | 143 | 123 | **86.0%** |
| **TOTAL** | **1403** | **316** | **22.5%** |

**Key insight:** Shops are almost entirely unwired (86%). Theaters and attractions are also heavily orphaned. Rides have the best coverage at 92.5%. The fix is straightforward: for each orphan POI, add one edge connecting it to the nearest walkway node. This is a bulk operation, not a design problem.

**Fastest fix strategy:** For each park, find orphan POIs, look up their (x, y) coordinates, find the nearest walkway node, and add a `{ from: poiId, to: nearestWalkwayNode, weight: 1 }` edge. This can be automated with a script.

## Recommendations

### Moderate (many unreachable POIs)

- **Busch Gardens Tampa** -- 14/40 POIs unreachable (35%)
- **Busch Gardens Williamsburg** -- 16/54 POIs unreachable (30%)
- **Carowinds** -- 20/44 POIs unreachable (45%)
- **Cedar Point** -- 30/66 POIs unreachable (45%)
- **Epic Universe** -- 15/51 POIs unreachable (29%)
- **Kings Island** -- 25/54 POIs unreachable (46%)
- **Knotts** -- 72/125 POIs unreachable (58%)
- **Magic Mountain** -- 21/58 POIs unreachable (36%)
- **Six Flags Great America** -- 11/46 POIs unreachable (24%)
- **Six Flags Over Georgia** -- 13/57 POIs unreachable (23%)
- **Universal Hollywood** -- 17/50 POIs unreachable (34%)

### Minor (a few unreachable POIs)

- **Canadas Wonderland** -- 1 unreachable POI(s)
- **Disneyland** -- 7 unreachable POI(s)
- **Dollywood** -- 9 unreachable POI(s)
- **Hersheypark** -- 5 unreachable POI(s)
- **Islands Of Adventure** -- 6 unreachable POI(s)
- **Magic Kingdom** -- 4 unreachable POI(s)
- **Seaworld Orlando** -- 4 unreachable POI(s)
- **Seaworld San Diego** -- 3 unreachable POI(s)
- **Six Flags Fiesta Texas** -- 6 unreachable POI(s)
- **Six Flags Great Adventure** -- 10 unreachable POI(s)
- **Universal Studios Florida** -- 7 unreachable POI(s)

### Knott's Berry Farm (worst case)

Knott's has 125 POIs but only 79 edges, leaving 72 POIs (58%) unreachable. It also has 2 duplicate edges (`ride-xcelerator <-> w-east-path` and `entrance-main <-> w-entry-plaza`). This park has the most comprehensive POI data (shops, food, services all catalogued) but the edge graph only covers the major coasters and a few food spots. It needs the most edge-wiring work of any park.

### General Notes

1. **Unreachable POIs** are POIs defined in the POI file but not referenced in any edge. Dijkstra cannot route to/from them. Each POI needs at least one edge connecting it to the walkway graph.
2. **Dangling edge refs** are node IDs used in edges that do not exist in either walkwayNodes or POIs. These will cause runtime errors or silent failures in pathfinding.
3. **Disconnected subgraphs** mean you literally cannot navigate from one part of the park to another. Add bridge edges to connect them.
4. **All edges are treated as undirected** by this audit (each A->B edge is traversable in both directions). The Dijkstra implementation should do the same.
