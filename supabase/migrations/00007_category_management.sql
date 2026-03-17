-- 00007_category_management.sql
-- Adds user-owned categories/subcategories and per-user hiding of universal categories.
-- NULL user_id = universal (system), UUID = user-owned (private).

BEGIN;

-- ─── 1a. Add user_id to categories ──────────────────────────────────────────────

ALTER TABLE financial_tracker.categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint on name (if exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_name_key'
      AND conrelid = 'financial_tracker.categories'::regclass
  ) THEN
    ALTER TABLE financial_tracker.categories DROP CONSTRAINT categories_name_key;
  END IF;
END $$;

-- Partial unique indexes: universal names unique, per-user names unique
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_universal_idx
  ON financial_tracker.categories (name)
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_user_idx
  ON financial_tracker.categories (name, user_id)
  WHERE user_id IS NOT NULL;

-- ─── 1b. Junction table: user_hidden_categories ─────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_tracker.user_hidden_categories (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES financial_tracker.categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS user_hidden_categories_user_idx
  ON financial_tracker.user_hidden_categories (user_id);

-- ─── 1c. Add user_id to subcategories ───────────────────────────────────────────

ALTER TABLE financial_tracker.subcategories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint on (category_id, name) if exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subcategories_category_id_name_key'
      AND conrelid = 'financial_tracker.subcategories'::regclass
  ) THEN
    ALTER TABLE financial_tracker.subcategories DROP CONSTRAINT subcategories_category_id_name_key;
  END IF;
END $$;

-- Partial unique indexes for subcategories
CREATE UNIQUE INDEX IF NOT EXISTS subcategories_name_universal_idx
  ON financial_tracker.subcategories (category_id, name)
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subcategories_name_user_idx
  ON financial_tracker.subcategories (category_id, name, user_id)
  WHERE user_id IS NOT NULL;

-- ─── 1i. Super admin helper function ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION financial_tracker.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM financial_tracker.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 1d. Update RLS on categories ───────────────────────────────────────────────

ALTER TABLE financial_tracker.categories ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view categories" ON financial_tracker.categories;
DROP POLICY IF EXISTS "categories_select" ON financial_tracker.categories;
DROP POLICY IF EXISTS "categories_insert" ON financial_tracker.categories;
DROP POLICY IF EXISTS "categories_update" ON financial_tracker.categories;
DROP POLICY IF EXISTS "categories_delete" ON financial_tracker.categories;

-- SELECT: universal OR own
CREATE POLICY "categories_select" ON financial_tracker.categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- INSERT: own only
CREATE POLICY "categories_insert" ON financial_tracker.categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: super admin for universal, user for own
CREATE POLICY "categories_update" ON financial_tracker.categories
  FOR UPDATE TO authenticated
  USING (
    (user_id IS NULL AND financial_tracker.is_super_admin())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    (user_id IS NULL AND financial_tracker.is_super_admin())
    OR user_id = auth.uid()
  );

-- DELETE: super admin for universal, user for own
CREATE POLICY "categories_delete" ON financial_tracker.categories
  FOR DELETE TO authenticated
  USING (
    (user_id IS NULL AND financial_tracker.is_super_admin())
    OR user_id = auth.uid()
  );

-- ─── 1e. Update RLS on subcategories ────────────────────────────────────────────

ALTER TABLE financial_tracker.subcategories ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view subcategories" ON financial_tracker.subcategories;
DROP POLICY IF EXISTS "subcategories_select" ON financial_tracker.subcategories;
DROP POLICY IF EXISTS "subcategories_insert" ON financial_tracker.subcategories;
DROP POLICY IF EXISTS "subcategories_update" ON financial_tracker.subcategories;
DROP POLICY IF EXISTS "subcategories_delete" ON financial_tracker.subcategories;

-- SELECT: universal OR own
CREATE POLICY "subcategories_select" ON financial_tracker.subcategories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- INSERT: own only
CREATE POLICY "subcategories_insert" ON financial_tracker.subcategories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: own only
CREATE POLICY "subcategories_update" ON financial_tracker.subcategories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: own only
CREATE POLICY "subcategories_delete" ON financial_tracker.subcategories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── 1f. RLS on user_hidden_categories ──────────────────────────────────────────

ALTER TABLE financial_tracker.user_hidden_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hidden_categories_select" ON financial_tracker.user_hidden_categories;
DROP POLICY IF EXISTS "hidden_categories_insert" ON financial_tracker.user_hidden_categories;
DROP POLICY IF EXISTS "hidden_categories_delete" ON financial_tracker.user_hidden_categories;

CREATE POLICY "hidden_categories_select" ON financial_tracker.user_hidden_categories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "hidden_categories_insert" ON financial_tracker.user_hidden_categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hidden_categories_delete" ON financial_tracker.user_hidden_categories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── 1g. Grants ─────────────────────────────────────────────────────────────────

-- Categories: authenticated can now INSERT/UPDATE/DELETE (RLS controls what)
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.subcategories TO authenticated;
GRANT SELECT, INSERT, DELETE ON financial_tracker.user_hidden_categories TO authenticated;

-- ─── 1h. Update/create views ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.ft_categories
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.categories;

CREATE OR REPLACE VIEW public.ft_subcategories
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.subcategories;

CREATE OR REPLACE VIEW public.ft_user_hidden_categories
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.user_hidden_categories;

-- Grants on views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_subcategories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.ft_user_hidden_categories TO authenticated;

COMMIT;
