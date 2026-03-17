# Track 12: Recurring Expenses

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Not Started (0/6) |
| **Phases** | 1 |
| **Dependencies** | 04_expense_management, 06_cards_subscriptions |

## Summary

Auto-generate monthly expenses from active subscriptions. On login, the app checks for subscriptions due since the last visit and queues them for review. Users confirm, edit, or skip each before they become real expenses. A `subscription_id` FK on `ft_expenses` links generated expenses back to their source subscription, enabling per-subscription expense history.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 12-SD-001 | Add `subscription_id` FK column to `ft_expenses` (nullable, references `ft_subscriptions`) | 3 | Not Started |
| 12-SD-002 | On-login check: detect subscriptions due since last visit, queue pending expenses | 8 | Not Started |
| 12-SD-003 | Review & confirm UI: list pending recurring expenses with confirm/skip/edit per item | 8 | Not Started |
| 12-SD-004 | Create confirmed expenses with `subscription_id` link | 5 | Not Started |
| 12-SD-005 | Subscription detail: show linked expense history (all expenses with matching `subscription_id`) | 5 | Not Started |
| 12-SD-006 | Handle edge cases: inactive subscriptions, skipped months, mid-month subscription changes | 3 | Not Started |

**Total Points:** 32

## Key Files

| Purpose | Path |
|---------|------|
| Subscription queries | `lib/supabase/queries.ts` |
| Expense table/types | `lib/types/database.ts` |
| Recurring review UI (TBD) | `app/(app)/subscriptions/review/page.tsx` |
| Subscription detail (TBD) | `app/(app)/subscriptions/[id]/page.tsx` |

## Notes

- Queue populates **on login**: check each active subscription's `renewal_day` against dates since last visit
- Users must confirm before expenses are created — no silent auto-generation
- `subscription_id` FK enables "View all expenses for this subscription" on subscription detail page
- Old manually-entered subscription expenses will remain unlinked (no backfill)
- Need to track "last checked date" per user to avoid duplicate generation
