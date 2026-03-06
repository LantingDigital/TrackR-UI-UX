// ─── Trivia Questions ──────────────────────────────────────
//
// 80 questions across 4 categories.
// answers[0] is always the correct answer — shuffled at runtime.

import type { TriviaCategory } from '../types/trivia';

interface RawQuestion {
  category: TriviaCategory;
  question: string;
  answers: [string, string, string, string]; // correct first
}

export const TRIVIA_QUESTIONS: RawQuestion[] = [
  // ─── Parks ──────────────────────────────────────────────
  { category: 'parks', question: 'Which park is home to Steel Vengeance?', answers: ['Cedar Point', 'Kings Island', 'Hersheypark', 'Dollywood'] },
  { category: 'parks', question: 'Busch Gardens Tampa is located in which US state?', answers: ['Florida', 'Virginia', 'California', 'Texas'] },
  { category: 'parks', question: 'Which park features the coaster "Fury 325"?', answers: ['Carowinds', 'Kings Dominion', 'Six Flags Great Adventure', 'Dollywood'] },
  { category: 'parks', question: 'Velocicoaster is located at which Universal park?', answers: ['Islands of Adventure', 'Universal Studios Florida', 'Universal Hollywood', 'Universal Singapore'] },
  { category: 'parks', question: 'Which park is the oldest operating amusement park in the US?', answers: ['Lake Compounce', 'Cedar Point', 'Knoebels', 'Kennywood'] },
  { category: 'parks', question: 'Energylandia is located in which country?', answers: ['Poland', 'Germany', 'Czech Republic', 'Hungary'] },
  { category: 'parks', question: 'Which Disney park has Space Mountain?', answers: ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'] },
  { category: 'parks', question: 'Phantasialand is located near which German city?', answers: ['Cologne', 'Berlin', 'Munich', 'Hamburg'] },
  { category: 'parks', question: 'Which park has the most roller coasters in the world?', answers: ['Six Flags Magic Mountain', 'Cedar Point', 'Energylandia', 'Europa-Park'] },
  { category: 'parks', question: 'Dollywood is named after which celebrity?', answers: ['Dolly Parton', 'Dolly Madison', 'Dolly Singh', 'Dolly Wilde'] },
  { category: 'parks', question: 'Which park is home to Millennium Force?', answers: ['Cedar Point', 'Carowinds', 'Six Flags Great America', 'Busch Gardens Williamsburg'] },
  { category: 'parks', question: 'Europa-Park is located in which country?', answers: ['Germany', 'France', 'Netherlands', 'Switzerland'] },
  { category: 'parks', question: 'Alton Towers is located in which country?', answers: ['England', 'Scotland', 'Ireland', 'Wales'] },
  { category: 'parks', question: 'Which park is home to Lightning Rod?', answers: ['Dollywood', 'Silver Dollar City', 'Holiday World', 'Knoebels'] },
  { category: 'parks', question: 'Holiday World is located in which US state?', answers: ['Indiana', 'Ohio', 'Kentucky', 'Illinois'] },
  { category: 'parks', question: 'Which park features Hagrid\'s Magical Creatures?', answers: ['Islands of Adventure', 'Universal Studios Florida', 'Magic Kingdom', 'Hollywood Studios'] },
  { category: 'parks', question: 'PortAventura is located in which country?', answers: ['Spain', 'Portugal', 'Italy', 'France'] },
  { category: 'parks', question: 'Hersheypark is located in which US state?', answers: ['Pennsylvania', 'New York', 'New Jersey', 'Connecticut'] },
  { category: 'parks', question: 'Which park is home to Intimidator 305?', answers: ['Kings Dominion', 'Carowinds', 'Kings Island', 'Cedar Point'] },
  { category: 'parks', question: 'Silver Dollar City is located near which city?', answers: ['Branson', 'Nashville', 'Memphis', 'Little Rock'] },

  // ─── Coasters ───────────────────────────────────────────
  { category: 'coasters', question: 'What type of coaster is Steel Vengeance?', answers: ['Hybrid (RMC)', 'Steel', 'Wooden', 'Launched'] },
  { category: 'coasters', question: 'How tall is Fury 325?', answers: ['325 feet', '300 feet', '350 feet', '310 feet'] },
  { category: 'coasters', question: 'Which coaster holds the record for most inversions?', answers: ['The Smiler', 'Colossus', 'Dragon Khan', 'Banshee'] },
  { category: 'coasters', question: 'What is the top speed of Kingda Ka?', answers: ['128 mph', '120 mph', '135 mph', '150 mph'] },
  { category: 'coasters', question: 'Which coaster was the first giga coaster?', answers: ['Millennium Force', 'Fury 325', 'Steel Dragon 2000', 'Leviathan'] },
  { category: 'coasters', question: 'El Toro is what type of coaster?', answers: ['Wooden (Intamin prefab)', 'Steel', 'Hybrid', 'Launched'] },
  { category: 'coasters', question: 'How many inversions does Velocicoaster have?', answers: ['4', '3', '5', '6'] },
  { category: 'coasters', question: 'What year did Steel Vengeance open?', answers: ['2018', '2016', '2019', '2017'] },
  { category: 'coasters', question: 'Which coaster was the tallest in the world as of 2024?', answers: ['Kingda Ka', 'Top Thrill 2', 'Fury 325', 'Steel Dragon 2000'] },
  { category: 'coasters', question: 'Iron Gwazi was converted from which coaster?', answers: ['Gwazi', 'Kumba', 'Montu', 'SheiKra'] },
  { category: 'coasters', question: 'How long is Steel Vengeance\'s ride?', answers: ['5,740 feet', '4,500 feet', '6,200 feet', '5,000 feet'] },
  { category: 'coasters', question: 'What type of launch does Velocicoaster use?', answers: ['LSM (Linear Synchronous Motor)', 'Hydraulic', 'Pneumatic', 'Chain lift'] },
  { category: 'coasters', question: 'Which coaster features the "Top Gun Stall" element?', answers: ['Velocicoaster', 'Steel Vengeance', 'Iron Gwazi', 'Fury 325'] },
  { category: 'coasters', question: 'What was the first RMC hybrid coaster?', answers: ['New Texas Giant', 'Iron Rattler', 'Goliath', 'Twisted Colossus'] },
  { category: 'coasters', question: 'How fast does Intimidator 305 go?', answers: ['90 mph', '85 mph', '95 mph', '100 mph'] },
  { category: 'coasters', question: 'X2 is what type of coaster?', answers: ['4th Dimension', 'Inverted', 'Wing', 'Flying'] },
  { category: 'coasters', question: 'Which coaster has the longest drop in the US?', answers: ['Kingda Ka', 'Fury 325', 'Millennium Force', 'Steel Vengeance'] },
  { category: 'coasters', question: 'Expedition GeForce is located at which park?', answers: ['Holiday Park', 'Europa-Park', 'Phantasialand', 'Heide Park'] },
  { category: 'coasters', question: 'What is the world\'s fastest wooden coaster?', answers: ['Lightning Rod', 'El Toro', 'Voyage', 'T Express'] },
  { category: 'coasters', question: 'How many airtime hills does Steel Vengeance have?', answers: ['27.2 seconds of airtime', '20 seconds', '15 seconds', '30 seconds'] },

  // ─── Manufacturers ──────────────────────────────────────
  { category: 'manufacturers', question: 'Who manufactured Steel Vengeance?', answers: ['Rocky Mountain Construction', 'Bolliger & Mabillard', 'Intamin', 'Vekoma'] },
  { category: 'manufacturers', question: 'Fury 325 was built by which manufacturer?', answers: ['Bolliger & Mabillard', 'Intamin', 'Mack Rides', 'Vekoma'] },
  { category: 'manufacturers', question: 'Who built Velocicoaster?', answers: ['Intamin', 'B&M', 'RMC', 'Mack Rides'] },
  { category: 'manufacturers', question: 'Which manufacturer is known for "Wing Coasters"?', answers: ['Bolliger & Mabillard', 'Intamin', 'Vekoma', 'RMC'] },
  { category: 'manufacturers', question: 'RMC stands for what?', answers: ['Rocky Mountain Construction', 'Roller Master Coasters', 'Ride Manufacturing Corp', 'Rapid Motion Coasters'] },
  { category: 'manufacturers', question: 'Which manufacturer built Kingda Ka?', answers: ['Intamin', 'B&M', 'S&S Worldwide', 'Premier Rides'] },
  { category: 'manufacturers', question: 'Mack Rides is headquartered in which country?', answers: ['Germany', 'Switzerland', 'Austria', 'Netherlands'] },
  { category: 'manufacturers', question: 'Who manufactures the "Raptor" track style?', answers: ['Rocky Mountain Construction', 'Vekoma', 'GCI', 'Gravity Group'] },
  { category: 'manufacturers', question: 'Which company built Expedition Everest?', answers: ['Vekoma', 'Intamin', 'B&M', 'Mack Rides'] },
  { category: 'manufacturers', question: 'GCI stands for what?', answers: ['Great Coasters International', 'Global Coaster Industries', 'Grand Coaster Inc', 'Gravity Coasters Inc'] },
  { category: 'manufacturers', question: 'Who built Taron at Phantasialand?', answers: ['Intamin', 'Mack Rides', 'B&M', 'Vekoma'] },
  { category: 'manufacturers', question: 'Which manufacturer is known for "Dive Coasters"?', answers: ['Bolliger & Mabillard', 'Intamin', 'Gerstlauer', 'Maurer'] },
  { category: 'manufacturers', question: 'S&S Worldwide is based in which country?', answers: ['United States', 'Germany', 'Japan', 'Switzerland'] },
  { category: 'manufacturers', question: 'Premier Rides built which famous indoor coaster?', answers: ['Revenge of the Mummy', 'Space Mountain', 'Rock \'n\' Roller Coaster', 'Flight of Fear'] },
  { category: 'manufacturers', question: 'Who built Mystic Timbers?', answers: ['Great Coasters International', 'Gravity Group', 'RMC', 'Intamin'] },
  { category: 'manufacturers', question: 'Arrow Dynamics was succeeded by which company?', answers: ['S&S Worldwide', 'Vekoma', 'Premier Rides', 'Chance Rides'] },
  { category: 'manufacturers', question: 'Which manufacturer built the first B&M invert?', answers: ['Batman: The Ride was the first B&M invert', 'Raptor', 'Montu', 'Alpengeist'] },
  { category: 'manufacturers', question: 'Gerstlauer is known for which coaster type?', answers: ['Euro-Fighter', 'Wing Coaster', 'Flying Coaster', 'Dive Coaster'] },
  { category: 'manufacturers', question: 'Who manufactured Phoenix at Knoebels?', answers: ['Schwarzkopf (originally)', 'Intamin', 'Vekoma', 'Arrow'] },
  { category: 'manufacturers', question: 'Zamperla has built coasters at which major park?', answers: ['Coney Island (Luna Park)', 'Cedar Point', 'Dollywood', 'Busch Gardens'] },

  // ─── History ────────────────────────────────────────────
  { category: 'history', question: 'What year did Disneyland open?', answers: ['1955', '1960', '1952', '1958'] },
  { category: 'history', question: 'The first modern roller coaster was built in which country?', answers: ['France', 'United States', 'England', 'Germany'] },
  { category: 'history', question: 'Cedar Point opened in which year?', answers: ['1870', '1890', '1900', '1880'] },
  { category: 'history', question: 'Which coaster broke the 200-foot barrier first?', answers: ['Magnum XL-200', 'Superman: The Escape', 'Millennium Force', 'Steel Phantom'] },
  { category: 'history', question: 'The "Golden Age" of roller coasters was in which decade?', answers: ['1920s', '1950s', '1970s', '1990s'] },
  { category: 'history', question: 'Coney Island\'s Cyclone opened in which year?', answers: ['1927', '1930', '1925', '1935'] },
  { category: 'history', question: 'Which was the first steel coaster?', answers: ['Matterhorn Bobsleds', 'Space Mountain', 'Revolution', 'Big Thunder Mountain'] },
  { category: 'history', question: 'Top Thrill Dragster opened in which year?', answers: ['2003', '2001', '2005', '2000'] },
  { category: 'history', question: 'Who is credited with inventing the vertical loop?', answers: ['Werner Stengel', 'Walt Disney', 'Ron Toomer', 'Anton Schwarzkopf'] },
  { category: 'history', question: 'The Great Depression caused many parks to close. Approximately how many US parks survived?', answers: ['About 300', 'About 1000', 'About 50', 'About 500'] },
  { category: 'history', question: 'Six Flags got its name from which flags?', answers: ['The six nations that governed Texas', 'Six founding families', 'Six original rides', 'Six investment groups'] },
  { category: 'history', question: 'Which was the first coaster to exceed 400 feet?', answers: ['Top Thrill Dragster', 'Kingda Ka', 'Superman: Escape from Krypton', 'Formula Rossa'] },
  { category: 'history', question: 'Knoebels is famous for not charging what?', answers: ['Admission (free entry)', 'Parking', 'Drink refills', 'Lockers'] },
  { category: 'history', question: 'The first Disney "mountain" coaster was?', answers: ['Matterhorn Bobsleds', 'Space Mountain', 'Big Thunder Mountain', 'Expedition Everest'] },
  { category: 'history', question: 'Cedar Fair acquired which company in 2006?', answers: ['Paramount Parks', 'Six Flags', 'Busch Gardens', 'SeaWorld'] },
  { category: 'history', question: 'The Beast at Kings Island opened in which year?', answers: ['1979', '1981', '1975', '1983'] },
  { category: 'history', question: 'Which was the first B&M coaster?', answers: ['Iron Wolf', 'Batman: The Ride', 'Raptor', 'Kumba'] },
  { category: 'history', question: 'The term "credit" in coaster enthusiast lingo means?', answers: ['Riding a unique coaster for the first time', 'A free ride ticket', 'A perfect score on a ride', 'A recommendation from a friend'] },
  { category: 'history', question: 'Busch Gardens was originally created by which company?', answers: ['Anheuser-Busch', 'Walt Disney Company', 'Universal Studios', 'Coca-Cola'] },
  { category: 'history', question: 'Which year did the first RMC hybrid conversion open?', answers: ['2011', '2013', '2015', '2009'] },
];
