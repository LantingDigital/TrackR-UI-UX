// ============================================
// Park Ride Definitions
//
// Static ride metadata used by the wait times
// service to generate realistic mock data.
// Each ride has a peak/min wait range and a
// historical average for comparison display.
//
// When switching to a live API, this file is
// still useful as a fallback / offline reference.
//
// IDs MUST match the corresponding POI file IDs
// so the wait time service and map layer agree.
// ============================================

export interface RideDefinition {
  id: string;
  name: string;
  peakWait: number;       // max wait on a busy day (minutes)
  minWait: number;        // min realistic wait (minutes)
  historicalAvg: number;  // average across all hours
  closureProbability?: number; // 0-1, default 0.05
}

export interface ParkDefinition {
  parkName: string;
  rides: RideDefinition[];
}

export const PARK_RIDE_DEFINITIONS: Record<string, ParkDefinition> = {

  // ============================================
  // Knott's Berry Farm
  // ============================================
  'knotts-berry-farm': {
    parkName: "Knott's Berry Farm",
    rides: [
      { id: 'ride-ghostrider', name: 'GhostRider', peakWait: 75, minWait: 10, historicalAvg: 40 },
      { id: 'ride-xcelerator', name: 'Xcelerator', peakWait: 60, minWait: 15, historicalAvg: 35, closureProbability: 0.15 },
      { id: 'ride-hangtime', name: 'HangTime', peakWait: 50, minWait: 10, historicalAvg: 30 },
      { id: 'ride-silver-bullet', name: 'Silver Bullet', peakWait: 40, minWait: 5, historicalAvg: 20 },
      { id: 'ride-montezooma', name: 'MonteZOOMa', peakWait: 0, minWait: 0, historicalAvg: 0, closureProbability: 1.0 },
      { id: 'ride-pony-express', name: 'Pony Express', peakWait: 35, minWait: 10, historicalAvg: 20 },
      { id: 'ride-supreme-scream', name: 'Supreme Scream', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-calico-river-rapids', name: 'Calico River Rapids', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-timber-mountain-log-ride', name: 'Timber Mountain Log Ride', peakWait: 35, minWait: 10, historicalAvg: 20 },
      { id: 'ride-jaguar', name: 'Jaguar!', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-coast-rider', name: 'Coast Rider', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-sol-spin', name: 'Sol Spin', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-sierra-sidewinder', name: 'Sierra Sidewinder', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-calico-mine-ride', name: 'Calico Mine Ride', peakWait: 30, minWait: 10, historicalAvg: 20 },
      { id: 'ride-la-revolucion', name: 'La Revolucion', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-beary-tales', name: "Knott's Bear-y Tales", peakWait: 30, minWait: 10, historicalAvg: 20 },
    ],
  },

  // ============================================
  // Cedar Point
  // ============================================
  'cedar-point': {
    parkName: 'Cedar Point',
    rides: [
      // Coasters
      { id: 'ride-steel-vengeance', name: 'Steel Vengeance', peakWait: 120, minWait: 30, historicalAvg: 75 },
      { id: 'ride-millennium-force', name: 'Millennium Force', peakWait: 90, minWait: 20, historicalAvg: 55 },
      { id: 'ride-top-thrill-2', name: 'Top Thrill 2', peakWait: 120, minWait: 30, historicalAvg: 70, closureProbability: 0.20 },
      { id: 'ride-maverick', name: 'Maverick', peakWait: 90, minWait: 20, historicalAvg: 50 },
      { id: 'ride-sirens-curse', name: "Siren's Curse", peakWait: 90, minWait: 20, historicalAvg: 55 },
      { id: 'ride-raptor', name: 'Raptor', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-gatekeeper', name: 'GateKeeper', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-valravn', name: 'Valravn', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-magnum-xl-200', name: 'Magnum XL-200', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-rougarou', name: 'Rougarou', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-gemini', name: 'Gemini', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-blue-streak', name: 'Blue Streak', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-cedar-creek-mine-ride', name: 'Cedar Creek Mine Ride', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-corkscrew', name: 'Corkscrew', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-iron-dragon', name: 'Iron Dragon', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-wild-mouse', name: 'Wild Mouse', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-woodstock-express', name: 'Woodstock Express', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-wilderness-run', name: 'Wilderness Run', peakWait: 10, minWait: 5, historicalAvg: 5 },
      // Flat / Thrill rides
      { id: 'ride-skyhawk', name: 'Skyhawk', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-power-tower', name: 'Power Tower', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-maxair', name: 'maXair', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-windseeker', name: 'WindSeeker', peakWait: 20, minWait: 5, historicalAvg: 10, closureProbability: 0.15 },
      { id: 'ride-giant-wheel', name: 'Giant Wheel', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-pipe-scream', name: 'Pipe Scream', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-matterhorn', name: 'Matterhorn', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-ocean-motion', name: 'Ocean Motion', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-monster', name: 'Monster', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-dodgem', name: 'Dodgem', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-midway-carousel', name: 'Midway Carousel', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-cedar-downs', name: 'Cedar Downs Racing Derby', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-super-himalaya', name: 'Super Himalaya', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-sky-ride', name: 'Sky Ride', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-snake-river-falls', name: 'Snake River Falls', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-thunder-canyon', name: 'Thunder Canyon', peakWait: 25, minWait: 5, historicalAvg: 15 },
    ],
  },

  // ============================================
  // Kings Island
  // ============================================
  'kings-island': {
    parkName: 'Kings Island',
    rides: [
      // Coasters
      { id: 'ride-orion', name: 'Orion', peakWait: 75, minWait: 15, historicalAvg: 40 },
      { id: 'ride-diamondback', name: 'Diamondback', peakWait: 60, minWait: 10, historicalAvg: 35 },
      { id: 'ride-the-beast', name: 'The Beast', peakWait: 75, minWait: 15, historicalAvg: 45 },
      { id: 'ride-banshee', name: 'Banshee', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-mystic-timbers', name: 'Mystic Timbers', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-flight-of-fear', name: 'Flight of Fear', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-invertigo', name: 'Invertigo', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-the-bat', name: 'The Bat', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-the-racer', name: 'The Racer', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-adventure-express', name: 'Adventure Express', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-queen-city-stunt-coaster', name: 'Queen City Stunt Coaster', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-woodstock-express-ki', name: 'Woodstock Express', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-great-pumpkin-coaster', name: 'Great Pumpkin Coaster', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-snoopys-soap-box-racers', name: "Snoopy's Soap Box Racers", peakWait: 10, minWait: 5, historicalAvg: 5 },
      // Flat / Thrill rides
      { id: 'ride-drop-tower', name: 'Drop Tower', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-delirium', name: 'Delirium', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-windseeker-ki', name: 'WindSeeker', peakWait: 15, minWait: 5, historicalAvg: 10, closureProbability: 0.15 },
      { id: 'ride-viking-fury', name: 'Viking Fury', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-grand-carousel', name: 'Grand Carousel', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-dodgem-ki', name: 'Dodgem', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-white-water-canyon', name: 'White Water Canyon', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-congo-falls', name: 'Congo Falls', peakWait: 15, minWait: 5, historicalAvg: 10 },
    ],
  },

  // ============================================
  // Carowinds
  // ============================================
  'carowinds': {
    parkName: 'Carowinds',
    rides: [
      // Coasters
      { id: 'ride-fury-325', name: 'Fury 325', peakWait: 90, minWait: 15, historicalAvg: 45 },
      { id: 'ride-copperhead-strike', name: 'Copperhead Strike', peakWait: 75, minWait: 15, historicalAvg: 40 },
      { id: 'ride-intimidator', name: 'Intimidator', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-afterburn', name: 'Afterburn', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-nighthawk', name: 'Nighthawk', peakWait: 45, minWait: 10, historicalAvg: 25, closureProbability: 0.10 },
      { id: 'ride-vortex-cw', name: 'Vortex', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-hurler', name: 'Hurler', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-carolina-cyclone', name: 'Carolina Cyclone', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-carolina-goldrusher', name: 'Carolina Goldrusher', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-flying-cobras', name: 'Flying Cobras', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-ricochet', name: 'Ricochet', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-thunder-striker', name: 'Thunder Striker', peakWait: 60, minWait: 15, historicalAvg: 35 },
      { id: 'ride-kiddy-hawk', name: 'Kiddy Hawk', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-woodstock-express-cw', name: 'Woodstock Express', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-snoopys-racing-railway', name: "Snoopy's Racing Railway", peakWait: 30, minWait: 10, historicalAvg: 20 },
      // Flat / Thrill rides
      { id: 'ride-windseeker-cw', name: 'WindSeeker', peakWait: 15, minWait: 5, historicalAvg: 10, closureProbability: 0.15 },
      { id: 'ride-electro-spin', name: 'Electro Spin', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-zephyr', name: 'Zephyr', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-dodgem-cw', name: 'Dodgem', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-grand-carousel-cw', name: 'Grand Carousel', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-charlie-browns-raft-blast', name: "Charlie Brown's Raft Blast", peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-boo-blasters', name: 'Boo Blasters on Boo Hill', peakWait: 15, minWait: 5, historicalAvg: 10 },
    ],
  },

  // ============================================
  // Six Flags Magic Mountain
  // IDs match magicMountainPOI.ts
  // ============================================
  'six-flags-magic-mountain': {
    parkName: 'Six Flags Magic Mountain',
    rides: [
      // Coasters
      { id: 'ride-twisted-colossus', name: 'Twisted Colossus', peakWait: 90, minWait: 15, historicalAvg: 45 },
      { id: 'ride-x2', name: 'X2', peakWait: 90, minWait: 20, historicalAvg: 50, closureProbability: 0.12 },
      { id: 'ride-tatsu', name: 'Tatsu', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-full-throttle', name: 'Full Throttle', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-goliath-mm', name: 'Goliath', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-batman-the-ride', name: 'Batman: The Ride', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-riddlers-revenge', name: "The Riddler's Revenge", peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-scream-mm', name: 'Scream', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-viper-mm', name: 'Viper', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-west-coast-racers', name: 'West Coast Racers', peakWait: 60, minWait: 10, historicalAvg: 30 },
      { id: 'ride-wonder-woman-foc', name: 'Wonder Woman Flight of Courage', peakWait: 75, minWait: 15, historicalAvg: 40 },
      { id: 'ride-apocalypse', name: 'Apocalypse', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-ninja', name: 'Ninja', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-gold-rusher', name: 'Gold Rusher', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-new-revolution', name: 'New Revolution', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-canyon-blaster', name: 'Canyon Blaster', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-road-runner-express', name: 'Road Runner Express', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-magic-flyer', name: 'Magic Flyer', peakWait: 10, minWait: 5, historicalAvg: 5 },
      // Flat / Thrill rides
      { id: 'ride-lex-luthor', name: 'Lex Luthor: Drop of Doom', peakWait: 30, minWait: 10, historicalAvg: 20 },
      { id: 'ride-crazanity', name: 'CraZanity', peakWait: 30, minWait: 5, historicalAvg: 15 },
      { id: 'ride-scrambler', name: 'Scrambler', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-buccaneer', name: 'Buccaneer', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-swashbuckler', name: 'Swashbuckler', peakWait: 10, minWait: 5, historicalAvg: 5 },
      { id: 'ride-wonder-woman-lasso', name: 'Wonder Woman Lasso of Truth', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-the-flash', name: 'The Flash: Speed Force', peakWait: 20, minWait: 5, historicalAvg: 10 },
      { id: 'ride-roaring-rapids', name: 'Roaring Rapids', peakWait: 25, minWait: 5, historicalAvg: 15 },
      { id: 'ride-tidal-wave', name: 'Tidal Wave', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-sky-tower', name: 'Sky Tower', peakWait: 15, minWait: 5, historicalAvg: 10 },
      { id: 'ride-grand-carousel-mm', name: 'Grand Carousel', peakWait: 10, minWait: 5, historicalAvg: 5 },
    ],
  },

  // ============================================
  // Universal Studios Hollywood
  // ============================================
  'universal-studios-hollywood': {
    parkName: 'Universal Studios Hollywood',
    rides: [
      // Upper Lot
      { id: 'ride-harry-potter-forbidden-journey', name: 'Harry Potter and the Forbidden Journey', peakWait: 90, minWait: 15, historicalAvg: 50 },
      { id: 'ride-flight-of-the-hippogriff', name: 'Flight of the Hippogriff', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-mario-kart-bowsers-challenge', name: "Mario Kart: Bowser's Challenge", peakWait: 120, minWait: 30, historicalAvg: 75 },
      { id: 'ride-despicable-me', name: 'Despicable Me Minion Mayhem', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-simpsons-ride', name: 'The Simpsons Ride', peakWait: 40, minWait: 10, historicalAvg: 20 },
      { id: 'ride-secret-life-of-pets', name: 'The Secret Life of Pets: Off the Leash!', peakWait: 50, minWait: 10, historicalAvg: 25 },
      { id: 'ride-studio-tour', name: 'Studio Tour', peakWait: 60, minWait: 15, historicalAvg: 35 },
      { id: 'ride-kung-fu-panda', name: 'DreamWorks Theatre: Kung Fu Panda', peakWait: 30, minWait: 5, historicalAvg: 15 },
      // Lower Lot
      { id: 'ride-jurassic-world-the-ride', name: 'Jurassic World: The Ride', peakWait: 75, minWait: 15, historicalAvg: 40 },
      { id: 'ride-transformers', name: 'Transformers: The Ride 3-D', peakWait: 45, minWait: 10, historicalAvg: 25 },
      { id: 'ride-revenge-of-the-mummy', name: 'Revenge of the Mummy: The Ride', peakWait: 50, minWait: 10, historicalAvg: 30 },
      { id: 'ride-fast-and-furious-drift', name: 'Fast & Furious: Hollywood Drift', peakWait: 90, minWait: 20, historicalAvg: 55 },
    ],
  },
};
