-- 007_pages_model_embeddability.sql
-- Shift from "sites" to "pages" model: track domain grouping, embeddability,
-- and per-user page exposure to control reuse.

-- ── New columns on sites (which now represents individual pages) ───────

-- Domain extracted from URL for grouping pages from the same source
ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain TEXT;

-- Whether this page can be embedded in our iframe viewer
-- NULL = untested, TRUE = works, FALSE = blocked
ALTER TABLE sites ADD COLUMN IF NOT EXISTS iframe_compatible BOOLEAN;

-- When embeddability was last tested
ALTER TABLE sites ADD COLUMN IF NOT EXISTS iframe_tested_at TIMESTAMPTZ;

-- ── Backfill domain from existing URLs ────────────────────────────────
-- Extract hostname: "https://pudding.cool/2023/article" → "pudding.cool"
UPDATE sites
SET domain = regexp_replace(
  regexp_replace(url, '^https?://(www\.)?', ''),
  '/.*$', ''
)
WHERE domain IS NULL;

-- ── Indexes for domain grouping and embeddability queries ─────────────
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_sites_iframe_compatible ON sites(iframe_compatible)
  WHERE status = 'approved';

-- ── User page exposure log ────────────────────────────────────────────
-- Lightweight table to track which pages each user has been shown,
-- enabling fine-grained reuse control beyond just pack history.
CREATE TABLE IF NOT EXISTS user_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_ms INTEGER,
  iframe_loaded BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'pack', -- pack, rabbit_hole, board, direct
  UNIQUE(user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_user_page_views_user ON user_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_page_views_site ON user_page_views(site_id);

-- ── RLS for user_page_views ───────────────────────────────────────────
ALTER TABLE user_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own page views"
  ON user_page_views FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page views"
  ON user_page_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page views"
  ON user_page_views FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage page views"
  ON user_page_views FOR ALL USING (auth.role() = 'service_role');
