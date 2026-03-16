# Track 10: Deposits

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P2 — Should Have |
| **Status** | Done (3/3) |
| **Phases** | 2 |
| **Dependencies** | 03_app_shell |

## Summary

Lump-sum deposit tracking restricted to specific users (juanes and ivonne). Simple CRUD for recording deposits with amount, title, date, and notes. Displays running total of all deposits.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 10-SD-001 | Deposit CRUD (amount, title, date, note) | 5 | Done |
| 10-SD-002 | Total deposits display | 3 | Done |
| 10-SD-003 | Access restriction (juanes/ivonne only) | 3 | Done |

**Total Points:** 11

## Key Files

| Purpose | Path |
|---------|------|
| Deposits page | `app/(app)/deposits/page.tsx` |

## Notes

- Access controlled by checking user display name against "juanes" and "ivonne"
- Deposits ordered by date descending (newest first)
- Sidebar conditionally shows Deposits link based on user identity
- Date defaults to today on new deposit form
