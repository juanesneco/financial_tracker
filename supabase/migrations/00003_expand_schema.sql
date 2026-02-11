-- ═══════════════════════════════════════════════════════════════════════════════
-- Financial Tracker Schema Expansion
-- Adds: cards, deposits, subscriptions, budgets, income_sources, income_records
-- Expands: profiles, categories, subcategories, expenses
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXPAND EXISTING TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles: add role, avatar, super admin flag
ALTER TABLE financial_tracker.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Categories: add emoji, budget_default, original_glide_id
ALTER TABLE financial_tracker.categories
  ADD COLUMN IF NOT EXISTS emoji TEXT,
  ADD COLUMN IF NOT EXISTS budget_default DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS original_glide_id TEXT UNIQUE;

-- Subcategories: add emoji, original_glide_id
ALTER TABLE financial_tracker.subcategories
  ADD COLUMN IF NOT EXISTS emoji TEXT,
  ADD COLUMN IF NOT EXISTS original_glide_id TEXT UNIQUE;

-- Expenses: add title, payment_method, card_id, comments, currency, original_glide_id
ALTER TABLE financial_tracker.expenses
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('card', 'cash')),
  ADD COLUMN IF NOT EXISTS card_id UUID,
  ADD COLUMN IF NOT EXISTS comments TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS original_glide_id TEXT UNIQUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Cards
CREATE TABLE IF NOT EXISTS financial_tracker.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  last_four TEXT,
  card_type TEXT CHECK (card_type IN ('credit', 'debit')),
  label TEXT,
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from expenses to cards (after cards table exists)
ALTER TABLE financial_tracker.expenses
  ADD CONSTRAINT fk_expenses_card
  FOREIGN KEY (card_id) REFERENCES financial_tracker.cards(id)
  ON DELETE SET NULL;

-- Deposits (inter-user repayments, primarily used by Juanes)
CREATE TABLE IF NOT EXISTS financial_tracker.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  note TEXT,
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS financial_tracker.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  renewal_day INTEGER CHECK (renewal_day >= 1 AND renewal_day <= 31),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS financial_tracker.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_tracker.categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES financial_tracker.subcategories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budgets_has_category CHECK (category_id IS NOT NULL OR subcategory_id IS NOT NULL)
);

-- Income Sources
CREATE TABLE IF NOT EXISTS financial_tracker.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  initials TEXT,
  legal_name TEXT,
  legal_address TEXT,
  legal_city_state_zip TEXT,
  legal_id TEXT,
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Income Records
CREATE TABLE IF NOT EXISTS financial_tracker.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES financial_tracker.income_sources(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  original_glide_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ft_cards_user_id ON financial_tracker.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_deposits_user_id ON financial_tracker.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_deposits_date ON financial_tracker.deposits(date DESC);
CREATE INDEX IF NOT EXISTS idx_ft_subscriptions_user_id ON financial_tracker.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_budgets_user_id ON financial_tracker.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_income_sources_user_id ON financial_tracker.income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_income_records_user_id ON financial_tracker.income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ft_income_records_date ON financial_tracker.income_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_ft_expenses_card_id ON financial_tracker.expenses(card_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS (updated_at)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at_cards
  BEFORE UPDATE ON financial_tracker.cards
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON financial_tracker.subscriptions
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON financial_tracker.budgets
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

CREATE TRIGGER set_updated_at_income_sources
  BEFORE UPDATE ON financial_tracker.income_sources
  FOR EACH ROW EXECUTE FUNCTION financial_tracker.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENABLE RLS ON NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE financial_tracker.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tracker.income_records ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Cards
CREATE POLICY "Users can view own cards"
  ON financial_tracker.cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON financial_tracker.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON financial_tracker.cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON financial_tracker.cards FOR DELETE
  USING (auth.uid() = user_id);

-- Deposits
CREATE POLICY "Users can view own deposits"
  ON financial_tracker.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON financial_tracker.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposits"
  ON financial_tracker.deposits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deposits"
  ON financial_tracker.deposits FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON financial_tracker.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON financial_tracker.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON financial_tracker.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON financial_tracker.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets"
  ON financial_tracker.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON financial_tracker.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON financial_tracker.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON financial_tracker.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Income Sources
CREATE POLICY "Users can view own income sources"
  ON financial_tracker.income_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income sources"
  ON financial_tracker.income_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources"
  ON financial_tracker.income_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources"
  ON financial_tracker.income_sources FOR DELETE
  USING (auth.uid() = user_id);

-- Income Records
CREATE POLICY "Users can view own income records"
  ON financial_tracker.income_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income records"
  ON financial_tracker.income_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income records"
  ON financial_tracker.income_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income records"
  ON financial_tracker.income_records FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PUBLIC VIEWS (PostgREST bridge)
-- ─────────────────────────────────────────────────────────────────────────────

-- Recreate ft_expenses to include new columns
CREATE OR REPLACE VIEW public.ft_expenses AS
  SELECT * FROM financial_tracker.expenses;

-- Recreate ft_profiles to include new columns
CREATE OR REPLACE VIEW public.ft_profiles AS
  SELECT * FROM financial_tracker.profiles;

-- Recreate ft_categories to include new columns
CREATE OR REPLACE VIEW public.ft_categories AS
  SELECT * FROM financial_tracker.categories;

-- Recreate ft_subcategories to include new columns
CREATE OR REPLACE VIEW public.ft_subcategories AS
  SELECT * FROM financial_tracker.subcategories;

-- New views
CREATE OR REPLACE VIEW public.ft_cards AS
  SELECT * FROM financial_tracker.cards;

CREATE OR REPLACE VIEW public.ft_deposits AS
  SELECT * FROM financial_tracker.deposits;

CREATE OR REPLACE VIEW public.ft_subscriptions AS
  SELECT * FROM financial_tracker.subscriptions;

CREATE OR REPLACE VIEW public.ft_budgets AS
  SELECT * FROM financial_tracker.budgets;

CREATE OR REPLACE VIEW public.ft_income_sources AS
  SELECT * FROM financial_tracker.income_sources;

CREATE OR REPLACE VIEW public.ft_income_records AS
  SELECT * FROM financial_tracker.income_records;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Cards
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.cards TO authenticated;

-- Deposits
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.deposits TO authenticated;

-- Subscriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.subscriptions TO authenticated;

-- Budgets
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.budgets TO authenticated;

-- Income Sources
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_income_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.income_sources TO authenticated;

-- Income Records
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_income_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.income_records TO authenticated;

-- Update existing grants for expanded columns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_tracker.expenses TO authenticated;
GRANT SELECT, UPDATE ON public.ft_profiles TO authenticated;
GRANT SELECT, UPDATE ON financial_tracker.profiles TO authenticated;
GRANT SELECT ON public.ft_categories TO authenticated, anon;
GRANT SELECT ON financial_tracker.categories TO authenticated, anon;
GRANT SELECT ON public.ft_subcategories TO authenticated, anon;
GRANT SELECT ON financial_tracker.subcategories TO authenticated, anon;
