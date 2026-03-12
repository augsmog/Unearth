# Figma Make Prompt: Unearth — Full Website Design

## What is Unearth?

Unearth is a web discovery platform. Users open packs of 5 website cards, keep 2–3 favorites, and build curated boards of their best finds — like Pinterest for discovering interesting websites. The product positions against algorithmic social media feeds (X, LinkedIn) and AI-generated content farms by surfacing authentic, human-made, quality websites.

**Tagline:** "Unearth the internet."
**Target audience:** Curious internet browsers who are tired of noisy feeds and AI slop. People who remember when the internet felt like a place to explore.

## Brand Direction

**Dark theme throughout.** Deep navy/midnight backgrounds with vibrant accent pops. The overall feel should be: the internet at night — calm, focused, a little magical. Like wandering through a well-curated museum after hours.

**Tone:** Playful but sophisticated. Warm but not cutesy. Think somewhere between the polish of Linear and the personality of a great indie game.

**Typography:** Clean sans-serif. Strong hierarchy — big bold headings, comfortable reading text.

**Color guidance (starting point, feel free to refine):**
- Backgrounds: deep navy range (`#1A1A2E` area)
- Card/elevated surfaces: slightly lighter
- Primary accent: warm red or coral — used for primary CTAs and the "kept" card state
- Gold: streak badges, special moments
- Text: white headings, blue-gray body, muted secondary text
- Category tags: each interest category should have its own subtle color identity

## Pages to Design

Design for mobile (390px) and desktop (1440px). Mobile-first — this is how most users will experience Unearth.

---

### 1. Landing Page (Marketing / Pre-Auth)

The first thing a new visitor sees. It needs to communicate what Unearth is and why it's different in under 5 seconds, then get them to sign up.

**Key sections:**
- **Hero:** Headline + subline + CTA ("Start Exploring" or "Open Your First Pack"). Show a visual of what the product feels like — maybe a pack mid-opening, or a hand of cards fanned out. This should feel exciting and immediately communicable.
- **How it works:** 3-step visual explanation (Open a pack → Keep your favorites → Build your collection). Keep it concise and visual.
- **What makes it different:** Brief positioning against social media feeds. "No algorithms. No infinite scroll. Just interesting websites, one pack at a time." or similar.
- **Social proof area:** Placeholder for testimonials, user count, or featured boards once the product launches.
- **Footer CTA:** Repeat the signup CTA.

**Do not** make this a long scrolling marketing page. Keep it tight — the product sells itself once people try it.

---

### 2. Onboarding: Interest Selection

First screen after signup. The user selects their interests from 18 parent categories displayed as visual tiles in a grid.

**The 18 categories (each needs an icon or illustration):**
Technology, Design & Creative, Startups & Business, Sports & Athletics, Finance & Money, Science & Nature, Arts & Expression, News & Current Events, Humor & Entertainment, Culture & Ideas, Lifestyle & Wellness, Pets & Animals, Parenting & Family, Automotive & Transport, Gaming & Interactive, Learning & Knowledge, Media & Journalism, Career & Professional

**Layout note:** With 18 tiles, the grid will scroll vertically on mobile. Ensure the first 2 rows (6 tiles) are visible on load without scrolling.

**Behavior:**
- Tiles toggle between selected/unselected with a clear visual state change
- Tapping a selected tile could expand it (inline or bottom sheet on mobile) to show 5–6 subcategory checkboxes — all checked by default, individually removable
- Minimum 3 categories selected to proceed
- A "Skip for now" option for users who want to dive right in
- CTA: "Start Discovering" — disabled until minimum selection met

**Feel:** This should feel like choosing your character class in a game, not filling out a form.

---

### 3. Discover Page (Core Experience)

This is the main screen where users open packs. **This page is covered in a separate Figma prompt** (Pack Opening Mechanic). For the full site design, just show this page in its "pack ready" state — a sealed pack centered with the "Open Pack" button — so it connects visually with the rest of the site.

---

### 4. My Boards (Collection View)

Where users see all their boards/collections. Follows the Pinterest model.

**Layout:**
- Grid of board cards, each showing: board name, number of sites saved, thumbnail mosaic (2×2 grid of site thumbnails from that board), and a public/private indicator
- A "Favorites" board always appears first (auto-created for every user)
- "Create New Board" card at the end of the grid
- On desktop: 3–4 column grid. On mobile: 2 columns.

**Empty state:** If a user has only the default Favorites board with nothing in it, show a friendly nudge: "Your boards are looking empty — open a pack to start collecting!"

---

### 5. Single Board View

Viewing one board's contents. Again, Pinterest-style.

**Layout:**
- Board title and description at top
- If public: a share link / copy URL button
- Masonry or grid of saved site cards (similar to the card component from the pack mechanic, but in a browse/view mode — no keep button, just the thumbnail, title, description, category)
- Clicking a card opens the site in a new tab
- Options to reorder, remove sites, or move to another board

---

### 6. Profile Page

The user's identity within Unearth.

**Key elements:**
- Display name and avatar
- Discovery stats: packs opened, sites kept, boards created
- Streak counter with visual indicator (flame icon or similar)
- Interest tags (their current selections, tappable to edit)
- Their public boards listed below (if any)

**Feel:** This should feel like a player profile in a game — stats, achievements, collection highlights.

---

### 7. Public Board View (Shareable)

When someone shares an Unearth board link, this is what the recipient sees. This page works without authentication.

**Layout:**
- Board title, description, and curator's display name
- The board contents in the same grid/masonry layout
- A persistent CTA bar or banner: "Like what you see? Start your own collection on Unearth" — drives signups
- Clean, minimal navigation — this is a share destination, not the full app

---

### 8. Admin Review Dashboard (Internal)

The founder's content review interface. Doesn't need to be beautiful — just functional and fast.

**Layout:**
- Queue of sites pending human review, sorted by AI quality score (highest first)
- Each item in the queue shows: site thumbnail, title, URL, quality score (1–100), AI content likelihood indicator (low/medium/high), source tag
- Quick action buttons: Approve / Reject / Skip
- Expandable detail view showing the full AI scoring breakdown by dimension
- Sidebar stats: total in pool, pending review, auto-approve rate, sites added this week

---

## Navigation

**Mobile:** Bottom tab bar with 3–4 items: Discover (pack icon), My Boards (grid icon), Profile (user icon). Keep it minimal.

**Desktop:** Left sidebar or top nav. Same core items plus the Unearth logo/wordmark.

The admin dashboard should be behind a separate route and not visible to regular users.

## Global Components

- **Site Card:** The reusable card component showing a website (thumbnail, title, description, category tag). Used in packs, boards, and search results. Design one version and show how it adapts across contexts.
- **Category Pill:** Small colored tag showing a site's category. Each of the 18 parent categories should have a subtle color association.
- **Streak Badge:** A visual indicator showing the user's current discovery streak. Should feel rewarding at higher numbers.
- **Empty States:** Design empty states for: no boards yet, empty board, no packs remaining, first-time user.

## What I'm Leaving to You

- Navigation style and placement
- Exact grid layouts and spacing
- Illustration style (if you add illustrations to the landing page or empty states)
- Motion and transition philosophy
- How the category color system works
- Any brand elements or visual motifs (geological/earth/digging imagery could tie into the "Unearth" name — or not, your call)
- Icon style
- Whether to include any gamification visuals beyond the streak (badges, milestones, etc.)

Make it feel like a place you'd want to spend 10 minutes a day discovering something new. Calm but exciting. Personal but shareable.
