---
name: nextjs-app
description: "Project-level conventions and architecture for the web discovery platform built with Next.js 14+ App Router, Supabase, Tailwind CSS, and Framer Motion. Use this skill when scaffolding new pages or components, setting up routing, configuring middleware, working with server actions, or making architectural decisions about the app structure. Also trigger for 'routing', 'layout', 'middleware', 'server component', 'server action', or general app architecture questions in the context of this project."
---

# Next.js App Architecture Skill

This skill defines the project conventions, file structure, and architectural patterns for the web discovery platform.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Animation | Framer Motion | 11.x |
| Auth & DB | Supabase | Latest |
| Hosting | Vercel | - |
| State | Zustand (for client state) | 5.x |

## Project Structure

```
project-root/
├── src/
│   ├── app/
│   │   ├── layout.tsx              (root layout: providers, fonts, dark theme)
│   │   ├── page.tsx                (landing / marketing page)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts   (OAuth callback handler)
│   │   ├── (app)/                   (authenticated app routes)
│   │   │   ├── layout.tsx           (app shell: nav, sidebar)
│   │   │   ├── discover/page.tsx    (pack opening — the core experience)
│   │   │   ├── boards/
│   │   │   │   ├── page.tsx         (all boards overview)
│   │   │   │   └── [slug]/page.tsx  (individual board view)
│   │   │   ├── onboarding/page.tsx  (interest selection)
│   │   │   └── profile/page.tsx     (user profile + stats)
│   │   ├── admin/
│   │   │   └── review/page.tsx      (content review dashboard)
│   │   ├── b/
│   │   │   └── [slug]/page.tsx      (public board view — shareable URL)
│   │   └── api/
│   │       ├── pack/
│   │       │   └── generate/route.ts (generate a pack — server-side)
│   │       └── pipeline/
│   │           ├── score/route.ts    (trigger scoring for a site)
│   │           └── fetch/route.ts    (trigger fetcher for a source)
│   ├── components/
│   │   ├── pack/                     (see pack-ux skill for details)
│   │   ├── board/
│   │   │   ├── BoardGrid.tsx
│   │   │   ├── BoardCard.tsx
│   │   │   └── AddToBoardModal.tsx
│   │   ├── onboarding/
│   │   │   └── InterestGrid.tsx
│   │   ├── ui/                       (shared UI primitives)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pill.tsx
│   │   │   └── Skeleton.tsx
│   │   └── layout/
│   │       ├── AppNav.tsx
│   │       ├── MobileNav.tsx
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             (browser Supabase client)
│   │   │   ├── server.ts             (server Supabase client)
│   │   │   └── admin.ts              (service role client for pipeline)
│   │   ├── pipeline/                  (see content-pipeline skill)
│   │   ├── pack/
│   │   │   └── generatePack.ts       (pack generation logic)
│   │   └── utils/
│   │       ├── cn.ts                  (clsx + tailwind-merge)
│   │       └── constants.ts
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useBoards.ts
│   │   └── useStreak.ts
│   ├── stores/
│   │   └── packStore.ts              (Zustand store for pack state)
│   └── types/
│       ├── database.ts               (generated Supabase types)
│       └── index.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
│   └── images/
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

## Architectural Conventions

### Server vs. Client Components

**Default to Server Components.** Only use `"use client"` when the component needs:
- Browser APIs (window, document)
- React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Framer Motion animations

**Pattern:** Server Component wrapper fetches data → passes to Client Component child for interactivity.

```tsx
// app/(app)/discover/page.tsx — Server Component
export default async function DiscoverPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getProfile(user.id);

  return <PackContainer initialInterests={profile.interests} userId={user.id} />;
}

// components/pack/PackContainer.tsx — Client Component
"use client";
export function PackContainer({ initialInterests, userId }: Props) {
  // All the interactive pack logic lives here
}
```

### Server Actions

Use Server Actions for data mutations. Define them in separate files.

```typescript
// app/(app)/discover/actions.ts
"use server";

export async function keepCards(packId: string, keptSiteIds: string[], boardId: string) {
  const supabase = await createServerSupabase();
  // Update pack with kept cards
  // Add kept sites to board
  // Update user streak
}
```

### Data Fetching

- **Server Components**: Fetch directly with Supabase server client
- **Client Components**: Use Server Actions for mutations, SWR or React Query for client-side fetching if needed
- **Real-time**: Use Supabase Realtime subscriptions only where needed (e.g., admin dashboard live updates)

### Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // 1. Refresh auth session
  // 2. Redirect unauthenticated users away from (app) routes
  // 3. Redirect authenticated users away from (auth) routes
  // 4. Protect /admin routes (check for admin role/email)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Route Groups

- `(auth)` — Login, signup, OAuth callback. No app shell.
- `(app)` — All authenticated routes. Wrapped in app shell layout with navigation.
- `admin` — Protected admin routes. Separate layout with admin nav.
- `b` — Public board views. Minimal layout, no auth required.

## Dark Theme Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // or media, depending on whether we add theme toggle
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1A1A2E',
          surface: '#16213E',
          elevated: '#252542',
        },
        accent: {
          primary: '#E94560',
          secondary: '#0F3460',
          gold: '#FFD700',
          purple: '#7B2FBE',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0C8',
          muted: '#6B6B8D',
        },
        border: {
          subtle: '#2D2D44',
        },
      },
    },
  },
};
```

Apply `bg-bg-primary text-text-primary` to the root layout body. The entire app is dark by default.

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

ANTHROPIC_API_KEY=your_claude_api_key

SCREENSHOT_API_KEY=your_screenshot_api_key
SCREENSHOT_API_URL=https://api.screenshotone.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to the client. These are server-only.

## Mobile-First Responsive Pattern

Design components mobile-first with Tailwind breakpoints:

```tsx
<div className="
  flex flex-col        {/* mobile: stack */}
  md:flex-row          {/* tablet+: side by side */}
  gap-4
  px-4 md:px-8 lg:px-16
">
```

Key breakpoints:
- Default (< 768px): Mobile layout
- `md` (768px): Tablet
- `lg` (1024px): Desktop
- `xl` (1440px): Large desktop

## Performance Considerations

- Use `next/image` for all images (including site thumbnails) with proper `width`/`height`
- Use `loading="lazy"` on below-fold content
- Pack generation should be a server action that runs at request time, not on page load
- Prefetch the next pack while the user is selecting cards from the current one
- Use Suspense boundaries with skeleton loaders for async content

## For database schema details, see the supabase-schema skill.
## For pack UX implementation details, see the pack-ux skill.
## For content pipeline details, see the content-pipeline skill.
