# Track 07: Budgets

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P2 — Should Have |
| **Status** | Done (4/4) |
| **Phases** | 2 |
| **Dependencies** | 04_expense_management |

## Summary

Category-based spending limits for the current month. Users set a budget amount per category, and the app calculates actual spending against the budget. Progress bars show utilization, and over-budget categories are visually highlighted with alerts.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 07-SD-001 | Budget CRUD (category selection, amount) | 5 | Done |
| 07-SD-002 | Progress bar with spending vs budget | 5 | Done |
| 07-SD-003 | Over-budget visual alerts | 3 | Done |
| 07-SD-004 | Current month scope | 3 | Done |

**Total Points:** 16

## Key Files

| Purpose | Path |
|---------|------|
| Budgets page | `app/(app)/budgets/page.tsx` |

## Notes

- Budget amounts compared against current month's expenses per category
- Progress bar fills proportionally; exceeding 100% triggers destructive color
- Category filter prevents duplicate budgets for the same category
- Scoped to current calendar month (1st to last day)
