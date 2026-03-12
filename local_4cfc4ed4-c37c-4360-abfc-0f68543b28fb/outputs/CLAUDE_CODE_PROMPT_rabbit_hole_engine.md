# Claude Code Implementation Prompt: Rabbit Hole Engine (Phase 1.5)

**Context:** Unearth is a web discovery platform with a pack-opening mechanic. The MVP is built (Next.js 16, Supabase, Zustand, Tailwind v4). See `PROGRESS.md` for current status. All 14 routes compile. The database has 5 migrations (001–005) and 60 seed sites.

**Reference specs** (read these first):
- `local_4cfc4ed4-c37c-4360-abfc-0f68543b28fb/outputs/Unearth_Architecture_Addendum_Rabbit_Hole.docx` — full schema, scoring, and engine design
- `local_4cfc4ed4-c37c-4360-abfc-0f68543b28fb/outputs/Unearth_Discord_Activity_Spec_v3.docx` — strategic context

**Goal:** Implement the rabbit hole engine as Phase 1.5 — the bridge between the current pack-only MVP and eventual Discord Activity support. This adds chained discovery, site adjacency, and the foundation for personalization. Do NOT build the Discord Activity itself — that's Phase 2.

---

## Task 1: Database Migration (006_rabbit_hole_engine.sql)

Create `supabase/006_rabbit_hole_engine.sql` with:

### New columns on `sites` table:
```sql
ALTER TABLE sites ADD COLUMN IF NOT EXISTS adjacency_tags TEXT[] DEFAULT '{}';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS cold_open_score INTEGER;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS engagement_format TEXT; -- 'instant' | 'visual' | 'read-short' | 'read-long' | 'tool' | 'explore'
ALTER TABLE sites ADD COLUMN IF NOT EXISTS rabbit_hole_depth_potential INTEGER DEFAULT 1; -- 1-5
```

### New table `site_edges`:
```sql
CREATE TABLE site_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  target_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL, -- 'topic' | 'vibe' | 'format' | 'creator' | 'audience'
  weight FLOAT DEFAULT 1.0, -- 0.0–1.0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_site_id, target_site_id, edge_type)
);

CREATE INDEX idx_site_edges_source ON site_edges(source_site_id);
CREATE INDEX idx_site_edges_source_weight ON site_edges(source_site_id, weight DESC);
CREATE INDEX idx_sites_adjacency_tags ON sites USING GIN(adjacency_tags);
```

### New table `rabbit_holes`:
```sql
CREATE TABLE rabbit_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entry_site_id UUID NOT NULL REFERENCES sites(id),
  entry_category TEXT,
  site_sequence UUID[] DEFAULT '{}',
  branch_points JSONB DEFAULT '[]',
  max_depth INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  source TEXT DEFAULT 'solo' -- 'solo' | 'discord'
);

CREATE INDEX idx_rabbit_holes_user ON rabbit_holes(user_id);
```

### Extended `packs` table:
```sql
ALTER TABLE packs ADD COLUMN IF NOT EXISTS rabbit_hole_id UUID REFERENCES rabbit_holes(id);
ALTER TABLE packs ADD COLUMN IF NOT EXISTS pack_type TEXT DEFAULT 'standard'; -- 'standard' | 'reset' | 'entry'
```

### New table `user_format_preferences`:
```sql
CREATE TABLE user_format_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_slug TEXT NOT NULL,
  format_scores JSONB NOT NULL DEFAULT '{}', -- {format: affinity_score}
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_slug)
);
```

### RLS policies:
- `rabbit_holes`: Users can SELECT/INSERT/UPDATE their own. Service role can do all.
- `site_edges`: All authenticated users can SELECT. Service role can INSERT/UPDATE/DELETE.
- `user_format_preferences`: Users can SELECT/INSERT/UPDATE their own.

---

## Task 2: Scorer Update (src/lib/pipeline/scorer.ts)

Add `cold_open_quality` as the 7th scoring dimension.

**In the DIMENSION_WEIGHTS constant**, revise to:
```typescript
const DIMENSION_WEIGHTS: Record<string, number> = {
  content_originality: 0.22,
  human_presence: 0.18,
  content_depth: 0.18,
  design_quality: 0.13,
  domain_signals: 0.09,
  uniqueness: 0.09,
  cold_open_quality: 0.11,
};
```

**In the Claude prompt** within the `scoreSite` function, add this dimension to the instruction:

```
7. cold_open_quality (1-100): How immediately engaging is this site for a first-time visitor who lands on it with zero context? Score 90+ for sites that deliver value within 3 seconds (interactive toys, auto-playing visualizations, playable games). Score 70-89 for sites engaging within 10 seconds (clear visual hook, obvious interaction). Score 50-69 for sites needing 30+ seconds of orientation. Score 30-49 for sites requiring significant reading commitment. Score 1-29 for sites needing deep navigation, account creation, or prior context.
```

**Also extend the response schema** to include `cold_open_quality` in the dimensions object and add two new fields to the structured output:
```typescript
engagement_format: "instant" | "visual" | "read-short" | "read-long" | "tool" | "explore";
rabbit_hole_depth_potential: number; // 1-5
```

The scorer should persist these values to the `sites` table alongside the existing fields.

**Important:** The overall `quality_score` uses the revised 7-dimension weights. But `cold_open_score` is ALSO stored separately on the site row (it's used independently by the rabbit hole engine for format matching). A brilliant essay with cold_open_score 35 can still have quality_score 90+.

---

## Task 3: Tagger Update (src/lib/pipeline/tagger.ts)

Extend the tagger to also generate `adjacency_tags`. Add to the Claude prompt:

```
Additionally, generate 5-15 adjacency_tags. These describe what this site is ADJACENT TO — not what it IS. Answer: "If someone liked this site, what other TOPICS, VIBES, or AUDIENCE TYPES would they also be interested in?"

Example: A site about neural network visualizations might have:
- tags: ['neural-networks', 'machine-learning', 'visualization']
- adjacency_tags: ['creative-coding', 'data-art', 'ai-research', 'computational-creativity', 'mathematics', 'generative-art', 'python-ecosystem']
```

Update the `TaggingResult` interface to include `adjacencyTags: string[]`.

After tagging, persist `adjacency_tags` to the sites table.

---

## Task 4: Edge Generator (NEW: src/lib/pipeline/edgeGenerator.ts)

Create a new pipeline module that builds the site adjacency graph.

```typescript
// Called after a site is approved and tagged
export async function generateEdges(siteId: string): Promise<void>
```

**Logic:**
1. Fetch the newly approved site's `tags`, `adjacency_tags`, and `categories`.
2. Query all other approved sites.
3. For each other site, compute overlap:
   - **Tag overlap:** Count of (site.adjacency_tags ∩ other.tags) + (site.adjacency_tags ∩ other.adjacency_tags) + (site.tags ∩ other.adjacency_tags)
   - **Category overlap:** Count of shared categories
   - Compute weight: `Math.min(1.0, (tag_overlap * 0.15) + (category_overlap * 0.15))`
4. Only create edges where weight ≥ 0.2 (skip very weak connections).
5. Determine edge_type from the primary source of overlap (topic if tag-based, format if content_type matches, etc.).
6. Insert bidirectional edges into `site_edges` (A→B and B→A).
7. For format diversity bonus: if the two sites have different `engagement_format`, add +0.1 to weight.

**Performance note:** With 60 seed sites this is fine as O(n²). At 1000+ sites, switch to a batch approach that uses `adjacency_tags` GIN index for candidate retrieval instead of full table scan.

**Integration:** Call `generateEdges(siteId)` at the end of the `routeDecision` function in `router.ts`, after tagging completes for auto-approved sites.

---

## Task 5: Rabbit Hole Engine (NEW: src/lib/rabbitHole/engine.ts)

Create the core rabbit hole engine module:

```typescript
interface RabbitHoleEntry {
  site: Site;
  themeLabel: string;      // "Weird Science", "Money Machines", etc.
  depthAvailable: number;  // approximate sites reachable
  category: string;        // primary interest category
}

interface ChainResult {
  nextSite: Site;
  branches: Site[];        // 1-2 alternative tangent options
  depth: number;
  themeLabel: string;
}

// Generate 3-5 entry points for a user
export async function generateEntryPoints(
  userId: string,
  count?: number  // default 4
): Promise<RabbitHoleEntry[]>

// Get the next site in a rabbit hole chain
export async function getNextInChain(
  rabbitHoleId: string,
  currentSiteId: string,
  userId: string
): Promise<ChainResult>

// Start a rabbit hole from a specific site (e.g., from a kept pack card)
export async function startRabbitHole(
  userId: string,
  entrySiteId: string,
  entryCategory?: string
): Promise<{ rabbitHole: RabbitHole; firstChain: ChainResult }>

// Record that the user followed a branch
export async function recordBranch(
  rabbitHoleId: string,
  fromSiteId: string,
  toSiteId: string
): Promise<void>

// End a rabbit hole session
export async function endRabbitHole(
  rabbitHoleId: string
): Promise<void>
```

### Entry Point Generation Logic:
1. Get user's interests from profile
2. Query sites WHERE quality_score >= 80 AND rabbit_hole_depth_potential >= 3 AND status = 'approved', filtered to user's interest categories
3. For each candidate, count reachable nodes via site_edges (BFS up to depth 8, early termination)
4. Select top candidates that maximize diversity across categories and engagement_format
5. Generate theme labels using categories + adjacency_tags (can be simple template: "Deep Dive: {primary_tag}" or use Claude for creative names in a future pass)

### Chain Algorithm (as specified in Architecture Addendum Section 3.2):
1. Get candidates from site_edges WHERE source_site_id = currentSiteId, ORDER BY weight DESC, LIMIT 20
2. Filter: remove already-seen sites (from rabbit_holes.site_sequence), remove quality_score < 70
3. Score each candidate: `chain_score = (0.4 × edge_weight) + (0.3 × interest_match) + (0.2 × format_affinity) + (0.1 × novelty_bonus)`
   - `interest_match`: 1.0 if site categories overlap user interests, 0.3 otherwise
   - `format_affinity`: lookup user_format_preferences for the site's category. If no data yet, use 0.5 (neutral)
   - `novelty_bonus`: 1.0 if site's primary category hasn't appeared in this rabbit hole yet, 0.3 otherwise
4. Select: highest chain_score = next site. Next 1-2 from DIFFERENT categories = branches
5. Depth-adjusted behavior:
   - Depth 1-3: only consider candidates with edge weight ≥ 0.6
   - Depth 4-6: candidates with edge weight ≥ 0.4
   - Depth 7-10: candidates with edge weight ≥ 0.2, increase novelty_bonus weight to 0.2
   - Depth 10+: include a "reset suggestion" flag in the ChainResult
6. Fallback: if < 3 candidates after filtering, query sites table for adjacency_tag overlap (GIN index search), create on-the-fly connections
7. Update rabbit_holes.site_sequence and .max_depth

---

## Task 6: Discover Page — Rabbit Hole Phase (src/app/(app)/discover/)

### 6.1 Zustand Store (src/stores/packStore.ts)

Extend `PackPhase` type:
```typescript
type PackPhase = 'ready' | 'opening' | 'selecting' | 'summary' | 'empty' | 'rabbit_hole';
```

Add rabbit hole state to the store:
```typescript
interface PackStore {
  // ...existing fields...

  // Rabbit hole state
  rabbitHoleId: string | null;
  rabbitHoleDepth: number;
  rabbitHoleTheme: string | null;
  currentSite: Site | null;        // currently displayed site in rabbit hole
  nextSite: Site | null;           // pre-loaded next chained site
  branchOptions: Site[];           // 1-2 tangent options
  entryPoints: RabbitHoleEntry[];  // available rabbit holes to start
}
```

Add actions:
```typescript
// Load entry points for the ready screen
loadEntryPoints: (entries: RabbitHoleEntry[]) => void;
// Start a rabbit hole
startRabbitHole: (id: string, theme: string, firstSite: Site, nextSite: Site, branches: Site[]) => void;
// Advance to next site in chain
advanceChain: (nextSite: Site, newNext: Site | null, branches: Site[]) => void;
// Follow a branch
followBranch: (branchSite: Site, newNext: Site | null, branches: Site[]) => void;
// Exit rabbit hole (back to ready)
exitRabbitHole: () => void;
```

### 6.2 Server Actions (src/app/(app)/discover/actions.ts)

Add new server actions alongside existing `generatePack` and `keepCards`:

```typescript
'use server'

export async function fetchEntryPoints(): Promise<RabbitHoleEntry[]>
// Calls engine.generateEntryPoints(userId)

export async function startRabbitHoleAction(entrySiteId: string, category?: string): Promise<{
  rabbitHoleId: string;
  theme: string;
  currentSite: Site;
  nextSite: Site;
  branches: Site[];
}>
// Calls engine.startRabbitHole(userId, entrySiteId, category)

export async function advanceRabbitHole(rabbitHoleId: string, currentSiteId: string): Promise<{
  nextSite: Site;
  branches: Site[];
  depth: number;
  suggestReset: boolean;
}>
// Calls engine.getNextInChain(rabbitHoleId, currentSiteId, userId)

export async function branchRabbitHole(rabbitHoleId: string, fromSiteId: string, toSiteId: string): Promise<{
  nextSite: Site;
  branches: Site[];
  depth: number;
}>
// Records branch + gets next chain from the branch site

export async function saveFromRabbitHole(siteId: string, boardId?: string): Promise<{ success: boolean }>
// Same as keepCards but for individual sites during rabbit hole browsing

export async function endRabbitHoleAction(rabbitHoleId: string): Promise<void>
// Calls engine.endRabbitHole
```

### 6.3 UI Components

Create these new components in `src/components/rabbit-hole/`:

**RabbitHoleReadyView.tsx** — Shown on the ready phase alongside the "Open Pack" button. Displays 3-5 entry point cards. Each card shows: lead site thumbnail, theme label, depth preview, category chip. Tapping starts the rabbit hole.

**RabbitHoleView.tsx** — The main rabbit hole phase view. Layout:
- Top 60%: Current site as full-width rich preview (large screenshot, title, description, tags, content type chip, engagement format indicator, "Visit Site" button)
- Below: Next chained site as a medium card (tap to advance)
- Below that: 1-2 branch options as compact cards ("Or explore this tangent...")
- Depth indicator in corner ("4 sites deep into Weird Science")
- "Save" button on current site
- "Open a Pack" button to reset (exits rabbit hole, returns to ready phase)
- At depth 10+: milestone celebration + reset suggestion

**RabbitHoleSummary.tsx** — Shown when a rabbit hole ends (user resets or explicitly ends). Shows: sites visited, depth reached, sites saved, rabbit hole theme. CTA: "Start a new rabbit hole" or "Open a Pack".

### 6.4 Integration into PackContainer

In `PackContainer.tsx`, add the `rabbit_hole` phase case to the phase switch. Load entry points when the ready phase mounts (alongside the existing pack generation). The ready phase should now show BOTH "Open a Pack" and the rabbit hole entry points.

In the `summary` phase (PostPackSummaryView), add a "Dive Deeper" CTA for each kept site that transitions to rabbit_hole phase seeded from that site.

---

## Task 7: Format Affinity Updater (src/lib/rabbitHole/formatAffinity.ts)

```typescript
export async function updateFormatAffinity(
  userId: string,
  siteId: string,
  action: 'keep' | 'pass' | 'follow' | 'abandon'
): Promise<void>
```

Called from:
- `keepCards` server action → action 'keep' for kept sites, 'pass' for passed sites
- `advanceRabbitHole` → action 'follow'
- `endRabbitHoleAction` (if mid-chain) → action 'abandon' for the last site

Logic: look up site's categories and engagement_format. For each matching interest_slug in user_format_preferences, update format_scores using the asymptotic formulas from the Architecture Addendum (keep: +0.1 approach, pass: ×0.95 decay, follow: +0.15 approach, abandon: ×0.95 decay).

---

## Task 8: Re-score and Re-tag Existing Sites

Create a one-time script `scripts/rescore-sites.ts` that:
1. Fetches all 60 approved seed sites
2. For each, calls the updated scorer to get cold_open_score, engagement_format, rabbit_hole_depth_potential
3. Calls the updated tagger to get adjacency_tags
4. Updates the sites table
5. Runs the edge generator to build the initial adjacency graph
6. Logs progress and results

Run with: `npx tsx scripts/rescore-sites.ts`

**Note:** This will make ~120 Claude API calls (60 scorer + 60 tagger). Budget accordingly.

---

## Execution Order

1. **Migration 006** — run in Supabase SQL editor after creating the file
2. **Scorer update** — modify scorer.ts with 7th dimension + new weights
3. **Tagger update** — modify tagger.ts with adjacency_tags generation
4. **Edge generator** — new module, integrate into router.ts
5. **Re-score script** — run to populate new columns and build initial graph
6. **Rabbit hole engine** — new module with chain algorithm
7. **Zustand store** — extend with rabbit hole state
8. **Server actions** — new actions for rabbit hole flow
9. **UI components** — RabbitHoleReadyView, RabbitHoleView, RabbitHoleSummary
10. **PackContainer integration** — wire rabbit hole phase into existing state machine
11. **Format affinity updater** — new module, integrate into keep/pass and chain actions
12. **Build verification** — ensure all 14+ routes still compile, test the full flow

---

## Files to Create (new):
- `supabase/006_rabbit_hole_engine.sql`
- `src/lib/pipeline/edgeGenerator.ts`
- `src/lib/rabbitHole/engine.ts`
- `src/lib/rabbitHole/formatAffinity.ts`
- `src/components/rabbit-hole/RabbitHoleReadyView.tsx`
- `src/components/rabbit-hole/RabbitHoleView.tsx`
- `src/components/rabbit-hole/RabbitHoleSummary.tsx`
- `scripts/rescore-sites.ts`

## Files to Modify (existing):
- `src/lib/pipeline/scorer.ts` — add 7th dimension, revise weights
- `src/lib/pipeline/tagger.ts` — add adjacency_tags generation
- `src/lib/pipeline/router.ts` — call edge generator after tagging
- `src/stores/packStore.ts` — extend phase type + rabbit hole state
- `src/app/(app)/discover/actions.ts` — add rabbit hole server actions
- `src/app/(app)/discover/PackContainer.tsx` — add rabbit_hole phase
- `src/app/(app)/discover/PostPackSummaryView.tsx` — add "Dive Deeper" CTA
- `src/types/database.ts` — add RabbitHole, SiteEdge, UserFormatPreference types
- `src/types/pipeline.ts` — extend ScoringResult, TaggingResult interfaces
