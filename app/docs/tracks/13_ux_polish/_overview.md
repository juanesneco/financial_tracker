# Track 13: UX Polish

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Not Started (0/2) |
| **Phases** | 1 |
| **Dependencies** | 03_app_shell, 04_expense_management |

## Summary

Two focused quality-of-life improvements: ensure every create/update/delete action shows a confirmation toast, and add the `is_displayed` column to categories so they can be hidden from dropdowns without deletion.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 13-SD-001 | Audit and add confirmation toasts for all create/update/delete actions across all pages | 5 | Not Started |
| 13-SD-002 | Add `is_displayed` boolean column to `ft_categories`, filter hidden categories from all dropdowns and filter bars | 5 | Not Started |

**Total Points:** 10

## Key Files

| Purpose | Path |
|---------|------|
| Expense form | `components/forms/ExpenseForm.tsx` |
| Income form | `components/forms/IncomeForm.tsx` |
| All list pages | `app/(app)/expenses/page.tsx`, `app/(app)/income/page.tsx`, etc. |
| Category queries | `lib/supabase/queries.ts` |
| Category management | `app/(app)/settings/categories/page.tsx` |

## Notes

- Toast audit: check ExpenseForm, IncomeForm, BudgetForm, CardForm, SubscriptionForm, Settings, Category management — every mutation should show a Sonner toast
- `is_displayed` defaults to `true`; toggled from the category management settings page
- Hidden categories still appear on existing expenses (historical data intact), just not in dropdowns for new entries
- This addresses the existing TODO from Track 04
