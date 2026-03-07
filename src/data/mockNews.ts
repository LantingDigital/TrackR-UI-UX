export interface NewsItem {
  id: string;
  source: string;
  image: string;
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
  isSaved: boolean;
  content: string;
  readTimeMinutes: number;
  author?: string;
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    source: 'CoasterNation',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/CedarPoint_Overview_BackHalf_DSCN9502_%28cropped%29.JPG/800px-CedarPoint_Overview_BackHalf_DSCN9502_%28cropped%29.JPG',
    title: 'Cedar Point Announces Major New Coaster for 2025 Season',
    subtitle: 'The Ohio amusement park reveals plans for a record-breaking attraction that promises to redefine thrill rides.',
    timestamp: '2h ago',
    isUnread: true,
    isSaved: false,
    readTimeMinutes: 4,
    author: 'Marcus Chen',
    content: `Cedar Point has officially pulled back the curtain on what could be the most ambitious roller coaster project in the park's storied history. During a packed press event at the Hotel Breakers ballroom, park officials revealed plans for a record-breaking attraction set to debut for the 2025 season.

The new coaster, which remains unnamed pending a public reveal later this year, will feature a steel track layout stretching over 7,200 feet with a maximum height exceeding 420 feet. If the numbers hold, it would surpass Kingda Ka as the tallest complete-circuit coaster in the world while also claiming the title of longest steel coaster in North America.

"We have always believed that Cedar Point is the roller coaster capital of the world, and this attraction will cement that legacy for a new generation," said the park's vice president of maintenance and construction during the announcement.

Industry insiders have speculated that the ride will utilize a next-generation launch system capable of propelling trains from zero to over 150 miles per hour in under four seconds. The manufacturer behind the project has not been officially confirmed, but permits filed with Erie County reference engineering firms closely associated with Intamin Amusement Rides.

Construction fencing has already appeared along the Frontier Trail area of the park, and aerial drone footage captured by enthusiast channels shows significant ground preparation including deep foundation work consistent with a massive support structure. Several flat rides and a portion of the existing midway have been cleared to make room for the new layout.

Season pass holders are already buzzing with excitement. Pre-sale numbers for 2025 passes have reportedly surged 40 percent compared to the same period last year, driven largely by anticipation around the announcement.

Cedar Point plans to release the full name, theme, and detailed specifications during a live-streamed event scheduled for later this fall.`,
  },
  {
    id: '2',
    source: 'Theme Park Insider',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Six_Flags_Magic_Mountain_%2813208988393%29.jpg/800px-Six_Flags_Magic_Mountain_%2813208988393%29.jpg',
    title: 'Six Flags and Cedar Fair Merger: What It Means for Season Pass Holders',
    subtitle: 'Industry experts weigh in on the implications of the largest theme park merger in history.',
    timestamp: '5h ago',
    isUnread: true,
    isSaved: false,
    readTimeMinutes: 5,
    author: 'Jenna Hartwell',
    content: `The theme park industry is entering a new era. The merger between Six Flags Entertainment and Cedar Fair has been finalized, creating the largest regional amusement park operator in North America with a combined portfolio of over 40 parks spanning the United States, Canada, and Mexico.

For the millions of season pass holders across both legacy chains, the immediate question is simple: what changes, and when?

According to executives from the newly formed Six Flags Entertainment Corporation, the most visible change will be a unified membership and season pass program rolling out over the next 18 months. Under the new structure, a single pass tier will grant access to every park in the combined portfolio. That means a Cedar Point pass holder could visit Magic Mountain, Great Adventure, and Knott's Berry Farm all on the same membership.

"We want to eliminate friction for our guests," said the company's chief commercial officer during an investor call. "A family in Ohio should be able to plan a vacation to a park in Texas or California without worrying about which pass they bought."

Behind the scenes, the merger is expected to drive significant capital investment. Parks that historically received modest annual budgets under Six Flags' cost-conscious management model will now benefit from Cedar Fair's track record of investing in marquee attractions. Industry analysts predict that parks like Six Flags Over Georgia, Six Flags Fiesta Texas, and La Ronde could see major new coaster installations within the next three years.

However, the consolidation also raises concerns. Some enthusiasts worry that redundant parks in overlapping markets could face closures or reduced operating calendars. The company has addressed this directly, stating that no park closures are planned and that every property in the portfolio will receive continued investment.

Pricing is another area of uncertainty. Cedar Fair's premium pricing model averaged significantly higher than Six Flags' value-oriented approach. The merged company has indicated that it will pursue a "value-plus" strategy, offering competitive base pricing with premium add-on experiences.

For now, existing passes from both chains will be honored through the end of the current season, with the new unified program launching ahead of the following year.`,
  },
  {
    id: '3',
    source: 'Coaster Studios',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Kennywood_Park.JPG/800px-Kennywood_Park.JPG',
    title: 'Top 10 Hidden Gems: Underrated Coasters You Need to Ride',
    subtitle: 'Our latest video explores amazing roller coasters that fly under the radar.',
    timestamp: '1d ago',
    isUnread: false,
    isSaved: true,
    readTimeMinutes: 6,
    author: 'Taylor Bybee',
    content: `Every enthusiast knows about Steel Vengeance, Velocicoaster, and Iron Gwazi. But what about the coasters that rarely make top-ten lists despite delivering world-class experiences? We traveled to parks across the country to ride the most underrated attractions in the industry, and the results might surprise you.

Starting on the East Coast, Phantom's Revenge at Kennywood in West Mifflin, Pennsylvania continues to fly under the radar despite being one of the most intense hyper coasters ever built. The terrain-hugging layout drops riders through a ravine at speeds exceeding 80 mph with sustained airtime that rivals anything from B&M or Intamin. Its relatively modest 160-foot height keeps it out of record-breaking conversations, but the ride experience is absolutely elite.

Moving south, Lightning Rod at Dollywood in Pigeon Forge, Tennessee has overcome its troubled opening to become one of the finest wooden coasters on the planet. The launched wooden coaster concept was groundbreaking, and now that the ride operates consistently, it delivers a relentless barrage of ejector airtime from the quad-down finale that has to be experienced to be believed.

Out west, Railblazer at California's Great America packs more intensity per foot of track than almost any coaster in existence. This single-rail design from Rocky Mountain Construction puts riders inches from the ground through inversions and near-misses that feel genuinely dangerous in the best possible way. At just 1,800 feet of track, it proves that a great coaster does not need to be long.

In the Midwest, Voyage at Holiday World in Santa Claus, Indiana remains one of the most aggressive wooden coasters ever designed. The second half of the ride tears through a dense forest with laterals and airtime moments that would be considered extreme on a steel coaster, let alone a wooden one.

Other notable mentions include Mystic Timbers at Kings Island, whose compact GCI layout delivers non-stop action, and Fury 325 at Carowinds, which despite being well-known among enthusiasts, still does not get the mainstream recognition it deserves as possibly the best giga coaster ever built.

The common thread among these hidden gems is that they prioritize ride experience over marketing milestones. They may not hold world records, but they deliver something more important: pure, unfiltered joy from start to finish.`,
  },
  {
    id: '4',
    source: 'RCDB',
    image: 'https://en.wikipedia.org/wiki/Special:FilePath/Steel_Vengeance_Drop_View.jpg',
    title: 'New RMC Conversion Announced for Classic Wooden Coaster',
    subtitle: 'Another beloved wooden coaster is getting the Iron Horse treatment this winter.',
    timestamp: '2d ago',
    isUnread: false,
    isSaved: false,
    readTimeMinutes: 3,
    content: `Rocky Mountain Construction has confirmed another Iron Horse conversion project, this time targeting a classic wooden coaster that has been a park staple for over three decades. The announcement was made through permit filings discovered by enthusiast researchers, with the park subsequently confirming the project in a brief statement.

The conversion will follow the proven RMC formula: the existing wooden structure will be largely retained as a support framework while the wooden track is replaced with RMC's proprietary steel I-box track. This approach allows for inversions, dramatic overbanked turns, and the kind of extreme airtime that has made RMC conversions among the most celebrated coasters in the world.

The original wooden coaster opened in 1991 and was designed by Custom Coasters International. While beloved by long-time park visitors, the ride had suffered from increasing roughness in recent seasons despite regular retracking efforts. The park had been evaluating options for several years before ultimately deciding on the RMC conversion path.

"This is the best of both worlds," a park spokesperson said. "We get to preserve the heritage and footprint that our guests love while delivering a ride experience that will be completely transformed."

RMC conversions have produced some of the highest-rated coasters in the world, including Steel Vengeance at Cedar Point, Iron Gwazi at Busch Gardens Tampa Bay, and Twisted Colossus at Six Flags Magic Mountain. Each of these rides consistently ranks among the top steel coasters globally in enthusiast polls.

Construction is expected to begin immediately following the current operating season, with a target opening of the following spring. The park has indicated that the ride will receive a new name and theme to reflect its transformation, though details will not be shared until closer to the debut.`,
  },
];
