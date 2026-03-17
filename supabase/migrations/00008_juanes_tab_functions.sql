-- 00008_juanes_tab_functions.sql
-- Two functions for the Juanes tab:
--   1. Deposits: Juanes' own deposits (money received from Ivonne) — no RLS bypass needed
--   2. Expenses: Ivonne's expenses (purchases Juanes made on her behalf, recorded under
--      Ivonne's user_id) — SECURITY DEFINER needed to bypass RLS

BEGIN;

-- Juanes: b5fd940d-ccd0-4a32-acd0-4471baa6fc76
-- Ivonne: 212f34e2-6f01-44e8-8252-daa378ec7ad9

-- ─── 1. get_ivonne_deposits ─────────────────────────────────────────────────
-- Returns Juanes' own deposits (money from Ivonne). Uses auth.uid() via RLS.

CREATE OR REPLACE FUNCTION financial_tracker.get_ivonne_deposits()
RETURNS SETOF financial_tracker.deposits AS $$
  SELECT *
  FROM financial_tracker.deposits
  WHERE user_id = auth.uid()
  ORDER BY date DESC;
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- ─── 2. get_ivonne_expenses ─────────────────────────────────────────────────
-- Returns all expenses under Ivonne's user_id. SECURITY DEFINER bypasses RLS
-- so Juanes can see Ivonne's records. Guarded: only Juanes can call this.

CREATE OR REPLACE FUNCTION financial_tracker.get_ivonne_expenses()
RETURNS SETOF financial_tracker.expenses AS $$
BEGIN
  IF auth.uid() != 'b5fd940d-ccd0-4a32-acd0-4471baa6fc76'::uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT *
    FROM financial_tracker.expenses
    WHERE user_id = '212f34e2-6f01-44e8-8252-daa378ec7ad9'::uuid
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 3. Public wrappers (PostgREST bridge) ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_ivonne_deposits()
RETURNS SETOF financial_tracker.deposits AS $$
  SELECT * FROM financial_tracker.get_ivonne_deposits();
$$ LANGUAGE sql SECURITY INVOKER STABLE;

CREATE OR REPLACE FUNCTION public.get_ivonne_expenses()
RETURNS SETOF financial_tracker.expenses AS $$
  SELECT * FROM financial_tracker.get_ivonne_expenses();
$$ LANGUAGE sql SECURITY INVOKER STABLE;

COMMIT;
