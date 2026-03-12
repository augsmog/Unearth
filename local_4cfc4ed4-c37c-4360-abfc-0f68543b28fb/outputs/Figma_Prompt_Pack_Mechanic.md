# Figma Make Prompt: Unearth — Pack Opening Mechanic

## What is Unearth?

Unearth is a web discovery platform where users open packs of website cards to explore interesting corners of the internet. Think StumbleUpon meets trading card pack openings. Users open a pack of 5 cards, keep 2–3 favorites, and build curated boards of their best finds. The tagline is "Unearth the internet."

## What to Design

The pack-opening flow — the core interaction that makes Unearth feel like a game instead of a feed. This is 5 screens on mobile (390px) and desktop (1440px).

**Design mobile-first.** The mobile experience is the primary use case.

## Brand Direction

- **Dark theme.** Deep navy/dark backgrounds, vibrant accent pops.
- **Tone:** Playful but polished. The excitement of cracking open a booster pack meets the clean sophistication of a modern product. Not childish, not corporate.
- **The pack opening should feel tactile and rewarding** — like something physical is happening on screen. Lean into the trading card aesthetic: foil edges, subtle glow, satisfying reveals.

## Color Palette (starting point — feel free to refine)

- Background: deep navy (`#1A1A2E` range)
- Card surfaces: slightly lighter navy
- Primary accent: warm red/coral for CTAs and "kept" states
- Gold accent: for special moments (pack glow, streaks)
- Text: white primary, muted blue-gray secondary

## The 5 Screens

### Screen 1: Pack Ready
The user sees a sealed pack, centered and inviting. A button says "Open Pack." Below the button, small text shows how many packs they have left today (e.g., "2 of 3 remaining"). The pack should feel like something you want to tap — give it personality, weight, presence. Subtle idle animation is welcome (a gentle float or shimmer).

### Screen 2: Pack Opening (Transition)
The pack opens and reveals 5 cards. Design this as a storyboard of 2–3 keyframes showing the opening moment — the actual animation will be built in code. Focus on the emotional arc: anticipation → reveal → excitement. The cards should fan out or spread in a way that feels physical and satisfying.

### Screen 3: Card Selection
The 5 cards are laid out for the user to browse. Each card shows a site thumbnail, title, short description, and a category tag. There's a "keep" button on each card. The user can keep 2–3 cards — once they hit the limit, remaining cards show a disabled keep state. A counter below the cards shows "Kept 2 of 3." A confirm button activates once at least 2 cards are kept.

**Card anatomy:**
- Site screenshot/thumbnail (top ~55%)
- Category pill (overlaid on thumbnail)
- Site title (bold, 1–2 lines)
- One-line description
- Keep button (circle with + icon, transitions to checkmark when kept)

**On mobile:** Cards should be swipeable horizontally with snap points.
**On desktop:** All 5 cards visible in a row.

### Screen 4: Kept Confirmation
After confirming, show just the 2–3 kept cards with a brief celebratory moment. A board selector lets the user choose which board to save to (default: "Favorites"). Two CTAs: "Open Another Pack" (primary) and "View Collection" (secondary). A small streak counter at the bottom (e.g., "3-day streak").

### Screen 5: No Packs Remaining
Empty state when daily packs are used up. Friendly message ("All packed out for today!"), a note about when packs refresh, and CTAs to browse boards or explore public boards instead.

## Component Variants to Create

- **Card:** Default, Hover, Kept (glowing border + checkmark), Disabled, Face-Down (card back for the reveal)
- **Keep Button:** Default, Hover, Active/Kept, Disabled
- **Pack:** Sealed, Opening (mid-reveal), Empty
- **CTA Button:** Primary (filled), Secondary (outline), Disabled

## What NOT to Prescribe

I'm intentionally leaving these decisions to you:
- Exact animation choreography and timing
- Card back pattern/design
- Pack visual design (shape, texture, decorative elements)
- How the mobile swipe carousel looks and feels
- Micro-interaction details on keep/confirm
- Any delightful surprises you want to add to the opening moment

Make it feel like opening a pack of cards should feel. Exciting, a little addictive, and worth coming back for.
