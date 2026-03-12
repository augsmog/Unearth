---
name: pack-ux
description: "Implements the trading-card pack opening mechanic — the core UX of the web discovery platform. Use this skill whenever working on pack opening animations, card components, card selection logic, keep/pass interactions, the card fan-out layout, the keep counter, or any Framer Motion animation related to the discovery experience. Also trigger when the user mentions 'cards', 'packs', 'keep', 'open pack', 'card flip', or 'discovery UX', even if they don't explicitly name this skill."
---

# Pack Opening UX Skill

This skill covers the implementation of the pack-opening mechanic — a trading-card inspired discovery experience built with Next.js, Framer Motion, and Tailwind CSS.

## Core Mechanic

Users open packs of 5 website cards, keep 2–3 favorites, and pass the rest. Both keep and pass actions generate preference signals for the recommendation engine.

## Tech Stack for This Feature

- **React** (Next.js App Router) for component structure
- **Framer Motion** for all animations (pack tear, card fan, card flip, micro-interactions)
- **Tailwind CSS** for styling (dark theme, mobile-first)
- **Zustand or React Context** for pack state management

## Animation Sequence

The pack opening has 5 phases. Each must feel premium and tactile — never cheap or janky.

### Phase 1: Pack Tear (0–400ms)
The sealed pack splits open from center. Use Framer Motion `variants` with a spring transition. A radial glow (`--accent-gold`) emanates from the center. Use `box-shadow` animation or a pseudo-element with `opacity` transition.

### Phase 2: Cards Fan Out (400–800ms)
5 cards emerge from behind the torn pack, fanning into an arc. Use `AnimatePresence` with staggered `initial`/`animate` on each card. Cards start stacked at center, translate to their arc position with rotation.

```tsx
// Arc positioning for 5 cards
const cardPositions = [
  { x: -120, rotate: -8 },
  { x: -60, rotate: -4 },
  { x: 0, rotate: 0 },
  { x: 60, rotate: 4 },
  { x: 120, rotate: 8 },
];
```

### Phase 3: Cards Settle (800–1200ms)
Cards transition from arc to their final layout positions (horizontal scroll on mobile, row on desktop). Use `layout` prop on Framer Motion for smooth layout transitions.

### Phase 4: Card Flip (1200–2000ms)
Cards flip face-up one at a time with 100ms stagger. This is a 3D Y-axis rotation.

```tsx
// Card flip using Framer Motion
<motion.div
  style={{ perspective: 1000 }}
>
  <motion.div
    animate={{ rotateY: isFlipped ? 0 : 180 }}
    transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
    style={{ transformStyle: "preserve-3d" }}
  >
    {/* Front face */}
    <div style={{ backfaceVisibility: "hidden" }}>
      <CardFront site={site} />
    </div>
    {/* Back face */}
    <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
      <CardBack />
    </div>
  </motion.div>
</motion.div>
```

### Phase 5: Ready State
All cards face-up, interactive. Keep buttons visible. The phase transitions are complete.

## Card Component Structure

```
CardComponent
├── CardBack (geometric pattern, logo watermark)
├── CardFront
│   ├── SiteThumbnail (screenshot image, object-cover)
│   ├── CategoryTag (pill overlay, top-left)
│   ├── SiteTitle (max 2 lines, ellipsis)
│   ├── SiteDescription (max 2 lines, ellipsis)
│   └── ActionArea
│       ├── PreviewLink (opens site in new tab)
│       └── KeepButton (circle, toggles kept state)
```

### Keep Button States
- **Default**: transparent bg, subtle border, "+" icon
- **Hover**: border and icon transition to `--accent-primary`
- **Kept**: filled `--accent-primary`, checkmark icon, card gets glow border
- **Disabled**: 50% opacity when keep limit reached (3 cards already kept)

## State Management

```typescript
type PackPhase = 'ready' | 'opening' | 'selecting' | 'summary' | 'empty' | 'rabbit_hole';

interface PackState {
  packId: string;
  sites: Site[];           // 5 sites in this pack
  keptSiteIds: Set<string>; // which sites the user has kept
  maxKeep: number;          // 3
  minKeep: number;          // 2
  phase: PackPhase;

  // Rabbit hole state (Phase 1.5)
  rabbitHoleId: string | null;
  rabbitHoleDepth: number;
  rabbitHoleTheme: string | null;
  currentSite: Site | null;
  nextSite: Site | null;
  branchOptions: Site[];
  entryPoints: RabbitHoleEntry[];
}
```

### Rabbit Hole Actions (Phase 1.5)

```typescript
// Actions added to the Zustand store
loadEntryPoints: (entries: RabbitHoleEntry[]) => void;
startRabbitHole: (id: string, theme: string, currentSite: Site, nextSite: Site, branches: Site[]) => void;
advanceChain: (nextSite: Site, newNext: Site | null, branches: Site[]) => void;
followBranch: (branchSite: Site, newNext: Site | null, branches: Site[]) => void;
exitRabbitHole: () => void;
```

Key rules:
- User can keep between 2 and 3 cards (configurable)
- User can toggle a kept card back to unkept (frees a slot)
- "Confirm" button only activates when minKeep threshold is met
- Both kept and passed cards are recorded in the `packs` table for recommendation learning

## Keep Confirmation Micro-interaction
When a card is kept:
1. Card scales to 1.08 then back to 1.0 (200ms spring)
2. Small particle burst from the card center (4–6 dots, random directions, fade out)
3. Card border transitions to `--accent-primary` with glow shadow
4. Keep counter updates with bounce animation

## Mobile Considerations
- Cards in a horizontally scrollable container with CSS `scroll-snap-type: x mandatory`
- Active card is slightly scaled up (1.05)
- Swipe gestures via Framer Motion `drag="x"` with `dragConstraints`
- Dot indicators below the card row for position awareness
- Touch target for keep button should be at least 44px × 44px

## File Organization

```
src/
├── app/(app)/discover/
│   ├── page.tsx                    (discover route)
│   ├── PackContainer.tsx           (orchestrates pack + rabbit hole phases)
│   ├── actions.ts                  (server actions: generatePack, keepCards, rabbit hole actions)
│   └── views/
│       ├── PackReadyView.tsx       (sealed pack + rabbit hole entry points)
│       ├── PackOpeningView.tsx     (pack tear animation)
│       ├── CardSelectionView.tsx   (keep/pass selection)
│       ├── PostPackSummaryView.tsx (summary + "Dive Deeper" CTA)
│       └── EmptyStateView.tsx     (daily limit reached)
├── components/
│   ├── pack/
│   │   ├── SealedPack.tsx         (pre-open visual)
│   │   ├── WebsiteCard.tsx        (card with flip)
│   │   ├── ParticleBurst.tsx      (keep confirmation effect)
│   │   ├── CounterDots.tsx        (keep counter)
│   │   └── InterestPill.tsx       (interest category pill)
│   └── rabbit-hole/               (Phase 1.5)
│       ├── RabbitHoleReadyView.tsx (entry point cards on ready phase)
│       ├── RabbitHoleView.tsx      (main browsing: current site, next, branches)
│       └── RabbitHoleSummary.tsx   (end-of-session summary)
├── stores/
│   └── packStore.ts               (Zustand with sessionStorage persistence)
```

## Rabbit Hole UX (Phase 1.5)

The rabbit hole phase is a chained site discovery mode alongside the pack mechanic.

### Entry Points
On the "ready" phase, below the "Open Pack" button, 3-5 entry point cards are shown. Each displays: lead site thumbnail, theme label ("Weird Science", "Internet Archaeology"), depth preview, and category chip.

### Main Browsing View
- Top: current site as full-width rich preview (screenshot, description, tags, visit button, save button)
- Below: next chained site as medium card (tap to advance)
- 1-2 branch options as compact cards ("Or explore this tangent...")
- Depth indicator ("4 sites deep into Weird Science")
- "Open a Pack" button to reset
- At depth 10+: milestone celebration + reset suggestion

### Dive Deeper CTA
In PostPackSummaryView, each kept site shows a "Dive deeper into [Category]" button that starts a rabbit hole seeded from that site.

## For more detailed design specifications, see [references/design-spec.md](references/design-spec.md)
