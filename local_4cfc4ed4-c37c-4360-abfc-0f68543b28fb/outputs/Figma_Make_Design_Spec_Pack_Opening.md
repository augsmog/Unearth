# Figma Make Design Spec: Pack Opening Mechanic

## Product Context

This is the core UX for a web discovery platform — a modern StumbleUpon that uses a trading-card pack mechanic instead of a feed. Users open packs of 5 website cards, keep 2–3 favorites, and build curated boards. The pack-opening experience is the signature interaction and must feel tactile, exciting, and premium — like opening a real pack of trading cards.

**Target platform:** Mobile-responsive web app (design mobile-first at 390px, then desktop at 1440px)
**Brand tone:** Playful but sophisticated. Dark theme with vibrant accent colors. Think: the excitement of opening a booster pack meets the clean polish of a modern SaaS product.

---

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1A1A2E` | App background |
| `--bg-surface` | `#16213E` | Card surface, modals |
| `--bg-elevated` | `#252542` | Elevated panels, sidebar |
| `--accent-primary` | `#E94560` | Primary CTA, keep button, rarity accent |
| `--accent-secondary` | `#0F3460` | Secondary elements, category tags |
| `--accent-gold` | `#FFD700` | Streak flame, rare card glow |
| `--accent-purple` | `#7B2FBE` | Legendary rarity glow |
| `--text-primary` | `#FFFFFF` | Headings, primary text |
| `--text-secondary` | `#B0B0C8` | Body text, descriptions |
| `--text-muted` | `#6B6B8D` | Metadata, timestamps |
| `--success` | `#4ADE80` | Kept card confirmation |
| `--border-subtle` | `#2D2D44` | Card borders, dividers |

## Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Display | Inter | 32px / 40px LH | 700 |
| H1 | Inter | 24px / 32px LH | 700 |
| H2 | Inter | 18px / 24px LH | 600 |
| Body | Inter | 14px / 20px LH | 400 |
| Caption | Inter | 12px / 16px LH | 500 |
| Button | Inter | 14px / 20px LH | 600 |

---

## Screen 1: Pack Ready State (Pre-Open)

### Layout (Mobile — 390px)

Full-screen view. Centered vertically and horizontally.

**Elements from top to bottom:**

1. **Header bar** (fixed top, 56px height)
   - Left: Hamburger menu icon (24px, `--text-secondary`)
   - Center: App logo/wordmark (placeholder text for now)
   - Right: User avatar circle (32px) with streak flame badge (if active)

2. **Pack counter** (centered, below header with 24px gap)
   - Text: "2 of 3 packs remaining today" in `--text-muted`, Caption style
   - 3 small dots below (8px circles): 1 filled `--accent-primary`, 2 filled `--border-subtle`

3. **Pack visual** (centered, dominant element)
   - A sealed pack rendered as a rounded rectangle (280px wide × 380px tall)
   - Background: gradient from `--bg-surface` to slightly lighter
   - Border: 2px `--border-subtle` with subtle inner glow
   - Decorative pattern on the pack face (geometric/abstract, low opacity)
   - Center icon or emblem on the pack (placeholder: compass or globe icon, 64px, `--accent-gold`)
   - Bottom of pack: "5 Sites Inside" text, Caption style, `--text-muted`
   - Subtle floating animation: pack gently bobs up and down (2px translate, 3s ease-in-out loop)

4. **Open Pack button** (centered, below pack with 32px gap)
   - Full-width (max 280px), 52px height
   - Background: `--accent-primary`
   - Text: "Open Pack" in Button style, white
   - Border-radius: 12px
   - Shadow: 0 4px 24px rgba(233, 69, 96, 0.3)

5. **Interest tags** (centered, below button with 24px gap)
   - Row of 3–4 pill-shaped tags showing the user's active interests
   - Each pill: `--bg-elevated` background, `--text-secondary` text, Caption style
   - 8px horizontal gap between pills
   - e.g., "Indie Tools", "Design", "AI", "Startups"

### Desktop (1440px)

Same layout centered in a max-width container (480px). The pack visual can be slightly larger (320px × 420px). Background can show subtle radial gradient or particle effect behind the pack.

---

## Screen 2: Pack Opening Animation (Transition)

This is the critical delight moment. Design the keyframes as separate frames in Figma — the engineering team will implement with Framer Motion.

### Animation Sequence (5 frames to design)

**Frame 1 — Pack Tear** (0ms–400ms)
- The pack splits open from the center with a diagonal tear effect
- The two halves of the pack peel away to the left and right
- A bright light/glow emanates from the center crack (`--accent-gold` glow, large blur radius)
- Cards are not yet visible — just the glow

**Frame 2 — Cards Fan Out** (400ms–800ms)
- 5 cards emerge from behind the torn pack
- Cards are initially stacked and face-down (showing card back design)
- Cards fan out in an arc pattern, evenly spaced
- Card back design: `--bg-surface` with subtle geometric pattern and a small logo watermark
- Each card: 160px wide × 220px tall (mobile), rounded corners 12px

**Frame 3 — Cards Arrange** (800ms–1200ms)
- Cards settle into their final positions
- Mobile: horizontal scrollable row with 16px gaps, cards slightly overlapping
- Desktop: 5 cards in a row with 16px gaps, all fully visible
- Cards are still face-down at this point

**Frame 4 — Cards Flip** (1200ms–2000ms)
- Cards flip over one at a time, left to right, with a 100ms stagger between each
- 3D flip animation (Y-axis rotation)
- As each card flips, its content is revealed (see Card Anatomy below)
- Subtle sparkle/shimmer effect on each card as it lands face-up

**Frame 5 — Ready State** (2000ms+)
- All 5 cards are face-up and interactable
- Transition to Screen 3 (Card Selection)

---

## Screen 3: Card Selection (Core Interaction)

### Card Anatomy (Single Card Component)

Each card is a self-contained component with these layers:

**Card container**: 160px × 220px (mobile) / 200px × 280px (desktop)
- Background: `--bg-surface`
- Border: 1px `--border-subtle`
- Border-radius: 12px
- Shadow: 0 2px 12px rgba(0, 0, 0, 0.3)
- Overflow: hidden

**Card content from top to bottom:**

1. **Site thumbnail** (top section, 100% width × 55% height)
   - Object-fit: cover
   - Placeholder: gradient rectangles with placeholder content shapes
   - Bottom edge: subtle gradient fade into card surface

2. **Category tag** (overlaid on thumbnail, top-left, 8px from edges)
   - Small pill: `--accent-secondary` background, white text
   - Caption style, 6px vertical / 10px horizontal padding
   - e.g., "Indie Tool", "Blog", "Design"

3. **Site title** (below thumbnail, 12px padding)
   - H2 style, `--text-primary`
   - Max 2 lines, ellipsis overflow
   - e.g., "Raycast — Supercharged Productivity"

4. **Site description** (below title, 4px gap)
   - Caption style, `--text-secondary`
   - Max 2 lines, ellipsis overflow
   - e.g., "A blazingly fast, totally extendable launcher for Mac"

5. **Action area** (bottom of card, 12px padding, flex row)
   - Left: "Preview" text link (Caption style, `--text-muted`, underline on hover)
   - Right: Keep button (see below)

### Keep Button States

**Default (not kept):**
- 32px × 32px circle
- Border: 2px `--border-subtle`
- Center: "+" icon (16px, `--text-muted`)
- Background: transparent

**Hover:**
- Border color transitions to `--accent-primary`
- "+" icon color transitions to `--accent-primary`
- Scale: 1.1

**Kept (selected):**
- Background: `--accent-primary`
- Border: 2px `--accent-primary`
- Center: checkmark icon (16px, white)
- Shadow: 0 0 12px rgba(233, 69, 96, 0.4)
- The entire card gets a subtle glow border (2px `--accent-primary` with 0.3 opacity shadow)

**Disabled (keep limit reached, this card not selected):**
- Opacity: 0.5 on the "+" icon
- Border: 2px `--border-subtle` (no change)
- Cursor: not-allowed

### Card Selection Layout (Mobile — 390px)

**Horizontal scrollable row:**
- Cards overlap slightly (showing ~80% of each card)
- Active/center card is fully visible and slightly larger (scale 1.05)
- Swipe left/right to browse cards
- Dot indicators below the card row (5 dots, active dot is `--accent-primary`)
- 16px horizontal padding on container

**Below the card row (24px gap):**

1. **Keep counter**
   - Text: "Kept 1 of 3" in Body style, `--text-secondary`
   - Visual: 3 small circles in a row (12px each)
     - Filled circles = slots used (`--accent-primary`)
     - Empty circles = slots remaining (`--border-subtle`)
     - Slight pulse animation on the next empty circle

2. **Confirm button** (appears after at least 2 cards are kept)
   - Full-width (max 340px), 52px height
   - Background: `--accent-primary`
   - Text: "Add to Collection" in Button style, white
   - Border-radius: 12px
   - If fewer than 2 kept: button shows "Keep at least 2" in `--text-muted`, disabled state

3. **Skip remaining button** (below confirm, 12px gap)
   - Text only: "Skip remaining" in Caption style, `--text-muted`
   - Underline on hover

### Card Selection Layout (Desktop — 1440px)

**Horizontal row, all cards visible:**
- 5 cards in a row, 16px gaps
- Max container width: 1080px, centered
- Cards are all the same size (200px × 280px)
- Hover state on cards: slight lift (translateY -4px) and increased shadow
- Clicking a card toggles its kept state

**Below the row:**
- Keep counter centered
- Confirm button centered (max-width 320px)

---

## Screen 4: Card Kept Confirmation (Micro-interaction)

When a card is kept, design a quick celebratory micro-animation:

- Card briefly scales to 1.08 and back to 1.0 (200ms ease-out)
- A ring of small particles/confetti bursts from the card (subtle, 4–6 particles)
- The card's border transitions to `--accent-primary` with a glow
- The keep counter updates with a slight bounce animation
- Sound cue placeholder: design a small speaker icon that indicates audio feedback exists

---

## Screen 5: Post-Pack Summary

After the user confirms their selections, show a summary before returning to the main state.

### Layout (Mobile — 390px)

1. **Header text** (centered, 24px from top of content area)
   - "Nice finds!" in Display style, `--text-primary`
   - Below: "Added to your collection" in Body style, `--text-secondary`

2. **Kept cards** (horizontal row, centered, 24px gap from text)
   - Show only the 2–3 kept cards at slightly larger size (180px × 250px)
   - Cards have the kept glow state (accent border + shadow)
   - Subtle entrance animation: cards slide up and fade in with stagger

3. **Board selector** (below cards, 24px gap)
   - Dropdown or bottom sheet: "Save to: Favorites ▾"
   - Default board is "Favorites"
   - Tapping opens a list of user's boards with option to "Create new board"

4. **Action buttons** (below board selector, 24px gap)
   - Primary: "Open Another Pack" — full width, `--accent-primary`, 52px height
   - Secondary: "View Collection" — text button, `--text-muted`

5. **Stats nudge** (bottom of screen, 16px from bottom)
   - Small text: "🔥 3-day streak! You've discovered 47 sites" in Caption style, `--text-muted`

---

## Screen 6: Empty State (No Packs Remaining)

### Layout (Mobile — 390px)

1. **Illustration area** (centered, large)
   - Empty pack illustration or an hourglass icon (64px, `--text-muted`)
   - Gentle floating animation

2. **Text** (centered below)
   - "All packed out for today!" in H1 style, `--text-primary`
   - "Your packs refresh tomorrow at midnight" in Body style, `--text-secondary`

3. **Alternative actions**
   - "Browse your boards" — primary button style
   - "Explore public boards" — secondary text link

---

## Component Library (Reusable Components to Design)

Please create these as Figma components with variants:

### 1. Card Component
**Variants:** Default, Hover, Kept, Disabled, Face-Down (card back)
**Props:** thumbnail (image), title (text), description (text), category (text)

### 2. Keep Button
**Variants:** Default, Hover, Active/Kept, Disabled

### 3. Pack Visual
**Variants:** Sealed, Opening (mid-tear), Empty

### 4. Interest Pill Tag
**Variants:** Default, Selected, Muted
**Props:** label (text)

### 5. Counter Dots
**Variants:** Configurable count (3–5), fill state per dot

### 6. CTA Button
**Variants:** Primary (filled), Secondary (outline), Disabled, Text-only
**Props:** label (text), icon (optional)

### 7. Streak Badge
**Variants:** Active (with flame), Inactive
**Props:** count (number)

---

## Spacing & Layout Tokens

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-full` | 9999px |

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | 390px | Single-column, swipeable cards, touch-first |
| Tablet | 768px | Cards slightly larger, still scrollable |
| Desktop | 1024px+ | All cards visible in row, hover states active |
| Large desktop | 1440px | Max container width, generous spacing |

---

## Interaction Notes for Engineering Handoff

- **Pack opening animation** will be built with Framer Motion (React). Design the keyframes as static frames — engineers will interpolate.
- **Card flip** is a 3D CSS/Framer Motion transform on the Y-axis. Design both the front (content) and back (pattern) of each card.
- **Swipe on mobile** uses a horizontally-scrollable container with snap points. Framer Motion `drag` prop handles the physics.
- **Keep limit enforcement** is handled in state — when 3 cards are kept, remaining unkept cards show disabled state. User can un-keep a card to free a slot.
- **Haptic feedback** (on mobile): trigger on keep action and pack open. Not a design deliverable but note it for engineering.

---

## Deliverables Checklist

- [ ] All 6 screens designed at 390px (mobile) and 1440px (desktop)
- [ ] Component library with all variants listed above
- [ ] 5-frame animation storyboard for pack opening sequence
- [ ] Card component with all 5 variant states
- [ ] Color and typography tokens as Figma styles/variables
- [ ] Auto-layout on all components for responsive behavior
- [ ] Prototype linking screens 1 → 2 → 3 → 4 → 5 with appropriate transitions
