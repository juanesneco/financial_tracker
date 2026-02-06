-- ═══════════════════════════════════════════════════════════════════════════════
-- Financial Tracker Schema
-- Creates schema, tables, indexes, triggers, RLS policies, views, and storage
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREATE SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS financial_tracker;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles
CREATE TABLE financial_tracker.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE financial_tracker.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subcategories
CREATE TABLE financial_tracker.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES financial_tracker.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Expenses
CREATE TABLE financial_tracker.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category_id UUID NOT NULL REFERENCES financial_tracker.categories(id),
  subcategory_id UUID REFERENCES financial_tracker.subcategories(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_ft_expenses_user_id ON financial_tracker.expenses(user_id);
CREATE INDEX idx_ft_expenses_date ON financial_tracker.expenses(date DESC);
CREATE INDEX idx_ft_expenses_category ON financial_tracker.expenses(category_id);
CREATE INDEX idx_ft_categories_order ON financial_tracker.categories(display_order);
CREATE INDEX idx_ft_subcategories_category ON financial_tracker.subcategories(category_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Updated at trigger function
CREATE OR REPLACE FUNCTION financial_tracker.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON financial_tracker.profiles
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON financial_tracker.expenses
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION financial_tracker.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO financial_tracker.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique trigger name to avoid conflict with other project triggers
CREATE TRIGGER on_auth_user_created_financial_tracker
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENABLE RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE financial_tracker.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.expenses ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON financial_tracker.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON financial_tracker.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories: all authenticated users can read
CREATE POLICY "Authenticated users can view categories"
  ON financial_tracker.categories FOR SELECT
  TO authenticated
  USING (true);

-- Subcategories: all authenticated users can read
CREATE POLICY "Authenticated users can view subcategories"
  ON financial_tracker.subcategories FOR SELECT
  TO authenticated
  USING (true);

-- Expenses: full user isolation
CREATE POLICY "Users can view own expenses"
  ON financial_tracker.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON financial_tracker.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON financial_tracker.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON financial_tracker.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PUBLIC VIEWS (PostgREST bridge)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.ft_profiles AS
  SELECT * FROM financial_tracker.profiles;

CREATE OR REPLACE VIEW public.ft_categories AS
  SELECT * FROM financial_tracker.categories;

CREATE OR REPLACE VIEW public.ft_subcategories AS
  SELECT * FROM financial_tracker.subcategories;

CREATE OR REPLACE VIEW public.ft_expenses AS
  SELECT * FROM financial_tracker.expenses;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. GRANT PERMISSIONS ON VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles
GRANT SELECT, UPDATE ON public.ft_profiles TO authenticated;

-- Categories (also allow anon for login page pre-fetch if needed)
GRANT SELECT ON public.ft_categories TO authenticated, anon;

-- Subcategories
GRANT SELECT ON public.ft_subcategories TO authenticated, anon;

-- Expenses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_expenses TO authenticated;

-- Grant usage on the underlying schema tables for view operations
GRANT USAGE ON SCHEMA financial_tracker TO authenticated, anon;
GRANT SELECT ON financial_tracker.categories TO authenticated, anon;
GRANT SELECT ON financial_tracker.subcategories TO authenticated, anon;
GRANT SELECT, UPDATE ON financial_tracker.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.expenses TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET (Receipts)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload receipts to their own folder
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own receipts
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
