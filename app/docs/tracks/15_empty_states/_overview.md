# Track 15: Empty States

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P3 — Nice to Have |
| **Status** | Not Started (0/5) |
| **Phases** | 1 |
| **Dependencies** | 03_app_shell |

## Summary

Friendly empty states on every page that can have no data. Each shows a helpful message and CTA button. No multi-step onboarding wizard — just contextual guidance where it's needed.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 15-SD-001 | Reusable EmptyState component (icon, message, CTA button) | 3 | Not Started |
| 15-SD-002 | Dashboard empty state (welcome message, "Add your first expense" CTA) | 3 | Not Started |
| 15-SD-003 | Expenses list empty state | 2 | Not Started |
| 15-SD-004 | Income, budgets, cards, subscriptions empty states | 5 | Not Started |
| 15-SD-005 | Balance sheet and statistics empty/no-data states | 3 | Not Started |

**Total Points:** 16

## Key Files

| Purpose | Path |
|---------|------|
| EmptyState component (TBD) | `components/shared/EmptyState.tsx` |
| Dashboard | `app/(app)/page.tsx` |
| All list pages | `app/(app)/expenses/page.tsx`, etc. |

## Notes

- No onboarding wizard — just page-level empty states with CTAs
- Empty states should feel encouraging, not clinical
- Statistics page: "Add a few expenses to see your spending breakdown"
- Lower priority since the app is primarily personal use and the user already knows the flow
