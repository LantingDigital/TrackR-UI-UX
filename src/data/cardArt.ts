/**
 * Coaster Card Art — maps coasterId to AI-generated art
 *
 * Coasters without entries here fall back to a styled placeholder
 * in the CoasterCard component.
 */

// Card art mapping — keys are coaster IDs from coasterIndex
export const CARD_ART: Record<string, any> = {
  // ── Six Flags Magic Mountain ──
  'apocalypse-the-ride': require('../../assets/cards/apocalypse-the-ride.webp'),
  'wonder-woman-flight-of-courage': require('../../assets/cards/wonder-woman-flight-of-courage.webp'),
  'batman-the-ride-six-flags-magic-mountain': require('../../assets/cards/batman-the-ride-six-flags-magic-mountain.webp'),
  'canyon-blaster-six-flags-magic-mountain': require('../../assets/cards/canyon-blaster-six-flags-magic-mountain.webp'),
  'flashback': require('../../assets/cards/flashback.webp'),
  'full-throttle': require('../../assets/cards/full-throttle.webp'),
  'gold-rusher': require('../../assets/cards/gold-rusher.webp'),
  'goliath': require('../../assets/cards/goliath.webp'),
  'green-lantern-first-flight': require('../../assets/cards/green-lantern-first-flight.webp'),
  'magic-flyer': require('../../assets/cards/magic-flyer.webp'),
  'ninja': require('../../assets/cards/ninja.webp'),
  'psyclone': require('../../assets/cards/psyclone.webp'),
  'road-runner-express': require('../../assets/cards/road-runner-express.webp'),
  'scream': require('../../assets/cards/scream.webp'),
  'shockwave-six-flags-magic-mountain': require('../../assets/cards/shockwave-six-flags-magic-mountain.webp'),
  'speedy-gonzales-hot-rod-racers': require('../../assets/cards/speedy-gonzales-hot-rod-racers.webp'),
  'superman-escape-from-krypton': require('../../assets/cards/superman-escape-from-krypton.webp'),
  'tatsu': require('../../assets/cards/tatsu.webp'),
  'the-new-revolution': require('../../assets/cards/the-new-revolution.webp'),
  'the-riddlers-revenge': require('../../assets/cards/the-riddlers-revenge.webp'),
  'twisted-colossus': require('../../assets/cards/twisted-colossus.webp'),
  'viper': require('../../assets/cards/viper.webp'),
  'west-coast-racers': require('../../assets/cards/west-coast-racers.webp'),
  'x2': require('../../assets/cards/x2.webp'),

  // ── Knott's Berry Farm ──
  'coast-rider': require('../../assets/cards/coast-rider.webp'),
  'ghostrider': require('../../assets/cards/ghostrider.webp'),
  'hangtime': require('../../assets/cards/hangtime.webp'),
  'jaguar': require('../../assets/cards/jaguar.webp'),
  'montezooma-the-forbidden-fortress': require('../../assets/cards/montezooma-the-forbidden-fortress.webp'),
  'pony-express': require('../../assets/cards/pony-express.webp'),
  'sierra-sidewinder': require('../../assets/cards/sierra-sidewinder.webp'),
  'silver-bullet': require('../../assets/cards/silver-bullet.webp'),
  'snoopys-tenderpaw-twister-coaster': require('../../assets/cards/snoopys-tenderpaw-twister-coaster.webp'),
  'timberline-twister': require('../../assets/cards/timberline-twister.webp'),
  'xcelerator': require('../../assets/cards/xcelerator.webp'),

  // ── Disneyland ──
  'big-thunder-mountain-railroad': require('../../assets/cards/big-thunder-mountain-railroad.webp'),
  'chip-n-dales-gadgetcoaster': require('../../assets/cards/chip-n-dales-gadgetcoaster.webp'),
  'matterhorn-bobsleds': require('../../assets/cards/matterhorn-bobsleds.webp'),
  'space-mountain': require('../../assets/cards/space-mountain.webp'),

  // ── Disney California Adventure ──
  'goofys-sky-school': require('../../assets/cards/goofys-sky-school.webp'),
  'incredicoaster': require('../../assets/cards/incredicoaster.webp'),

  // ── California's Great America ──
  'demon': require('../../assets/cards/demon.webp'),
  'flight-deck': require('../../assets/cards/flight-deck.webp'),
  'gold-striker': require('../../assets/cards/gold-striker.webp'),
  'patriot': require('../../assets/cards/patriot.webp'),
  'psycho-mouse': require('../../assets/cards/psycho-mouse.webp'),
  'railblazer': require('../../assets/cards/railblazer.webp'),
  'the-grizzly': require('../../assets/cards/the-grizzly.webp'),
  'woodstock-express': require('../../assets/cards/woodstock-express.webp'),

  // ── Universal Islands of Adventure ──
  'jurassic-world-velocicoaster': require('../../assets/cards/jurassic-world-velocicoaster.webp'),
  'hagrid-s-magical-creatures-motorbike-adventure': require('../../assets/cards/hagrid-s-magical-creatures-motorbike-adventure.webp'),
  'the-incredible-hulk-coaster': require('../../assets/cards/the-incredible-hulk-coaster.webp'),

  // ── Universal Studios Hollywood ──
  'fast-furious-hollywood-drift': require('../../assets/cards/fast-furious-hollywood-drift.webp'),
  'flight-of-the-hippogriff-universal-studios-hollywood': require('../../assets/cards/flight-of-the-hippogriff-universal-studios-hollywood.webp'),
  'revenge-of-the-mummy-universal-studios-hollywood': require('../../assets/cards/revenge-of-the-mummy-universal-studios-hollywood.webp'),

  // ── SeaWorld San Diego ──
  'arctic-rescue': require('../../assets/cards/arctic-rescue.webp'),
  'electric-eel': require('../../assets/cards/electric-eel.webp'),
  'emperor': require('../../assets/cards/emperor.webp'),
  'journey-to-atlantis': require('../../assets/cards/journey-to-atlantis.webp'),
  'manta': require('../../assets/cards/manta.webp'),

  // ── Six Flags Discovery Kingdom ──
  'batman-the-ride-six-flags-discovery-kingdom': require('../../assets/cards/batman-the-ride-six-flags-discovery-kingdom.webp'),
  'boomerang-coast-to-coaster-six-flags-discovery-kingdom': require('../../assets/cards/boomerang-coast-to-coaster-six-flags-discovery-kingdom.webp'),
  'cobra-six-flags-discovery-kingdom': require('../../assets/cards/cobra-six-flags-discovery-kingdom.webp'),
  'kong': require('../../assets/cards/kong.webp'),
  'medusa': require('../../assets/cards/medusa.webp'),
  'roadrunner-express': require('../../assets/cards/roadrunner-express.webp'),
  'sidewinder-safari': require('../../assets/cards/sidewinder-safari.webp'),
  'superman-ultimate-flight': require('../../assets/cards/superman-ultimate-flight.webp'),
  'the-flash-vertical-velocity': require('../../assets/cards/the-flash-vertical-velocity.webp'),

  // ── Other California ──
  'crazy-dane-coaster': require('../../assets/cards/crazy-dane-coaster.webp'),
  'greased-lightnin': require('../../assets/cards/greased-lightnin.webp'),
  'invertigo': require('../../assets/cards/invertigo.webp'),
  'merlins-revenge': require('../../assets/cards/merlins-revenge.webp'),
  'pandemonium': require('../../assets/cards/pandemonium.webp'),
  'roar': require('../../assets/cards/roar.webp'),
  'screamin-demon': require('../../assets/cards/screamin-demon.webp'),
  'stealth': require('../../assets/cards/stealth.webp'),
  'whizzer': require('../../assets/cards/whizzer.webp'),

  // ── Cedar Point ──
  'blue-streak': require('../../assets/cards/blue-streak.webp'),
  'cedar-creek-mine-ride': require('../../assets/cards/cedar-creek-mine-ride.webp'),
  'gatekeeper': require('../../assets/cards/gatekeeper.webp'),
  'iron-dragon': require('../../assets/cards/iron-dragon.webp'),
  'magnum-xl-200': require('../../assets/cards/magnum-xl-200.webp'),
  'maverick': require('../../assets/cards/maverick.webp'),
  'millennium-force': require('../../assets/cards/millennium-force.webp'),
  'raptor': require('../../assets/cards/raptor.webp'),
  'rougarou': require('../../assets/cards/rougarou.webp'),
  'sirens-curse': require('../../assets/cards/sirens-curse.webp'),
  'steel-vengeance': require('../../assets/cards/steel-vengeance.webp'),
  'top-thrill-2': require('../../assets/cards/top-thrill-2.webp'),
  'valravn': require('../../assets/cards/valravn.webp'),
  'wicked-twister': require('../../assets/cards/wicked-twister.webp'),
  'wildcat-cedar-point': require('../../assets/cards/wildcat-cedar-point.webp'),

  // ── Kings Island ──
  'adventure-express': require('../../assets/cards/adventure-express.webp'),
  'banshee': require('../../assets/cards/banshee.webp'),
  'diamondback': require('../../assets/cards/diamondback.webp'),
  'firehawk': require('../../assets/cards/firehawk.webp'),
  'flight-of-fear': require('../../assets/cards/flight-of-fear.webp'),
  'mystic-timbers': require('../../assets/cards/mystic-timbers.webp'),
  'orion': require('../../assets/cards/orion.webp'),
  'son-of-beast': require('../../assets/cards/son-of-beast.webp'),
  'the-bat': require('../../assets/cards/the-bat.webp'),
  'the-beast': require('../../assets/cards/the-beast.webp'),
  'vortex-kings-island': require('../../assets/cards/vortex-kings-island.webp'),

  // ── Canada's Wonderland ──
  'behemoth': require('../../assets/cards/behemoth.webp'),
  'leviathan': require('../../assets/cards/leviathan.webp'),
  'yukon-striker': require('../../assets/cards/yukon-striker.webp'),

  // ── Six Flags Great Adventure ──
  'el-toro': require('../../assets/cards/el-toro.webp'),
  'great-american-scream-machine': require('../../assets/cards/great-american-scream-machine.webp'),
  'great-american-scream-machine-six-flags-great-adventure': require('../../assets/cards/great-american-scream-machine-six-flags-great-adventure.webp'),
  'green-lantern': require('../../assets/cards/green-lantern.webp'),
  'kingda-ka': require('../../assets/cards/kingda-ka.webp'),
  'nitro': require('../../assets/cards/nitro.webp'),
  'the-dark-knight-coaster': require('../../assets/cards/the-dark-knight-coaster.webp'),

  // ── Carowinds ──
  'afterburn': require('../../assets/cards/afterburn.webp'),
  'copperhead-strike': require('../../assets/cards/copperhead-strike.webp'),
  'fury-325': require('../../assets/cards/fury-325.webp'),
  'hurler': require('../../assets/cards/hurler.webp'),
  'thunder-road': require('../../assets/cards/thunder-road.webp'),
  'thunder-striker': require('../../assets/cards/thunder-striker.webp'),

  // ── Busch Gardens Tampa Bay ──
  'cheetah-hunt': require('../../assets/cards/cheetah-hunt.webp'),
  'iron-gwazi': require('../../assets/cards/iron-gwazi.webp'),
  'phoenix-rising': require('../../assets/cards/phoenix-rising.webp'),
  'sheikra': require('../../assets/cards/sheikra.webp'),

  // ── Kings Dominion ──
  'pantherian': require('../../assets/cards/pantherian.webp'),
  'twisted-timbers': require('../../assets/cards/twisted-timbers.webp'),

  // ── Six Flags New England ──
  'goliath-six-flags-new-england': require('../../assets/cards/goliath-six-flags-new-england.webp'),
  'superman-the-ride': require('../../assets/cards/superman-the-ride.webp'),

  // ── Kennywood ──
  'steel-curtain': require('../../assets/cards/steel-curtain.webp'),
  'phantoms-revenge': require('../../assets/cards/phantoms-revenge.webp'),

  // ── Alton Towers ──
  'galactica': require('../../assets/cards/galactica.webp'),
  'oblivion': require('../../assets/cards/oblivion.webp'),
  'the-smiler': require('../../assets/cards/the-smiler.webp'),
  'wicker-man': require('../../assets/cards/wicker-man.webp'),
  'nemesis-reborn': require('../../assets/cards/nemesis-reborn.webp'),

  // ── Hersheypark ──
  'candymonium': require('../../assets/cards/candymonium.webp'),
  'fahrenheit': require('../../assets/cards/fahrenheit.webp'),
  'great-bear': require('../../assets/cards/great-bear.webp'),
  'skyrush': require('../../assets/cards/skyrush.webp'),
  'wildcats-revenge': require('../../assets/cards/wildcats-revenge.webp'),

  // ── Six Flags Over Texas ──
  'mr-freeze': require('../../assets/cards/mr-freeze.webp'),
  'new-texas-giant': require('../../assets/cards/new-texas-giant.webp'),

  // ── Thorpe Park ──
  'hyperia': require('../../assets/cards/hyperia.webp'),

  // ── Energylandia ──
  'hyperion': require('../../assets/cards/hyperion.webp'),

  // ── Fuji-Q Highland ──
  'eejanaika': require('../../assets/cards/eejanaika.webp'),
  'takabisha': require('../../assets/cards/takabisha.webp'),

  // ── Nagashima Spa Land ──
  'hakugei': require('../../assets/cards/hakugei.webp'),
  'steel-dragon-2000': require('../../assets/cards/steel-dragon-2000.webp'),

  // ── Ferrari World ──
  'formula-rossa': require('../../assets/cards/formula-rossa.webp'),

  // ── Ferrari Land ──
  'red-force': require('../../assets/cards/red-force.webp'),

  // ── Dreamworld ──
  'tower-of-terror-ii': require('../../assets/cards/tower-of-terror-ii.webp'),

  // ── Universal Orlando (additional) ──
  'hollywood-rip-ride-rockit': require('../../assets/cards/hollywood-rip-ride-rockit.webp'),
  'escape-from-gringotts': require('../../assets/cards/escape-from-gringotts.webp'),

  // ── Epic Universe ──
  'stardust-racers': require('../../assets/cards/stardust-racers.webp'),
  'hiccups-wing-gliders': require('../../assets/cards/hiccups-wing-gliders.webp'),

  // ── Cedar Point (additional) ──
  'disaster-transport': require('../../assets/cards/disaster-transport.webp'),
  'gemini': require('../../assets/cards/gemini.webp'),

  // ── Six Flags Great America ──
  'raging-bull': require('../../assets/cards/raging-bull.webp'),

  // ── Six Flags Over Texas (additional) ──
  'titan': require('../../assets/cards/titan.webp'),

  // ── Busch Gardens Williamsburg ──
  'loch-ness-monster': require('../../assets/cards/loch-ness-monster.webp'),
  'apollos-chariot': require('../../assets/cards/apollos-chariot.webp'),
  'griffon': require('../../assets/cards/griffon.webp'),

  // ── Six Flags Fiesta Texas ──
  'iron-rattler': require('../../assets/cards/iron-rattler.webp'),

  // ── Hersheypark (additional) ──
  'jolly-rancher-remix': require('../../assets/cards/jolly-rancher-remix.webp'),
  'sooperdooperlooper': require('../../assets/cards/sooperdooperlooper.webp'),
  'lightning-racer': require('../../assets/cards/lightning-racer.webp'),
  'storm-runner': require('../../assets/cards/storm-runner.webp'),

  // ── Dollywood ──
  'big-bear-mountain': require('../../assets/cards/big-bear-mountain.webp'),
  'lightning-rod': require('../../assets/cards/lightning-rod.webp'),
  'mystery-mine': require('../../assets/cards/mystery-mine.webp'),
  'tennessee-tornado': require('../../assets/cards/tennessee-tornado.webp'),
  'thunderhead': require('../../assets/cards/thunderhead.webp'),
  'wild-eagle': require('../../assets/cards/wild-eagle.webp'),

  // ── Kings Dominion (additional) ──
  'volcano-the-blast-coaster': require('../../assets/cards/volcano-the-blast-coaster.webp'),

  // ── Cedar Point (additional) ──
  'corkscrew-cedar-point': require('../../assets/cards/corkscrew-cedar-point.webp'),

  // ── Six Flags Great America (additional) ──
  'maxx-force': require('../../assets/cards/maxx-force.webp'),

  // ── Six Flags Great Adventure (additional) ──
  'jersey-devil-coaster': require('../../assets/cards/jersey-devil-coaster.webp'),

  // ── Silver Dollar City ──
  'outlaw-run': require('../../assets/cards/outlaw-run.webp'),
  'time-traveler': require('../../assets/cards/time-traveler.webp'),

  // ── Busch Gardens Williamsburg (additional) ──
  'pantheon': require('../../assets/cards/pantheon.webp'),
  'alpengeist': require('../../assets/cards/alpengeist.webp'),
  'verbolten': require('../../assets/cards/verbolten.webp'),
  'big-bad-wolf': require('../../assets/cards/big-bad-wolf.webp'),
  'drachen-fire': require('../../assets/cards/drachen-fire.webp'),

  // ── Busch Gardens Tampa Bay (additional) ──
  'montu': require('../../assets/cards/montu.webp'),
  'kumba': require('../../assets/cards/kumba.webp'),
  'tigris': require('../../assets/cards/tigris.webp'),

  // ── Six Flags Great America (additional) ──
  'american-eagle': require('../../assets/cards/american-eagle.webp'),
  'shockwave': require('../../assets/cards/shockwave.webp'),
  'x-flight': require('../../assets/cards/x-flight.webp'),
  'goliath-six-flags-great-america': require('../../assets/cards/goliath-six-flags-great-america.webp'),

  // ── Six Flags Great Adventure (additional) ──
  'medusa-six-flags-great-adventure': require('../../assets/cards/medusa-six-flags-great-adventure.webp'),

  // ── Kings Dominion (additional) ──
  'dominator': require('../../assets/cards/dominator.webp'),

  // ── Carowinds (additional) ──
  'nighthawk': require('../../assets/cards/nighthawk.webp'),

  // ── SeaWorld Orlando ──
  'mako': require('../../assets/cards/mako.webp'),

  // ── Holiday World ──
  'the-voyage': require('../../assets/cards/the-voyage.webp'),

  // ── Europa-Park ──
  'silver-star': require('../../assets/cards/silver-star.webp'),
  'blue-fire-megacoaster': require('../../assets/cards/blue-fire-megacoaster.webp'),

  // ── Fuji-Q Highland (additional) ──
  'fujiyama': require('../../assets/cards/fujiyama.webp'),
  'do-dodonpa': require('../../assets/cards/do-dodonpa.webp'),

  // ── PortAventura ──
  'shambhala': require('../../assets/cards/shambhala.webp'),

  // ── Chengdu Sunac Land ──
  'wrath-of-rakshasa': require('../../assets/cards/wrath-of-rakshasa.webp'),

  // ── Walt Disney World (Magic Kingdom) ──
  'seven-dwarfs-mine-train': require('../../assets/cards/seven-dwarfs-mine-train.webp'),

  // ── Walt Disney World (Animal Kingdom) ──
  'expedition-everest': require('../../assets/cards/expedition-everest.webp'),

  // ── Walt Disney World (EPCOT) ──
  'guardians-of-the-galaxy-cosmic-rewind': require('../../assets/cards/guardians-of-the-galaxy-cosmic-rewind.webp'),

  // ── Walt Disney World (Magic Kingdom, additional) ──
  'tron-lightcycle-run': require('../../assets/cards/tron-lightcycle-run.webp'),

  // ── Six Flags New England (additional) ──
  'wicked-cyclone': require('../../assets/cards/wicked-cyclone.webp'),

  // ── Six Flags Over Georgia ──
  'twisted-cyclone': require('../../assets/cards/twisted-cyclone.webp'),
  'goliath-six-flags-over-georgia': require('../../assets/cards/goliath-six-flags-over-georgia.webp'),

  // ── Six Flags Fiesta Texas (additional) ──
  'superman-krypton-coaster': require('../../assets/cards/superman-krypton-coaster.webp'),

  // ── Worlds of Fun ──
  'mamba': require('../../assets/cards/mamba.webp'),

  // ── Universal Studios Florida ──
  'revenge-of-the-mummy': require('../../assets/cards/revenge-of-the-mummy.webp'),

  // ── Busch Gardens Williamsburg (additional) ──
  'tempesto': require('../../assets/cards/tempesto.webp'),

  // ── Europa-Park ──
  'alpenfury': require('../../assets/cards/alpenfury.webp'),
  'atlantica-supersplash': require('../../assets/cards/atlantica-supersplash.webp'),
  'arthur': require('../../assets/cards/arthur.webp'),
  'ba-a-a-express': require('../../assets/cards/ba-a-a-express.webp'),

  // ── Plopsaland De Panne ──
  'anubis-the-ride': require('../../assets/cards/anubis-the-ride.webp'),

  // ── Fun Spot America (Atlanta) ──
  'arieforce-one': require('../../assets/cards/arieforce-one.webp'),

  // ── Warner Bros. Movie World (Australia) ──
  'arkham-asylum-shock-therapy': require('../../assets/cards/arkham-asylum-shock-therapy.webp'),

  // ── SeaWorld San Antonio ──
  'aquaman-power-wave': require('../../assets/cards/aquaman-power-wave.webp'),

  // ── Kings Island (additional) ──
  'backlot-stunt-coaster': require('../../assets/cards/backlot-stunt-coaster.webp'),

  // ── Disneyland Paris (Walt Disney Studios Park) ──
  'avengers-assemble-flight-force': require('../../assets/cards/avengers-assemble-flight-force.webp'),

  // ── Universal Studios Singapore ──
  'battlestar-galactica-human-vs-cylon': require('../../assets/cards/battlestar-galactica-human-vs-cylon.webp'),

  // ── Six Flags Mexico ──
  'batgirl-batarang': require('../../assets/cards/batgirl-batarang.webp'),

  // ── Efteling ──
  'baron-1898': require('../../assets/cards/baron-1898.webp'),

  // ── Various ──
  'bat-lagoon': require('../../assets/cards/bat-lagoon.webp'),

  // ── Six Flags America ──
  'batwing': require('../../assets/cards/batwing.webp'),

  // ── Lagoon (Utah) ──
  'cannibal': require('../../assets/cards/cannibal.webp'),

  // ── Kemah Boardwalk ──
  'boardwalk-bullet': require('../../assets/cards/boardwalk-bullet.webp'),

  // ── Phantasialand ──
  'bobbahn-phantasialand': require('../../assets/cards/bobbahn-phantasialand.webp'),
  'black-mamba': require('../../assets/cards/black-mamba.webp'),

  // ── Gardaland ──
  'blue-tornado': require('../../assets/cards/blue-tornado.webp'),

  // ── Luna Park (Coney Island) ──
  'coney-island-cyclone': require('../../assets/cards/coney-island-cyclone.webp'),

  // ── Waldameer / Great Escape / Hersheypark ──
  'comet': require('../../assets/cards/comet.webp'),

  // ── Hersheypark ──
  'cocoa-cruiser': require('../../assets/cards/cocoa-cruiser.webp'),

  // ── Carowinds ──
  'carolina-cyclone': require('../../assets/cards/carolina-cyclone.webp'),
  'carolina-goldrusher': require('../../assets/cards/carolina-goldrusher.webp'),

  // ── Six Flags Great Adventure ──
  'catwomans-whip': require('../../assets/cards/catwomans-whip.webp'),

  // ── Six Flags Mexico ──
  'chupacabra': require('../../assets/cards/chupacabra.webp'),

  // ── Various (France) ──
  'coccinelle': require('../../assets/cards/coccinelle.webp'),

  // ── Busch Gardens Tampa Bay (additional) ──
  'cobras-curse': require('../../assets/cards/cobras-curse.webp'),

  // ── Batch Review Approved (2026-03-16) ──
  'crystal-wing': require('../../assets/cards/crystal-wing.webp'),
  'd-monen': require('../../assets/cards/d-monen.webp'),
  'dahlonega-mine-train': require('../../assets/cards/dahlonega-mine-train.webp'),
  'dare-devil-dive': require('../../assets/cards/dare-devil-dive.webp'),
  'dc-rivals-hypercoaster': require('../../assets/cards/dc-rivals-hypercoaster.webp'),
  'de-vliegende-hollander': require('../../assets/cards/de-vliegende-hollander.webp'),
  'dragon-fyre': require('../../assets/cards/dragon-fyre.webp'),
  'dragon-khan': require('../../assets/cards/dragon-khan.webp'),
  'euro-mir': require('../../assets/cards/euro-mir.webp'),
  'fiorano-gt-challenge': require('../../assets/cards/fiorano-gt-challenge.webp'),
  'flight-of-the-hippogriff-universal-studios-beijing': require('../../assets/cards/flight-of-the-hippogriff-universal-studios-beijing.webp'),
  'flight-of-the-hippogriff-universal-studios-japan': require('../../assets/cards/flight-of-the-hippogriff-universal-studios-japan.webp'),
  'flying-aces': require('../../assets/cards/flying-aces.webp'),
  'furius-baco': require('../../assets/cards/furius-baco.webp'),
  'galeforce': require('../../assets/cards/galeforce.webp'),
  'hollywood-dream-the-ride': require('../../assets/cards/hollywood-dream-the-ride.webp'),
};

/**
 * Per-image focal point for hero cropping.
 * Values 0 (top) to 1 (bottom), default 0.5 (center).
 * Only add entries that need adjustment — omitted = centered.
 */
export const CARD_ART_FOCAL: Record<string, number> = {
  // Tune these as needed after reviewing in-app
};

/**
 * Derive rarity from popularity rank
 */
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export function getRarityFromRank(popularityRank: number): CardRarity {
  if (popularityRank <= 50) return 'legendary';
  if (popularityRank <= 200) return 'rare';
  if (popularityRank <= 500) return 'uncommon';
  return 'common';
}

/** Rarity display colors */
export const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  legendary: '#FF9800',
};

/** Rarity gradient backgrounds for placeholder cards */
export const RARITY_GRADIENTS: Record<CardRarity, [string, string]> = {
  common: ['#E0E0E0', '#BDBDBD'],
  uncommon: ['#C8E6C9', '#81C784'],
  rare: ['#BBDEFB', '#64B5F6'],
  legendary: ['#FFE0B2', '#FFB74D'],
};
