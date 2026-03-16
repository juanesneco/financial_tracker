# Track 06: Cards & Subscriptions

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (6/6) |
| **Phases** | 2 |
| **Dependencies** | 03_app_shell |

## Summary

Payment card management and recurring subscription tracking. Cards store bank, last four digits, and type (credit/debit). Subscriptions link to cards and track title, amount, renewal day, and active status. Cards with active subscriptions cannot be deleted. Subscriptions are grouped by card in an accordion view.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 06-SD-001 | Cards CRUD (bank, last 4, credit/debit type) | 5 | Done |
| 06-SD-002 | Subscriptions CRUD (title, amount, renewal day, card assignment) | 8 | Done |
| 06-SD-003 | Subscriptions grouped by card in accordion | 5 | Done |
| 06-SD-004 | Active/inactive toggle for subscriptions | 3 | Done |
| 06-SD-005 | Card deletion protection (can't delete with active subscriptions) | 3 | Done |
| 06-SD-006 | Active monthly total calculation | 3 | Done |

**Total Points:** 27

## Key Files

| Purpose | Path |
|---------|------|
| Cards management page | `app/(app)/cards/page.tsx` |
| Subscriptions page | `app/(app)/subscriptions/page.tsx` |

## Notes

- Card label auto-generated as "{Bank} {Type} ({Last4})"
- Cards ordered by bank name
- Subscriptions use Accordion component to group by card
- Active monthly total sums all `is_active` subscriptions
- Delete protection: API checks for active subscriptions before allowing card deletion
- Sort options: by renewal day or by title
