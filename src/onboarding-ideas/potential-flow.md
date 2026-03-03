# TrackR Onboarding Flow — Concept Doc

---

## Overview

The onboarding should feel like a seamless extension of TrackR's minimalist, Apple-inspired design — off-white backgrounds, soft shadows, selective red accents. Every screen earns its place by either delighting the user or making their future experience better. No screen should feel like a chore.

The flow is split into three phases:

1. **Hook** — Pre-auth showcase screens
2. **Setup** — Account creation + personalization
3. **Launch** — Post-onboarding prompted actions (import, first log)

---

## Phase 1: Hook (Pre-Auth)

### Screen 1 — "Welcome to TrackR"

**Layout:** Upper 60% is a looping animation — a stylized coaster car tracing a track silhouette that morphs into different iconic coaster elements (inversions, airtime hills, launches). The animation uses the brand red as a subtle accent against the off-white canvas, with soft shadow depth.

**Below the fold:**
- App logo + tagline (something like *"Your rides. Your way."* or *"Track it. Rank it. Own it."*)
- **Continue with Apple** button (primary)
- **Continue with Google** button (secondary)
- **Sign up with email** (tertiary/text link)
- "Already have an account? **Log in**"

### Screen 2 — Feature Carousel (optional swipe)

If the user doesn't immediately tap sign-up, they can swipe through 2-3 showcase cards that auto-advance slowly. Each card occupies the upper 60% with a micro-animation or illustrated mockup:

1. **"Log every ride"** — Animation of a coaster card being added to a collection with a satisfying snap
2. **"Rank your way"** — Quick preview of the weighted ranking system with sliders adjusting and a top-10 list reordering in real-time
3. **"Collect them all"** — An anime-style coaster card flipping into view with a subtle shimmer effect

The sign-up buttons persist at the bottom across all carousel states.

**Design note:** These aren't tutorial slides — they're hype screens. Short, visual, zero explanation needed. Think Apple keynote energy, not app walkthrough.

---

## Phase 2: Setup (Post-Auth)

After the user creates their account (email/password or social), they flow into personalization. Each screen is skippable but encouraged. A subtle progress indicator (thin line or dots) shows how far along they are without creating pressure.

### Screen 3 — "What kind of rider are you?"

This is the light, fun question that determines experience level without ever saying "guest" or "enthusiast." It should feel like a personality quiz, not a settings page.

**Approach — Single fun question with visual options:**

Present 3-4 illustrated cards the user taps to select:

| Card | Label | Vibe | Maps to |
|------|-------|------|---------|
| 🎢 | *"I'm here for the thrills"* | Casual visitor, loves a good coaster | Guest-leaning |
| 📊 | *"I've got a spreadsheet for this"* | Enthusiast who tracks everything | Enthusiast |
| 🗺️ | *"I'm always planning the next trip"* | Trip planner, park hopper | Enthusiast-leaning |
| 🆕 | *"Just getting started"* | New to the hobby | Guest |

Each card has a small illustrated icon and a one-liner. Tapping one triggers a subtle spring animation (scale bounce + red accent glow). The selection silently configures the app experience — which features are surfaced prominently, what tooltips appear, how complex the initial UI feels.

**What this controls:**
- Whether the ranking weights setup is surfaced during onboarding or deferred
- Complexity of the home feed (news-heavy vs. action-heavy)
- Whether the import prompt appears immediately after onboarding or later
- Tooltip density in the first session

### Screen 4 — "Pick your home parks"

**Layout:** A search bar at top with a map or list of popular parks below (geo-sorted by the user's location). Parks displayed as cards with park images, names, and location.

- User can search and select 1-5 home parks
- Selected parks get a red check with a spring animation
- These become the default parks for quick-logging rides and personalized news

**Why this screen earns its place:** It immediately makes the app feel personal. Their home feed, Discover tab, and trip suggestions all benefit from knowing this on day one.

### Screen 5 — "Set up your profile"

Clean, minimal:
- Profile photo (camera/gallery picker, or skip for a default avatar)
- Display name (pre-filled from social login if available)
- Optional: short bio or "favorite coaster" one-liner

This is quick — 15 seconds max. The display name is the only required field.

### Screen 6 — "Stay in the loop"

Notification preferences, presented as toggleable cards (not a boring settings list):

- 🎢 **New ride alerts** — "When a new coaster opens near your home parks"
- 📰 **News & rumors** — "Breaking coaster news and Screamscape updates"
- 🏆 **Community highlights** — "When your rankings or cards get attention"
- 📍 **At-the-park mode** — "Smart features when we detect you're at a park"

Each card has a toggle with a satisfying haptic tap. All default to ON — the user opts out rather than in. This screen doubles as a preview of what the app can do.

### Screen 7 — "Your rankings, your rules" (Enthusiast path only)

This screen only appears if the user selected an enthusiast-leaning option on Screen 3.

A brief, visual intro to the weighted ranking system:

- Show a sample coaster (e.g., a well-known ride) with the ranking criteria: Airtime, Intensity, Smoothness, Theming, etc.
- Let the user drag sliders to set their initial weights
- As they adjust, a sample "Top 3" list reorders in real-time to show the impact
- *"You can always change these later"* reassurance text

This is the "this app gets me" moment. Seeing the list respond to their personal preferences is an instant hook.

**If guest path:** Skip this screen entirely. The ranking system gets introduced later via contextual prompts when they first rate a coaster.

---

## Phase 3: Launch (Post-Onboarding)

### Screen 8 — "Welcome aboard" (Transition)

A quick celebratory moment — their profile card animates in with their name, photo, and home parks listed. Maybe a subtle confetti of tiny coaster silhouettes. This lasts 2-3 seconds before transitioning to the main app.

### Prompted Action — AI Import (Appears on first Home screen visit)

A dismissable but prominent card on the Home tab:

> **"Already tracking rides somewhere else?"**
> Bring your history to TrackR — upload a CSV, paste a link, or even snap screenshots. Our AI handles the rest.
>
> **[Import My Rides]**  ·  Maybe Later

Tapping "Import My Rides" opens the AI Universal Importer flow:

#### AI Universal Importer Flow

**Step 1 — Choose your source:**
- 📄 **Upload a file** (CSV, spreadsheet, text file)
- 📸 **Upload screenshots** (from Coaster-Count, CoasterStats, or any app/website)
- 🔗 **Paste a profile link** (if supported — future consideration)
- ✏️ **Manual quick-add** (search and check off coasters from a list)

**Step 2 — AI processing screen:**
A clean animation showing the AI parsing their data. Progress indicators:
- "Reading your data..."
- "Found 147 coasters..."
- "Matching to our database..."
- "Almost done..."

This is a great place for a micro-animation — maybe coaster cards flipping into a collection one by one.

**Step 3 — Review & confirm:**
Show a scrollable list of matched coasters with:
- ✅ Confident matches (auto-checked)
- ⚠️ Fuzzy matches (user confirms — "Did you mean Steel Vengeance or Steel Force?")
- ❌ Unmatched entries (user can manually search and assign)

Count summary at top: "143 matched · 3 need review · 1 not found"

**Step 4 — Import complete:**
Celebration moment — their total ride count animates up, their first anime-style coaster cards generate, and they're dropped back into the app with a populated profile.

---

## Summary Flow

```
[Pre-Auth]
  Screen 1 — Welcome + Sign Up (animation + auth buttons)
  Screen 2 — Feature carousel (optional swipe, same auth buttons)

[Auth]
  → Email/password form OR social login

[Post-Auth Setup]
  Screen 3 — "What kind of rider?" (fun experience level question)
  Screen 4 — Pick home parks
  Screen 5 — Profile setup (photo + display name)
  Screen 6 — Notification preferences
  Screen 7 — Ranking weights intro (enthusiast path only)

[Transition]
  Screen 8 — Welcome celebration

[Post-Onboarding]
  → Main app with AI Import prompt card on Home tab
```

---

## Design Principles for the Onboarding

1. **Every screen earns its place** — If it doesn't delight or improve the experience, cut it
2. **Motion is meaning** — Spring animations, haptic feedback, and micro-interactions make each tap feel premium
3. **No walls of text** — Illustrations, animations, and short labels do the heavy lifting
4. **Skippable but rewarding** — Users can skip any personalization screen, but those who engage get a noticeably better first session
5. **Consistent with the app** — Off-white canvas, soft shadows, red accents. The onboarding IS the app, not a separate experience
6. **Progressive disclosure** — Guest users see a simpler onboarding; enthusiast features reveal themselves naturally over time

---

## Open Questions

- **Tagline:** What's the one-liner for TrackR? This shows up on Screen 1 and sets the tone.
- **Rider type labels:** The 4 options on Screen 3 need wordsmithing — they should feel playful and relatable to the coaster community.
- **Import data scope:** When the AI importer pulls in ride history, should it attempt to import ride counts and ratings too, or just the coaster list? This affects the review/confirm step complexity.
- **At-the-park mode:** Referenced in notifications — is this a planned feature? If so, onboarding is a good place to request location permissions.
- **Social features:** If the Social tab gets defined, should onboarding include a "Find friends" or "Follow parks" step?