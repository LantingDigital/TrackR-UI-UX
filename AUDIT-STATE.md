# TrackR Audit & Agent Architecture — Session State

**Last updated:** 2026-03-23
**Session purpose:** Full TrackR file audit + V1 agent team architecture design
**Resume instruction:** If this session disconnects, start a new session and say "Resume TrackR audit from AUDIT-STATE.md" — read this file first, then continue where we left off.

---

## PHASE 1: FILE AUDIT — COMPLETE

All decisions made. Caleb answered every question. Here's what was decided:

### Deleting (not yet executed):
- [ ] Root junk files: `SESSION-1.md`, `SESSION-2.md`, `SESSION-5.md`, `error.txt`, `gemini-nb2-result.png`, `file.svg`, `sprint-a-testing.html`, `team-dashboard.html`
- [ ] `.playwright-mcp/` directory (50+ ephemeral log files from old browser sessions)
- [ ] `docs/articles/research/` (3 research articles: tormenta, rmc-raptor, socal-arms-race)
- [ ] `.claude/design/` directory — AFTER merging any unique content into `DESIGN_SYSTEM/`. The `.claude/design/system.md` is a duplicate of DESIGN_SYSTEM/. The unique files are `components.md`, `screens.md`, `home-screen.md` — check if their content exists in DESIGN_SYSTEM/ before deleting. If not, merge it in.

### Keeping:
- `content/articles/` — 12 finished articles for news feed (usable content)
- `pipeline/` — card generation pipeline (active but needs redesign)
- `scripts/` — OSM map scripts (maps shelved for v1 but needed for v2)
- `admin/` — Next.js admin dashboard (low priority, keep)
- `.claude/plans/` — frontend plans (frontend freeze is temporary, needed for v1.5+)
- `mcp-data/` — Caleb wasn't sure what this was. Contains `article/` and `nanobanana/` subdirs. MCP infrastructure data. Decision: unclear, ask again if relevant or leave for now.

### Rewriting (not yet executed):
- [ ] `docs/V1-IMPLEMENTATION-PLAN.md` — FULL REWRITE for end-of-April 2026 timeline. Old plan says June 22 target, sprint dates are stale. Caleb wants time MCP used during responses to track actual velocity.
- [ ] `docs/v1-audit/` (20 docs) — Rewrite the open questions (Q1-Q20) to be useful toward the actual goal. They were from one session and accidentally became the source of truth. Many questions are already answered in later sessions.
- [ ] NanoBanana pipeline — entire flow needs redesign (messy file structure, Caleb wants to add things to the flow)
- [ ] Root `DATABASE_SCHEMA.md` — rename to clarify it's static coaster/park data (not the same as `docs/DATABASE_SCHEMA_V1/` which is user data)

### Confirmed decisions:
- **Pro is IN V1** (confirmed). Strategy doc "PENDING" note needs to be removed.
- **Everything ships in V1** — no scope reduction. Merch, Apple Wallet, Pro, HealthKit, all of it.
- **V1 target: END OF APRIL 2026**
- Root `DATABASE_SCHEMA.md` and `docs/DATABASE_SCHEMA_V1/` are DIFFERENT things: root = static coaster/park data, folder = user data/backend spec. Both needed, just rename root for clarity.
- DESIGN_SYSTEM/ is the single source of truth for design. .claude/design/ is a duplicate.

### Key insight from Caleb:
"The punch list addressed the wrong way. I'd rather figure out what solutions need to be finished, then create an agent around them, rather than having a punch list. I'm trying to use what we have already and redo the system to start the agentic flow from scratch, but still work with the content that we have."

---

## PHASE 2: AGENT ARCHITECTURE — IN PROGRESS

### Overall Architecture Decision:
**Feature-based agents with phased activation.**

Each agent owns a FULL VERTICAL (backend + frontend for their feature). This solves Caleb's previous pain points:
- Backend agent used to finish too fast and sit idle
- Frontend agent was overloaded because Caleb iterates heavily on visual stuff
- NanoBanana agent went dark for hours and was unresponsive
- Feature-based distributes workload evenly because every agent has both backend AND frontend

Caleb's interaction model: ME (main session) as team lead. I coordinate all agents. Caleb can also interact with agents directly via worktrees/agent teams in Claude Code.

### Agent Roster (8 feature + 2 utility):

| # | Agent | Owns | Phase | Status |
|---|-------|------|-------|--------|
| 1 | **auth-agent** | Firebase Auth, sign-in/up/out, session, user doc, onboarding auth pages | Phase 1 | **WRITTEN** ✅ |
| 2 | **core-data-agent** | Ride logs, ratings, profile sync, criteria config, Zustand↔Firestore sync | Phase 1 | **WRITTEN** ✅ |
| 3 | **social-agent** | Posts, comments, friends, feed, rankings, user search | Phase 2 | **WRITTEN** ✅ |
| 4 | **commerce-agent** | Pro IAP, merch store, Stripe, QPMN orders | Phase 2 | **WRITTEN** ✅ |
| 5 | **experience-agent** | Apple Wallet PKPass, ticket sync, wait times, HealthKit | Phase 2 | **WRITTEN** ✅ |
| 6 | **polish-agent** | Fog fixes, keyboard, punch list, onboarding polish | Ongoing | **WRITTEN** ✅ |
| 7 | **content-agent** | Article pipeline, news feed wiring | Ongoing | **WRITTEN** ✅ |
| 8 | **card-art-agent** | NanoBanana pipeline (redesigned with batch review) | Ongoing | **WRITTEN** ✅ |
| - | **firebase-browser** | Utility: Firebase Console access (Playwright) | On-demand | EXISTS (keep as-is) |
| - | **merch-browser** | Utility: QPMN/vendor browser access (Playwright) | On-demand | EXISTS (keep as-is) |

**Phase 1** = no dependencies, start immediately.
**Phase 2** = depends on auth-agent being done (needs authenticated users).
**Ongoing** = no code dependencies, can run from day 1 in parallel.

The old `card-art-browser.md` agent will be REPLACED by the new `card-art-agent.md` (full feature agent with redesigned batch workflow, not just a Playwright wrapper).

### Agent Files Written So Far:

**1. auth-agent.md** — `projects/trackr/.claude/agents/auth-agent.md`
- Owns: Firebase Auth (Apple, Google, Email), session persistence, user doc creation, username validation, account deletion, local-to-cloud migration
- KEY DETAIL (Caleb's specific request, described multiple times): The onboarding is a horizontal swipe. Auth is the LAST page. "Skip" button on all onboarding pages slides to auth page. When user naturally swipes to auth page, "Skip" button fades out (animated, not instant). Sign-in and sign-up are two adjacent swipeable pages.
- 14 deliverables, 13 success criteria
- Depends on: nothing (Phase 1)

**2. core-data-agent.md** — `projects/trackr/.claude/agents/core-data-agent.md`
- Owns: Ride log persistence, rating persistence, criteria config sync, profile stats, Zustand↔Firestore sync layer, offline support
- Builds the Firestore service layer, wires existing screens to real data
- Does NOT build new screens — only swaps data source from in-memory to Firestore
- 14 deliverables, 11 success criteria
- Depends on: auth-agent (needs uid for Firestore paths, but can build service layer in parallel)
- Caleb had no adjustments — was about to approve when he asked for this state file

### ALL AGENTS WRITTEN ✅

**All 8 feature agents + 2 utility agents are defined.** Here's a summary of each:

**3. social-agent** — `projects/trackr/.claude/agents/social-agent.md`
- Will own: Community posts, comments, likes, friend system (request→accept), feed algorithm, rankings computation, user search
- Key context: `docs/v1-audit/community-feed.md`, `community-friends.md`, `community-rankings.md`, `community-games.md`
- Big note: CommunityFriends has 6 MISSING UI ELEMENTS (biggest UI gap in the app per v1 audit)
- This agent has both backend (collections, CFs) and frontend (wire community screens to real data + build missing friend UI)

**4. commerce-agent**
- Will own: TrackR Pro IAP (PWYW $1-$12), merch store (7 screens already built), Stripe integration, QPMN order fulfillment, gold foil pricing logic
- Key context: V1-IMPLEMENTATION-PLAN sections 1-2, PRICING-STRATEGY.md, MERCH-PAYMENT-PLAN.md
- 3 Stripe CFs already built but NOT deployed (need Stripe secrets)
- May need merch-browser utility agent for QPMN API testing

**5. experience-agent**
- Will own: Apple Wallet PKPass, ticket sync to Firestore, wait times (Queue-Times API), HealthKit step counting
- Key context: v1-audit/wallet.md, v1-audit/apple-wallet.md, APPLE-WALLET-CERT-SETUP.md
- PKPass CF deployed but needs real certs (manual Apple Developer step)
- Queue-Times mapping done (35 parks), needs API signup + wiring

**6. polish-agent**
- Will own: ALL UI bug fixes. Fog fixes (11 remaining screens per STATE.md), keyboard behavior, ProfileReady animation, HomePark redesign, AddTicketFlow redesign, Trivia fix
- Frontend ONLY — no backend work
- Can run from day 1 (no dependencies)
- Follows frontend-freeze rule: only fixes EXISTING UI, doesn't build new features

**7. content-agent**
- Will own: Article pipeline (15-20 articles before TestFlight), news feed Firestore wiring
- Light backend (articles collection) + content generation
- Uses Perplexity Tier 1 only per cost rules

**8. card-art-agent**
- Will REPLACE old card-art-browser.md
- Redesigned with: batch workflow (generate 5 → pause → Caleb reviews → approve/reject → next batch)
- Must stay responsive to messages between batches
- Has its own Playwright MCP (isolated browser) for Gemini access
- Source image verification REQUIRED per existing rules

---

## WHAT TO DO NEXT (if session resumes)

ALL 8 AGENTS ARE WRITTEN. Next steps:

1. **Execute file cleanup** — delete the files from the Phase 1 audit decisions above
2. **Merge .claude/design/ unique content into DESIGN_SYSTEM/** — then delete .claude/design/
3. **Rename root DATABASE_SCHEMA.md** — to something like COASTER-DATA-SCHEMA.md for clarity
4. **Update strategy doc** — remove "PENDING" note on Pro (it's confirmed IN V1)
5. **Rewrite V1-IMPLEMENTATION-PLAN.md** — new agent-based timeline for end of April 2026
6. **Update v1-audit/ open questions** — mark answered ones, rewrite remaining to be useful
7. **Update STATE.md** — replace with new state reflecting agent architecture
8. **Delete old card-art-browser.md** — replaced by card-art-agent.md
9. **Test: deploy first agent team** — start with Phase 1 (auth-agent + core-data-agent) + polish-agent + card-art-agent in parallel
10. **Track velocity with time MCP** — Caleb wants timestamp tracking to validate April timeline

---

## CALEB'S PREFERENCES (captured this session)

- Wants agents that own full verticals (backend + frontend), not layer-based splits
- Wants even workload distribution — no agent sitting idle while another drowns
- Wants to be able to interact with each agent individually via worktrees
- Planning before executing — don't just spawn agents ad-hoc
- The punch list approach is wrong — organize work around agents, not flat task lists
- NanoBanana pipeline needs full redesign (messy files, wants to add to the flow)
- Admin dashboard was built for visibility into agent work but hasn't been super helpful
- "Everything ships in V1" — no scope cuts, agents make it possible
- Time MCP should run during responses to track velocity and validate April timeline

---

## SESSION 2 DECISIONS (2026-03-23)

### Auth-Agent — Fully Refined

**Onboarding reality (confirmed via device screenshots):**
- Onboarding is LIGHT THEME (#F7F7F7), VERTICAL SCROLL, interactive phone mockups
- NOT dark theme, NOT horizontal swipe, NOT the old step-based fade system
- The v1-audit docs about onboarding are STALE and wrong
- HomePark step is PERMANENTLY REMOVED from onboarding. Home park selection happens on first visit to Parks screen.

**Auth page:**
- Auth is the LAST section of vertical scroll, ALWAYS (auto-positioned, not hardcoded)
- Sign-in / Sign-up TOGGLE on the SAME page (not two separate pages)
- Both modes: Apple + Google + Email
- "Browse without account" = small text link at bottom (de-emphasized)

**Skip button:**
- Skip on all sections except auth
- Skip does HORIZONTAL transition to DUPLICATE auth page (leaving vs finishing feeling)
- Skip fades out when scrolling to bottom auth section (scroll-position-driven opacity)

**Anonymous users:**
- Browse only (coasters, parks). NO logging, rating, wallet, community
- Asked for name only → shorter welcome → browse mode
- Locked features trigger contextual bottom sheet nudge ("Sign up to log your first ride")
- Name auto-fills if they later sign up

**Post-auth flow:**
1. Profile Setup: Name (OAuth auto-fill), Username (real-time "@name is available!" / "@name has already been taken", min 3 chars), Avatar (camera + library + preset defaults)
2. Celebration: "Welcome, [Real Name]!" with animation
3. Into app

**Edge cases:**
- Unverified email on relaunch → show verification screen again, block app
- Apple Sign-In nil name → require manual entry
- App killed during profile setup → show profile setup again on relaunch
- Returning user on new device → skip profile setup → "Welcome back!" celebration
- Skip vs scroll auth → identical post-auth flow
- Username changeable anytime in Settings
- Email verification REQUIRED before app use

### Core-Data-Agent — Fully Refined

**Data persistence:**
- Offline-first REQUIRED (Firestore persistence)
- Optimistic logging (instant celebration, background write)
- Re-rides = separate Firestore documents (one per ride)
- Full ride editing (timestamp, notes, seat)
- Deletion with confirmation dialog + immediate CF count update

**Stats:**
- Local-first + Firestore listener (no loading state)
- Credit count = hero stat (front and center)
- Total rides = deeper stats view (not prominent)

**20 Rating Criteria (FINAL):**
Core Ride Feel: (1) Floater Airtime*, (2) Ejector Airtime, (3) Intensity*, (4) Smoothness*, (5) Speed, (6) Inversions, (7) Laterals, (8) Hangtime, (9) Drop Quality
Design & Flow: (10) Pacing*, (11) Layout, (12) Duration, (13) Uniqueness
Experience: (14) Theming*, (15) Scenery, (16) Comfort, (17) Re-rideability, (18) Night Ride, (19) Worth the Wait
Emotional: (20) Intimidation
(* = smart default for free users)

- Free users: pick 5 from 20
- Pro users: up to all 20
- Smart defaults on first use (no setup wizard)
- Card-based picker UI
- No custom criteria in V1 (AI rounding deferred to v1.5, see memory/project_trackr-custom-criteria.md)

**Weight system:**
- Recalculation via Cloud Function (handles 200+ ratings)
- Toast notification during recalc
- Modal warning before applying weight changes
- Weight revert: rebuild from scratch (existing button doesn't cover new system)

**Batch logging:**
- Re-logging existing coaster → quantity selector
- "Same seat for all?" toggle (yes = enter once, no = step through individually)

**Export/Import:**
- Export is FREE (Apple compliance). Core-data-agent builds it.
- Import = separate import-agent (CSV/Excel/JSON with AI format detection). V1 scope per Caleb.

**Seat map database:**
- Want exact row/seat data per coaster train
- Only build if reliable data source exists (RCDB, LogRide, etc.)
- Manual entry (front/middle/back + left/middle/right) as V1 fallback
- Research task before building

**Coaster Clash criteria recommender:**
- V1 stretch goal or v1.5
- Game-based system: play ride-vs-ride comparisons → algorithm infers criteria preferences → recommends criteria + weights
- Caleb's expanded vision: full user profiling system, "complete your profile" feature, aggregate data for park partnerships
- Needs its own dedicated scoping session
- Caleb says 10-15 rounds isn't enough — wants LOTS of questions

### New Agent Added to Roster
- **import-agent** — handles CSV/Excel/JSON import with AI format detection, field mapping, duplicate handling. V1 scope.

### Metro Connection (corrected)
- USB ONLY for React Native dev. Never Tailscale.
- Check Mac's local IP via `ifconfig en0`
- Caleb enters `http://{MAC_IP}:8081` in Expo dev client
- Rule saved to `.claude/rules/metro-ip-check.md`
- Old `remote-metro.md` rule DELETED

### Remaining Agents to Review
- social-agent — NOT YET REVIEWED (written but needs Q&A session like auth and core-data)
- commerce-agent — NOT YET REVIEWED
- experience-agent — NOT YET REVIEWED
- polish-agent — NOT YET REVIEWED
- content-agent — NOT YET REVIEWED
- card-art-agent — NOT YET REVIEWED
- import-agent — NOT YET WRITTEN (new agent)

---

### Social-Agent — Fully Refined (Session 2, 2026-03-23)

**Scope narrowed:** Social-agent owns Feed + Friends + Rankings ONLY. Games/Play split to new games-agent.

**Key decisions:**
- Mutual friends only. No follows. No follower counts.
- Public/private accounts with per-post visibility control
- 4 post types: Post (generic, #1 option), Review, Trip Report, Ranked List. Bucket List DROPPED.
- Images in ALL post types. 2000 char limit. Client-side compression to ~1MB.
- Stories IN V1: Instagram-style, photo+video, text overlays, coaster/park tags, 24h expiry, full-screen viewer (tap advance, swipe next friend)
- Post editing: both delete AND edit. Edited posts show "edited" label.
- Like display: "Liked by @jayden and 11 others" — tappable full list
- Rankings tab REDESIGNED: Coasters view (criteria rankings) + Riders view (user leaderboards) with segmented control
- Riders metrics: Credits (unverified w/disclaimer), Verified Credits (GPS-only), Rides Logged, Parks Visited, Reviews Written
- User-level blocking (ProfileView + Settings) + admin-level banning (Firebase Console)
- Profanity filter + rate limiting on post/comment submission
- Report button on every post, comment, and profile
- Friend request notifications: push + in-app badge + custom branded email (uses auth-agent's email pipeline)
- Custom email pipeline is V1 (Firebase default emails suck and go to spam). Auth-agent builds pipeline, others reuse.
- Firebase Storage for images (migrate to R2 if needed later)
- No phone number collection. Email notifications + deep links for v1.5.

**New agents added to roster:**
- **games-agent** — split from social. Owns Play tab, game persistence, game leaderboards, daily Coastle, weekly challenges. NOT YET WRITTEN.
- **import-agent** — CSV/Excel/JSON import with AI format detection. NOT YET WRITTEN.

### Commerce-Agent — Fully Refined (Session 2, 2026-03-23)

**Pro Tiers (FINAL):** Rider ($1-3), Thrill Seeker ($4-6), Thoosie ($7-9), Legend ($10-12). SVG icon + unique color per tier. Same features for all. Dollar amounts not shown publicly.

**Pro Expiry:** 14-day grace period → downgrade modal → select 5 criteria → recalculate ratings. Reactivate button in modal.

**Free Card:** Physical card, user picks during Pro signup, added to next Collection Window, free shipping. First subscription only.

**Merch Model:** Collection Windows (2-week batch cycles) + Rush Orders (instant via QPMN API, premium pricing). FIRST deliverable = QPMN pricing research.

**Post-Order Rush Upgrade:** While "In Collection Window," users can upgrade to Rush (pay difference, pulled from batch).

**Three Order States:** In Collection Window (editable) → Printing (locked by Caleb) → Shipped (final).

**Order Tracking:** Countdown to batch date → approximate delivery estimate by location. Late order inquiry via email.

**Payment:** Apple IAP for Pro (digital), Stripe + Apple Pay for merch (physical). USD only for V1.

**Other:** Cart persists indefinitely (Firestore). Worldwide shipping. Returns defective only. Gift orders + gift message supported. Multiple orders auto-combine by address. Pro discount 10% auto-applied, locked at order time. Upgrade anytime, downgrade at renewal. Promo codes v1.5. Sales tax research as deliverable. Gold border: core-data owns GPS data, commerce applies to fulfillment. NanoBanana = internal only (.claude/rules/).

**Games-agent written.** 5 games (Coastle, Trivia, Speed Sorter, Blind Ranking, Parkle). Coaster Clash CUT for V1 (criteria recommender in v1.5). Daily puzzles deterministic from local date. Both global + friends leaderboards. Weekly in-app challenges.

---

### Polish Agent — Full Walkthrough Complete (Session 2, 2026-03-23)

**EVERY screen in the app has been walked through with Caleb on device. All issues captured in docs/polish/:**

| File | Screen | Approx Issues |
|------|--------|---------------|
| onboarding-fixes.md | All onboarding showcase screens | 35+ |
| home-screen-fixes.md | Home screen + all child modals | 40+ |
| parks-screen-fixes.md | Parks screen + stats/food/rides/guides | 30+ |
| logbook-screen-fixes.md | Logbook + collection/stats/pending | 30+ |
| community-screen-fixes.md | Community feed/friends/rankings/play | TBD |
| profile-settings-fixes.md | Profile + all settings sub-screens | 40+ |
| INDEX.md | Master index linking all fix files | - |

**Total: 175+ documented issues across the entire app.**

**New App-Wide Rules Discovered:**
1. NO FOG ON BOTTOM SHEETS — remove all fog from bottom sheets everywhere
2. KEYBOARD DISMISS ON SCROLL — scrolling any list dismisses keyboard app-wide
3. THREE-TIER MODAL SYSTEM: iOS Alert = NEVER. Custom modal (blurred bg) = destructive actions. Bottom sheet = options/choices.
4. HAPTICS MASTER SWITCH — Settings haptics toggle must kill ALL haptics instantly when off
5. NO EMOJIS anywhere in the app — SVG icons only (reinforced during park guides walkthrough)
6. Card art gray loading is the #1 recurring issue — needs app-wide pre-loading/caching solution with loading indicator + fade-in

**Remaining Work for Next Session:**
1. Clarifying questions from the walkthrough (Caleb offered to answer everything)
2. Write app-wide-fixes.md consolidating cross-cutting issues
3. Update polish-agent.md with complete walkthrough data + new rules
4. Review remaining agents: games-agent, content-agent, card-art-agent, import-agent (need deep Q&A like auth/core-data/social/commerce)
5. Write import-agent.md (new agent, not yet created)
6. Execute file cleanup from Phase 1 audit (deletions still pending)
7. Rewrite V1-IMPLEMENTATION-PLAN.md with agent-based timeline

---

### Polish Clarifying Questions — COMPLETE (Session 3, 2026-03-24)

**All clarifying questions answered. 250+ issues fully documented.**

**New decisions from Q&A:**
- Card art fan: automated loop, random selection
- Onboarding animations: match real app's spring configs exactly
- Wallet demo: automated (not interactive)
- Criteria demo: show sliders moving, percentages redistributing, lock mechanism. Perfect loop.
- Park switcher onboarding: replicate real MorphingPill at smaller scale
- Rankings onboarding: build new Coasters/Riders design ahead of social-agent
- Fog revert: git blame to find last correct home screen fog
- Nav bar: hide during sheets, MUST always return. Global visibility manager.
- Delete ride: custom modal (destructive action tier)
- Rarity badges: REMOVED entirely
- Tab collapse: simple fade-out like parks screen
- Stats drill-down screens: core-data-agent builds
- Park data: new park-data-agent needed (food, rides, hours, Google Maps deep links)
- Buy Now: bypasses cart, goes straight to checkout (subject to batch logic)
- Gold border toggle: already exists, preview auto-scrolls to top
- FABs: committed app-wide. Bottom fog effect (reversed header fog) separates FAB from content.
- Rating display: X.X/10 format, tappable to expand criteria breakdown
- Ranked list slot conflict: swap with animation, displaced entry goes to holding area
- Screens needing design proposals: profile, AddTicketFlow, park stats, trivia, credits

**Polish agent SPLIT into 3:**
1. polish-onboarding-agent (35+ issues)
2. polish-app-agent (160+ issues: home, logbook, parks, community, app-wide rules)
3. polish-commerce-agent (75+ issues: merch, wallet, profile, settings)

**New agents added this session:**
- park-data-agent (food, rides, hours, Google Maps deep links)
- 3 polish agents replace the single polish-agent

**Remaining agents to review:**
- games-agent (written, needs deep Q&A)
- content-agent (written, needs deep Q&A)
- card-art-agent (written, needs deep Q&A)
- import-agent (NOT YET WRITTEN)
- park-data-agent (NOT YET WRITTEN)
- 3 polish agents (NOT YET WRITTEN — need to create from the fix files)

### Content-Agent — Fully Refined (Session 3, 2026-03-24)

**Content is a FULL MEDIA OPERATION, not a trickle of articles.**

**Content taxonomy:** 10 categories, 70+ subcategories saved to `.claude/content/content-taxonomy.md`
Categories: News, Park Guides, Historical Deep Dives, Culture Pieces, Ride Reviews, Trip Reports, Seasonal Content, Buyer's Guides & Gear, Rankings & Lists, Industry & Behind the Curtain

**Research flow:** Perplexity browser-based research template saved to `.claude/content/research-flow.md`. Each subcategory gets its own adapted prompt. Sources prioritized per topic type.

**10-stage pipeline saved to `.claude/content/pipeline.md`:**
1. Invoke (skill prompts for subcategory + quantity)
2. Topic Discovery (Perplexity browser, Sonar model, deep research)
3. Perplexity Research Report (explicitly request article format, extract source URLs)
4. Reformat to TrackR Article (community voice, article structure, clickable source links)
5. Humanize pass 1 (/humanizer skill, strips 25 AI patterns)
6. AI Detect pass 2 (local tool — agent researches and proposes, no external API dependency)
7. Rewrite flagged sections (repeat detect until clean)
8. Generate Hero Image (NanoBanana landscape via Gemini browser, topic-specific content)
9. Generate Inline Images 2-3 (NanoBanana style, dynamic aspect ratios, placed at relevant sections)
10. Publish to Firestore (article + images + source links + metadata)

**Key decisions:**
- Voice: community (authentic thoosie, not personal, not editorial)
- Humanization: mandatory /humanizer skill + local AI detection second pass
- Text2Go MCP rejected (external API dependency) — agent researches local alternatives via Perplexity
- Perplexity generates the article draft (not just research data) — prompt explicitly requests article format
- Hero image: always landscape, NanoBanana stylization, content varies by topic (not always coasters)
- Inline images: 2-3 per article, dynamic aspect ratios, source photos optional (text-prompt-only OK)
- All Perplexity source URLs become clickable links in the published article
- Publishing cadence: daily (perpetual content production)
- Scale: agent runs non-stop for N articles per session (user specifies quantity)
- Content agent needs TWO browser slots: Perplexity + Gemini

### Browser Slot System — Implemented (Session 3, 2026-03-24)

**MAJOR INFRASTRUCTURE CHANGE:** Replaced ALL Playwright MCP usage with pre-launched browser slot system.

- 20 browser slots (browser-1 through browser-20) via CDP on ports 9222-9241
- Chrome instances on macOS Desktop 2 (no focus stealing)
- Headed browsers (bypass Cloudflare/bot detection)
- Session persistence (cookies/logins saved per data-dir)
- Cross-project sharing (all projects use same 20 slots)

**Files created/updated:**
- launch-browsers.sh → EA project root
- BROWSER-WORKFLOW.md → EA project root
- .mcp.json → EA project root (20 browser slots)
- All TrackR agent files updated (removed inline Playwright MCPs)
- playwright-team-isolation.md → updated (old system deprecated)
- playwright.md → updated (browser slot rules replace headless rules)
- coding.md → Perplexity MCP API deprecated, browser-based Perplexity is primary

**Perplexity MCP API is DEPRECATED.** All research through browser-based Perplexity Pro ($20/mo subscription, unlimited, free).

### Games-Agent — Fully Refined (Session 3, 2026-03-24)

- Parkle: light desaturated blue accent, same layout as Coastle
- Difficulty tiers: Easy (top 200) / Hard (full database)
- Game stats: universal (games played) + game-specific metrics per game
- Weekly challenges: mix of game-specific and game-agnostic
- Parkle hints: match Coastle hint count, park-specific data (first letter, country, chain, etc.)
- Trivia: 300 high-quality curated questions, researcher agent creates them, NO AI-generated filler
- SpeedSorter: REBUILD drag-and-drop from scratch with reanimated + gesture handler

### Remaining for Next Session
- Rewrite content-agent.md with full pipeline
- Review card-art-agent (deep Q&A)
- Write import-agent (new)
- Write park-data-agent (new)
- Write 3 polish agents (split from single polish-agent)
- Execute file cleanup from Phase 1 audit
- Build the content skill that invokes the agent

### Card Art JSON Prompting — PROVEN (Session 3, 2026-03-24)

**JSON image prompting pipeline tested and validated with real Gemini sessions.**

**The proven flow (3 steps, same Gemini session):**
1. Upload source → Gemini outputs JSON analysis (clean, no fluff) describing every visual element
2. Agent modifies ONLY style fields (adds warm golden-hour treatment). Composition/layout fields stay UNTOUCHED (this preserves track accuracy)
3. Send modified JSON → Gemini generates styled image. "Redo with Pro" mandatory.

**Key discovery:** The composition fields in the JSON are what preserve the layout. Subject position, camera angle, framing, structural features — these are never modified. Only the artistic treatment (color grading, texture simplification, atmosphere, lighting) gets overridden.

**Style corrections from testing:**
- First attempt (v1) was too vibrant/painterly — wrong style entirely
- Second attempt (v2) was muted but too COOL — missing the warm golden-hour sky
- Final version (v3) nails it: warm peach/salmon sky, simplified surfaces, atmospheric haze, Studio Ghibli-meets-architectural-rendering feel

**Sanity check added:** 9-point verification after every generation (layout match, coaster type, no phantom track, correct train, no people, no watermarks, aspect ratio, warm color grading, simplified textures). Failed checks logged in JSON receipt for debugging.

**Files:**
- `json-image-prompting.md` v3 (proven) saved to `.claude/content/`
- Style override block standardized
- Test results saved to `assets/card-art-pipeline/` (json-test-v2-scrolled.png, original-nb-baseline.png)

**Browser workflow notes:**
- "Create image" button triggers Gemini's style picker, NOT NanoBanana directly
- Just paste prompt normally — Gemini auto-invokes NanoBanana with image + reimagine instruction
- Fresh Chrome sessions need re-authentication (2FA via Google Authenticator)
- Session data persists in mcp-data/ directory between launches if same data-dir name is used

### ALL AGENTS COMPLETE (Session 3, 2026-03-24)

**Every agent in the V1 roster has been written, reviewed, and locked in for production.**

**Final Agent Roster (13 feature + 2 utility = 15 agents):**

| # | Agent | Scope | Status |
|---|-------|-------|--------|
| 1 | auth-agent | Firebase Auth, onboarding auth, profile setup, session | PRODUCTION READY |
| 2 | core-data-agent | Ride logs, ratings, 20 criteria, Firestore sync, export | PRODUCTION READY |
| 3 | social-agent | Feed, friends, stories, rankings (Coasters+Riders), blocking, moderation | PRODUCTION READY |
| 4 | games-agent | Coastle, Trivia, SpeedSorter rebuild, Blind Ranking, Parkle (new), leaderboards, challenges | PRODUCTION READY |
| 5 | commerce-agent | Pro IAP (4 tiers), merch store (Collection Windows + Rush), Stripe, QPMN, order lifecycle | PRODUCTION READY |
| 6 | experience-agent | Apple Wallet, tickets, wait times (multi-provider), weather (cross-platform), HealthKit/Health Connect, home park | PRODUCTION READY |
| 7 | content-agent | 10-stage article pipeline, 70+ subcategories, Perplexity research, humanization, NanoBanana images | PRODUCTION READY |
| 8 | card-art-agent | JSON image prompting pipeline (proven), 9-point sanity check, NanoBanana via Gemini | PRODUCTION READY |
| 9 | polish-onboarding-agent | 35+ onboarding showcase fixes | PRODUCTION READY |
| 10 | polish-app-agent | 160+ home/logbook/parks/community fixes + 13 app-wide rules | PRODUCTION READY |
| 11 | polish-commerce-agent | 75+ merch/wallet/profile/settings fixes | PRODUCTION READY |
| 12 | import-agent | Any-format import, AI field mapping, fuzzy coaster matching, batch processing | PRODUCTION READY |
| 13 | park-data-agent | Food/rides/hours/shows/POIs, Google Places coordinates, geo-locked maps deep links, daily refresh | PRODUCTION READY |
| - | firebase-browser | Utility: Firebase Console browser access | READY |
| - | merch-browser | Utility: QPMN/vendor browser access | READY |

**Import-agent key decisions (Session 3):**
- Any file format, AI detects structure
- Map everything possible (coaster, date, rating, seat, notes, park, count)
- Fuzzy match + confirm → coaster search picker for unknowns
- Always preview before writing
- Batch in chunks of 50 with progress bar (non-blocking)
- Imported rides: pending dot (no number), bypass log modal nagging

**Park-data-agent key decisions (Session 3):**
- Food: Perplexity first, scrape gaps
- Hours: daily refresh via ThemeParks.wiki API
- POI coordinates: Google Places API
- Maps deep links: geo-locked to park guests only. "Open in Google Maps/Apple Maps" with walking directions
- Shows: include if ThemeParks.wiki has data, skip individual scraping
- All ride types (not just coasters)
- Coverage: as many parks as possible, no cap

**WHAT'S NEXT: PHASE 1 DEPLOYMENT**
All agents are written. The next step is:
1. Execute Phase 1 file cleanup (deletions from the original audit)
2. Deploy first agent team (Phase 1: auth + core-data + polish agents + card-art in parallel)
3. Track velocity with time MCP to validate April timeline
