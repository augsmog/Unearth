# Unearth — Build Progress

## Status: Phase 1.5 (Rabbit Hole Engine) Complete — Ready for E2E Testing
Last updated: 2026-03-11

## Phase 1 — MVP (Complete)
- [x] Next.js 16 project scaffolding + dependency installation
- [x] Design system port (theme.css → globals.css, Inter + Rajdhani fonts)
- [x] File structure + 47 shadcn/ui components copied
- [x] Supabase clients (browser, server, admin) + middleware
- [x] Database migrations (4 SQL files: schema, RLS, triggers, seed interests)
- [x] Auth flow: login, signup (email/password + Google OAuth + magic link), callback
- [x] Pack components: SealedPack, WebsiteCard, ParticleBurst, CounterDots, InterestPill
- [x] Zustand pack store with sessionStorage persistence
- [x] Discover page — single-page state machine (ready→opening→selecting→summary→empty)
- [x] Pack opening animation (7-phase: shake→tilt→burst→cards-fly→settle→flip→complete)
- [x] Card selection view with keep/pass, particle burst, counter dots
- [x] Onboarding page — 18-category interest grid with subcategory expansion
- [x] Boards pages — grid list + single board masonry view
- [x] Profile page — avatar, stats, streak, interests, sign out
- [x] Landing page — animated hero pack, how-it-works, positioning, CTA
- [x] Public board view (`/b/[slug]`) — no auth required, signup CTA
- [x] Content pipeline: 4 fetchers (HN, Product Hunt, GitHub Trending, RSS)
- [x] AI scorer (Claude API, 6 weighted dimensions)
- [x] Decision router (auto-approve ≥85, review 30-84, reject <30)
- [x] Metadata tagger + screenshot capture (Playwright)
- [x] Admin review dashboard with keyboard shortcuts, score breakdown, stats
- [x] API routes: /api/pipeline/fetch, /score, /screenshot
- [x] n8n workflow setup script (5 workflows: 4 fetcher crons + scoring pipeline)
- [x] AppNav (desktop) + MobileNav (bottom bar) layout components
- [x] Build passes: all 14 routes compile successfully

## Phase 1.5 — Rabbit Hole Engine (Code Complete)
- [x] Database migration 006_rabbit_hole_engine.sql (site_edges, rabbit_holes, user_format_preferences + new site/pack columns)
- [x] AI scorer updated to 7-dimension model (added cold_open_quality at 11%, revised all weights)
- [x] Metadata tagger updated with adjacency_tags generation (5-15 tags per site)
- [x] Edge generator module (tag overlap computation, bidirectional weighted edges)
- [x] Edge generator integrated into decision router (runs after tagger on auto-approve)
- [x] TypeScript types extended (EngagementFormat, SiteEdge, RabbitHole, UserFormatPreference, ChainResult)
- [x] Rabbit hole engine (generateEntryPoints, startRabbitHole, getNextInChain, recordBranch, endRabbitHole)
- [x] Format affinity updater (keep/pass/follow/abandon actions with asymptotic approach/decay)
- [x] Zustand pack store extended with rabbit_hole phase + state + actions
- [x] 6 new server actions (fetchEntryPoints, startRabbitHoleAction, advanceRabbitHole, branchRabbitHole, saveFromRabbitHole, endRabbitHole)
- [x] Format affinity integrated into existing keepCards action
- [x] RabbitHoleReadyView — entry point cards on ready phase
- [x] RabbitHoleView — main browsing (current site, next chain, branch options, depth indicator)
- [x] RabbitHoleSummary — end-of-session stats and CTAs
- [x] PackContainer updated with rabbit_hole phase + entry point loading
- [x] PostPackSummaryView updated with "Dive Deeper" CTA per kept site
- [x] Re-scoring script created (scripts/rescore-sites.ts)
- [x] Skill files updated (content-pipeline, supabase-schema, pack-ux)
- [x] Build passes: all 14 routes compile successfully

## Anonymous Exploration + Unlimited Packs (Complete)
- [x] Middleware updated: /discover accessible without auth
- [x] Supabase anonymous auth: auto-signs in anonymous visitors (requires enabling in Supabase Dashboard)
- [x] App layout handles anonymous users (minimal shell, no profile fetch)
- [x] AppNav/MobileNav show "Sign Up" CTA for anonymous users (hide Boards/Profile)
- [x] Discover page works for anonymous users (no interests/streak, auto sign-in client-side)
- [x] Server actions: anonymous users can open packs + rabbit holes, skip board saves/streaks/stats
- [x] RabbitHoleView: "Sign up to save" shown instead of Save button for anonymous users
- [x] PackContainer: SignUpBanner shown on ready/summary/rabbit-hole-end for anonymous users
- [x] Landing page CTAs ("Get Started", "Start Exploring") link to /discover instead of /signup
- [x] Daily pack limit removed for all users (unlimited packs, monetization deferred)
- [x] Build passes: all 14 routes compile successfully

## In-App Site Preview + Screenshots (Complete)
- [x] SitePreviewModal: full-screen overlay with iframe embed, screenshot fallback, Keep/Save button, "New Tab" escape hatch
- [x] WebsiteCard: thumbnail + "Preview Site" open SitePreviewModal instead of new tab
- [x] RabbitHoleView: "Preview Site" button + clickable screenshot open SitePreviewModal
- [x] CardSelectionView: wired up preview modal with Keep toggle from within preview
- [x] Minimum keep requirement removed (can keep 0-3, "Skip this pack" when 0)
- [x] Batch screenshot script: `scripts/capture-screenshots.ts` (Playwright → Supabase Storage → thumbnail_url)
- [x] Build passes: all 14 routes compile successfully

## Completed Setup
- [x] Supabase project created, credentials in `.env.local`
- [x] All 4 MVP migrations run (schema, RLS, triggers, seed interests)
- [x] Google OAuth configured in Supabase
- [x] Anthropic API key added
- [x] Pipeline API key generated
- [x] Admin email set (jones.augie1@gmail.com)
- [x] Playwright installed
- [x] 60 hand-picked websites seed SQL created (005_seed_websites.sql)
- [x] Dev server running, all routes responding correctly
- [x] Middleware auth redirects verified working

## Remaining
- [x] Run `005_seed_websites.sql` in Supabase SQL Editor — 60 sites seeded
- [x] Run `006_rabbit_hole_engine.sql` in Supabase SQL Editor — tables + RLS created
- [x] Create `screenshots` storage bucket in Supabase (public)
- [x] Run `npx tsx scripts/rescore-sites.ts` — 60/60 scored, 60/60 tagged, 268 edges (536 bidirectional), 0 failures
- [ ] Enable anonymous sign-ins in Supabase Dashboard (Authentication → Settings)
- [ ] Full end-to-end test (anonymous → discover → rabbit hole, then signup → onboarding → discover → boards)
- [ ] Configure n8n on Render (provide N8N_BASE_URL + N8N_API_KEY)
- [ ] Deploy to Vercel

## Build Output (14 Routes)
| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing page |
| `/login` | Static | Email/password + OAuth + magic link |
| `/signup` | Static | Registration |
| `/callback` | Dynamic | OAuth code exchange |
| `/discover` | Dynamic | Core pack + rabbit hole experience (state machine) |
| `/onboarding` | Dynamic | Interest selection (18 categories) |
| `/boards` | Dynamic | Board grid list |
| `/boards/[slug]` | Dynamic | Single board masonry view |
| `/profile` | Dynamic | User profile + stats |
| `/b/[slug]` | Dynamic | Public board (no auth) |
| `/admin/review` | Dynamic | Content review dashboard |
| `/api/pipeline/*` | Dynamic | 3 pipeline API routes |

## Key Architecture Decisions
- Pack experience is single-page state machine at /discover (not multiple routes)
- Rabbit hole engine adds `rabbit_hole` phase to the same state machine
- Zustand store replaces React Router location.state for pack flow
- Site adjacency graph uses directed weighted edges (site_edges table)
- Chain algorithm: `chain_score = 0.4×edge_weight + 0.3×interest_match + 0.2×format_affinity + 0.1×novelty_bonus`
- Depth-adjusted thresholds: 1-3 ≥0.6, 4-6 ≥0.4, 7-10 ≥0.2, 10+ suggest reset
- Format affinity model: per-user, per-category engagement format preferences
- n8n on Render (Autumn8 pattern: webhook-triggered, no creds in n8n)
- Screenshots via self-hosted Playwright (jpeg, 1280x720)
- Supabase for auth + PostgreSQL + storage
- Tailwind CSS v4 with @theme inline + custom design tokens
- shadcn/ui components included but currently unused (custom UI used instead)

## File Structure
```
src/
├── app/
│   ├── (app)/         discover, boards, profile, onboarding (auth required)
│   ├── (auth)/        login, signup, callback
│   ├── admin/review/  content review dashboard
│   ├── api/pipeline/  fetch, score, screenshot routes
│   ├── b/[slug]/      public board view
│   ├── layout.tsx     root layout (fonts, dark theme)
│   └── page.tsx       landing page
├── components/
│   ├── board/         BoardGrid, BoardView
│   ├── landing/       LandingHero
│   ├── layout/        AppShell, AppNav, MobileNav
│   ├── pack/          SealedPack, WebsiteCard, ParticleBurst, CounterDots, InterestPill
│   ├── rabbit-hole/   RabbitHoleReadyView, RabbitHoleView, RabbitHoleSummary
│   └── ui/            47 shadcn/ui components
├── hooks/             useUser
├── lib/
│   ├── pipeline/      fetchers/, scorer, tagger, router, edgeGenerator, screenshot
│   ├── rabbitHole/    engine, formatAffinity
│   ├── supabase/      client, server, admin
│   └── utils/         cn
├── stores/            packStore (Zustand)
└── types/             database types, pipeline types
scripts/
└── rescore-sites.ts   Re-score existing sites with new Phase 1.5 fields
```
