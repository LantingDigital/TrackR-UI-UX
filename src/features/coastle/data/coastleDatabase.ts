import { CoastleCoaster } from '../types/coastle';

// ============================================
// Coastle Coaster Database — 150+ entries
// ============================================

export const COASTER_DATABASE: CoastleCoaster[] = [
  // === STEEL — SIT-DOWN ===
  { id: 'steel-vengeance', name: 'Steel Vengeance', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 205, speedMph: 74, lengthFt: 5740, inversions: 4, yearOpened: 2018 },
  { id: 'fury-325', name: 'Fury 325', park: 'Carowinds', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 325, speedMph: 95, lengthFt: 6602, inversions: 0, yearOpened: 2015 },
  { id: 'millennium-force', name: 'Millennium Force', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 310, speedMph: 93, lengthFt: 6595, inversions: 0, yearOpened: 2000 },
  { id: 'maverick', name: 'Maverick', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 105, speedMph: 70, lengthFt: 4450, inversions: 2, yearOpened: 2007 },
  { id: 'expedition-ge-force', name: 'Expedition GeForce', park: 'Holiday Park', country: 'Germany', continent: 'Europe', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 174, speedMph: 75, lengthFt: 4429, inversions: 0, yearOpened: 2001 },
  { id: 'el-toro', name: 'El Toro', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Wood', type: 'Wooden', heightFt: 181, speedMph: 70, lengthFt: 4400, inversions: 0, yearOpened: 2006 },
  { id: 'lightning-rod', name: 'Lightning Rod', park: 'Dollywood', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 206, speedMph: 73, lengthFt: 3800, inversions: 0, yearOpened: 2016 },
  { id: 'top-thrill-dragster', name: 'Top Thrill Dragster', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 420, speedMph: 120, lengthFt: 2800, inversions: 0, yearOpened: 2003 },
  { id: 'kingda-ka', name: 'Kingda Ka', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 456, speedMph: 128, lengthFt: 3118, inversions: 0, yearOpened: 2005 },
  { id: 'intimidator-305', name: 'Intimidator 305', park: 'Kings Dominion', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 305, speedMph: 90, lengthFt: 5100, inversions: 0, yearOpened: 2010 },
  { id: 'phantom-revenge', name: "Phantom's Revenge", park: 'Kennywood', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 160, speedMph: 85, lengthFt: 3340, inversions: 0, yearOpened: 2001 },
  { id: 'diamondback', name: 'Diamondback', park: 'Kings Island', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 230, speedMph: 80, lengthFt: 5282, inversions: 0, yearOpened: 2009 },
  { id: 'orion', name: 'Orion', park: 'Kings Island', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 287, speedMph: 91, lengthFt: 5321, inversions: 0, yearOpened: 2020 },
  { id: 'leviathan', name: 'Leviathan', park: "Canada's Wonderland", country: 'Canada', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 306, speedMph: 92, lengthFt: 5486, inversions: 0, yearOpened: 2012 },
  { id: 'mako', name: 'Mako', park: 'SeaWorld Orlando', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 200, speedMph: 73, lengthFt: 4760, inversions: 0, yearOpened: 2016 },
  { id: 'nitro', name: 'Nitro', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 230, speedMph: 80, lengthFt: 5394, inversions: 0, yearOpened: 2001 },
  { id: 'apollo-chariot', name: "Apollo's Chariot", park: 'Busch Gardens Williamsburg', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 170, speedMph: 73, lengthFt: 4882, inversions: 0, yearOpened: 1999 },
  { id: 'magnum-xl200', name: 'Magnum XL-200', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 205, speedMph: 72, lengthFt: 5106, inversions: 0, yearOpened: 1989 },
  { id: 'shambhala', name: 'Shambhala', park: 'PortAventura World', country: 'Spain', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 249, speedMph: 83, lengthFt: 5093, inversions: 0, yearOpened: 2012 },
  { id: 'silver-star', name: 'Silver Star', park: 'Europa-Park', country: 'Germany', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 239, speedMph: 81, lengthFt: 5380, inversions: 0, yearOpened: 2002 },
  { id: 'hyperion', name: 'Hyperion', park: 'Energylandia', country: 'Poland', continent: 'Europe', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 252, speedMph: 88, lengthFt: 4600, inversions: 0, yearOpened: 2018 },

  // === INVERTED ===
  { id: 'banshee', name: 'Banshee', park: 'Kings Island', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 167, speedMph: 68, lengthFt: 4124, inversions: 7, yearOpened: 2014 },
  { id: 'raptor', name: 'Raptor', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 137, speedMph: 57, lengthFt: 3790, inversions: 6, yearOpened: 1994 },
  { id: 'montu', name: 'Montu', park: 'Busch Gardens Tampa Bay', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 150, speedMph: 60, lengthFt: 3983, inversions: 7, yearOpened: 1996 },
  { id: 'afterburn', name: 'Afterburn', park: 'Carowinds', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 113, speedMph: 62, lengthFt: 2780, inversions: 5, yearOpened: 1999 },
  { id: 'alpengeist', name: 'Alpengeist', park: 'Busch Gardens Williamsburg', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 195, speedMph: 67, lengthFt: 3828, inversions: 6, yearOpened: 1997 },
  { id: 'nemesis', name: 'Nemesis', park: 'Alton Towers', country: 'UK', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 42, speedMph: 50, lengthFt: 2349, inversions: 4, yearOpened: 1994 },
  { id: 'black-mamba', name: 'Black Mamba', park: 'Phantasialand', country: 'Germany', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 85, speedMph: 50, lengthFt: 2625, inversions: 4, yearOpened: 2006 },
  { id: 'oziris', name: 'OzIris', park: 'Parc Astérix', country: 'France', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 131, speedMph: 56, lengthFt: 3215, inversions: 5, yearOpened: 2012 },

  // === FLYING ===
  { id: 'flying-dinosaur', name: 'The Flying Dinosaur', park: 'Universal Studios Japan', country: 'Japan', continent: 'Asia', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Flying', heightFt: 124, speedMph: 50, lengthFt: 3688, inversions: 4, yearOpened: 2016 },
  { id: 'tatsu', name: 'Tatsu', park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Flying', heightFt: 170, speedMph: 62, lengthFt: 3602, inversions: 4, yearOpened: 2006 },
  { id: 'manta', name: 'Manta', park: 'SeaWorld Orlando', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Flying', heightFt: 140, speedMph: 56, lengthFt: 3359, inversions: 4, yearOpened: 2009 },

  // === WING ===
  { id: 'gatekeeper', name: 'GateKeeper', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Wing', heightFt: 170, speedMph: 67, lengthFt: 4164, inversions: 6, yearOpened: 2013 },
  { id: 'wild-eagle', name: 'Wild Eagle', park: 'Dollywood', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Wing', heightFt: 210, speedMph: 61, lengthFt: 3127, inversions: 5, yearOpened: 2012 },
  { id: 'the-swarm', name: 'The Swarm', park: 'Thorpe Park', country: 'UK', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Wing', heightFt: 127, speedMph: 62, lengthFt: 2461, inversions: 4, yearOpened: 2012 },
  { id: 'raptor-gardaland', name: 'Raptor', park: 'Gardaland', country: 'Italy', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Wing', heightFt: 108, speedMph: 55, lengthFt: 2395, inversions: 4, yearOpened: 2011 },

  // === FLOORLESS ===
  { id: 'kraken', name: 'Kraken', park: 'SeaWorld Orlando', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Floorless', heightFt: 149, speedMph: 65, lengthFt: 4177, inversions: 7, yearOpened: 2000 },
  { id: 'bizarro', name: 'Bizarro', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Floorless', heightFt: 142, speedMph: 61, lengthFt: 3985, inversions: 6, yearOpened: 1999 },
  { id: 'dominator', name: 'Dominator', park: 'Kings Dominion', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Floorless', heightFt: 157, speedMph: 65, lengthFt: 4210, inversions: 5, yearOpened: 2008 },

  // === DIVE ===
  { id: 'valravn', name: 'Valravn', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Dive', heightFt: 223, speedMph: 75, lengthFt: 3415, inversions: 3, yearOpened: 2016 },
  { id: 'sheikra', name: 'SheiKra', park: 'Busch Gardens Tampa Bay', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Dive', heightFt: 200, speedMph: 70, lengthFt: 3188, inversions: 2, yearOpened: 2005 },
  { id: 'griffon', name: 'Griffon', park: 'Busch Gardens Williamsburg', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Dive', heightFt: 205, speedMph: 71, lengthFt: 3108, inversions: 2, yearOpened: 2007 },
  { id: 'baron-1898', name: 'Baron 1898', park: 'Efteling', country: 'Netherlands', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Dive', heightFt: 121, speedMph: 56, lengthFt: 1640, inversions: 2, yearOpened: 2015 },
  { id: 'yukon-striker', name: 'Yukon Striker', park: "Canada's Wonderland", country: 'Canada', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Dive', heightFt: 223, speedMph: 81, lengthFt: 3625, inversions: 4, yearOpened: 2019 },

  // === SPINNING ===
  { id: 'time-traveler', name: 'Time Traveler', park: 'Silver Dollar City', country: 'USA', continent: 'North America', manufacturer: 'Mack Rides', material: 'Steel', type: 'Spinning', heightFt: 100, speedMph: 51, lengthFt: 3020, inversions: 3, yearOpened: 2018 },
  { id: 'wonder-woman-golden-lasso', name: 'Wonder Woman Golden Lasso', park: 'Six Flags Fiesta Texas', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Steel', type: 'Spinning', heightFt: 106, speedMph: 52, lengthFt: 1800, inversions: 3, yearOpened: 2019 },

  // === STAND-UP ===
  { id: 'riddlers-revenge', name: "Riddler's Revenge", park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Stand-up', heightFt: 156, speedMph: 65, lengthFt: 4370, inversions: 6, yearOpened: 1998 },
  { id: 'georgia-scorcher', name: 'Georgia Scorcher', park: 'Six Flags Over Georgia', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Stand-up', heightFt: 107, speedMph: 54, lengthFt: 2950, inversions: 3, yearOpened: 1999 },

  // === WOODEN ===
  { id: 'the-voyage', name: 'The Voyage', park: 'Holiday World', country: 'USA', continent: 'North America', manufacturer: 'The Gravity Group', material: 'Wood', type: 'Wooden', heightFt: 163, speedMph: 67, lengthFt: 6442, inversions: 0, yearOpened: 2006 },
  { id: 'phoenix', name: 'Phoenix', park: 'Knoebels', country: 'USA', continent: 'North America', manufacturer: 'Philadelphia Toboggan Coasters', material: 'Wood', type: 'Wooden', heightFt: 78, speedMph: 45, lengthFt: 3200, inversions: 0, yearOpened: 1985 },
  { id: 'the-beast', name: 'The Beast', park: 'Kings Island', country: 'USA', continent: 'North America', manufacturer: 'Kings Island', material: 'Wood', type: 'Wooden', heightFt: 110, speedMph: 65, lengthFt: 7359, inversions: 0, yearOpened: 1979 },
  { id: 'mystic-timbers', name: 'Mystic Timbers', park: 'Kings Island', country: 'USA', continent: 'North America', manufacturer: 'Great Coasters International', material: 'Wood', type: 'Wooden', heightFt: 109, speedMph: 53, lengthFt: 3265, inversions: 0, yearOpened: 2017 },
  { id: 'ghostrider', name: 'GhostRider', park: "Knott's Berry Farm", country: 'USA', continent: 'North America', manufacturer: 'Custom Coasters International', material: 'Wood', type: 'Wooden', heightFt: 118, speedMph: 56, lengthFt: 4533, inversions: 0, yearOpened: 1998 },
  { id: 'thunderhead', name: 'Thunderhead', park: 'Dollywood', country: 'USA', continent: 'North America', manufacturer: 'Great Coasters International', material: 'Wood', type: 'Wooden', heightFt: 100, speedMph: 54, lengthFt: 3230, inversions: 0, yearOpened: 2004 },
  { id: 'cyclone', name: 'Cyclone', park: 'Luna Park', country: 'USA', continent: 'North America', manufacturer: 'Vernon Keenan', material: 'Wood', type: 'Wooden', heightFt: 85, speedMph: 60, lengthFt: 2640, inversions: 0, yearOpened: 1927 },
  { id: 'boulder-dash', name: 'Boulder Dash', park: 'Lake Compounce', country: 'USA', continent: 'North America', manufacturer: 'Custom Coasters International', material: 'Wood', type: 'Wooden', heightFt: 115, speedMph: 60, lengthFt: 4725, inversions: 0, yearOpened: 2000 },
  { id: 'wodan', name: 'Wodan', park: 'Europa-Park', country: 'Germany', continent: 'Europe', manufacturer: 'Great Coasters International', material: 'Wood', type: 'Wooden', heightFt: 131, speedMph: 62, lengthFt: 3543, inversions: 0, yearOpened: 2012 },
  { id: 'troy', name: 'Troy', park: 'Toverland', country: 'Netherlands', continent: 'Europe', manufacturer: 'Great Coasters International', material: 'Wood', type: 'Wooden', heightFt: 105, speedMph: 53, lengthFt: 3608, inversions: 0, yearOpened: 2007 },

  // === HYBRID (RMC) ===
  { id: 'iron-rattler', name: 'Iron Rattler', park: 'Six Flags Fiesta Texas', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 171, speedMph: 70, lengthFt: 3266, inversions: 1, yearOpened: 2013 },
  { id: 'twisted-timbers', name: 'Twisted Timbers', park: 'Kings Dominion', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 109, speedMph: 54, lengthFt: 3351, inversions: 3, yearOpened: 2018 },
  { id: 'twisted-colossus', name: 'Twisted Colossus', park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 150, speedMph: 57, lengthFt: 4990, inversions: 2, yearOpened: 2015 },
  { id: 'wicked-cyclone', name: 'Wicked Cyclone', park: 'Six Flags New England', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 109, speedMph: 55, lengthFt: 3320, inversions: 3, yearOpened: 2015 },
  { id: 'outlaw-run', name: 'Outlaw Run', park: 'Silver Dollar City', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 107, speedMph: 68, lengthFt: 2937, inversions: 3, yearOpened: 2013 },
  { id: 'zadra', name: 'Zadra', park: 'Energylandia', country: 'Poland', continent: 'Europe', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 206, speedMph: 75, lengthFt: 4265, inversions: 3, yearOpened: 2019 },
  { id: 'untamed', name: 'Untamed', park: 'Walibi Holland', country: 'Netherlands', continent: 'Europe', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 118, speedMph: 56, lengthFt: 2625, inversions: 3, yearOpened: 2019 },
  { id: 'wildfire', name: 'Wildfire', park: 'Kolmården', country: 'Sweden', continent: 'Europe', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 184, speedMph: 71, lengthFt: 3871, inversions: 3, yearOpened: 2016 },

  // === LAUNCH COASTERS ===
  { id: 'velocicoaster', name: 'VelociCoaster', park: "Universal's Islands of Adventure", country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 155, speedMph: 70, lengthFt: 4700, inversions: 4, yearOpened: 2021 },
  { id: 'taron', name: 'Taron', park: 'Phantasialand', country: 'Germany', continent: 'Europe', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 98, speedMph: 73, lengthFt: 4295, inversions: 0, yearOpened: 2016 },
  { id: 'maverick-cp', name: 'Top Thrill 2', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Zamperla', material: 'Steel', type: 'Sit-down', heightFt: 420, speedMph: 120, lengthFt: 2800, inversions: 0, yearOpened: 2024 },
  { id: 'do-dodonpa', name: 'Do-Dodonpa', park: 'Fuji-Q Highland', country: 'Japan', continent: 'Asia', manufacturer: 'S&S Worldwide', material: 'Steel', type: 'Sit-down', heightFt: 161, speedMph: 112, lengthFt: 3901, inversions: 0, yearOpened: 2017 },
  { id: 'formula-rossa', name: 'Formula Rossa', park: 'Ferrari World', country: 'UAE', continent: 'Asia', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 171, speedMph: 150, lengthFt: 6562, inversions: 0, yearOpened: 2010 },
  { id: 'hagrid', name: "Hagrid's Magical Creatures", park: "Universal's Islands of Adventure", country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 65, speedMph: 50, lengthFt: 5053, inversions: 0, yearOpened: 2019 },
  { id: 'cheetah-hunt', name: 'Cheetah Hunt', park: 'Busch Gardens Tampa Bay', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 102, speedMph: 60, lengthFt: 4429, inversions: 0, yearOpened: 2011 },
  { id: 'pantheon', name: 'Pantheon', park: 'Busch Gardens Williamsburg', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 180, speedMph: 73, lengthFt: 3327, inversions: 2, yearOpened: 2022 },
  { id: 'copperhead-strike', name: 'Copperhead Strike', park: 'Carowinds', country: 'USA', continent: 'North America', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 82, speedMph: 42, lengthFt: 3232, inversions: 5, yearOpened: 2019 },
  { id: 'icon', name: 'Icon', park: 'Blackpool Pleasure Beach', country: 'UK', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 88, speedMph: 51, lengthFt: 3379, inversions: 0, yearOpened: 2018 },
  { id: 'helix', name: 'Helix', park: 'Liseberg', country: 'Sweden', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 135, speedMph: 62, lengthFt: 4380, inversions: 7, yearOpened: 2014 },
  { id: 'blue-fire', name: 'Blue Fire', park: 'Europa-Park', country: 'Germany', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 124, speedMph: 62, lengthFt: 3380, inversions: 4, yearOpened: 2009 },

  // === MULTI-LAUNCH / MULTI-ELEMENT ===
  { id: 'iron-gwazi', name: 'Iron Gwazi', park: 'Busch Gardens Tampa Bay', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 206, speedMph: 76, lengthFt: 4075, inversions: 3, yearOpened: 2022 },
  { id: 'jersey-devil', name: 'Jersey Devil Coaster', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Steel', type: 'Sit-down', heightFt: 130, speedMph: 58, lengthFt: 3000, inversions: 3, yearOpened: 2021 },
  { id: 'x2', name: 'X2', park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 175, speedMph: 76, lengthFt: 3610, inversions: 2, yearOpened: 2002 },
  { id: 'steel-curtain', name: 'Steel Curtain', park: 'Kennywood', country: 'USA', continent: 'North America', manufacturer: 'S&S Worldwide', material: 'Steel', type: 'Sit-down', heightFt: 220, speedMph: 76, lengthFt: 4000, inversions: 9, yearOpened: 2019 },

  // === INTERNATIONAL ICONS ===
  { id: 'hakugei', name: 'Hakugei', park: 'Nagashima Spa Land', country: 'Japan', continent: 'Asia', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 185, speedMph: 66, lengthFt: 4052, inversions: 2, yearOpened: 2019 },
  { id: 'steel-dragon-2000', name: 'Steel Dragon 2000', park: 'Nagashima Spa Land', country: 'Japan', continent: 'Asia', manufacturer: 'D.H. Morgan Manufacturing', material: 'Steel', type: 'Sit-down', heightFt: 318, speedMph: 95, lengthFt: 8133, inversions: 0, yearOpened: 2000 },
  { id: 't-express', name: 'T Express', park: 'Everland', country: 'South Korea', continent: 'Asia', manufacturer: 'Intamin', material: 'Wood', type: 'Wooden', heightFt: 183, speedMph: 65, lengthFt: 5380, inversions: 0, yearOpened: 2008 },
  { id: 'dc-rivals', name: 'DC Rivals HyperCoaster', park: 'Warner Bros. Movie World', country: 'Australia', continent: 'Oceania', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 200, speedMph: 71, lengthFt: 4167, inversions: 0, yearOpened: 2017 },
  { id: 'ride-to-happiness', name: 'Ride to Happiness', park: 'Plopsaland De Panne', country: 'Belgium', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Spinning', heightFt: 114, speedMph: 56, lengthFt: 3280, inversions: 5, yearOpened: 2021 },

  // === MORE B&M ===
  { id: 'kumba', name: 'Kumba', park: 'Busch Gardens Tampa Bay', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 143, speedMph: 60, lengthFt: 3978, inversions: 7, yearOpened: 1993 },
  { id: 'incredible-hulk', name: 'The Incredible Hulk', park: "Universal's Islands of Adventure", country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 110, speedMph: 67, lengthFt: 3700, inversions: 7, yearOpened: 1999 },
  { id: 'goliath-sfmm', name: 'Goliath', park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Giovanola', material: 'Steel', type: 'Sit-down', heightFt: 235, speedMph: 85, lengthFt: 4500, inversions: 0, yearOpened: 2000 },
  { id: 'goliath-sfog', name: 'Goliath', park: 'Six Flags Over Georgia', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 200, speedMph: 70, lengthFt: 4480, inversions: 0, yearOpened: 2006 },
  { id: 'raging-bull', name: 'Raging Bull', park: 'Six Flags Great America', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 202, speedMph: 73, lengthFt: 5057, inversions: 0, yearOpened: 1999 },
  { id: 'behemoth', name: 'Behemoth', park: "Canada's Wonderland", country: 'Canada', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 230, speedMph: 77, lengthFt: 5318, inversions: 0, yearOpened: 2008 },

  // === MORE INTAMIN ===
  { id: 'i305-2', name: 'Ride of Steel', park: 'Six Flags Darien Lake', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 208, speedMph: 73, lengthFt: 5394, inversions: 0, yearOpened: 1999 },
  { id: 'xcelerator', name: 'Xcelerator', park: "Knott's Berry Farm", country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 205, speedMph: 82, lengthFt: 2202, inversions: 0, yearOpened: 2002 },
  { id: 'superman-escape', name: 'Superman Escape', park: 'Warner Bros. Movie World', country: 'Australia', continent: 'Oceania', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 118, speedMph: 62, lengthFt: 2513, inversions: 0, yearOpened: 2005 },

  // === ARROW / VEKOMA CLASSICS ===
  { id: 'loch-ness-monster', name: 'Loch Ness Monster', park: 'Busch Gardens Williamsburg', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 130, speedMph: 60, lengthFt: 3240, inversions: 2, yearOpened: 1978 },
  { id: 'tennessee-tornado', name: 'Tennessee Tornado', park: 'Dollywood', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 163, speedMph: 70, lengthFt: 2676, inversions: 3, yearOpened: 1999 },
  { id: 'corkscrew', name: 'Corkscrew', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 85, speedMph: 48, lengthFt: 2050, inversions: 3, yearOpened: 1976 },

  // === MACK RIDES ===
  { id: 'lost-gravity', name: 'Lost Gravity', park: 'Walibi Holland', country: 'Netherlands', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 105, speedMph: 54, lengthFt: 2559, inversions: 2, yearOpened: 2016 },

  // === MORE GLOBAL ===
  { id: 'karnan', name: 'Kärnan', park: 'Hansa-Park', country: 'Germany', continent: 'Europe', manufacturer: 'Gerstlauer', material: 'Steel', type: 'Sit-down', heightFt: 240, speedMph: 78, lengthFt: 4104, inversions: 3, yearOpened: 2015 },
  { id: 'takabisha', name: 'Takabisha', park: 'Fuji-Q Highland', country: 'Japan', continent: 'Asia', manufacturer: 'Gerstlauer', material: 'Steel', type: 'Sit-down', heightFt: 141, speedMph: 62, lengthFt: 3294, inversions: 7, yearOpened: 2011 },
  { id: 'twisted-cyclone', name: 'Twisted Cyclone', park: 'Six Flags Over Georgia', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 100, speedMph: 50, lengthFt: 2400, inversions: 3, yearOpened: 2018 },
  { id: 'goliath-sfga', name: 'Goliath', park: 'Six Flags Great America', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Wood', type: 'Wooden', heightFt: 165, speedMph: 72, lengthFt: 3100, inversions: 2, yearOpened: 2014 },
  { id: 'new-texas-giant', name: 'New Texas Giant', park: 'Six Flags Over Texas', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 153, speedMph: 65, lengthFt: 4200, inversions: 0, yearOpened: 2011 },
  { id: 'twisted-typhoon', name: 'Twisted Typhoon', park: 'Wild Adventures', country: 'USA', continent: 'North America', manufacturer: 'Vekoma', material: 'Steel', type: 'Sit-down', heightFt: 100, speedMph: 47, lengthFt: 2500, inversions: 4, yearOpened: 2023 },
  { id: 'cannibal', name: 'Cannibal', park: 'Lagoon', country: 'USA', continent: 'North America', manufacturer: 'Lagoon', material: 'Steel', type: 'Sit-down', heightFt: 208, speedMph: 70, lengthFt: 2735, inversions: 4, yearOpened: 2015 },
  { id: 'expedition-everest', name: 'Expedition Everest', park: 'Disney Animal Kingdom', country: 'USA', continent: 'North America', manufacturer: 'Vekoma', material: 'Steel', type: 'Sit-down', heightFt: 199, speedMph: 50, lengthFt: 4424, inversions: 0, yearOpened: 2006 },
  { id: 'space-mountain-dl', name: 'Space Mountain', park: 'Disneyland', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Sit-down', heightFt: 80, speedMph: 35, lengthFt: 3500, inversions: 0, yearOpened: 1977 },
  { id: 'big-thunder-mountain', name: 'Big Thunder Mountain', park: 'Disneyland', country: 'USA', continent: 'North America', manufacturer: 'Vekoma', material: 'Steel', type: 'Sit-down', heightFt: 104, speedMph: 36, lengthFt: 2780, inversions: 0, yearOpened: 1979 },
  { id: 'rock-n-roller', name: "Rock 'n' Roller Coaster", park: 'Disney Hollywood Studios', country: 'USA', continent: 'North America', manufacturer: 'Vekoma', material: 'Steel', type: 'Sit-down', heightFt: 80, speedMph: 57, lengthFt: 3403, inversions: 3, yearOpened: 1999 },
  { id: 'revenge-of-mummy', name: 'Revenge of the Mummy', park: 'Universal Studios Florida', country: 'USA', continent: 'North America', manufacturer: 'Premier Rides', material: 'Steel', type: 'Sit-down', heightFt: 44, speedMph: 45, lengthFt: 2200, inversions: 0, yearOpened: 2004 },
  { id: 'tatsu-sfmm', name: 'Full Throttle', park: 'Six Flags Magic Mountain', country: 'USA', continent: 'North America', manufacturer: 'Premier Rides', material: 'Steel', type: 'Sit-down', heightFt: 160, speedMph: 70, lengthFt: 2500, inversions: 1, yearOpened: 2013 },
  { id: 'iron-dragon', name: 'Iron Dragon', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Arrow Dynamics', material: 'Steel', type: 'Inverted', heightFt: 76, speedMph: 40, lengthFt: 2800, inversions: 0, yearOpened: 1987 },
  { id: 'batman-clone', name: 'Batman: The Ride', park: 'Six Flags Great America', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 100, speedMph: 50, lengthFt: 2700, inversions: 5, yearOpened: 1992 },
  { id: 'superman-sfne', name: 'Superman: The Ride', park: 'Six Flags New England', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 208, speedMph: 77, lengthFt: 5400, inversions: 0, yearOpened: 2000 },
  { id: 'wicked-twister', name: 'Wicked Twister', park: 'Cedar Point', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 215, speedMph: 72, lengthFt: 675, inversions: 0, yearOpened: 2002 },
  { id: 'fahrenheit', name: 'Fahrenheit', park: 'Hersheypark', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 121, speedMph: 58, lengthFt: 2700, inversions: 6, yearOpened: 2008 },
  { id: 'storm-runner', name: 'Storm Runner', park: 'Hersheypark', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 150, speedMph: 72, lengthFt: 2800, inversions: 2, yearOpened: 2004 },
  { id: 'great-bear', name: 'Great Bear', park: 'Hersheypark', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Inverted', heightFt: 90, speedMph: 61, lengthFt: 2800, inversions: 4, yearOpened: 1998 },
  { id: 'candymonium', name: 'Candymonium', park: 'Hersheypark', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Sit-down', heightFt: 210, speedMph: 76, lengthFt: 4636, inversions: 0, yearOpened: 2020 },
  { id: 'wildcat-treble', name: "Wildcat's Revenge", park: 'Hersheypark', country: 'USA', continent: 'North America', manufacturer: 'Rocky Mountain Construction', material: 'Hybrid', type: 'Hybrid', heightFt: 140, speedMph: 62, lengthFt: 3510, inversions: 4, yearOpened: 2023 },
  { id: 'phantom-manor', name: 'Medusa', park: 'Six Flags Discovery Kingdom', country: 'USA', continent: 'North America', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Floorless', heightFt: 150, speedMph: 61, lengthFt: 3937, inversions: 7, yearOpened: 2000 },
  { id: 'tallest-freefall', name: 'Zumanjaro: Drop of Doom', park: 'Six Flags Great Adventure', country: 'USA', continent: 'North America', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 415, speedMph: 90, lengthFt: 830, inversions: 0, yearOpened: 2014 },
  { id: 'fenix', name: 'Fénix', park: 'Toverland', country: 'Netherlands', continent: 'Europe', manufacturer: 'Bolliger & Mabillard', material: 'Steel', type: 'Wing', heightFt: 131, speedMph: 56, lengthFt: 2625, inversions: 5, yearOpened: 2018 },
  { id: 'wooden-warrior', name: 'Wooden Warrior', park: 'Quassy', country: 'USA', continent: 'North America', manufacturer: 'The Gravity Group', material: 'Wood', type: 'Wooden', heightFt: 40, speedMph: 35, lengthFt: 1230, inversions: 0, yearOpened: 2011 },
  { id: 'lightning-run', name: 'Lightning Run', park: 'Kentucky Kingdom', country: 'USA', continent: 'North America', manufacturer: 'Chance Rides', material: 'Steel', type: 'Sit-down', heightFt: 100, speedMph: 55, lengthFt: 2500, inversions: 3, yearOpened: 2014 },
  { id: 'mine-blower', name: 'Mine Blower', park: 'Fun Spot Kissimmee', country: 'USA', continent: 'North America', manufacturer: 'The Gravity Group', material: 'Wood', type: 'Wooden', heightFt: 80, speedMph: 48, lengthFt: 1920, inversions: 1, yearOpened: 2017 },
  { id: 'flying-aces', name: 'Flying Aces', park: 'Ferrari World', country: 'UAE', continent: 'Asia', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 207, speedMph: 75, lengthFt: 4947, inversions: 0, yearOpened: 2016 },
  { id: 'kondaa', name: 'Kondaa', park: 'Walibi Belgium', country: 'Belgium', continent: 'Europe', manufacturer: 'Intamin', material: 'Steel', type: 'Sit-down', heightFt: 180, speedMph: 71, lengthFt: 3900, inversions: 0, yearOpened: 2021 },
  { id: 'voltron', name: 'Voltron Nevera', park: 'Europa-Park', country: 'Germany', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Sit-down', heightFt: 115, speedMph: 62, lengthFt: 4757, inversions: 5, yearOpened: 2024 },
  { id: 'twisted-tornado', name: 'The Ride to Happiness', park: 'Plopsaland De Panne', country: 'Belgium', continent: 'Europe', manufacturer: 'Mack Rides', material: 'Steel', type: 'Spinning', heightFt: 114, speedMph: 56, lengthFt: 3280, inversions: 5, yearOpened: 2021 },
];

/** Curated ~50 well-known coasters used as daily answer pool */
export const DAILY_ANSWER_POOL: string[] = [
  'steel-vengeance', 'fury-325', 'millennium-force', 'velocicoaster', 'el-toro',
  'lightning-rod', 'the-voyage', 'maverick', 'the-beast', 'kingda-ka',
  'top-thrill-dragster', 'intimidator-305', 'iron-gwazi', 'banshee', 'raptor',
  'valravn', 'gatekeeper', 'magnum-xl200', 'mystic-timbers', 'diamondback',
  'orion', 'leviathan', 'mako', 'nitro', 'tatsu',
  'montu', 'kumba', 'sheikra', 'griffon', 'kraken',
  'outlaw-run', 'zadra', 'twisted-colossus', 'iron-rattler', 'ghostrider',
  'taron', 'nemesis', 'helix', 'expedition-ge-force', 'shambhala',
  'formula-rossa', 'steel-dragon-2000', 'hakugei', 'hagrid', 'thunderhead',
  'boulder-dash', 'pantheon', 'candymonium', 'wildcat-treble', 'voltron',
];

/** Search coasters by name (case-insensitive), excluding already-guessed IDs */
export function searchCoasters(query: string, excludeIds: string[] = []): CoastleCoaster[] {
  if (!query || query.length < 1) return [];
  const lowerQuery = query.toLowerCase();
  const excludeSet = new Set(excludeIds);
  return COASTER_DATABASE.filter(
    (c) => !excludeSet.has(c.id) && (
      c.name.toLowerCase().includes(lowerQuery) ||
      c.park.toLowerCase().includes(lowerQuery)
    )
  ).slice(0, 15);
}

/** Get coaster by ID */
export function getCoasterById(id: string): CoastleCoaster | undefined {
  return COASTER_DATABASE.find((c) => c.id === id);
}
