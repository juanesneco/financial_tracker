-- 00010_add_is_displayed_to_categories.sql
-- Adds is_displayed boolean to categories so categories can be globally
-- hidden from dropdowns/filters without deleting them (preserving historical
-- expense references).

BEGIN;

-- ─── 1. Add column ──────────────────────────────────────────────────────────

ALTER TABLE financial_tracker.categories
  ADD COLUMN IF NOT EXISTS is_displayed BOOLEAN NOT NULL DEFAULT true;

-- ─── 2. Recreate the ft_categories view to include the new column ───────────
-- DROP is required because the column set changed.

DROP VIEW IF EXISTS public.ft_categories;
CREATE VIEW public.ft_categories
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.categories;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_categories TO authenticated;

COMMIT;
