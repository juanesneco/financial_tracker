-- Fix: Add security_invoker = true to all views missing it.
-- Without this, RLS policies are bypassed and all users see all data.
-- Views ft_categories, ft_subcategories, ft_user_hidden_categories, ft_cards
-- already have security_invoker from migrations 00005 and 00007.

-- ft_expenses (last recreated in 00006 without security_invoker)
CREATE OR REPLACE VIEW public.ft_expenses
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.expenses;

-- ft_profiles
CREATE OR REPLACE VIEW public.ft_profiles
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.profiles;

-- ft_deposits
CREATE OR REPLACE VIEW public.ft_deposits
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.deposits;

-- ft_subscriptions (DROP required — column order changed since original CREATE)
DROP VIEW IF EXISTS public.ft_subscriptions;
CREATE VIEW public.ft_subscriptions
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.subscriptions;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_subscriptions TO authenticated;

-- ft_budgets (DROP to be safe, same pattern)
DROP VIEW IF EXISTS public.ft_budgets;
CREATE VIEW public.ft_budgets
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.budgets;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ft_budgets TO authenticated;

-- ft_income_sources
CREATE OR REPLACE VIEW public.ft_income_sources
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.income_sources;

-- ft_income_records
CREATE OR REPLACE VIEW public.ft_income_records
  WITH (security_invoker = true) AS
  SELECT * FROM financial_tracker.income_records;
