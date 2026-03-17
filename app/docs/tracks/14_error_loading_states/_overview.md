# Track 14: Error & Loading States

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P2 — Should Have |
| **Status** | Not Started (0/5) |
| **Phases** | 1 |
| **Dependencies** | 03_app_shell |

## Summary

Preventive safety net: global error boundaries and skeleton loading states across all pages. No crashes have occurred yet, but a failed Supabase query should show a recoverable error — not a blank page. Loading states prevent "is it broken?" moments.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 14-SD-001 | Global error boundary (`error.tsx`) with retry button | 5 | Not Started |
| 14-SD-002 | Not-found page (`not-found.tsx`) with navigation back | 2 | Not Started |
| 14-SD-003 | Skeleton loading components for list pages (expenses, income, balance) | 5 | Not Started |
| 14-SD-004 | Skeleton loading for dashboard (summary cards, category breakdown) | 3 | Not Started |
| 14-SD-005 | Skeleton loading for statistics (charts, top categories) | 3 | Not Started |

**Total Points:** 18

## Key Files

| Purpose | Path |
|---------|------|
| Global error boundary (TBD) | `app/(app)/error.tsx` |
| Not found page (TBD) | `app/(app)/not-found.tsx` |
| Loading files (TBD) | `app/(app)/loading.tsx`, `app/(app)/expenses/loading.tsx`, etc. |

## Notes

- This is preventive — no production issues yet, but good insurance
- Next.js `error.tsx` catches rendering errors per route segment
- Next.js `loading.tsx` shows automatically during server component data fetching
- Skeleton components should match the layout of real content
- Use shadcn/ui `Skeleton` component as base
