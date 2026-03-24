# Parks Screen — Bug & Polish Tracker

All known issues from the parks screen and its child views. Organized by section.

---

## Park Hours (Dynamic, Timezone-Aware)

- [ ] **Park hours must be accurate and dynamic.** Opening hours displayed under the park location must reflect real operating schedules, not static/placeholder data.
- [ ] **Display in the PARK's timezone, not the user's.** Example: "Open today 10am-10pm ET". A user in California viewing a Florida park should see Eastern time.
- [ ] **Show "Closed" when park is closed in its local timezone.** Even if the user is in a timezone where it seems like the park should be open, if it's closed in the park's timezone, display "Closed".
- [ ] **Find or build an API for park operating hours.** Research available sources (park websites, third-party APIs, scraping) to get accurate daily schedules including seasonal variations and special events.

---

## Park Switcher (MorphingPill)

- [ ] ~~Change button animation~~ — **KEEP. Working well.** No changes needed.
- [ ] ~~Loading animation with roller coaster~~ — **Good.** QUESTION: should this become the **app-wide loading indicator** for consistency? Decide and document.
- [ ] **Search autocomplete results appear instantly.** Results pop in on keystroke with no transition. Should use Reanimated entering/exiting transitions (FadeIn with stagger) to match the search modal on the home screen.
- [ ] **Closing animation lags for data-heavy parks.** When selecting a park with lots of data, the pill close animation stutters. Consider showing a loading indicator inside the pill before triggering the close animation.
- [ ] **Park names missing city/state info.** Truncated names only show country. Example: Universal's Islands of Adventure just says "USA" — should say "Orlando, Florida, USA" for disambiguation.
- [ ] **Dynamic park name length based on scroll position.** When scrolled down, the Change button disappears and the park name has more room — show more characters. When scrolling back up, truncate again to avoid intersecting the Change button. Animate the transition.

---

## Park Stats Screen

- [ ] **Design was never explicitly approved.** Built without Caleb's review. Needs a full design pass before further polish.
- [ ] **Hero image scroll behavior is wrong.** Image scrolls down and locks in a weird position with the status bar visible. Fix: image should either **STAY FIXED** (parallax — scale to 110%, let content scroll over it) or if it scrolls, it must be **blurry**. Current behavior is neither.
- [ ] ~~Hero card overlapping hero image~~ — **Okay for now.** Revisit after design pass.
- [ ] **Data accuracy: verify tallest coaster source.** SFMM shows tallest coaster at 235ft — is this from the app's own coaster database or scraped from the internet? Must come from the app's internal coaster database, not external sources.
- [ ] **Only showing 6 coasters for Magic Mountain.** Should show ALL coasters at the park. Critical data completeness issue — likely a query limit or filter bug.
- [ ] **Missing card art for some coasters.** Goliath, Full Throttle, Riddler's Revenge don't show art. This is a card-art-agent pipeline issue, not a polish task — tracking here for visibility.
- [ ] **Long-press on coasters must show the standard action sheet.** Long-pressing any coaster should show the same action sheet used everywhere else in the app (Log, View Stats, etc.). Currently missing or inconsistent.
- [ ] **Consider adding tab navigation: Coasters | Food.** Same list view could show different data types. Would unify the food/dining data with the coaster list under one tabbed interface.

---

## Food / Rides Data

- [ ] **Food data returns nothing for any park.** Cedar Point, Knott's, Magic Mountain all show "no food data". Completely broken or never wired up.
- [ ] **Ride data returns nothing for some parks.** Some parks have no ride data at all. Both food and ride data need dynamic data sources.
- [ ] **Best approach: scrape park websites or parse park maps.** Per Caleb's direction — scrape official park websites or parse park maps (PDFs, interactive maps) for food/dining locations and menus. Research and implement a data pipeline for this.

---

## Weather

- [ ] **Weather must be dynamic to the park's city.** Current weather data must be fetched based on the selected park's geographic location, not hardcoded or based on user location.
- [ ] **Hourly forecast should ONLY show hours the park is open, starting from current time forward.** Example: park open 10am-8pm, current time 2:30pm — show 2pm, 3pm, 4pm, 5pm, 6pm, 7pm, 8pm.
- [ ] **After closing time: show "park closed" indicator.** Display a red circle with line through it (prohibition icon) to fill remaining carousel slots after closing time. Communicates that the park is done for the day.
- [ ] **Steps counter must show real data.** Wire up HealthKit (iOS) / Health Connect (Android) to display actual step count. Currently showing placeholder/static data.

---

## Wait Times

- [ ] **Verify which data is real (Queue-Times) vs mock.** Audit every park's wait time display to confirm whether it's pulling from Queue-Times API or showing fabricated mock data.
- [ ] **Holiday World confirmed NOT in Queue-Times.** Currently showing mock data as if it's real. Must clearly distinguish real-time data from mock/unavailable data.
- [ ] **Research parks lacking Queue-Times coverage.** Identify which parks have no Queue-Times data and find alternative APIs (park-specific APIs, third-party providers, scraping).
- [ ] **Fallback display for parks with no wait time data.** Design and implement a clear UI state for parks where no wait time data is available at all — don't show fake data or leave it blank without explanation.

---

## Pass Section

- [ ] ~~Add Your Pass button~~ — **KEEP. Working well.** Opens import pass flow correctly.
- [ ] ~~Fast pass / skip-the-line scanning~~ — **SHELVED.** Most parks use RFID wristbands, not scannable passes. Keep the pass section as-is for now. Revisit only if park technology changes.

---

## Park Guides

- [ ] **Show max 5 guides in the carousel.** Limit the horizontal scroll to 5 guide cards, then show a "View All" card at the end as the 6th item.
- [ ] **Add "View All" text button on the header row.** Place it on the right side of the "Park Guides" section header, inline with the title.
- [ ] **Build a full-screen "All Guides" screen.** Opens when "View All" is tapped (either from the carousel end card or the header button). Scrollable list of all guides for that park.
- [ ] **Plan for DOZENS of guides per park.** The "All Guides" screen must handle large lists efficiently (FlatList, lazy loading, etc.).
- [ ] **NO EMOJIS in park guides.** This app uses SVG icons only. Replace any emojis currently in guide content with proper icons. See `feedback_no-emojis.md`.

---

## Bottom Padding (APP-WIDE)

- [ ] **Reduce extra empty space at the bottom of pages.** Visible on the parks screen and other screens throughout the app — bottom padding is noticeably larger than standard. Reduce to match the app's standard content padding. This is an app-wide fix, not parks-specific, but documenting here since it was spotted on this screen.
