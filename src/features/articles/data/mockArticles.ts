/**
 * Mock article data — seeded from real coaster industry topics.
 * In production, this will be fetched from Firestore articles collection.
 */

import { Article } from '../types';

export const MOCK_ARTICLES: Article[] = [
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
    bannerImageUrl: 'https://picsum.photos/seed/six-flags-merger/800/500',
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
    bannerImageUrl: 'https://picsum.photos/seed/cedar-point-2025/800/500',
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
    bannerImageUrl: 'https://picsum.photos/seed/hidden-gems/800/500',
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
    bannerImageUrl: 'https://picsum.photos/seed/rmc-conversion/800/500',
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
