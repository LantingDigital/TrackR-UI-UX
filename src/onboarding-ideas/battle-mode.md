---

# TrackR Feature Brief: Battle Mode

## What This Is

Battle Mode is a new core feature for TrackR that serves **two purposes**: it's the primary way the app learns what a user cares about in a roller coaster, and it's a fun, game-like experience that keeps users engaged long-term.

At its simplest, the app shows the user two roller coasters and asks them to express a preference. But instead of just picking one, the user can respond on a **spectrum**:

- Strongly prefer one
- Slightly prefer one
- Say they're equal
- Say both are amazing
- Say neither is great for a specific quality
- Say they haven't ridden one of them

The app collects these responses over time and uses the pattern of choices to figure out what ride characteristics matter most to that specific user. Then it uses that knowledge to generate **personalized coaster rankings** and eventually **pre-fill suggested ratings** when the user logs a ride.

## Where It Lives In The App

Battle Mode is not a separate section tucked away somewhere. It's **central to the user's profile setup** and should be accessible from the main app experience.

When a new user signs up, their profile is incomplete. Battle Mode is how they build it. The home screen should prominently display a **profile completion card** showing their progress. Tapping it opens Battle Mode. They can do as many or as few battles as they want in a sitting, take a break, and come back later. The progress bar fills over days or weeks as they play.

Once their profile reaches full completion, Battle Mode doesn't disappear. It transforms into a casual **"Quick Battle"** feature they can access anytime for fun. Data from these casual battles still quietly refines their profile in the background.

## How It Works From The User's Perspective

### Step 1: Pick Your Criteria

Before any battles happen, the user picks the **10 ride characteristics** that matter most to them out of a larger list of about 20 options. Things like:

- Airtime quality
- Intensity
- Smoothness
- Theming
- Pacing
- Uniqueness

This tells the app which dimensions to pay attention to when analyzing their battle choices.

### Step 2: Battle

The user is shown two coasters. Sometimes the app just asks "Which would you rather ride?" and sometimes it asks about a specific characteristic like "Which has better airtime?" or "Which is smoother?"

The user responds on a **graduated scale** rather than a binary pick:

- Strongly prefer one
- Slightly prefer one
- Call it a tie
- Say both are amazing for that quality
- Say neither is great for that quality
- Skip if they haven't ridden one of the rides

The app decides when to stop based on how **confident** it is that it understands the user's preferences — similar to how Akinator knows when it has enough information to guess your character. Some users will reach that confidence threshold in 20 battles, others might take 40 or more depending on how decisive and consistent their answers are.

If the user sees their results and feels like the app got it wrong, they can tell it to keep going. The app then enters a **refinement phase** where it asks more targeted questions to fix the weak spots.

### Step 3: Results

When the app feels confident, it presents the user with three things:

1. **Criteria weights** — a breakdown of their inferred criteria weights showing what matters most to them and by how much
2. **Personalized ranking** — all coasters sorted by how well each one matches their specific taste
3. **Preference insights** — manufacturer biases, near-ties between rides, and which criteria they tend to evaluate as a group

The user can react to individual coasters in the ranking by flagging them as feeling too high or too low, which feeds back into future refinement.

## What The App Tracks Behind The Scenes

Beyond the obvious choice data, the app silently collects **behavioral signals** that make the profile more accurate:

- **Response time** — how quickly the user responds to each battle, which indicates conviction versus uncertainty
- **Contradictions** — whether they contradict themselves across battles, which reveals genuine near-ties or fuzzy memory
- **Fatigue detection** — whether their response quality declines over a long session, indicating fatigue
- **Matchup balance** — whether one coaster is dominating battles and needs tougher opponents
- **Brand affinity** — whether the user consistently favors a specific manufacturer or ride type across all battles
- **Prediction surprises** — whether the user's choice surprises the algorithm's prediction, which reveals blind spots
- **Criteria clustering** — which criteria the user seems to evaluate as a package deal rather than independently
- **Bucket list** — which coasters the user hasn't ridden, which builds a bucket list

All of this metadata refines the profile beyond what the explicit responses alone can tell the app.

## How It Connects To The Rest Of TrackR

The profile that Battle Mode builds is not just for show. It feeds directly into the **ride logging experience**. When a user goes to log a ride, instead of filling in ratings from scratch, the app can **pre-fill suggested scores** based on what it knows about their preferences from Battle Mode. The user adjusts whatever feels off, confirms, and moves on. The gap between what the app suggested and what the user actually set becomes additional data that further refines their profile over time.

This creates a **self-improving loop**:

1. Battles build the initial profile
2. The profile generates predictions for ride logging
3. The user's corrections during logging refine the profile
4. The refined profile makes better predictions next time

The profile is a living thing that gets smarter the more the user interacts with the app, without ever requiring them to redo the onboarding.

## What Needs To Exist First

Battle Mode depends on having **baseline data** about roller coasters — not just factual specs like height and speed, but **community-derived sentiment scores** across the criteria categories. Without knowing that Steel Vengeance is widely considered a 10/10 for airtime and VelociCoaster is known for its inversions, the app can't create meaningful matchups or infer anything useful from the user's choices.

This baseline data is being built separately through a **scraping and aggregation pipeline** across community sources. Battle Mode should be designed to work with whatever subset of that data is available, gracefully handling coasters that have incomplete profiles.

## Priority

Battle Mode is **not a side feature**. It's the engine that powers personalization across the entire app. Without it, ride logging is manual, rankings are generic, and there's no reason for the app to feel smarter than a spreadsheet. With it, every interaction teaches the app something new about the user, and the experience gets better the more they use it.
