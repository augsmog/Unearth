-- 002_rls_policies.sql
-- Row Level Security policies for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_decisions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES: users can view and update their own profile
-- ============================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- SITES: authenticated users can view approved sites
-- ============================================================

CREATE POLICY "Authenticated users can view approved sites"
  ON sites FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- ============================================================
-- INTERESTS: authenticated users can view all interests
-- ============================================================

CREATE POLICY "Authenticated users can view interests"
  ON interests FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
-- BOARDS: users can manage own boards, anyone can view public
-- ============================================================

CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public boards"
  ON boards FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

CREATE POLICY "Users can insert own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- BOARD_ITEMS: users can manage own, anyone can view public
-- ============================================================

CREATE POLICY "Users can view own board items"
  ON board_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view public board items"
  ON board_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.is_public = TRUE
    )
  );

CREATE POLICY "Users can insert own board items"
  ON board_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own board items"
  ON board_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own board items"
  ON board_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_items.board_id
        AND boards.user_id = auth.uid()
    )
  );

-- ============================================================
-- PACKS: users can view and insert own packs
-- ============================================================

CREATE POLICY "Users can view own packs"
  ON packs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packs"
  ON packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packs"
  ON packs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SCORING_DECISIONS: service_role only (no user-facing policies)
-- ============================================================

-- No policies created - only service_role key can access this table.
-- RLS is enabled but with no permissive policies for authenticated users,
-- so all user-level access is denied. The service_role key bypasses RLS.
