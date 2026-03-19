/**
 * Mock article data — seeded from real coaster industry topics.
 * In production, this will be fetched from Firestore articles collection.
 */

import { Article } from '../types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'article-weekly-digest-march-10-16',
    title: 'This Week in Coasters: March 10-16, 2026',
    subtitle: 'Muppets take over Rock \'n\' Roller Coaster, Big Thunder\'s comeback, and a hazmat scare at Disneyland',
    body: `Slow news week? Not exactly. No groundbreaking announcements, but a lot of stuff moving in the background. Construction photos, reopening dates, and one genuinely weird incident at Disneyland.

## Muppets Rock 'n' Roller Coaster is getting real

If you've been following the Rock 'n' Roller Coaster retheme at Hollywood Studios, the scaffolding is officially everywhere now. The facade is covered. New flame graphics showed up on the stretch limo car this week, and the guitar marquee is getting torn into. Disney's still targeting summer 2026 for the debut, and for the first time it actually looks like they might hit it.

The internet is still split on this one. Losing Aerosmith stings if you grew up with it. But the ride hardware isn't changing, that launch and those inversions are staying. If the Muppets humor lands (and Disney has a solid track record there, Muppet Vision 3D still holds up), this could quietly become one of the better rethemes they've done. The kind where people complain online for six months and then ride it and go "okay fine, this is good."

Construction walls around Animation Courtyard pushed even further into guest pathways this week too. Hollywood Studios is a construction zone right now.

## Big Thunder coming back in May

WDW locked in some reopening dates. Big Thunder Mountain Railroad is confirmed for early May, which is solid timing if you're planning a spring trip. Buzz Lightyear's Space Ranger Spin is also coming back with what they're calling a "refreshed experience," some Easter egg updates, nothing crazy. And Soarin' Across America at EPCOT finally has a real date after being behind walls for what feels like two years.

Not the most exciting news on its own, but if you've been to WDW recently you know how many rides have been down simultaneously. Getting three back is a relief.

## Space Mountain got evacuated

Weird one. On March 14, Disneyland evacuated Space Mountain and shut down parts of Tomorrowland over a hazardous materials situation. Nobody got hurt, everything reopened, but it was the most-talked-about Disney story of the week. Ended up in all the recap roundups. Just one of those reminders that running a theme park 365 days a year is genuinely complicated.

## World of Frozen opens March 29

Disney Adventure World (the rebranded Walt Disney Studios Park at Disneyland Paris) launches March 29. Less than two weeks out. World of Frozen is the centerpiece, and Raiponce Tangled Spin joins the lineup too. Early photos look really good, like Tokyo Fantasy Springs good.

Paris has been the underdog Disney resort forever. This is the biggest investment they've gotten in years, and it'll be interesting to see if the quality matches what Tokyo pulled off last year.

## Everything else

Dollywood's hybrid water-coaster is still progressing. VAI Resort and the Mattel Theme Park in Arizona got more construction footage. Universal's Frisco, Texas resort is chugging along. Across the country, parks are locking in 2026 operating calendars and announcing preview nights.

No "we just announced a 500-foot RMC" moment. It was a build week, not an announce week. But a lot of pieces are falling into place for what could be a really strong summer.

## Next week

March 29 is coming fast. Any early reports or soft opening leaks from Disney Adventure World will be the thing to watch. And we'll keep an eye on how quickly the Muppets facade work moves at Hollywood Studios now that scaffolding is fully up.`,
    bannerImage: require('../../../../assets/cards/big-thunder-mountain-railroad.webp'),
    category: 'news-digest',
    tags: ['weekly-digest', 'disney', 'muppets', 'rock-n-roller-coaster', 'world-of-frozen', 'space-mountain'],
    readTimeMinutes: 5,
    sources: [
      { name: 'Theme Park Insider', url: 'https://www.themeparkinsider.com' },
      { name: 'WDWNT', url: 'https://wdwnt.com/2026/03/space-mountain-evacuated-due-to-hazardous-material-this-and-more-in-the-top-10-stories-of-the-week-for-march-14-2026/' },
      { name: 'WDW Magic', url: 'https://www.wdwmagic.com' },
      { name: 'Laughing Place', url: 'https://www.laughingplace.com/disney-parks/the-magic-of-disney-animation-march-2026-update/' },
      { name: 'Newsweek', url: 'https://www.newsweek.com' },
      { name: 'Disney Fanatic', url: 'https://www.disneyfanatic.com' },
      { name: 'TimeOut', url: 'https://www.timeout.com' },
    ],
    authorId: 'trackr-editorial',
    authorName: 'TrackR Team',
    publishedAt: '2026-03-16T18:00:00Z',
    status: 'published',
  },
  {
    id: 'article-sf-cf-merger',
    title: 'Six Flags and Cedar Fair Merger: What It Means for You',
    subtitle: 'The largest theme park merger in history is changing everything from season passes to new ride investments.',
    body: `The theme park industry is entering a new era. The merger between Six Flags Entertainment and Cedar Fair has been finalized, creating the largest regional amusement park operator in North America with a combined portfolio of over 40 parks.

## What's Changing

For the millions of season pass holders across both legacy chains, the most visible change will be a unified membership and season pass program rolling out over the next 18 months.

Under the new structure, a single pass tier will grant access to every park in the combined portfolio. That means a Cedar Point pass holder could visit Magic Mountain, Great Adventure, and Knott's Berry Farm all on the same membership.

> "We want to eliminate friction for our guests. A family in Ohio should be able to plan a vacation to a park in Texas or California without worrying about which pass they bought."

## Capital Investment

Behind the scenes, the merger is expected to drive significant capital investment. Parks that historically received modest annual budgets under Six Flags' cost-conscious management model will now benefit from Cedar Fair's track record of investing in marquee attractions.

Industry analysts predict that parks like **Six Flags Over Georgia**, **Six Flags Fiesta Texas**, and **La Ronde** could see major new coaster installations within the next three years.

## What About Pricing?

Cedar Fair's premium pricing model averaged significantly higher than Six Flags' value-oriented approach. The merged company has indicated a "value-plus" strategy — competitive base pricing with premium add-on experiences.

## The Bottom Line

For now, existing passes from both chains will be honored through the end of the current season, with the new unified program launching ahead of the following year. The real excitement starts when those capital investment dollars begin flowing to parks that have been waiting years for a headline attraction.`,
    bannerImage: 'https://picsum.photos/seed/six-flags-merger/800/500',
    category: 'industry',
    tags: ['six-flags', 'cedar-fair', 'merger', 'season-pass'],
    readTimeMinutes: 5,
    sources: [
      { name: 'Theme Park Insider', url: 'https://www.themeparkinsider.com' },
      { name: 'Coaster Nation', url: 'https://www.coasternation.com' },
    ],
    authorId: 'trackr-editorial',
    authorName: 'TrackR Editorial',
    publishedAt: '2026-03-15T14:00:00Z',
    status: 'published',
  },
  {
    id: 'article-cedar-point-2025',
    title: 'Cedar Point Announces Record-Breaking Coaster for 2025',
    subtitle: 'The roller coaster capital of the world just raised the bar again with plans for a 420-foot launch coaster.',
    body: `Cedar Point has officially pulled back the curtain on what could be the most ambitious roller coaster project in the park's storied history.

## The Numbers

The new coaster will feature a steel track layout stretching over **7,200 feet** with a maximum height exceeding **420 feet**. If the numbers hold, it would surpass Kingda Ka as the tallest complete-circuit coaster in the world while also claiming the title of longest steel coaster in North America.

## Launch Technology

Industry insiders have speculated that the ride will utilize a next-generation launch system capable of propelling trains from zero to over **150 miles per hour** in under four seconds. Permits filed with Erie County reference engineering firms closely associated with Intamin Amusement Rides.

## Construction Progress

Construction fencing has already appeared along the Frontier Trail area of the park. Aerial drone footage captured by enthusiast channels shows significant ground preparation including deep foundation work consistent with a massive support structure.

Several flat rides and a portion of the existing midway have been cleared to make room for the new layout.

## Season Pass Impact

Pre-sale numbers for 2025 passes have reportedly surged **40 percent** compared to the same period last year, driven largely by anticipation around the announcement.

Cedar Point plans to release the full name, theme, and detailed specifications during a live-streamed event scheduled for later this fall.`,
    bannerImage: 'https://picsum.photos/seed/cedar-point-2025/800/500',
    category: 'news',
    tags: ['cedar-point', 'new-coaster', 'intamin', 'record-breaking'],
    readTimeMinutes: 4,
    sources: [
      { name: 'CoasterNation', url: 'https://www.coasternation.com' },
    ],
    authorId: 'trackr-editorial',
    authorName: 'TrackR Editorial',
    publishedAt: '2026-03-14T10:00:00Z',
    status: 'published',
  },
  {
    id: 'article-hidden-gems',
    title: 'Top 10 Hidden Gems: Underrated Coasters You Need to Ride',
    subtitle: 'These world-class rides fly under the radar. Time to update your bucket list.',
    body: `Every enthusiast knows about Steel Vengeance, Velocicoaster, and Iron Gwazi. But what about the coasters that rarely make top-ten lists despite delivering world-class experiences?

## Phantom's Revenge — Kennywood

The terrain-hugging layout drops riders through a ravine at speeds exceeding **80 mph** with sustained airtime that rivals anything from B&M or Intamin. Its relatively modest 160-foot height keeps it out of record-breaking conversations, but the ride experience is absolutely elite.

## Lightning Rod — Dollywood

The launched wooden coaster concept was groundbreaking, and now that the ride operates consistently, it delivers a relentless barrage of ejector airtime from the quad-down finale that has to be experienced to be believed.

## Railblazer — California's Great America

This single-rail design from Rocky Mountain Construction packs more intensity per foot of track than almost any coaster in existence. At just 1,800 feet of track, it proves that a great coaster does not need to be long.

## Voyage — Holiday World

The second half of the ride tears through a dense forest with laterals and airtime moments that would be considered extreme on a steel coaster, let alone a wooden one.

## The Common Thread

These hidden gems prioritize ride experience over marketing milestones. They may not hold world records, but they deliver something more important: pure, unfiltered joy from start to finish.`,
    bannerImage: 'https://picsum.photos/seed/hidden-gems/800/500',
    category: 'ride-review',
    tags: ['hidden-gems', 'underrated', 'bucket-list', 'rmc'],
    readTimeMinutes: 6,
    sources: [
      { name: 'Coaster Studios', url: 'https://www.youtube.com/@coasterstudios' },
      { name: 'RCDB', url: 'https://rcdb.com' },
    ],
    authorId: 'trackr-editorial',
    authorName: 'TrackR Editorial',
    publishedAt: '2026-03-12T16:00:00Z',
    status: 'published',
  },
  {
    id: 'article-rmc-conversion',
    title: 'New RMC Conversion Announced for Classic Wooden Coaster',
    subtitle: 'Another beloved wooden coaster is getting the Iron Horse treatment — and fans are divided.',
    body: `Rocky Mountain Construction has confirmed another Iron Horse conversion project, this time targeting a classic wooden coaster that has been a park staple for over three decades.

## The RMC Formula

The existing wooden structure will be largely retained as a support framework while the wooden track is replaced with RMC's proprietary **steel I-box track**. This approach allows for inversions, dramatic overbanked turns, and the kind of extreme airtime that has made RMC conversions among the most celebrated coasters in the world.

## History

The original wooden coaster opened in 1991 and was designed by Custom Coasters International. While beloved by long-time park visitors, the ride had suffered from increasing roughness in recent seasons despite regular retracking efforts.

## Track Record

RMC conversions have produced some of the highest-rated coasters in the world, including:

- **Steel Vengeance** at Cedar Point
- **Iron Gwazi** at Busch Gardens Tampa Bay
- **Twisted Colossus** at Six Flags Magic Mountain

Each of these rides consistently ranks among the top steel coasters globally in enthusiast polls.

## Timeline

Construction is expected to begin immediately following the current operating season, with a target opening of the following spring.`,
    bannerImage: 'https://picsum.photos/seed/rmc-conversion/800/500',
    category: 'news',
    tags: ['rmc', 'iron-horse', 'wooden-coaster', 'conversion'],
    readTimeMinutes: 3,
    sources: [
      { name: 'RCDB', url: 'https://rcdb.com' },
    ],
    authorId: 'trackr-editorial',
    authorName: 'TrackR Editorial',
    publishedAt: '2026-03-10T12:00:00Z',
    status: 'published',
  },
];

/** Get published articles sorted by publish date (newest first) */
export function getPublishedArticles(): Article[] {
  return MOCK_ARTICLES
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Get articles by category */
export function getArticlesByCategory(category: Article['category']): Article[] {
  return getPublishedArticles().filter(a => a.category === category);
}

/** Format relative time from ISO date */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
