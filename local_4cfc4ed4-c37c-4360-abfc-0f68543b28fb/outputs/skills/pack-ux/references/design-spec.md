# Pack UX Design Reference

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1A1A2E` | App background |
| `--bg-surface` | `#16213E` | Card surface |
| `--bg-elevated` | `#252542` | Elevated panels |
| `--accent-primary` | `#E94560` | CTA, keep button, card glow |
| `--accent-secondary` | `#0F3460` | Category tags |
| `--accent-gold` | `#FFD700` | Streak flame, rare glow |
| `--text-primary` | `#FFFFFF` | Headings |
| `--text-secondary` | `#B0B0C8` | Body text |
| `--text-muted` | `#6B6B8D` | Metadata |
| `--border-subtle` | `#2D2D44` | Borders, dividers |

## Card Dimensions

| Context | Width | Height | Border Radius |
|---------|-------|--------|---------------|
| Mobile card | 160px | 220px | 12px |
| Desktop card | 200px | 280px | 12px |
| Summary card | 180px | 250px | 12px |

## Animation Timing Reference

| Phase | Duration | Easing | Stagger |
|-------|----------|--------|---------|
| Pack tear | 400ms | ease-out | - |
| Card fan out | 400ms | spring(260, 20) | 50ms |
| Cards settle | 400ms | spring(200, 25) | - |
| Card flip | 500ms per card | spring(260, 20) | 100ms |
| Keep micro-animation | 200ms | ease-out | - |
| Particle burst | 600ms | ease-out | random |

## Framer Motion Spring Presets

```typescript
export const springs = {
  snappy: { type: "spring", stiffness: 260, damping: 20 },
  gentle: { type: "spring", stiffness: 200, damping: 25 },
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};
```

## Mobile Swipe Configuration

```typescript
// For the horizontal card carousel on mobile
const swipeConfig = {
  drag: "x",
  dragConstraints: { left: -cardWidth * 4, right: 0 },
  dragElastic: 0.1,
  onDragEnd: (event, info) => {
    const threshold = cardWidth / 3;
    if (Math.abs(info.offset.x) > threshold) {
      // Snap to next/prev card
    }
  },
};
```

## Accessibility Notes

- Keep button must have `aria-pressed` state
- Card flip animation should respect `prefers-reduced-motion`
- Pack counter should use `aria-live="polite"` for screen reader updates
- All interactive elements need focus-visible outlines
- Card content (title, description) should be accessible even during animation
