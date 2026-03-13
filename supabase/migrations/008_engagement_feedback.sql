-- 008_engagement_feedback.sql
-- Add aggregate engagement tracking columns to sites.
-- These are updated inline by trackSiteEngagement() as a running average,
-- then used by diverseWeightedSample() to boost/penalize sites based on
-- real user engagement data.

-- Running count of unique user views (for running average denominator)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS engagement_view_count INTEGER DEFAULT 0;

-- Running average of time_spent_ms across all user views
ALTER TABLE sites ADD COLUMN IF NOT EXISTS engagement_avg_time_ms FLOAT DEFAULT 0;

-- Index for sorting approved sites by engagement
CREATE INDEX IF NOT EXISTS idx_sites_engagement
  ON sites(engagement_avg_time_ms DESC)
  WHERE status = 'approved';
