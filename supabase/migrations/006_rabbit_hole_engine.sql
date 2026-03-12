-- Phase 1.5: Rabbit Hole Engine
-- New columns, tables, and RLS policies for the adjacency graph and rabbit hole tracking.

-- ── New columns on sites ────────────────────────────────────────────
ALTER TABLE sites ADD COLUMN IF NOT EXISTS adjacency_tags TEXT[] DEFAULT '{}';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS cold_open_score INTEGER;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS engagement_format TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS rabbit_hole_depth_potential INTEGER DEFAULT 1;

-- ── site_edges ──────────────────────────────────────────────────────
CREATE TABLE site_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  target_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_site_id, target_site_id, edge_type)
);
CREATE INDEX idx_site_edges_source ON site_edges(source_site_id);
CREATE INDEX idx_site_edges_source_weight ON site_edges(source_site_id, weight DESC);
CREATE INDEX idx_sites_adjacency_tags ON sites USING GIN(adjacency_tags);

-- ── rabbit_holes ────────────────────────────────────────────────────
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
  source TEXT DEFAULT 'solo'
);
CREATE INDEX idx_rabbit_holes_user ON rabbit_holes(user_id);

-- ── Extended packs ──────────────────────────────────────────────────
ALTER TABLE packs ADD COLUMN IF NOT EXISTS rabbit_hole_id UUID REFERENCES rabbit_holes(id);
ALTER TABLE packs ADD COLUMN IF NOT EXISTS pack_type TEXT DEFAULT 'standard';

-- ── user_format_preferences ─────────────────────────────────────────
CREATE TABLE user_format_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_slug TEXT NOT NULL,
  format_scores JSONB NOT NULL DEFAULT '{}',
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_slug)
);

-- ── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE rabbit_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_format_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rabbit holes" ON rabbit_holes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rabbit holes" ON rabbit_holes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rabbit holes" ON rabbit_holes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view site edges" ON site_edges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage site edges" ON site_edges FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own format prefs" ON user_format_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own format prefs" ON user_format_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own format prefs" ON user_format_preferences FOR UPDATE USING (auth.uid() = user_id);
