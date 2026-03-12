---
name: supabase-schema
description: "Defines and manages the Supabase PostgreSQL database schema, row-level security policies, and auth configuration for the web discovery platform. Use this skill when creating or modifying database tables, writing migrations, setting up RLS policies, configuring Supabase Auth, writing database queries, or working with the Supabase client. Also trigger for 'database', 'schema', 'migration', 'RLS', 'auth', 'Supabase', 'query', or 'SQL' in the context of this project."
---

# Supabase Schema Skill

This skill defines the PostgreSQL database schema, Row-Level Security policies, and Supabase configuration for the web discovery platform.

## Database Schema

### Core Tables

#### `profiles` (extends Supabase auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  streak_count INTEGER DEFAULT 0,
  streak_last_date DATE,
  total_packs_opened INTEGER DEFAULT 0,
  total_sites_kept INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sites`

```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  content_type TEXT CHECK (content_type IN ('tool', 'blog', 'portfolio', 'resource', 'community', 'saas', 'other')),
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 100),
  ai_content_likelihood TEXT CHECK (ai_content_likelihood IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source TEXT NOT NULL,
  source_url TEXT,
  reading_time_minutes INTEGER,
  scoring_dimensions JSONB,
  -- Phase 1.5 additions:
  adjacency_tags TEXT[] DEFAULT '{}',
  cold_open_score INTEGER,
  engagement_format TEXT CHECK (engagement_format IN ('instant', 'visual', 'read-short', 'read-long', 'tool', 'explore')),
  rabbit_hole_depth_potential INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_categories ON sites USING GIN(categories);
CREATE INDEX idx_sites_tags ON sites USING GIN(tags);
CREATE INDEX idx_sites_quality_score ON sites(quality_score) WHERE status = 'approved';
CREATE INDEX idx_sites_adjacency_tags ON sites USING GIN(adjacency_tags);
CREATE INDEX idx_sites_engagement_format ON sites(engagement_format) WHERE status = 'approved';
```

#### `boards`

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  slug TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_boards_user ON boards(user_id);
CREATE INDEX idx_boards_public ON boards(is_public) WHERE is_public = TRUE;
```

#### `board_items`

```sql
CREATE TABLE board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, site_id)
);

CREATE INDEX idx_board_items_board ON board_items(board_id);
CREATE INDEX idx_board_items_site ON board_items(site_id);
```

#### `packs`

```sql
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_ids UUID[] NOT NULL,
  kept_site_ids UUID[] DEFAULT '{}',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  -- Phase 1.5 additions:
  rabbit_hole_id UUID REFERENCES rabbit_holes(id),
  pack_type TEXT DEFAULT 'standard' CHECK (pack_type IN ('standard', 'reset', 'entry'))
);

CREATE INDEX idx_packs_user ON packs(user_id);
CREATE INDEX idx_packs_opened ON packs(opened_at);
```

#### `scoring_decisions`

```sql
CREATE TABLE scoring_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  ai_score INTEGER NOT NULL,
  ai_dimensions JSONB,
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),
  decided_by TEXT NOT NULL CHECK (decided_by IN ('auto', 'founder')),
  founder_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scoring_site ON scoring_decisions(site_id);
CREATE INDEX idx_scoring_decided_by ON scoring_decisions(decided_by);
```

#### `interests`

```sql
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES interests(id),
  position INTEGER DEFAULT 0
);
```

#### `site_edges` (Phase 1.5)

```sql
CREATE TABLE site_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  target_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('topic', 'vibe', 'format', 'creator', 'audience')),
  weight FLOAT NOT NULL CHECK (weight BETWEEN 0.0 AND 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_site_id, target_site_id, edge_type)
);

CREATE INDEX idx_edges_source ON site_edges(source_site_id);
CREATE INDEX idx_edges_source_weight ON site_edges(source_site_id, weight DESC);
```

#### `rabbit_holes` (Phase 1.5)

```sql
CREATE TABLE rabbit_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entry_site_id UUID NOT NULL REFERENCES sites(id),
  entry_category TEXT,
  site_sequence UUID[] DEFAULT '{}',
  branch_points JSONB DEFAULT '[]',
  max_depth INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  source TEXT DEFAULT 'solo' CHECK (source IN ('solo', 'discord'))
);

CREATE INDEX idx_rabbit_holes_user ON rabbit_holes(user_id);
```

#### `user_format_preferences` (Phase 1.5)

```sql
CREATE TABLE user_format_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_slug TEXT NOT NULL,
  format_scores JSONB DEFAULT '{}',
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_slug)
);
```

### Helper Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create default "Favorites" board for new users
CREATE OR REPLACE FUNCTION create_default_board()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO boards (user_id, name, slug, position)
  VALUES (NEW.id, 'Favorites', 'favorites', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_board();
```

## Row-Level Security Policies

Every table that contains user data needs RLS enabled. The principle: users can read their own data and public data, but only write their own data.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Boards: users can CRUD their own, anyone can read public boards
CREATE POLICY "Users can manage own boards" ON boards
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public boards" ON boards
  FOR SELECT USING (is_public = TRUE);

-- Board items: users can manage items on their own boards
CREATE POLICY "Users can manage own board items" ON board_items
  FOR ALL USING (
    board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can view public board items" ON board_items
  FOR SELECT USING (
    board_id IN (SELECT id FROM boards WHERE is_public = TRUE)
  );

-- Packs: users can read their own pack history
CREATE POLICY "Users can view own packs" ON packs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own packs" ON packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sites: all authenticated users can read approved sites
CREATE POLICY "Authenticated users can view approved sites" ON sites
  FOR SELECT USING (status = 'approved' AND auth.role() = 'authenticated');

-- Interests: readable by all authenticated users
CREATE POLICY "Authenticated users can view interests" ON interests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies (use a service role key for pipeline operations)
-- Scoring decisions: only accessible via service role (admin dashboard)
CREATE POLICY "Service role can manage scoring decisions" ON scoring_decisions
  FOR ALL USING (auth.role() = 'service_role');

-- Phase 1.5 RLS policies
ALTER TABLE site_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbit_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_format_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view site edges" ON site_edges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own rabbit holes" ON rabbit_holes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rabbit holes" ON rabbit_holes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rabbit holes" ON rabbit_holes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own format preferences" ON user_format_preferences
  FOR ALL USING (auth.uid() = user_id);
```

## Supabase Auth Configuration

### Providers to Enable
- Email/password (primary)
- Google OAuth (secondary)
- Magic link (low-friction option)

### Auth Hook: Create Profile on Signup

```sql
-- In Supabase, set up a trigger on auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Supabase Client Setup (Next.js)

```typescript
// lib/supabase/client.ts — browser client
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts — server client (for Server Components & Route Handlers)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// lib/supabase/admin.ts — service role client (for pipeline operations)
import { createClient } from '@supabase/supabase-js';

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Common Query Patterns

### Generate a Pack (Server Action)

```typescript
async function generatePack(userId: string, interests: string[]) {
  // 1. Get sites the user has already seen
  const { data: seenPacks } = await adminClient
    .from('packs')
    .select('site_ids')
    .eq('user_id', userId);

  const seenSiteIds = seenPacks?.flatMap(p => p.site_ids) ?? [];

  // 2. Query approved sites matching interests, excluding seen
  const { data: candidates } = await adminClient
    .from('sites')
    .select('*')
    .eq('status', 'approved')
    .overlaps('categories', interests)
    .not('id', 'in', `(${seenSiteIds.join(',')})`)
    .order('quality_score', { ascending: false })
    .limit(50);

  // 3. Weighted random selection of 5
  const selected = weightedRandomSample(candidates, 5, interests);

  // 4. Create pack record
  const { data: pack } = await adminClient
    .from('packs')
    .insert({
      user_id: userId,
      site_ids: selected.map(s => s.id),
    })
    .select()
    .single();

  return { pack, sites: selected };
}
```

## Migration File Organization

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_auth_triggers.sql
│   ├── 004_seed_interests.sql
│   ├── 005_seed_websites.sql
│   └── 006_rabbit_hole_engine.sql  (Phase 1.5: site_edges, rabbit_holes, user_format_preferences, new site columns)
└── seed.sql
```

Always use `supabase migration new <name>` to create new migration files. Never modify existing migrations that have been applied.

## For the interest taxonomy seed data, see [references/taxonomy-seed.md](references/taxonomy-seed.md)
