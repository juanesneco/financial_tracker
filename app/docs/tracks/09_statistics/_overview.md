# Track 09: Statistics & Analytics

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P2 — Should Have |
| **Status** | Done (4/4) |
| **Phases** | 2 |
| **Dependencies** | 04_expense_management |

## Summary

Visual analytics for expense patterns. Pie/donut chart breaks down spending by category for the selected month. Bar chart shows 6-month spending trends. Top categories section displays ranked spending with progress bars. Month selector allows navigating between periods.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 09-SD-001 | Category breakdown pie/donut chart | 5 | Done |
| 09-SD-002 | 6-month trend bar chart | 5 | Done |
| 09-SD-003 | Top categories with progress bars | 3 | Done |
| 09-SD-004 | Month selector navigation | 3 | Done |

**Total Points:** 16

## Key Files

| Purpose | Path |
|---------|------|
| Statistics page | `app/(app)/statistics/page.tsx` |

## Notes

- Charts built with Recharts library using custom 13-color palette
- Responsive containers adapt chart size to viewport
- Pie chart shows percentage and absolute amount per category
- Bar chart covers current month + 5 previous months
- Top categories ranked by total spend with percentage of monthly total
