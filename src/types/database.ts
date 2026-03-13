// ── Enums & Type Unions ─────────────────────────────────────────────

export type ContentType =
  | 'article'
  | 'tool'
  | 'video'
  | 'podcast'
  | 'newsletter'
  | 'course'
  | 'community'
  | 'repository'
  | 'other';

export type SiteStatus =
  | 'pending'
  | 'scoring'
  | 'approved'
  | 'rejected'
  | 'flagged';

export type AiContentLikelihood =
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type ScoringDecisionOutcome =
  | 'approved'
  | 'rejected'
  | 'needs_review';

export type ScoringDecisionActor =
  | 'ai'
  | 'founder'
  | 'moderator';

export type PackColor = 'gold' | 'blue' | 'purple';

export type EngagementFormat = 'instant' | 'visual' | 'read-short' | 'read-long' | 'tool' | 'explore';
export type PackType = 'standard' | 'reset' | 'entry';
export type RabbitHoleSource = 'solo' | 'discord';
export type EdgeType = 'topic' | 'vibe' | 'format' | 'creator' | 'audience';
export type FormatAffinityAction = 'keep' | 'pass' | 'follow' | 'abandon';

// ── Scoring Dimensions ──────────────────────────────────────────────

export interface ScoringDimensionDetail {
  score: number;
  reasoning: string;
}

// ── Core Tables ─────────────────────────────────────────────────────

export interface Site {
  id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  categories: string[];
  tags: string[];
  content_type: ContentType;
  quality_score: number;
  ai_content_likelihood: AiContentLikelihood;
  status: SiteStatus;
  source: string;
  source_url: string | null;
  reading_time_minutes: number | null;
  scoring_dimensions: Record<string, ScoringDimensionDetail> | null;
  adjacency_tags: string[];
  cold_open_score: number | null;
  engagement_format: EngagementFormat | null;
  rabbit_hole_depth_potential: number;
  engagement_view_count: number;
  engagement_avg_time_ms: number;
  impression_count: number;
  keep_count: number;
  rabbit_hole_save_count: number;
  created_at: string;
  approved_at: string | null;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  interests: string[];
  streak_count: number;
  streak_last_date: string | null;
  total_packs_opened: number;
  total_sites_kept: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  slug: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BoardItem {
  id: string;
  board_id: string;
  site_id: string;
  position: number;
  added_at: string;
}

export interface Pack {
  id: string;
  user_id: string;
  site_ids: string[];
  kept_site_ids: string[];
  opened_at: string;
  rabbit_hole_id: string | null;
  pack_type: PackType;
}

export interface ScoringDecision {
  id: string;
  site_id: string;
  ai_score: number;
  ai_dimensions: Record<string, ScoringDimensionDetail> | null;
  decision: ScoringDecisionOutcome;
  decided_by: ScoringDecisionActor;
  founder_notes: string | null;
  created_at: string;
}

export interface Interest {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
}

// ── Pipeline Types ──────────────────────────────────────────────────

export type RawSiteSource =
  | 'hackernews'
  | 'reddit'
  | 'rss'
  | 'rss_feed'
  | 'product_hunt'
  | 'github_trending'
  | 'lobsters'
  | 'arena'
  | 'directory'
  | 'manual'
  | 'community'
  | 'submission';

export interface RawSite {
  url: string;
  title: string;
  description?: string;
  source: RawSiteSource;
  sourceUrl?: string;
  fetchedAt: string;
  rawHtml?: string;
  rawText?: string;
}

export interface ScoringResult {
  overall_score: number;
  dimensions: Record<string, ScoringDimensionDetail>;
  ai_content_likelihood: AiContentLikelihood;
  summary: string;
  recommended_categories: string[];
  recommended_tags: string[];
  cold_open_score?: number;
  engagement_format?: EngagementFormat;
  rabbit_hole_depth_potential?: number;
}

export interface SiteEdge {
  id: string;
  source_site_id: string;
  target_site_id: string;
  edge_type: EdgeType;
  weight: number;
  created_at: string;
}

export interface RabbitHole {
  id: string;
  user_id: string | null;
  entry_site_id: string;
  entry_category: string | null;
  site_sequence: string[];
  branch_points: Array<{ depth: number; from_site_id: string; to_site_id: string; branch_type: string }>;
  max_depth: number;
  started_at: string;
  ended_at: string | null;
  source: RabbitHoleSource;
}

export interface UserFormatPreference {
  id: string;
  user_id: string;
  interest_slug: string;
  format_scores: Record<string, number>;
  sample_size: number;
  updated_at: string;
}

export interface RabbitHoleEntry {
  site: Site;
  themeLabel: string;
  depthAvailable: number;
  category: string;
}

export interface ChainResult {
  nextSite: Site;
  branches: Site[];
  depth: number;
  themeLabel: string;
  suggestReset?: boolean;
}
