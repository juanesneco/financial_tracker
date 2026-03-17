# Track 10: Juanes Tab (formerly Deposits)

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P2 — Should Have |
| **Status** | Done (6/6) |
| **Phases** | 2 |
| **Dependencies** | 03_app_shell |

## Summary

Cross-account financial view for Juanes showing money received from Ivonne (deposits under Juanes' user_id) and expenses made on Ivonne's behalf (expenses under Ivonne's user_id). Includes all-time and yearly summary cards, monthly breakdown table with year selector, and filtered transaction lists. Access restricted to Juanes only.

Replaces the original Deposits tab which was a simple CRUD for both Juanes and Ivonne. The legacy deposits page (`/deposits`) is no longer linked in navigation.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 10-SD-001 | Database functions for cross-account access | 5 | Done |
| 10-SD-002 | RPC query wrappers in queries.ts | 2 | Done |
| 10-SD-003 | All-time summary card (deposits, expenses, net) | 3 | Done |
| 10-SD-004 | Year selector and yearly summary card | 3 | Done |
| 10-SD-005 | Monthly breakdown table with totals | 5 | Done |
| 10-SD-006 | Access restriction (Juanes only) in sidebar and mobile nav | 3 | Done |

**Total Points:** 21

## Key Files

| Purpose | Path |
|---------|------|
| Juanes page | `app/(app)/juanes/page.tsx` |
| SQL migration | `supabase/migrations/00008_juanes_tab_functions.sql` |
| RPC query functions | `lib/supabase/queries.ts` (getIvonneDeposits, getIvonneExpenses) |
| Sidebar nav | `components/layout/Sidebar.tsx` |
| Mobile nav | `components/layout/MobileNav.tsx` |
| Legacy deposits page | `app/(app)/deposits/page.tsx` (no longer linked) |

## Architecture

### Database Functions

Two PostgreSQL functions exposed via PostgREST `.rpc()`:

- **`get_ivonne_deposits()`** — Returns all deposits where `user_id = auth.uid()` (Juanes' own deposits from Ivonne). Uses `SECURITY INVOKER` since RLS already allows access to own data.
- **`get_ivonne_expenses()`** — Returns all expenses where `user_id = Ivonne's UUID`. Uses `SECURITY DEFINER` to bypass RLS (Juanes can't normally see Ivonne's expenses). Guarded: raises exception if `auth.uid()` is not Juanes.

Each has a public schema wrapper (`public.get_ivonne_deposits()`, `public.get_ivonne_expenses()`) for PostgREST compatibility.

### Page Layout

1. **All-time summary card** — Total deposits (green), total expenses (red), net balance, record counts
2. **Year selector** — Chevron navigation between min/max years derived from data
3. **Yearly summary card** — 3-column grid: deposits, expenses, net for selected year
4. **Monthly breakdown table** — 12 rows with deposits/expenses/net per month + footer totals
5. **Deposits list** — Filtered to selected year, read-only
6. **Expenses list** — Filtered to selected year, read-only

All data fetched once via two RPCs, then filtered client-side with `useMemo`.

## Notes

- Navigation shows "Juanes" link only when `display_name.includes("juanes")` — Ivonne and other users see nothing
- Deposits are positive amounts representing money Ivonne gave Juanes (111 records)
- Expenses are under Ivonne's user_id representing purchases Juanes made on her behalf (303 records)
- The legacy `/deposits` page still exists but is unreachable from navigation
