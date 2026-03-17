-- ═══════════════════════════════════════════════════════════════════════════════
-- Add subscription_id FK to expenses
-- Links expenses to the subscription that generated them
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add nullable subscription_id column
ALTER TABLE financial_tracker.expenses
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- 2. Add foreign key constraint (SET NULL on delete so expenses survive subscription removal)
ALTER TABLE financial_tracker.expenses
  ADD CONSTRAINT fk_expenses_subscription
  FOREIGN KEY (subscription_id) REFERENCES financial_tracker.subscriptions(id)
  ON DELETE SET NULL;

-- 3. Index for lookup by subscription
CREATE INDEX IF NOT EXISTS idx_ft_expenses_subscription_id
  ON financial_tracker.expenses(subscription_id);

-- 4. Recreate the public view to expose new column (with security_invoker)
CREATE OR REPLACE VIEW public.ft_expenses
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.expenses;

-- 5. Re-grant permissions (required after view recreation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_expenses TO authenticated;
