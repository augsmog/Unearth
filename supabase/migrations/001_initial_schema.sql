-- 001_initial_schema.sql
-- Core tables for Unearth

-- profiles (extends auth.users)
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

-- sites
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- interests
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES interests(id),
  position INTEGER DEFAULT 0
);

-- boards
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

-- board_items
CREATE TABLE board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, site_id)
);

-- packs
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_ids UUID[] NOT NULL,
  kept_site_ids UUID[] DEFAULT '{}',
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- scoring_decisions
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

-- Indexes
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_categories ON sites USING GIN(categories);
CREATE INDEX idx_sites_tags ON sites USING GIN(tags);
CREATE INDEX idx_sites_quality_score ON sites(quality_score) WHERE status = 'approved';
CREATE INDEX idx_boards_user ON boards(user_id);
CREATE INDEX idx_boards_public ON boards(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_board_items_board ON board_items(board_id);
CREATE INDEX idx_board_items_site ON board_items(site_id);
CREATE INDEX idx_packs_user ON packs(user_id);
CREATE INDEX idx_packs_opened ON packs(opened_at);
CREATE INDEX idx_scoring_site ON scoring_decisions(site_id);
CREATE INDEX idx_scoring_decided_by ON scoring_decisions(decided_by);
