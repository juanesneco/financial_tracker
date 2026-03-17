# Track 04: Expense Management

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (8/8) |
| **Phases** | 1, 2, 3 |
| **Dependencies** | 03_app_shell |

## Summary

Core expense tracking: a full form with amount, title, category/subcategory, payment method, card selection, date, notes, comments, and receipt upload. Expenses are listed with search/filter/pagination, grouped by date. Each expense has a detail page with view/edit/delete modes. Categories use emoji icons for visual identification.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 04-SD-001 | Add expense form (amount, title, category, subcategory, payment method, card, date, note, comments, receipt) | 13 | Done |
| 04-SD-002 | Add expense page (mobile) with form integration | 5 | Done |
| 04-SD-003 | Expenses list with filters (search, category, payment method, date range) | 8 | Done |
| 04-SD-004 | Expenses grouped by date with pagination (50/page) | 5 | Done |
| 04-SD-005 | Expense detail page with view/edit modes | 8 | Done |
| 04-SD-006 | Expense delete functionality | 3 | Done |
| 04-SD-007 | Receipt upload to Supabase storage | 5 | Done |
| 04-SD-008 | Category & subcategory system with emojis | 5 | Done |

**Total Points:** 52

## Key Files

| Purpose | Path |
|---------|------|
| Expense form component | `components/forms/ExpenseForm.tsx` |
| Add expense page | `app/(app)/add/page.tsx` |
| Expenses list page | `app/(app)/expenses/page.tsx` |
| Expense detail page | `app/(app)/expenses/[id]/page.tsx` |
| Expense row component | `components/shared/ExpenseRow.tsx` |
| Category badge | `components/shared/CategoryBadge.tsx` |
| Payment method icon | `components/shared/PaymentMethodIcon.tsx` |

## Notes

- Receipt images uploaded to Supabase Storage with preview and delete
- Subcategory select is conditional, filtered by selected category
- Payment method toggles between "card" and "cash"; card selector appears for card
- Expense detail page supports `?from=home` for back navigation
- Pagination at 50 expenses per page
- Date grouping uses "Today" / "Yesterday" / formatted date labels

## TODO

- **Category display filter:** Add an `is_displayed` boolean column (default `true`) to `ft_categories` via DB migration. Then filter `categories.filter(c => c.is_displayed)` in all dropdowns and filter bars (ExpenseForm, expenses page, balance page, statistics). This lets us hide categories from the UI without deleting them or breaking historical expense references.
