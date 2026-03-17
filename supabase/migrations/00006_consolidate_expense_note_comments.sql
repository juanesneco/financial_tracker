-- Consolidate comments into note, then drop comments column
-- Title = required main description, Note = optional additional details

-- Step 1: Merge comments into note for rows where comments has content
UPDATE financial_tracker.expenses
SET note = CASE
  WHEN (note IS NULL OR TRIM(note) = '') AND comments IS NOT NULL AND TRIM(comments) != ''
    THEN TRIM(comments)
  WHEN note IS NOT NULL AND TRIM(note) != '' AND comments IS NOT NULL AND TRIM(comments) != ''
    THEN TRIM(note) || E'\n\n' || TRIM(comments)
  ELSE note
END
WHERE comments IS NOT NULL AND TRIM(comments) != '';

-- Step 2: Drop the comments column (view depends on it, so drop/recreate view first)
DROP VIEW IF EXISTS public.ft_expenses;
ALTER TABLE financial_tracker.expenses DROP COLUMN IF EXISTS comments;
CREATE OR REPLACE VIEW public.ft_expenses AS
  SELECT * FROM financial_tracker.expenses;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_expenses TO authenticated;
