-- Add deactivation date to cards (null = active, set = inactive)
ALTER TABLE financial_tracker.cards
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Recreate the public view to expose new column
CREATE OR REPLACE VIEW public.ft_cards
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  bank,
  last_four,
  card_type,
  label,
  deactivated_at,
  original_glide_id,
  created_at,
  updated_at
FROM financial_tracker.cards;
