# Track 08: Balance Sheet

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (5/5) |
| **Phases** | 3 |
| **Dependencies** | 04_expense_management, 05_income_management |

## Summary

Unified view combining income and expense transactions into a single ledger. Summary cards show total income, total expenses, and net balance (colored green for surplus, red for deficit). Supports filtering by type, category, payment method, date range, and search. Dual layout: table on desktop, cards on mobile.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 08-SD-001 | Combined income + expense transaction view | 8 | Done |
| 08-SD-002 | Summary cards (total income, total expenses, net balance) | 5 | Done |
| 08-SD-003 | Filters (type, category, payment method, date range, search) | 5 | Done |
| 08-SD-004 | Dual layout — table (desktop) / cards (mobile) | 5 | Done |
| 08-SD-005 | Pagination (50/page) | 3 | Done |

**Total Points:** 26

## Key Files

| Purpose | Path |
|---------|------|
| Balance sheet page | `app/(app)/balance/page.tsx` |

## Notes

- Merges `ft_expenses` and `ft_income_records` into one timeline
- Desktop uses `<Table>` component; mobile uses card layout
- Search matches against title and note fields
- Net balance card uses green/red color coding based on surplus/deficit
- Month selector with date range for filtering
- Pagination at 50 items per page with page navigation
