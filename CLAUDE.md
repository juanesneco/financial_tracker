# Financial Tracker

Personal finance tracking app. Part of the JENG platform. See parent `CLAUDE.md` for shared infrastructure docs.

## Dev Server

- Port **3004** (port 3000 is taken by Supabase Studio)

## Development Tracks

Feature development is organized into numbered tracks at `app/docs/tracks/`. Each track has an `_overview.md` with stories, points, and status.

### Completed (Tracks 01–11)

| # | Track | Stories | Status |
|---|-------|---------|--------|
| 01 | Infrastructure | 5/5 | Done |
| 02 | Authentication | 5/5 | Done |
| 03 | App Shell | 5/5 | Done |
| 04 | Expense Management | 8/8 | Done |
| 05 | Income Management | 5/5 | Done |
| 06 | Cards & Subscriptions | 5/5 | Done |
| 07 | Budgets | 5/5 | Done |
| 08 | Balance Sheet | 5/5 | Done |
| 09 | Statistics | 5/5 | Done |
| 10 | Deposits (Juanes Tab) | 5/5 | Done |
| 11 | Settings & Profile | 5/5 | Done |

### In Progress / Upcoming (Tracks 12–16)

| # | Track | Priority | Stories | Status |
|---|-------|----------|---------|--------|
| 12 | Recurring Expenses | P1 | 0/6 | Not Started |
| 13 | UX Polish | P1 | 0/2 | Not Started |
| 14 | Error & Loading States | P2 | 0/5 | Not Started |
| 15 | Empty States | P3 | 0/5 | Not Started |
| 16 | Receipt Scanning | P1 | 0/7 | Not Started |

### Key Decisions (from interview 2026-03-17)

- **No data export** (CSV/PDF) — cut entirely
- **No notifications/reminders** — not needed for personal use
- **No offline/PWA enhancements** — online-only is fine
- **No advanced features** (goals, auto-categorize, shared household) — focus on core first
- **Recurring expenses**: queue on login for review, not auto-created silently. Uses `subscription_id` FK on `ft_expenses`
- **Empty states**: simple CTAs per page, no onboarding wizard
- **Error/loading states**: preventive only, no production issues yet
