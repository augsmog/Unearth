-- 009_engagement_aggregates.sql
-- Site-level engagement aggregates that enable self-correcting recommendations.
-- AI quality_score is the starting point; real user behavior adjusts ranking over time.

-- How many times this site has been shown in a pack (denominator for keep rate)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS impression_count INTEGER DEFAULT 0;

-- How many users kept this site (from packs or rabbit holes)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS keep_count INTEGER DEFAULT 0;

-- How many users saved this from a rabbit hole specifically (strongest signal)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS rabbit_hole_save_count INTEGER DEFAULT 0;

-- Indexes for effective score queries
CREATE INDEX IF NOT EXISTS idx_sites_impression_count
  ON sites(impression_count DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_sites_keep_count
  ON sites(keep_count DESC)
  WHERE status = 'approved';
